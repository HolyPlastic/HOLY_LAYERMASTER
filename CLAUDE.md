# HolyLayerMaster — Claude Brief

## Stack
- **CEP Panel** for Adobe After Effects (Chromium Embedded Framework)
- **Frontend:** HTML / CSS / JS (`js/main.js`, `js/colorpicker.js`, `js/hlm-dragdrop.js`)
- **Backend:** ExtendScript JSX (`jsx/hostscript.jsx`) — bridged via `csInterface.evalScript()`
- **Storage:** `_HLM_Data/` folder adjacent to `.aep` file

## Critical Rules
- `body { background: transparent; }` — always. AE shows through.
- CEP bridge is **async**. Never assume evalScript returns synchronously.
- No rounded corners (`border-radius: 0px` everywhere).
- All colours in `:root` as `var(--hlm-*)` tokens. No inline hex in classes.
- Region markers required in all HTML/CSS files — see `docs/CODE_STYLE.md`.
- - **Never add `/* */` comments inside JSDoc block comments** in any `.js` file — nested block comments cause a `SyntaxError` that silently kills the entire module.
- **When adding a new section to `index.html`**, it must be wrapped in `<div data-section-id="yourKey">` inside `<div id="sectionsContainer">`, and `'yourKey'` must be added to `sectionOrder` in both `makeDefaultConfig()` and the `loadConfig()` backfill in `main.js`. See `docs/features/08-drag-drop.md`.

## Docs Map
Read only what the task needs:
- **Touching any feature** → `docs/features/<feature>.md` (description + dev log)
- **Cross-cutting concerns** (storage, DNA tagging, CEP events) → `docs/ARCHITECTURE.md`
- **Code style / regions / CSS conventions** → `docs/CODE_STYLE.md`
- **Planned / unimplemented features** → `docs/ROADMAP.md`

## Dev Log Rule
After every edit, append one entry to the dev log in the relevant `docs/features/<feature>.md`:
```
- 4. [what changed] — [why, one sentence max]
```
Number sequentially from existing entries. Keep it factual. No prose.