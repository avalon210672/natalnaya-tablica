import type { ColumnMapping, StructureTransformationRecipe } from '../../types/transformation'
import { buildSourceHeaderMap, getCell, normalizeHeader } from './workbook'
import { looksLikePersonName, resolveFioColumn } from './fio'

function findColInRow(matrix: string[][], row: number, patterns: string[]): number {
  if (row < 0) return -1
  for (let c = 0; c < (matrix[row]?.length ?? 0); c++) {
    const h = normalizeHeader(getCell(matrix, row, c))
    for (const pattern of patterns) {
      if (h.includes(normalizeHeader(pattern))) return c
    }
  }
  return -1
}

function resolveStaffColumns(matrix: string[][], headerRow: number) {
  const labelRow = headerRow - 1
  const position =
    findColInRow(matrix, labelRow, ['должность (специальность']) ??
    findColInRow(matrix, labelRow, ['должность']) ??
    8
  const id =
    findColInRow(matrix, labelRow, ['идентификатор штатной должности']) ?? 9
  const code =
    findColInRow(matrix, labelRow, ['код  штатной должности', 'код штатной должности']) ??
    10
  return { position, id, code }
}

/** Пересчитывает номера колонок исходника под текущий файл (ФИО и др. могут смещаться). */
export function resolveMappingsForSource(
  sourceMatrix: string[][],
  recipe: StructureTransformationRecipe,
): { mappings: ColumnMapping[]; fioSourceCol: number } {
  const sourceMap = buildSourceHeaderMap(sourceMatrix, recipe.sourceHeaderRow)
  const staff = resolveStaffColumns(sourceMatrix, recipe.sourceHeaderRow)
  const fioSourceCol = resolveFioColumn(
    sourceMatrix,
    recipe.sourceHeaderRow,
    recipe.sourceDataStartRow,
  )

  const mappings: ColumnMapping[] = []

  for (const m of recipe.columnMappings) {
    let sourceCol = m.sourceCol

    if (m.targetCol === 8) {
      sourceCol = fioSourceCol
    } else if (m.targetCol < 5) {
      const level =
        sourceMap.get(`наименование (уровень ${m.targetCol + 2})`) ??
        sourceMap.get(`наименование (уровень ${m.targetCol + 1})`)
      if (level !== undefined) sourceCol = level
    } else if (m.targetCol === 5) {
      sourceCol = staff.position
    } else if (m.targetCol === 6) {
      sourceCol = staff.id
    } else if (m.targetCol === 7) {
      sourceCol = staff.code
    }

    mappings.push({ ...m, sourceCol })
  }

  return { mappings, fioSourceCol }
}

export function shouldIncludeSourceRow(
  sourceMatrix: string[][],
  row: number,
  fioSourceCol: number,
): boolean {
  if (fioSourceCol < 0) return false
  return looksLikePersonName(getCell(sourceMatrix, row, fioSourceCol))
}
