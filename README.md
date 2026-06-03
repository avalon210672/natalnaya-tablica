# Натальная Таблица

Локальное приложение для **трансформаций Excel** (macOS / Windows через Tauri).

1. Загрузите **исходник + эталон** → если пара совместима, задаёте имя → плитка в списке.
2. Если файлы **не «бьются»** — трансформация **не создаётся**, с перечнем причин.
3. **«Трансформируем»** на плитке → новый исходник → диалог **Сохранить как**.

## Требования

- Node.js 20+
- **Rust** (для desktop): [https://rustup.rs](https://rustup.rs)

## Запуск (desktop)

```bash
npm install
npm run dev
```

Откроется окно Tauri (в dev поднимается Vite на :5173).

## Только веб (без Tauri)

```bash
npm run dev:web
```

Файлы через браузер; рецепты в `localStorage`.

## Один файл для пользователя (без установки Node)

Собрать portable-версию — всё приложение в одном HTML:

```bash
npm run build:portable
```

Папка `release/`: отдайте пользователю zip с `Натальная-Таблица.html` и скриптом `Запуск (macOS).command` или `Запуск (Windows).bat`. Подробнее: [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md).

## Сборка desktop-приложения (.app / .exe)

Пошагово: **[docs/BUILD-DESKTOP.md](docs/BUILD-DESKTOP.md)**.

Кратко — нужен [Rust](https://rustup.rs), затем:

```bash
npm install
npm run build
```

Артефакты: `src-tauri/target/release/bundle/` (`.app` / `.dmg` на Mac, установщик на Windows).

### Сборка в GitHub (Mac + Windows без Horizon)

После push в `main` запускается [Actions → Build Desktop](https://github.com/avalon210672/natalnaya-tablica/actions). В конце run → **Artifacts**:

- `desktop-macos` — `.dmg` / `.app`
- `desktop-windows` — установщик `.exe` / `.msi`
- `portable-html-windows-mac` — один HTML + скрипты запуска

Ручной запуск: Actions → Build Desktop → **Run workflow**.

## Тест на паре из Downloads

```bash
npx tsx scripts/test-transform.mjs
```

## Ограничения v1

- Один лист, без сводных; **макросы не переносятся**.
- Оформление: объединения ячеек и высоты строк из эталона, стили заголовков (заливка, рамки, Calibri). Итог сохраняется как **.xlsx**.
- Старые трансформации без шаблона оформления выдают **.xls** без стилей — пересоздайте трансформацию.
