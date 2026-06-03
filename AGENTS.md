# AGENTS.md

Правила и контекст для ИИ-агента в этом проекте.

## О проекте

**Натальная Таблица** — локальное приложение для трансформации Excel (юмористический бренд, не астрология).

Пользователь обучает трансформацию на паре файлов (исходник + эталон), затем применяет рецепт к новым исходникам. Интерфейс на русском.

**Стек:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Tauri 2, `xlsx`.

**Ключевые директории:**

- `src/lib/excel/` — learn, validate, apply
- `src/lib/platform/` — диалоги файлов (Tauri / веб)
- `src/lib/transformations/` — хранение рецептов (AppData / localStorage)
- `src-tauri/` — Rust-оболочка desktop
- `logs/` — логи агента

**Создание трансформации:** без экрана правки правил; при несовместимости пары — `TransformationPairError` с причинами.

**Ограничения:** один лист, без сводных; макросы не копируются. Оформление эталона → `styleTemplateXlsxBase64` в рецепте; выход **.xlsx** (exceljs).

## Правила работы

- Секреты в `.env`, не коммитить
- Коммиты: `тип: описание` на русском
- Заметки: `Cursor/natalnaya-tablica/` в Obsidian

## Learned User Preferences

<!-- Заполняется плагином Continual Learning -->

## Learned Workspace Facts

<!-- Заполняется плагином Continual Learning -->
