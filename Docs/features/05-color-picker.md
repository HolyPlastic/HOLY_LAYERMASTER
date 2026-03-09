# Bank Color Picker

**Files:** `js/colorpicker.js` (HLMColorPicker module) | `js/main.js` → `openColorPicker()`, `fetchAELabels()` | `jsx/hostscript.jsx` → `getAELabelData()`
**Trigger:** Right-click any Capture button or State capture button.

Standalone reusable popup module. Init once at boot:
```js
HLMColorPicker.init({ fetchSwatches, onApply, onReset });
```
- `onApply(targetId, hex)` — saves to `currentConfig.bankColors`, persists config, refreshes indicators.
- `onReset(targetId)` — deletes custom color, reverts to `BANK_PALETTE` auto-assignment.

**Layout:** OK + Reset row → native OS picker trigger + hex input row → AE label color swatches (flex-wrap).

**AE Label Colors:** Read via `app.preferences.getPrefAsString` with CP1252 encoding. Stored as ARGB bytes — alpha stripped, `000000` results skipped. Cached after first fetch; invalidate with `HLMColorPicker.clearSwatchCache()`.

**Positioning:** Full panel width (fixed margin each side). Opens below anchor, flips above if insufficient space. Re-positions after swatches render.

---

## Dev Log
- 1: Initial implementation as standalone module.
