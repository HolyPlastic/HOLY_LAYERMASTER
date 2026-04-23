# Bank Color Picker

**Files:** `js/colorpicker.js` (HLMColorPicker module) | `js/main.js` → `openColorPicker()`, `fetchAELabels()`, `setAccentColor()`, `loadSavedAccentColor()` | `jsx/hostscript.jsx` → `getAELabelData()`
**Trigger:** Right-click any Capture button or State capture button. Also: the `#hlm-color-btn` button in the COMP HEADER opens the picker with `targetId='accent'` to change the panel accent color.

Standalone reusable popup module. Init once at boot:
```js
HLMColorPicker.init({ fetchSwatches, onApply, onReset, onPreview });
```
- `onApply(targetId, hex)` — applies color, saves to config/persists.
- `onReset(targetId)` — deletes custom color, reverts to `BANK_PALETTE` auto-assignment.
- `onPreview(targetId, hex)` — live preview: called on every hex input or native picker scrub. For `targetId='accent'`, this updates `--accent`, `--accent-dim`, `--accent-dark`, and `--border-accent` CSS variables in real time.

**Layout:** OK + Reset row → native OS picker trigger + hex input row → AE label color swatches (flex-wrap).

**AE Label Colors:** Read via `app.preferences.getPrefAsString` with CP1252 encoding. Stored as ARGB bytes — alpha stripped, `000000` results skipped. Cached after first fetch; invalidate with `HLMColorPicker.clearSwatchCache()`.

**Positioning:** Full panel width (fixed margin each side). Opens below anchor, flips above if insufficient space. Re-positions after swatches render.

---

## Panel Accent Color Picker

A `#hlm-color-btn` button in the COMP HEADER opens `HLMColorPicker` with `targetId='accent'`. The `onPreview` callback (`setAccentColor`) updates CSS custom properties on `<html>` in real time as the user scrubs the hex input or native picker. `onApply` saves to `localStorage` key `hlm_accentColor`. On load, `loadSavedAccentColor()` restores the saved color before the first render.

`setAccentColor(hex)` derives:
- `--accent` = the hex value
- `--accent-dim` = `rgba(r*0.8, g*0.8, b*0.8, 0.18)`
- `--accent-dark` = `rgb(r*0.5, g*0.5, b*0.5)`
- `--border-accent` = `rgba(r, g, b, 0.28)`

All orange elements in the panel (iso-btn borders/icons/labels, `.btn-color-picker`, cp-ok-btn, section stars, etc.) are driven by these variables.

---

## Dev Log
- 1: Initial implementation as standalone module.
- 2: Added `onPreview` to `HLMColorPicker` — `_preview()` calls the callback on hex input `input` event and native picker `input` event. Added `setAccentColor()` / `loadSavedAccentColor()` / `getCurrentAccentColor()` to `main.js`. Accent color saved/loaded from `localStorage` key `hlm_accentColor`. `#hlm-color-btn` added to COMP HEADER. `--accent-dark` added to `:root`. Iso-btn restyled: default = `--accent-border`/`--accent`, hover = `--accent-dim` fill, active = `--accent-dark` fill with `--bg-panel` text. Button height 36px, bar gap 4px.
- 3: New modeless settings panel (`settings.html`, registered as `com.holy.layer.master.settings` in manifest). Replaces the inline `HLMColorPicker` popup for panel accent colour — settings cog button (`#hlm-settings-cog-btn`) opens the modeless window via `requestOpenExtension`. Panel contains a full HSV canvas picker (spectrum + hue strip), hex input, undo/apply/cancel buttons, and favourite colour swatches. `AutoVisible true` + empty-string second arg to `requestOpenExtension` (required for CEP modeless attach). Default accent `#ff7c44` hard-locked as a half-width "right-half rhombus" swatch at leftmost position in favourites row — always present, not removable, ensures plugin identity colour is never lost. Uses `DEFAULT_TAG` SVG path (viewBox `0 0 19.5 27.61`) and `.hs-fav-default` class (20×27px). CSEvent `holy.layermaster.color.change` broadcasts live preview to main panel. CSS vars `--accent-mid`, `--accent-offwhite`, `--ACCENT-H/S/L`, `--ACCENT-RGB` added to `:root` and `STYLE_boot`.
