import * as XLSX from 'xlsx'
import type { StructureTransformationRecipe } from '../../types/transformation'
import { getCell, readWorkbookFromArrayBuffer, sheetToMatrix } from './workbook'
import { resolveReportDate } from './narrowLayout'
import { getTargetColCount } from './styleTemplate'
import { resolveMappingsForSource, shouldIncludeSourceRow } from './resolveColumns'
import { applyWithStyleTemplate, type OutputRow } from './styleTemplate'

const COL_WIDTHS = [42, 28, 28, 24, 22, 36, 18, 18, 32]

function buildDataRows(
  sourceMatrix: string[][],
  recipe: StructureTransformationRecipe,
): { rows: OutputRow[]; reportDate: string } {
  const { mappings, fioSourceCol } = resolveMappingsForSource(sourceMatrix, recipe)
  const { sourceDataStartRow, headers } = recipe
  const colCount = getTargetColCount(headers)
  const rows: OutputRow[] = []

  for (let s = sourceDataStartRow; s < sourceMatrix.length; s++) {
    if (!shouldIncludeSourceRow(sourceMatrix, s, fioSourceCol)) continue
    const values: string[] = []
    for (let t = 0; t < colCount; t++) {
      const map = mappings.find((m) => m.targetCol === t)
      values[t] = map && map.sourceCol >= 0 ? getCell(sourceMatrix, s, map.sourceCol) : ''
    }
    rows.push({ values })
  }

  const reportDate = resolveReportDate(sourceMatrix, headers)

  return { rows, reportDate }
}

function applyLegacyXls(
  recipe: StructureTransformationRecipe,
  dataRows: OutputRow[],
  reportDate: string,
): ArrayBuffer {
  const { headers } = recipe
  const colCount = getTargetColCount(headers)
  const out: (string | number)[][] = headers.targetRows.map((row) => [...row])

  const dateRow = headers.reportDateTarget.row
  const dateValueCol = headers.dateValueTargetCol ?? headers.reportDateTarget.col + 1
  if (out[dateRow]) {
    out[dateRow][headers.reportDateTarget.col] = 'отчет на дату:'
    out[dateRow][dateValueCol] = reportDate
  }

  for (const row of dataRows) {
    out.push(row.values)
  }

  const newSheet = XLSX.utils.aoa_to_sheet(out)
  newSheet['!cols'] = Array.from({ length: colCount }, (_, i) => ({
    wch: COL_WIDTHS[i] ?? 18,
  }))

  const outWb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(outWb, newSheet, recipe.sheetName)

  return XLSX.write(outWb, { bookType: 'xls', type: 'array' }) as ArrayBuffer
}

export function applyTransformation(
  sourceFile: ArrayBuffer,
  recipe: StructureTransformationRecipe,
): Promise<ArrayBuffer> {
  const wb = readWorkbookFromArrayBuffer(sourceFile)
  const ws = wb.Sheets[recipe.sheetName]
  if (!ws) throw new Error(`Лист «${recipe.sheetName}» не найден в исходнике.`)

  const sourceMatrix = sheetToMatrix(ws) as string[][]
  const { rows, reportDate } = buildDataRows(sourceMatrix, recipe)

  if (recipe.styleTemplateXlsxBase64) {
    return applyWithStyleTemplate(
      recipe.styleTemplateXlsxBase64,
      recipe,
      rows,
      reportDate,
    )
  }

  return Promise.resolve(applyLegacyXls(recipe, rows, reportDate))
}

export function defaultOutputExtension(recipe: StructureTransformationRecipe): 'xls' | 'xlsx' {
  return recipe.styleTemplateXlsxBase64 ? 'xlsx' : 'xls'
}
