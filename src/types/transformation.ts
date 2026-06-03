export interface ColumnMapping {
  targetCol: number
  sourceCol: number
  targetHeader: string
  sourceHeader: string
}

export interface RowFilter {
  sourceCol: number
  kind: 'nonEmpty'
  description: string
}

export interface SheetMergeSpec {
  top: number
  left: number
  bottom: number
  right: number
}

export interface HeaderLayout {
  targetHeaderRowCount: number
  targetColCount: number
  targetRows: string[][]
  sheetMerges: SheetMergeSpec[]
  reportDateSource: { row: number; col: number }
  reportDateTarget: { row: number; col: number }
  dateValueTargetCol: number
}

export interface StructureTransformationRecipe {
  kind: 'org-structure-narrow'
  sheetName: string
  sourceHeaderRow: number
  sourceDataStartRow: number
  columnMappings: ColumnMapping[]
  rowFilter: RowFilter
  headers: HeaderLayout
  /** xlsx-шаблон оформления эталона (base64) */
  styleTemplateXlsxBase64?: string
}

export interface Transformation {
  id: string
  name: string
  createdAt: string
  recipe: StructureTransformationRecipe
}
