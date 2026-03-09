# HolyLayerMaster — Claude Brief

## Stack
- **CEP Panel** for Adobe After Effects (Chromium Embedded Framework)
- **Frontend:** HTML / CSS / JS (`js/main.js`, `js/colorpicker.js`, `js/hlm-dragdrop.js`)
- **Backend:** ExtendScript JSX (`jsx/hostscript.jsx`) — bridged via `csInterface.evalScript()`
- **Storage:** `_HLM_Data/` folder adjacent to `.aep` file. All file I/O uses ExtendScript `File`/`Folder` API via `hlm_*` helper functions in `hostscript.jsx` — no Node.js `fs` or `path` in the browser-side JS.

## Critical Rules
- If a change you make creates a condition that is relevant to all future code updates then you can add a critical rule to the end of this list. ONLY if it is a must-read for future agents working on the codebase.
- `body { background: transparent; }` — always. AE shows through.
- CEP bridge is **async**. Never assume evalScript returns synchronously.
- No rounded corners (`border-radius: 0px` everywhere).
- All colours in `:root` as `var(--hlm-*)` tokens. No inline hex in classes.
- Region markers required in all HTML/CSS files — see `docs/CODE_STYLE.md`.
- **Never add `/* */` comments inside JSDoc block comments** in any `.js` file — nested block comments cause a `SyntaxError` that silently kills the entire module.
- **When adding a new section to `index.html`**, it must be wrapped in `<div data-section-id="yourKey">` inside `<div id="sectionsContainer">`, and `'yourKey'` must be added to `sectionOrder` in both `makeDefaultConfig()` and the `loadConfig()` backfill in `main.js`. See `docs/features/08-drag-drop.md`.
- **No Node.js `fs` or `path` in `main.js`** — file I/O goes through `hlm_*` helper functions in `hostscript.jsx` via `evalScript()`. `--mixed-context` is not in the manifest and must never be added back. See `docs/ARCHITECTURE.md` for the storage pattern.
- **`loadConfig()` is async** — it takes a callback. All logic that depends on the loaded config must go inside that callback, not after the call.

## Docs Map
Read only what the task needs:
- **Touching any feature** → `docs/features/<feature>.md` (description + dev log)
- **Cross-cutting concerns** (storage, DNA tagging, CEP events) → `docs/ARCHITECTURE.md`
- **Code style / regions / CSS conventions** → `docs/CODE_STYLE.md`
- **Planned / unimplemented features** → `docs/ROADMAP.md`

## Dev Log Rule
After every edit, append one entry to the dev log in the relevant `docs/features/<feature>.md`:
```
- [number]: [what changed] [why, one sentence max] - [relevant code, citaitons, snippets, whatever is helpful for future agents]
```
Number sequentially from existing entries. Keep it factual. No prose. Please add actual code change details. Try not to create a huge log but do not scrimp on important details. 