# Сборка Desktop (Tauri)

> **Актуальная пошаговая инструкция для Mac и Windows:** [BUILD-LOCAL.md](./BUILD-LOCAL.md)

Ниже — краткая справка по Tauri. Пользователю Node.js и Rust **не нужны** — он получает только `.app` или `.exe`.

---

## 1. Что установить (один раз)

### Общее

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Rust** — [https://rustup.rs](https://rustup.rs)

После установки Rust перезапустите терминал и проверьте:

```bash
node --version
rustc --version
cargo --version
```

### macOS (ваш случай)

```bash
xcode-select --install
```

Нужны Command Line Tools (компилятор для Rust).

### Windows (если собираете там)

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — workload «Desktop development with C++»
- **WebView2** — обычно уже есть в Windows 11; в Windows 10 при необходимости: [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)

---

## 2. Подготовка проекта

```bash
cd /Users/sergeypodvolotsky/Projects/natalnaya-tablica
npm install
```

Первая сборка Rust скачает зависимости — может занять **5–15 минут**.

---

## 3. Проверка в режиме разработки

Окно приложения без финальной сборки:

```bash
npm run dev
```

Должно открыться окно «Натальная Таблица» (внутри — Vite на :5173).

---

## 4. Релизная сборка

```bash
npm run build
```

Команда автоматически:

1. собирает фронт (`npm run build:web` → папка `dist/`);
2. компилирует Rust;
3. упаковывает установщик / приложение.

### Где лежит результат

```text
src-tauri/target/release/bundle/
```

| Платформа | Что отдать пользователю |
|-----------|-------------------------|
| **macOS** | `macos/Натальная Таблица.app` или `.dmg` из той же папки |
| **Windows** | `.msi` / `.exe` из `nsis/` или `msi/` (имя зависит от версии Tauri) |

Пользователь: перетащить `.app` в «Программы» или запустить установщик Windows.

---

## 5. Сборка под другую ОС

| Собираете на | Получите |
|--------------|----------|
| Mac | `.app` / `.dmg` для Mac |
| Windows | `.exe` / `.msi` для Windows |

Кросс-компиляция (Mac → Windows exe) не используем. Для Windows — [portable](./DISTRIBUTION.md#1-portable--один-html-рекомендуется-если-нет-rust).

---

## 6. Типичные ошибки

### `cargo: command not found` / `rustc not found`

Rust не установлен или терминал не перезапускали после `rustup`.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### macOS: `linker cc not found`

```bash
xcode-select --install
```

### `Transforming destructuring... safari13 is not supported`

В `vite.config.ts` для macOS задан таргет `safari16` (плагины Tauri fs используют современный JS). Если ошибка вернулась — обновите репозиторий и снова `npm run build`.

### Долго висит на первом `npm run build`

Нормально — компилируются сотни crate’ов Rust. Дождитесь окончания (1–10 минут).

### Windows: ошибка WebView2

Установите WebView2 Runtime (см. выше).

---

## 7. Сравнение с portable

| | Tauri desktop | `npm run build:portable` |
|---|---------------|---------------------------|
| Нужен Rust при сборке | да | нет |
| У пользователя | `.app` / `.exe` | HTML + браузер |
| Диалоги файлов | системные | браузер |
| Рецепты | AppData | localStorage |

Если Rust пока не ставите — используйте **portable** ([DISTRIBUTION.md](./DISTRIBUTION.md)).
