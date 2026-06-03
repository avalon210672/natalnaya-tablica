import * as XLSX from 'xlsx'

export type SheetMatrix = (string | number | boolean)[][]

export function readWorkbookFromArrayBuffer(buffer: ArrayBuffer) {
  return XLSX.read(buffer, { type: 'array', cellStyles: true, bookVBA: true })
}

export function sheetToMatrix(ws: XLSX.WorkSheet): SheetMatrix {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as SheetMatrix
}

export function getCell(matrix: SheetMatrix, row: number, col: number): string {
  const v = matrix[row]?.[col]
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

export function normalizeHeader(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function findHeaderRow(matrix: SheetMatrix, marker: string): number {
  const needle = normalizeHeader(marker)
  for (let r = 0; r < Math.min(matrix.length, 30); r++) {
    for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
      if (normalizeHeader(getCell(matrix, r, c)).includes(needle)) return r
    }
  }
  return -1
}

export function buildSourceHeaderMap(matrix: SheetMatrix, headerRow: number): Map<string, number> {
  const map = new Map<string, number>()
  const row = matrix[headerRow] ?? []
  for (let c = 0; c < row.length; c++) {
    const key = normalizeHeader(getCell(matrix, headerRow, c))
    if (key) map.set(key, c)
  }
  return map
}
