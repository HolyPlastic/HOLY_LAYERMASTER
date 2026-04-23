# Isolation Rail

**Files:** `js/main.js` (listeners) | `jsx/hostscript.jsx` → `isolateSolo()`, `isolateShyFocus()`, `isolateLock()`, `isolateInvert()`
**UI:** Four buttons at top of panel — SOLO, SHY, LOCK, INVERT. Can be reordered by drag (see `docs/features/08-drag-drop.md`).

Three quick-action toggles on selected layers. Each has reverse logic: a second press undoes the action when conditions are already met.

---

## Solo
Toggles solo on selected layers. Reverse trigger: if all **visible** (non-shy-hidden) selected layers are already soloed → un-solos them. Shy-hidden layers excluded from both the condition check and the action — the solo toggle now applies only to visible layers to prevent AE errors on hidden layers.

## Shy Focus
Three branches:
- **No selection (or only shy-hidden layers selected)** → toggle global `hideShyLayers` comp switch.
- **`hideShyLayers` is ON AND effective (visible) selection is non-empty** → REVERSE: disable global shy + un-shy every layer in comp.
- **Selection exists + global shy OFF** → FOCUS: un-shy selected, shy all others, force `hideShyLayers` ON.

Reverse is keyed on `hideShyLayers` state, not on whether selected layers are shy — after a Focus, focused layers have `shy=false` making an `allSelectedShy` check unreliable.

**Effective selection:** shy-hidden layers (shy=true while `hideShyLayers` is ON) are filtered out before evaluating which branch to take. If only shy-hidden layers are selected, the effective selection is empty → Branch 1 fires (simple toggle). Same filter pattern as `isolateSolo()` (Entry 3).

## Lock
All selected locked → unlock all. Otherwise → lock all.

## Invert
Deselects currently selected layers, selects all unlocked layers that are not in the current selection. Locked layers are skipped. No reverse trigger — always computes the complement of the current selection.

---

## Dev Log
- 1: Initial implementation.
- 2: Added known bug notes — shy reverse tripped by hidden layers, states potentially same root cause.
- 3. isolateSolo() now applies solo toggle only to visible layers — fixes AE error when shy-hidden layers are in the selection.
- 4: Added `holyAPI_hlm_isolateSolo()`, `holyAPI_hlm_isolateShyFocus()`, `holyAPI_hlm_isolateLock()` wrapper functions before context IIFE in `hostscript.jsx`. Wrappers catch errors and return `"SUCCESS"` or `"ERROR: ..."` strings for Holy Agent Phase 4 bridge.
- 5: Added INVERT button to isolation bar. `isolateInvert()` in `hostscript.jsx` deselects current selection, selects all non-selected unlocked layers. Locked layers are skipped. Icon: dashed rect with + sign (matching iso-btn style). `holyAPI_hlm_isolateInvert()` wrapper added for Holy Agent bridge.
- 6: Restyled iso-btn: always uses `--accent` for borders/icons/labels. Hover: `--accent-dim` fill. Active: `--accent-dark` fill with `--bg-panel` text. Height increased to 36px, bar gap to 4px. `--accent-dark` added to `:root` as HSL-derived token. Invert button icon also updated to use `stroke` (not fill) for consistency.
- 7: Fixed shy reverse edge case — `isolateShyFocus()` now computes an "effective selection" by filtering out `shy && hideShyLayers` layers before evaluating which branch to take. If only shy-hidden layers are selected, effective selection is empty → Branch 1 fires (simple global toggle) instead of incorrectly triggering REVERSE. Same filter idiom as `isolateSolo()` Entry 3. Bug: "Shy reverse tripped by hidden layers" struck through below.

---

## Open Bugs
- ~~**Shy reverse tripped by hidden layers** — reverse logic fires incorrectly when shy-hidden layers are in the selection. Root cause under investigation. Possibly needs to filter out `shy && hideShyLayers` layers from the condition check (same pattern already applied in `isolateSolo`).~~ FIXED — see Dev Log entry 7.
