# Isolation Rail

**Files:** `js/main.js` (listeners) | `jsx/hostscript.jsx` → `isolateSolo()`, `isolateShyFocus()`, `isolateLock()`
**UI:** Three buttons at top of panel — SOLO, SHY, LOCK. Can be reordered by drag (see `docs/features/08-drag-drop.md`).

Three quick-action toggles on selected layers. Each has reverse logic: a second press undoes the action when conditions are already met.

---

## Solo
Toggles solo on selected layers. Reverse trigger: if all **visible** (non-shy-hidden) selected layers are already soloed → un-solos them. Shy-hidden layers excluded from both the condition check and the action — the solo toggle now applies only to visible layers to prevent AE errors on hidden layers.

## Shy Focus
Three branches:
- **No selection** → toggle global `hideShyLayers` comp switch.
- **`hideShyLayers` is ON** → REVERSE: disable global shy + un-shy every layer in comp.
- **Selection exists + global shy OFF** → FOCUS: un-shy selected, shy all others, force `hideShyLayers` ON.

Reverse is keyed on `hideShyLayers` state, not on whether selected layers are shy — after a Focus, focused layers have `shy=false` making an `allSelectedShy` check unreliable.

> ⚠️ Known issue: Shy reverse logic has intermittent edge cases. Under investigation.

## Lock
All selected locked → unlock all. Otherwise → lock all.

---

## Dev Log
- 2024-07-29: Initial implementation of all three isolation buttons.
- 2024-08-06: Added known bug notes — shy reverse tripped by hidden layers, states potentially same root cause.
- 3. isolateSolo() now applies solo toggle only to visible layers — fixes AE error when shy-hidden layers are in the selection.

---

## Open Bugs
- **Shy reverse tripped by hidden layers** — reverse logic fires incorrectly when shy-hidden layers are in the selection. Root cause under investigation. Possibly needs to filter out `shy && hideShyLayers` layers from the condition check (same pattern already applied in `isolateSolo`).
