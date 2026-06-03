import { applyTransformation } from './apply'
import type { StructureTransformationRecipe } from '../../types/transformation'
import { looksLikePersonName } from './fio'
import { findFioTargetCol } from './layoutFromTarget'
import { resolveMappingsForSource, shouldIncludeSourceRow } from './resolveColumns'
import {
  findHeaderRow,
  getCell,
  normalizeHeader,
  readWorkbookFromArrayBuffer,
  sheetToMatrix,
} from './workbook'

export class TransformationPairError extends Error {
  readonly reasons: string[]

  constructor(reasons: string[]) {
    const text = reasons.join('\n')
    super(
      reasons.length === 1
        ? text
        : `Нельзя создать трансформацию:\n${reasons.map((r) => `• ${r}`).join('\n')}`,
    )
    this.name = 'TransformationPairError'
    this.reasons = reasons
  }
}

function countTargetDataRows(matrix: string[][], fromRow: number, fioCol: number): number {
  let n = 0
  for (let r = fromRow; r < matrix.length; r++) {
    if (getCell(matrix, r, fioCol)) n++
  }
  return n
}

function rowsMatch(source: string[][], target: string[][], recipe: StructureTransformationRecipe, targetRow: number, sourceRow: number): boolean {
  for (const m of recipe.columnMappings) {
    const tgtVal = getCell(target, targetRow, m.targetCol)
    if (!tgtVal) continue
    const srcVal = getCell(source, sourceRow, m.sourceCol)
    if (srcVal !== tgtVal) return false
  }
  return true
}

export async function validateTransformationPair(
  sourceFile: ArrayBuffer,
  targetFile: ArrayBuffer,
  recipe: StructureTransformationRecipe,
): Promise<void> {
  const reasons: string[] = []

  const srcWb = readWorkbookFromArrayBuffer(sourceFile)
  const tgtWb = readWorkbookFromArrayBuffer(targetFile)

  const commonSheet = srcWb.SheetNames.find((n) => tgtWb.SheetNames.includes(n))
  if (!commonSheet) {
    reasons.push(
      `Нет общего листа: в исходнике [${srcWb.SheetNames.join(', ')}], в итоге [${tgtWb.SheetNames.join(', ')}].`,
    )
  }

  const sourceMatrix = sheetToMatrix(srcWb.Sheets[recipe.sheetName]) as string[][]
  const targetMatrix = sheetToMatrix(tgtWb.Sheets[recipe.sheetName]) as string[][]

  const targetLevelRow = findHeaderRow(targetMatrix, 'наименование (уровень 1)')
  if (targetLevelRow < 0) {
    reasons.push('В итоговом файле не найдена строка с уровнями подразделения (уровень 1…5).')
  }

  const targetMaxCol = Math.max(
    ...targetMatrix.slice(0, 20).map((row) => (row?.length ?? 0) - 1),
    0,
  )
  const expectedCols = recipe.headers.targetColCount ?? recipe.headers.targetRows[0]?.length
  if (expectedCols && Math.abs(targetMaxCol + 1 - expectedCols) > 2) {
    reasons.push(
      `Ширина итога (${targetMaxCol + 1} колонок) не совпадает с выученной шапкой (${expectedCols} колонок).`,
    )
  }

  const sourceMaxCol = Math.max(
    ...sourceMatrix.slice(0, 30).map((row) => (row?.length ?? 0) - 1),
    0,
  )
  if (sourceMaxCol < 15) {
    reasons.push(
      `Исходный файл слишком узкий (${sourceMaxCol + 1} колонок): похоже, это уже итог, а не широкий исходник.`,
    )
  }

  const hasFioInTarget = targetMatrix.some((row, r) =>
    row?.some(
      (cell) =>
        r > 0 &&
        normalizeHeader(String(cell)).includes('фамилия') &&
        normalizeHeader(String(cell)).includes('отчество'),
    ),
  )
  if (!hasFioInTarget) {
    reasons.push('В итоговом файле нет колонки «Фамилия, Имя, Отчество».')
  }

  const { mappings, fioSourceCol } = resolveMappingsForSource(sourceMatrix, recipe)
  if (fioSourceCol < 0) {
    reasons.push('В исходнике не найдена колонка с ФИО (фамилия, имя, отчество).')
  }

  let sourceFioRows = 0
  for (let r = recipe.sourceDataStartRow; r < sourceMatrix.length; r++) {
    if (shouldIncludeSourceRow(sourceMatrix, r, fioSourceCol)) sourceFioRows++
  }
  if (sourceFioRows < 5) {
    reasons.push(
      `В исходнике слишком мало строк с ФИО (${sourceFioRows}): трансформация не определена.`,
    )
  }

  const fioTargetCol = findFioTargetCol(recipe.headers.targetRows)
  const targetDataStart = recipe.headers.targetHeaderRowCount
  const targetDataRows = countTargetDataRows(targetMatrix, targetDataStart, fioTargetCol)
  if (targetDataRows < 5) {
    reasons.push(`В итоговом файле слишком мало строк данных (${targetDataRows}).`)
  }

  let outBuffer: ArrayBuffer
  try {
    outBuffer = await applyTransformation(sourceFile, recipe)
  } catch {
    reasons.push('Не удалось применить выведенные правила к исходнику.')
    throw new TransformationPairError(reasons)
  }

  const outMatrix = sheetToMatrix(
    readWorkbookFromArrayBuffer(outBuffer).Sheets[recipe.sheetName],
  ) as string[][]
  const outDataRows = outMatrix.length - targetDataStart
  const ratio = outDataRows / targetDataRows

  if (ratio < 0.88 || ratio > 1.12) {
    reasons.push(
      `Число строк не совпадает: по правилам получилось ${outDataRows}, в эталоне ${targetDataRows}. Файлы, вероятно, из разных отчётов или с другой структурой.`,
    )
  }

  let checked = 0
  let matched = 0
  const maxCheck = 40

  for (let t = targetDataStart; t < targetMatrix.length && checked < maxCheck; t++) {
    const fio = getCell(targetMatrix, t, fioTargetCol)
    if (!looksLikePersonName(fio)) continue
    checked++
    let sourceRow = -1
    for (let s = recipe.sourceDataStartRow; s < sourceMatrix.length; s++) {
      if (getCell(sourceMatrix, s, fioSourceCol) === fio) {
        sourceRow = s
        break
      }
    }
    if (sourceRow < 0) continue
    if (rowsMatch(sourceMatrix, targetMatrix, { ...recipe, columnMappings: mappings }, t, sourceRow))
      matched++
  }

  if (checked < 5) {
    reasons.push(
      'Не удалось сопоставить данные между исходником и итогом (нет общих ФИО в первых строках).',
    )
  } else if (matched / checked < 0.75) {
    reasons.push(
      `Совпало только ${matched} из ${checked} проверенных строк: структура итога не выводится из этого исходника.`,
    )
  }

  const checkCols = recipe.columnMappings
    .filter((m) => m.sourceCol >= 0)
    .map((m) => m.targetCol)
  for (const col of checkCols) {
    const map = mappings.find((m) => m.targetCol === col)
    if (!map) continue
    const tgtVal = getCell(targetMatrix, targetDataStart, col)
    if (tgtVal && !getCell(sourceMatrix, recipe.sourceDataStartRow, map.sourceCol)) {
      reasons.push(
        `Колонка «${map.targetHeader}» в эталоне не соответствует данным исходника.`,
      )
      break
    }
  }

  if (reasons.length > 0) {
    throw new TransformationPairError(reasons)
  }
}
