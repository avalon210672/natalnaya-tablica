#!/usr/bin/env node
/**
 * Упаковка dist/index.html в папку release/ для передачи пользователю.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distHtml = path.join(root, 'dist', 'index.html')
const releaseDir = path.join(root, 'release')
const appHtml = path.join(releaseDir, 'Натальная-Таблица.html')

if (!fs.existsSync(distHtml)) {
  console.error('Сначала выполните: npm run build:portable')
  process.exit(1)
}

fs.mkdirSync(releaseDir, { recursive: true })
fs.copyFileSync(distHtml, appHtml)

const macLauncher = `#!/bin/zsh
DIR="\${0:A:h}"
FILE="$DIR/Натальная-Таблица.html"
if [[ ! -f "$FILE" ]]; then
  osascript -e 'display alert "Файл Натальная-Таблица.html не найден рядом со скриптом."'
  exit 1
fi
open "$FILE"
`
fs.writeFileSync(path.join(releaseDir, 'Запуск (macOS).command'), macLauncher, { mode: 0o755 })

const winLauncher = `@echo off
chcp 65001 >nul
start "" "%~dp0Натальная-Таблица.html"
`
fs.writeFileSync(path.join(releaseDir, 'Запуск (Windows).bat'), winLauncher, 'utf8')

const readme = `# Натальная Таблица — portable

## Как запустить

- **macOS:** двойной клик по \`Запуск (macOS).command\` (или откройте \`Натальная-Таблица.html\` в Chrome / Edge).
- **Windows:** двойной клик по \`Запуск (Windows).bat\` (или откройте HTML в браузере).

Рекомендуемый браузер: **Chrome** или **Edge** (для работы с Excel-файлами).

## Что внутри одного HTML

- Весь интерфейс и логика трансформаций встроены в \`Натальная-Таблица.html\`.
- Рецепты хранятся в **localStorage** браузера (привязаны к этому файлу).
- Файлы не отправляются в интернет — всё локально.

## Ограничения portable

- Нет системного диалога «Сохранить как» — итог скачивается через браузер.
- Для «настоящего» приложения (.app / .exe) соберите desktop-версию (см. README в репозитории).

Передайте пользователю **всю папку** \`release\` или zip-архив с ней.
`

fs.writeFileSync(path.join(releaseDir, 'КАК-ЗАПУСТИТЬ.txt'), readme, 'utf8')

const sizeMb = (fs.statSync(appHtml).size / (1024 * 1024)).toFixed(1)
console.log(`Готово: ${releaseDir}`)
console.log(`  Натальная-Таблица.html — ${sizeMb} МБ`)
console.log('  Запуск (macOS).command')
console.log('  Запуск (Windows).bat')
