import fs from 'fs'
import XLSX from 'xlsx'
import { learnTransformationFromPair } from '../src/lib/excel/learn.ts'
import { applyTransformation } from '../src/lib/excel/apply.ts'
import { resolveMappingsForSource } from '../src/lib/excel/resolveColumns.ts'
import { sheetToMatrix, readWorkbookFromArrayBuffer } from '../src/lib/excel/workbook.ts'

const SRC = '/Users/sergeypodvolotsky/Downloads/ZHCM_0112_Штатная расстановка_30.01.2026_18_17_0888.XLS'
const ETALON = '/Users/sergeypodvolotsky/Downloads/Итог.XLS'
const OLD_ETALON_SRC = '/Users/sergeypodvolotsky/Downloads/Исходник.XLS'

const src = fs.readFileSync(SRC)
const etalon = fs.readFileSync(ETALON)
const learnSrc = fs.readFileSync(OLD_ETALON_SRC)

const { recipe } = await learnTransformationFromPair(
  learnSrc.buffer.slice(learnSrc.byteOffset, learnSrc.byteOffset + learnSrc.byteLength),
  etalon.buffer.slice(etalon.byteOffset, etalon.byteOffset + etalon.byteLength),
)

const matrix = sheetToMatrix(readWorkbookFromArrayBuffer(src.buffer).Sheets['Структура'])
const { mappings, fioSourceCol } = resolveMappingsForSource(matrix, recipe)
console.log('FIO column (1-based):', fioSourceCol + 1, 'mapping col8 ->', mappings.find((m) => m.targetCol === 8)?.sourceCol)

const out = await applyTransformation(
  src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength),
  recipe,
)
const m = XLSX.utils.sheet_to_json(XLSX.read(out, { type: 'array' }).Sheets['Структура'], {
  header: 1,
})
console.log('R0:', m[0])
console.log('R1:', m[1])
console.log('R2:', m[2])
console.log('merges:', XLSX.read(out, { type: 'array' }).Sheets['Структура']['!merges'])
console.log('R3 FIO:', m[3]?.[8])
let fio = 0
for (let i = 3; i < m.length; i++) {
  const v = String(m[i]?.[8] ?? '')
  if (v && v !== '-' && v.includes(' ')) fio++
}
console.log('rows', m.length, 'with real FIO in col I:', fio)
