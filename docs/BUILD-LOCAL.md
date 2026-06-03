# Локальная сборка на Mac и Windows

Инструкция для **того, кто собирает** программу на своём компьютере.  
Пользователям, которым вы отдаёте готовые файлы, **Node.js и Rust не нужны**.

Репозиторий: [github.com/avalon210672/natalnaya-tablica](https://github.com/avalon210672/natalnaya-tablica)

---

## Что можно собрать

| Тип | Команда | Rust | Результат | Кому отдавать |
|-----|---------|------|-----------|---------------|
| **Portable** | `npm run build:portable` | нет | один HTML + скрипты запуска | Mac и Windows (универсально) |
| **Desktop (Tauri)** | `npm run build` | да | `.app`/`.dmg` или `.exe`/`.msi` | только та ОС, где собирали |

Portable собирается **одинаково** на Mac и Windows.  
Desktop: на Mac получите только Mac-версию, на Windows — только Windows-версию.

---

## 0. Получить проект

**Через Git:**

```bash
git clone https://github.com/avalon210672/natalnaya-tablica.git
cd natalnaya-tablica
```

**Или** распаковать zip с папкой проекта и открыть терминал в этой папке.

Дальше все команды — **из корня проекта** (где лежит `package.json`).

---

## 1. Portable (рекомендуется для Windows)

Подходит, если не хотите ставить Rust или нужен один файл для коллег.

### Mac и Windows — одинаковые шаги

**Установить один раз:** [Node.js 20+](https://nodejs.org)

**Терминал (Mac: Terminal, Windows: PowerShell или cmd):**

```bash
npm install
npm run build:portable
```

**Результат** — папка `release/`:

| Файл | Назначение |
|------|------------|
| `Натальная-Таблица.html` | всё приложение (~1.6 МБ) |
| `Запуск (macOS).command` | запуск на Mac |
| `Запуск (Windows).bat` | запуск на Windows |
| `КАК-ЗАПУСТИТЬ.txt` | инструкция для пользователя |

**Что отправить:** zip всей папки `release`. Минимум для Windows: **HTML + `.bat`** в одной папке.

**У пользователя:** Node.js не нужен, нужен Chrome или Edge.

---

## 2. Desktop на macOS (.app / .dmg)

### 2.1. Установка (один раз)

1. [Node.js 20+](https://nodejs.org)
2. [Rust](https://rustup.rs) — в терминале установщик, вариант по умолчанию; если прервали — запустите снова до конца
3. Command Line Tools:

```bash
xcode-select --install
```

4. Перезапустите терминал, проверьте:

```bash
source "$HOME/.cargo/env"
node --version
rustc --version
cargo --version
```

### 2.2. Проверка без сборки установщика

```bash
cd ~/Projects/natalnaya-tablica   # ваш путь
npm install
npm run dev
```

Должно открыться окно «Натальная Таблица».

### 2.3. Релизная сборка

```bash
npm run build
```

Первая сборка часто **5–15 минут** (компиляция Rust).

**Где искать файлы:**

```text
src-tauri/target/release/bundle/
├── macos/Натальная Таблица.app
└── dmg/Натальная Таблица_0.1.0_aarch64.dmg   (номер версии может отличаться)
```

**Что отдать пользователю Mac:** `.dmg` (удобнее) или `.app`.

### 2.4. После изменений в коде

Снова `npm run build` и отправить новый `.dmg` / `.app`.

---

## 3. Desktop на Windows (.exe / .msi)

Сборка выполняется **на компьютере с Windows** (не на Mac).

### 3.1. Установка (один раз)

1. [Node.js 20 LTS](https://nodejs.org) — галочка «Add to PATH»
2. [Rust](https://rustup.rs) — установщик `rustup-init.exe`, профиль **default**, toolchain **msvc**
3. [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — компонент **«Разработка классических приложений на C++»** (Desktop development with C++)
4. [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) — если Windows 10 и сборка жалуется на WebView2

**PowerShell (новое окно после установки):**

```powershell
node --version
rustc --version
cargo --version
```

### 3.2. Проверка без установщика

```powershell
cd C:\Users\ВАШ_ПОЛЬЗОВАТЕЛЬ\Projects\natalnaya-tablica
npm install
npm run dev
```

Должно открыться окно приложения.

### 3.3. Релизная сборка

```powershell
npm run build
```

Первая сборка — **10–25 минут**.

**Где искать файлы** (пути могут чуть отличаться):

```text
src-tauri\target\release\bundle\
├── nsis\          ← часто установщик .exe
└── msi\           ← иногда .msi
```

Откройте подпапки и найдите файл с расширением `.exe` или `.msi` и именем вроде «Натальная Таблица».

**Что отдать пользователю Windows:** установщик `.exe` (или `.msi`). Пользователь запускает его и ставит программу как обычное приложение.

### 3.4. После изменений в коде

Снова `npm run build` на Windows и раздайте новый установщик.

---

## 4. Краткая шпаргалка

### Mac — только portable

```bash
npm install
npm run build:portable
# → release/
```

### Mac — desktop

```bash
source "$HOME/.cargo/env"
npm install
npm run build
# → src-tauri/target/release/bundle/dmg/
```

### Windows — portable

```powershell
npm install
npm run build:portable
# → release\
```

### Windows — desktop

```powershell
npm install
npm run build
# → src-tauri\target\release\bundle\nsis\ или msi\
```

---

## 5. Что выбрать при раздаче

| Ситуация | Вариант |
|----------|---------|
| Коллеги на **Windows**, без установки | **portable** (zip `release/`) |
| Вы на **Mac**, коллеги на Windows | portable, собранный на Mac (`build:portable`) |
| Только **Mac**, «как программа» | `npm run build` → `.dmg` |
| **Windows**, «как программа» | `npm run build` на Windows → `.exe` |
| Нет Rust / не хотите возиться | **portable** |

---

## 6. Типичные ошибки

### `rustc` / `cargo` не найдены

Rust не доустановлен или терминал не перезапускали.

- **Mac:** `source "$HOME/.cargo/env"` или новое окно терминала  
- **Windows:** закройте и откройте PowerShell после `rustup-init.exe`

### Mac: `linker cc not found`

```bash
xcode-select --install
```

### Mac: `safari13 is not supported` при `npm run build`

Обновите проект с GitHub (в `vite.config.ts` должен быть таргет `safari16`).

### `npm run build` очень долго

Нормально для первого раза — компилируется Rust.

### Windows: WebView2

Установите [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/).

### Windows: ошибки линковки / MSVC

Переустановите C++ Build Tools с workload для desktop C++.

### Portable: у пользователя не открывается

Нужны **оба** файла в одной папке: `Натальная-Таблица.html` и `Запуск (Windows).bat`. Браузер — Chrome или Edge.

---

## 7. Связанные документы

- [DISTRIBUTION.md](./DISTRIBUTION.md) — что именно отдавать пользователю  
- [README.md](../README.md) — обзор проекта
