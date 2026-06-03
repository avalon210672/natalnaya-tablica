export const BaseDirectory = { AppData: 20 }

export async function exists(): Promise<boolean> {
  return false
}

export async function mkdir(): Promise<void> {}

export async function readTextFile(): Promise<string> {
  return '[]'
}

export async function writeTextFile(): Promise<void> {}

export async function readFile(): Promise<Uint8Array> {
  return new Uint8Array()
}

export async function writeFile(): Promise<void> {}
