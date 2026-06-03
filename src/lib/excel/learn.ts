import type { StructureTransformationRecipe, ColumnMapping } from '../../types/transformation'
import {
  buildSourceHeaderMap,
  findHeaderRow,
  getCell,
  readWorkbookFromArrayBuffer,
  sheetToMatrix,
} from './workbook'
import { resolveFioColumn } from './fio'
import { findFioTargetCol, learnHeaderLayoutFromTarget } from './layoutFromTarget'
import { buildStyleTemplateXlsx } from './styleTemplate'
import { validateTransformationPair } from './validate'

function findColByValue(matrix: string[][], row: number, value: string): number {
  if (!value) return -1
  const rowData = matrix[row] ?? []
  for (let c = 0; c < rowData.length; c++) {
    if (getCell(matrix, row, c) === value) return c
  }
  return -1
}

function findFirstPairRow(
  source: string[][],
  target: string[][],
  sourceStart: number,
  targetStart: number,
  fioSourceCol: number,
  fioTargetCol: number,
): { sourceRow: number; targetRow: number } {
  for (let t = targetStart; t < target.length; t++) {
    const fio = getCell(target, t, fioTargetCol)
    if (!fio) continue
    for (let s = sourceStart; s < source.length; s++) {
      if (getCell(source, s, fioSourceCol) === fio) {
        return { sourceRow: s, targetRow: t }
      }
    }
  }
  return { sourceRow: sourceStart, targetRow: targetStart }
}

export interface LearnResult {
  recipe: StructureTransformationRecipe
  summary: string[]
  warnings: string[]
}

export async function learnTransformationFromPair(
  sourceFile: ArrayBuffer,
  targetFile: ArrayBuffer,
): Promise<LearnResult> {
  const warnings: string[] = []
  const summary: string[] = []

  const srcWb = readWorkbookFromArrayBuffer(sourceFile)
  const tgtWb = readWorkbookFromArrayBuffer(targetFile)

  const sheetName = srcWb.SheetNames.find((n) => tgtWb.SheetNames.includes(n)) ?? srcWb.SheetNames[0]

  const sourceMatrix = sheetToMatrix(srcWb.Sheets[sheetName]) as string[][]
  const targetMatrix = sheetToMatrix(tgtWb.Sheets[sheetName]) as string[][]

  if (srcWb.vbaraw || tgtWb.vbaraw) {
    warnings.push('В файлах есть макросы: в v1 они не переносятся — только данные и базовое оформление.')
  }

  const sourceHeaderRow = findHeaderRow(sourceMatrix, 'наименование (уровень 1)')
  if (sourceHeaderRow < 0) throw new Error('Не найдена строка заголовков в исходнике.')

  const headers = learnHeaderLayoutFromTarget(targetFile, sheetName)
  const targetHeaderRowCount = headers.targetHeaderRowCount
  const targetColCount = headers.targetColCount
  const fioTargetCol = findFioTargetCol(headers.targetRows)
  const targetLevelRow = findHeaderRow(targetMatrix, 'наименование (уровень 1)')
  const sourceDataStartRow = sourceHeaderRow + 2

  const sourceMap = buildSourceHeaderMap(sourceMatrix, sourceHeaderRow)
  const fioSourceCol = resolveFioColumn(sourceMatrix, sourceHeaderRow, sourceDataStartRow)

  if (fioSourceCol < 0) {
    throw new Error('В исходнике не найдена колонка «Фамилия, Имя, Отчество».')
  }

  const { sourceRow, targetRow } = findFirstPairRow(
    sourceMatrix,
    targetMatrix,
    sourceDataStartRow,
    targetHeaderRowCount,
    fioSourceCol,
    fioTargetCol,
  )

  const columnMappings: ColumnMapping[] = []

  for (let targetCol = 0; targetCol < targetColCount; targetCol++) {
    const tgtVal = getCell(targetMatrix, targetRow, targetCol)
    let sourceCol = findColByValue(sourceMatrix, sourceRow, tgtVal)

    if (sourceCol < 0 && targetCol < 5) {
      sourceCol = sourceMap.get(`наименование (уровень ${targetCol + 2})`) ?? sourceMap.get(`наименование (уровень ${targetCol + 1})`) ?? targetCol + 2
    }
    if (sourceCol < 0 && targetCol === 5) sourceCol = 8
    if (sourceCol < 0 && targetCol === 6) sourceCol = 9
    if (sourceCol < 0 && targetCol === 7) sourceCol = 10
    if (targetCol === fioTargetCol) sourceCol = fioSourceCol

    const targetHeader =
      targetCol < 5
        ? getCell(targetMatrix, targetLevelRow, targetCol)
        : getCell(targetMatrix, 1, targetCol)

    columnMappings.push({
      targetCol,
      sourceCol,
      targetHeader: targetHeader || `Колонка ${targetCol + 1}`,
      sourceHeader:
        [...sourceMap.entries()].find(([, c]) => c === sourceCol)?.[0] ?? `Колонка ${sourceCol + 1}`,
    })
  }

  summary.push(`Лист: «${sheetName}»`)
  summary.push(
    `Исходник: ${sourceMatrix.length} строк; итог: ${targetMatrix.length} строк, ${targetColCount} колонок`,
  )
  summary.push(`Фильтр: строки с заполненным ФИО (колонка ${fioSourceCol + 1} в исходнике)`)
  summary.push('Сопоставление колонок выведено по эталонной паре строк')

  const recipe: StructureTransformationRecipe = {
    kind: 'org-structure-narrow',
    sheetName,
    sourceHeaderRow,
    sourceDataStartRow,
    columnMappings,
    rowFilter: {
      sourceCol: fioSourceCol,
      kind: 'nonEmpty',
      description: 'Строка попадает в итог, если заполнено ФИО',
    },
    headers,
  }

  await validateTransformationPair(sourceFile, targetFile, recipe)

  recipe.styleTemplateXlsxBase64 = await buildStyleTemplateXlsx(targetFile, recipe)
  summary.push('Оформление эталона сохранено в шаблон (xlsx)')

  return { recipe, summary, warnings }
}
