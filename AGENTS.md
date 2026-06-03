# AGENTS.md

Правила и контекст для ИИ-агента в этом проекте.

## О проекте

Веб-приложение «Натальная таблица» — табличное отображение положений планет в натальной карте (знак, градус, дом, ретроградность).

**Стек:** React 19, TypeScript, Vite 8, Tailwind CSS 4.

**Ключевые директории:**

- `src/components/` — UI (форма рождения, таблица, layout)
- `src/lib/` — расчёт карты (сейчас демо), форматирование
- `src/data/` — справочники планет и знаков (RU)
- `src/pages/` — страницы
- `src/types/` — TypeScript-типы
- `logs/` — логи агента (`logs/agent_YYYY-MM-DD.log`)

Расчёт позиций планет демонстрационный; для точных эфемерид — подключить астрономическую библиотеку (см. TODO в `src/lib/natal.ts`).

## Правила работы

- Секреты только в `.env` (не коммитить); образец — `.env.example`
- Коммиты: `тип: краткое описание` на русском (`feat`, `fix`, `docs`, `refactor`, `chore`)
- Заметки по проекту в Obsidian: `Cursor/natalnaya-tablica/`

## Learned User Preferences

<!-- Заполняется плагином Continual Learning -->

## Learned Workspace Facts

<!-- Заполняется плагином Continual Learning -->
