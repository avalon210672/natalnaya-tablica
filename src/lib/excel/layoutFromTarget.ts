import type { HeaderLayout } from '../../types/transformation'
import type { SheetMerge } from './styleTemplate'
import { findHeaderRow, getCell, normalizeHeader, sheetToMatrix } from './workbook'
import * as XLSX from 'xlsx'

export function detectTargetColumnCount(targetMatrix: string[][], headerRowCount: number): number {
  let maxCol = 0
  const scanRows = Math.min(targetMatrix.length, headerRowCount + 5)
  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < (targetMatrix[r]?.length ?? 0); c++) {
      if (getCell(targetMatrix, r, c)) maxCol = Math.max(maxCol, c)
    }
  }
  return Math.max(maxCol + 1, 1)
}

export function extractTargetHeaderRows(
  targetMatrix: string[][],
  headerRowCount: number,
  targetColCount: number,
): string[][] {
  const rows: string[][] = []
  for (let r = 0; r < headerRowCount; r++) {
    const row: string[] = []
    for (let c = 0; c < targetColCount; c++) {
      row.push(getCell(targetMatrix, r, c))
    }
    rows.push(row)
  }
  return rows
}

export function extractMergesFromTargetSheet(
  ws: XLSX.WorkSheet,
  maxRow: number,
  maxCol: number,
): SheetMerge[] {
  return (ws['!merges'] ?? [])
    .filter((m) => m.e.r <= maxRow && m.e.c <= maxCol)
    .map((m) => ({
      top: m.s.r,
      left: m.s.c,
      bottom: m.e.r,
      right: m.e.c,
    }))
}

function findLabelCol(matrix: string[][], row: number, needle: string): number {
  for (let c = 0; c < (matrix[row]?.length ?? 0); c++) {
    const h = normalizeHeader(getCell(matrix, row, c))
    if (h.includes(normalizeHeader(needle))) return c
  }
  return -1
}

export function findFioTargetCol(headerRows: string[][]): number {
  for (let r = 0; r < headerRows.length; r++) {
    for (let c = 0; c < (headerRows[r]?.length ?? 0); c++) {
      const h = normalizeHeader(headerRows[r]![c] ?? '')
      if (h.includes('фамилия') && h.includes('отчество')) return c
    }
  }
  return Math.max(0, (headerRows[0]?.length ?? 9) - 1)
}

/** Шапка, объединения и размерность — из эталона (не из констант). */
export function learnHeaderLayoutFromTarget(
  targetFile: ArrayBuffer,
  sheetName: string,
): HeaderLayout {
  const wb = XLSX.read(targetFile, { type: 'array', cellStyles: true })
  const ws = wb.Sheets[sheetName]
  if (!ws) throw new Error(`Лист «${sheetName}» не найден в эталоне.`)

  const targetMatrix = sheetToMatrix(ws) as string[][]
  const levelRow = findHeaderRow(targetMatrix, 'наименование (уровень 1)')
  const targetHeaderRowCount = levelRow >= 0 ? levelRow + 1 : 3
  const targetColCount = detectTargetColumnCount(targetMatrix, targetHeaderRowCount)
  const targetRows = extractTargetHeaderRows(targetMatrix, targetHeaderRowCount, targetColCount)
  const sheetMerges = extractMergesFromTargetSheet(ws, targetHeaderRowCount, targetColCount - 1)

  const dateRow = 0
  let dateLabelCol = findLabelCol(targetMatrix, dateRow, 'отчет на дату')
  if (dateLabelCol < 0) dateLabelCol = 0
  let dateValueCol = dateLabelCol + 1
  const dateAt0 = getCell(targetMatrix, dateRow, 0)
  if (normalizeHeader(dateAt0).includes('отчет') && normalizeHeader(dateAt0).includes('дату')) {
    dateLabelCol = 0
    dateValueCol = 1
  }

  return {
    targetHeaderRowCount,
    targetColCount,
    targetRows,
    sheetMerges,
    reportDateSource: { row: dateRow, col: dateLabelCol },
    reportDateTarget: { row: dateRow, col: dateLabelCol },
    dateValueTargetCol: dateValueCol,
  }
}
