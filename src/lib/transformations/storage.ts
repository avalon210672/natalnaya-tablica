import type { Transformation } from '../../types/transformation'
import { isTauri } from '../platform/env'

const STORAGE_KEY = 'natalnaya-tablica:transformations'
const FILE_NAME = 'transformations.json'

let cache: Transformation[] | null = null

async function loadFromDisk(): Promise<Transformation[]> {
  const { BaseDirectory, exists, readTextFile, writeTextFile, mkdir } = await import(
    '@tauri-apps/plugin-fs'
  )
  const dir = BaseDirectory.AppData
  const hasFile = await exists(FILE_NAME, { baseDir: dir })
  if (!hasFile) {
    await mkdir('', { baseDir: dir, recursive: true }).catch(() => {})
    await writeTextFile(FILE_NAME, '[]', { baseDir: dir })
    return []
  }
  const raw = await readTextFile(FILE_NAME, { baseDir: dir })
  return JSON.parse(raw) as Transformation[]
}

async function saveToDisk(list: Transformation[]): Promise<void> {
  const { BaseDirectory, writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs')
  const dir = BaseDirectory.AppData
  await mkdir('', { baseDir: dir, recursive: true }).catch(() => {})
  await writeTextFile(FILE_NAME, JSON.stringify(list, null, 2), { baseDir: dir })
}

function loadFromWeb(): Transformation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Transformation[]
  } catch {
    return []
  }
}

function saveToWeb(list: Transformation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function listTransformations(): Promise<Transformation[]> {
  if (cache) return [...cache]
  cache = isTauri() ? await loadFromDisk() : loadFromWeb()
  return [...cache]
}

export async function saveTransformation(t: Transformation): Promise<void> {
  const list = (await listTransformations()).filter((x) => x.id !== t.id)
  list.unshift(t)
  cache = list
  if (isTauri()) await saveToDisk(list)
  else saveToWeb(list)
}

export async function deleteTransformation(id: string): Promise<void> {
  const list = (await listTransformations()).filter((x) => x.id !== id)
  cache = list
  if (isTauri()) await saveToDisk(list)
  else saveToWeb(list)
}

export function createId(): string {
  return crypto.randomUUID()
}

export function invalidateTransformationsCache(): void {
  cache = null
}
