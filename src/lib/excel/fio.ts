import { getCell, normalizeHeader } from './workbook'

export function looksLikePersonName(value: string): boolean {
  const v = value.trim()
  if (!v || v.length < 8) return false
  if (v === '-' || v === '—') return false
  if (/^\d/.test(v) || /^\d{2}\.\d{2}\.\d{4}/.test(v)) return false
  if (/^г\.\s/i.test(v)) return false
  const parts = v.split(/\s+/).filter(Boolean)
  if (parts.length >= 3) {
    return parts.every((p) => p.length >= 2 && /[а-яё]/i.test(p) && !/^\d+$/.test(p))
  }
  if (parts.length === 2) {
    return parts[0].length >= 4 && !parts[0].endsWith('.') && parts.every((p) => /[а-яё]/i.test(p))
  }
  return false
}

/** Заголовок «Фамилия…» часто смещён относительно данных (объединённые ячейки). */
export function resolveFioColumn(
  matrix: string[][],
  headerRow: number,
  dataStartRow: number,
  searchRadius = 15,
): number {
  const headerCandidates: number[] = []
  const row = matrix[headerRow] ?? []
  for (let c = 0; c < row.length; c++) {
    const h = normalizeHeader(getCell(matrix, headerRow, c))
    if (h.includes('фамилия') && h.includes('отчество')) headerCandidates.push(c)
  }

  const colsToTry = new Set<number>()
  for (const c of headerCandidates) {
    for (let d = -searchRadius; d <= searchRadius; d++) {
      const idx = c + d
      if (idx >= 0) colsToTry.add(idx)
    }
  }

  let bestCol = -1
  let bestScore = 0
  for (const c of colsToTry) {
    let score = 0
    for (let r = dataStartRow; r < matrix.length; r++) {
      if (looksLikePersonName(getCell(matrix, r, c))) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestCol = c
    }
  }
  return bestCol
}
