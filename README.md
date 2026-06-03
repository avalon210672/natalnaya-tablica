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

## Сборка на своём Mac или Windows

**Полная инструкция:** **[docs/BUILD-LOCAL.md](docs/BUILD-LOCAL.md)** — portable (без Rust), desktop на Mac (`.app`/`.dmg`), desktop на Windows (`.exe`), куда смотреть готовые файлы.

| Цель | Команда |
|------|---------|
| Portable для Mac и Windows | `npm run build:portable` → папка `release/` |
| Программа для Mac | `npm run build` → `src-tauri/target/release/bundle/` |
| Программа для Windows | то же на **ПК с Windows** |

Репозиторий: [github.com/avalon210672/natalnaya-tablica](https://github.com/avalon210672/natalnaya-tablica)

## Тест на паре из Downloads

```bash
npx tsx scripts/test-transform.mjs
```

## Ограничения v1

- Один лист, без сводных; **макросы не переносятся**.
- Оформление: объединения ячеек и высоты строк из эталона, стили заголовков (заливка, рамки, Calibri). Итог сохраняется как **.xlsx**.
- Старые трансформации без шаблона оформления выдают **.xls** без стилей — пересоздайте трансформацию.
