# Persistence

For DNA tagging and storage layout, see `docs/ARCHITECTURE.md`.

This file covers the JS-side config management only.

**Files:** `js/main.js` → `getDataDir()`, `getSavePath()`, `getConfigPath()`, `ensureDataDir()`, `loadConfig()`, `saveConfig()`, `makeDefaultConfig()`

---

## Config Lifecycle

- Loaded on project path change (inside `_applyContext()`).
- Saved on: bank/state add/remove, rename, color change.
- `makeDefaultConfig()` provides 3 KF banks, 3 Layer banks, 3 states as defaults.
- `loadConfig()` backfills missing fields silently — safe to add new config fields without migration.

## Data Files

Each bank/state write is a separate JSON keyed by `<compId>_<bankId>`. Clear = `fs.unlinkSync`. Recall checks `fs.existsSync` before reading.

`getBankCount()` reads the file to count items for the indicator tooltip — handles `data.layers`, `data.ids`, and `data.keyframes` shapes.

---

## Dev Log
- 1: Initial file-based persistence implementation.
- 2: Updated `loadConfig()` async callback with a `try/catch` block and explicit string checks to prevent silent C++ engine failures when reading missing/unsaved project configs.
