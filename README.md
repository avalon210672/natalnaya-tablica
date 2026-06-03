# Натальная Таблица

Локальное приложение для **трансформаций Excel** (desktop на macOS; на Windows — portable HTML).

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

Артефакты: `src-tauri/target/release/bundle/` (`.app` / `.dmg` на Mac).

**Windows:** desktop-сборку (.exe) пока не делаем — отдавайте [portable](#один-файл-для-пользователя-без-установки-node) (`npm run build:portable`).

Репозиторий: [github.com/avalon210672/natalnaya-tablica](https://github.com/avalon210672/natalnaya-tablica)

## Тест на паре из Downloads

```bash
npx tsx scripts/test-transform.mjs
```

## Ограничения v1

- Один лист, без сводных; **макросы не переносятся**.
- Оформление: объединения ячеек и высоты строк из эталона, стили заголовков (заливка, рамки, Calibri). Итог сохраняется как **.xlsx**.
- Старые трансформации без шаблона оформления выдают **.xls** без стилей — пересоздайте трансформацию.
