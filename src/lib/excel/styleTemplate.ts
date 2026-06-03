import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import type { HeaderLayout, StructureTransformationRecipe } from '../../types/transformation'
import { getCell, readWorkbookFromArrayBuffer, sheetToMatrix } from './workbook'

export interface SheetMerge {
  top: number
  left: number
  bottom: number
  right: number
}

export interface StyleTemplateMeta {
  merges: SheetMerge[]
  columnWidths: number[]
  headerRowHeights: number[]
  dataRowHeight?: number
}

const FONT = { name: 'Calibri', size: 11 }
const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFB4B4B4' } },
  left: { style: 'thin', color: { argb: 'FFB4B4B4' } },
  bottom: { style: 'thin', color: { argb: 'FFB4B4B4' } },
  right: { style: 'thin', color: { argb: 'FFB4B4B4' } },
}
const FILL_HEADER: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E1F2' },
}
const FILL_DATE: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2F2F2' },
}

export function getTargetColCount(headers: HeaderLayout): number {
  return headers.targetColCount ?? headers.targetRows[0]?.length ?? 9
}

function extractMetaFromSheet(
  ws: XLSX.WorkSheet,
  layout: HeaderLayout,
): StyleTemplateMeta {
  const colCount = getTargetColCount(layout)
  const defaultWidths = Array.from({ length: colCount }, () => 18)
  const cols = ws['!cols']
  const columnWidths = defaultWidths.map((fallback, i) => {
    const col = cols?.[i]
    if (col?.wch) return col.wch
    if (col?.width) return col.width
    return fallback
  })

  const rows = ws['!rows'] ?? []
  const headerRowHeights: number[] = []
  for (let r = 0; r < layout.targetHeaderRowCount; r++) {
    const h = rows[r]?.hpt ?? rows[r]?.hpx
    headerRowHeights.push(h && h > 0 ? h : r === 0 ? 18 : 39)
  }
  const dataRow = rows[layout.targetHeaderRowCount]
  const dataRowHeight = dataRow?.hpt ?? dataRow?.hpx

  return {
    merges: layout.sheetMerges ?? [],
    columnWidths,
    headerRowHeights,
    dataRowHeight,
  }
}

function applyHeaderCellStyle(cell: ExcelJS.Cell, row: number, col: number) {
  cell.border = BORDER_THIN
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

  if (row === 0) {
    cell.font = { ...FONT, bold: col <= 1 }
    cell.fill = FILL_DATE
    if (col === 0) cell.alignment = { ...cell.alignment, horizontal: 'left' }
    return
  }

  cell.font = { ...FONT, bold: true }
  cell.fill = FILL_HEADER
}

function applyDataCellStyle(cell: ExcelJS.Cell) {
  cell.font = FONT
  cell.border = BORDER_THIN
  cell.alignment = { vertical: 'middle', wrapText: true }
}

function applySheetMerges(sheet: ExcelJS.Worksheet, merges: SheetMerge[]) {
  for (const m of merges) {
    try {
      sheet.mergeCells(m.top + 1, m.left + 1, m.bottom + 1, m.right + 1)
    } catch {
      // уже объединено
    }
  }
}

function cloneRowStyle(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number, colCount: number) {
  const src = sheet.getRow(fromRow)
  const dst = sheet.getRow(toRow)
  if (src.height) dst.height = src.height
  for (let c = 1; c <= colCount; c++) {
    const fromCell = src.getCell(c)
    const toCell = dst.getCell(c)
    if (fromCell.style) {
      toCell.style = JSON.parse(JSON.stringify(fromCell.style)) as ExcelJS.Style
    }
  }
}

function writeHeaderRows(
  sheet: ExcelJS.Worksheet,
  layout: HeaderLayout,
  reportDate: string,
  meta: StyleTemplateMeta,
) {
  const headerRows = layout.targetRows
  const headerCount = layout.targetHeaderRowCount
  const colCount = getTargetColCount(layout)
  const dateValueCol = layout.dateValueTargetCol ?? layout.reportDateTarget.col + 1
  const styleDataRow = headerCount + 1

  for (let r = 0; r < styleDataRow; r++) {
    const excelRow = sheet.getRow(r + 1)
    excelRow.height = meta.headerRowHeights[r] ?? (r === 0 ? 18 : 39)

    for (let c = 0; c < colCount; c++) {
      const cell = excelRow.getCell(c + 1)
      let value = r < headerCount ? (headerRows[r]?.[c] ?? '') : ''

      if (r === layout.reportDateTarget.row) {
        if (c === layout.reportDateTarget.col) {
          value = value || 'отчет на дату:'
        } else if (c === dateValueCol) {
          value = reportDate
        }
      }

      cell.value = value || null
      if (r < headerCount) applyHeaderCellStyle(cell, r, c)
      else applyDataCellStyle(cell)
    }
  }
}

/** Собирает xlsx-шаблон с оформлением из эталона. */
export async function buildStyleTemplateXlsx(
  targetFile: ArrayBuffer,
  recipe: StructureTransformationRecipe,
): Promise<string> {
  const xlsWb = readWorkbookFromArrayBuffer(targetFile)
  const ws = xlsWb.Sheets[recipe.sheetName]
  if (!ws) throw new Error('Лист эталона не найден для шаблона оформления.')

  const layout = recipe.headers
  const meta = extractMetaFromSheet(ws, layout)
  const matrix = sheetToMatrix(ws) as string[][]
  const sampleDate =
    getCell(matrix, layout.reportDateTarget.row, layout.dateValueTargetCol ?? 1) ||
    getCell(matrix, 0, 2) ||
    '01.01.2026'

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(recipe.sheetName)

  meta.columnWidths.forEach((wch, i) => {
    sheet.getColumn(i + 1).width = wch
  })

  writeHeaderRows(sheet, layout, sampleDate, meta)
  applySheetMerges(sheet, meta.merges)

  const raw = await workbook.xlsx.writeBuffer()
  return arrayBufferToBase64(toArrayBuffer(raw))
}

function toArrayBuffer(
  data: ArrayBuffer | { buffer: ArrayBuffer; byteOffset: number; byteLength: number },
): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

export function decodeStyleTemplateBase64(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export interface OutputRow {
  values: string[]
}

export async function applyWithStyleTemplate(
  templateBase64: string,
  recipe: StructureTransformationRecipe,
  dataRows: OutputRow[],
  reportDate: string,
): Promise<ArrayBuffer> {
  const layout = recipe.headers
  const colCount = getTargetColCount(layout)
  const headerCount = layout.targetHeaderRowCount
  const styleDataRow = headerCount + 1

  let columnWidths = Array.from({ length: colCount }, () => 18)
  try {
    const tplWb = new ExcelJS.Workbook()
    await tplWb.xlsx.load(decodeStyleTemplateBase64(templateBase64))
    const tplSheet = tplWb.getWorksheet(recipe.sheetName) ?? tplWb.worksheets[0]
    if (tplSheet) {
      columnWidths = columnWidths.map((fallback, i) => {
        const w = tplSheet.getColumn(i + 1).width
        return w && w > 0 ? w : fallback
      })
    }
  } catch {
    // шаблон не обязателен
  }

  const meta: StyleTemplateMeta = {
    merges: layout.sheetMerges ?? [],
    columnWidths,
    headerRowHeights: Array.from({ length: headerCount }, (_, r) => (r === 0 ? 18 : 39)),
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(recipe.sheetName)

  meta.columnWidths.forEach((wch, i) => {
    sheet.getColumn(i + 1).width = wch
  })

  writeHeaderRows(sheet, layout, reportDate, meta)

  let writeRow = styleDataRow
  for (const data of dataRows) {
    if (writeRow > styleDataRow) {
      cloneRowStyle(sheet, styleDataRow, writeRow, colCount)
    }
    const row = sheet.getRow(writeRow)
    if (!row.height && meta.dataRowHeight) row.height = meta.dataRowHeight
    for (let c = 0; c < colCount; c++) {
      const cell = row.getCell(c + 1)
      cell.value = data.values[c] ?? null
      if (writeRow > styleDataRow) applyDataCellStyle(cell)
    }
    writeRow++
  }

  applySheetMerges(sheet, meta.merges)

  const out = await workbook.xlsx.writeBuffer()
  return toArrayBuffer(out)
}
