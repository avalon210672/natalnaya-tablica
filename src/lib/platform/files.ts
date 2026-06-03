import { isTauri } from './env'

export interface PickedFile {
  name: string
  buffer: ArrayBuffer
}

const EXCEL_FILTERS = [
  { name: 'Excel', extensions: ['xls', 'xlsx', 'XLS', 'XLSX'] },
]

export async function pickExcelFile(title: string): Promise<PickedFile | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const path = await open({
      title,
      multiple: false,
      filters: EXCEL_FILTERS,
    })
    if (!path || typeof path !== 'string') return null
    const { readFile } = await import('@tauri-apps/plugin-fs')
    const bytes = await readFile(path)
    const name = path.split(/[/\\]/).pop() ?? 'file.xls'
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return { name, buffer }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xls,.xlsx,.XLS,.XLSX'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      void file.arrayBuffer().then((buffer) => resolve({ name: file.name, buffer }))
    }
    input.click()
  })
}

export async function saveExcelFile(
  buffer: ArrayBuffer,
  defaultName: string,
  mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
): Promise<boolean> {
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({
      title: 'Сохранить итоговый файл',
      defaultPath: defaultName.endsWith('.xls') || defaultName.endsWith('.xlsx')
        ? defaultName
        : `${defaultName}.xls`,
      filters: EXCEL_FILTERS,
    })
    if (!path || typeof path !== 'string') return false
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    await writeFile(path, new Uint8Array(buffer))
    return true
  }

  const blob = new Blob([buffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultName.endsWith('.xls') || defaultName.endsWith('.xlsx')
    ? defaultName
    : `${defaultName}.xls`
  a.click()
  URL.revokeObjectURL(url)
  return true
}
