import fs from 'fs'
import XLSX from 'xlsx'
import { learnTransformationFromPair } from '../src/lib/excel/learn.ts'
import { applyTransformation } from '../src/lib/excel/apply.ts'

const src = fs.readFileSync('/Users/sergeypodvolotsky/Downloads/Исходник.XLS')
const tgt = fs.readFileSync('/Users/sergeypodvolotsky/Downloads/Итог.XLS')

const { recipe } = await learnTransformationFromPair(
  src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength),
  tgt.buffer.slice(tgt.byteOffset, tgt.byteOffset + tgt.byteLength),
)
console.log('Mappings:', recipe.columnMappings)

const out = await applyTransformation(
  src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength),
  recipe,
)
console.log('has style template', !!recipe.styleTemplateXlsxBase64)
const wb = XLSX.read(out, { type: 'array' })
const m = XLSX.utils.sheet_to_json(wb.Sheets['Структура'], { header: 1 })
const tgtM = XLSX.utils.sheet_to_json(XLSX.read(tgt).Sheets['Структура'], { header: 1 })
console.log('out rows', m.length, 'tgt rows', tgtM.length)
console.log('row3 match', JSON.stringify(m[3]) === JSON.stringify(tgtM[3]))
let mism = 0
for (let i = 3; i < Math.min(m.length, tgtM.length); i++) {
  if (JSON.stringify(m[i]) !== JSON.stringify(tgtM[i])) mism++
}
console.log('data row mismatches', mism)
console.log('out[3]', m[3])
console.log('tgt[3]', tgtM[3])
for (let c = 0; c < 9; c++) {
  const a = m[3]?.[c]
  const b = tgtM[3]?.[c]
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.log('diff col', c, 'out', a, 'tgt', b)
    if (typeof a === 'string' && typeof b === 'string') {
      console.log('  codes out', [...a].map((ch) => ch.charCodeAt(0)))
      console.log('  codes tgt', [...b].map((ch) => ch.charCodeAt(0)))
    }
  }
}
