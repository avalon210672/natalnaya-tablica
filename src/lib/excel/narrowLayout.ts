import type { HeaderLayout } from '../../types/transformation'
import { getCell } from './workbook'

/** Дата отчёта в исходнике: ищем рядом с подписью «отчет на дату:». */
export function resolveReportDate(
  sourceMatrix: string[][],
  layout: HeaderLayout,
): string {
  const row = layout.reportDateSource.row
  const startCol = layout.reportDateSource.col

  for (let c = startCol; c <= startCol + 3; c++) {
    const v = getCell(sourceMatrix, row, c)
    if (!v) continue
    const lower = v.toLowerCase()
    if (lower.includes('отчет') && lower.includes('дату')) continue
    if (/^\d{2}\.\d{2}\.\d{4}/.test(v)) return v
  }

  for (let c = 0; c < 20; c++) {
    const v = getCell(sourceMatrix, row, c)
    if (/^\d{2}\.\d{2}\.\d{4}/.test(v)) return v
  }

  return ''
}
