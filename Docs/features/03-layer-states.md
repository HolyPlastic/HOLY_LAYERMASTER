# Layer States

**Files:** `js/main.js` → `captureStateData()`, `applyStateData()`, `syncStatesUI()`, `refreshStateIndicator()`, `addState()`, `renderStatesDropdown()` | `jsx/hostscript.jsx` → `captureLayerStates()`, `applyLayerStates()`
**UI Section:** Layer States

Snapshots and restores full comp visibility state: `enabled`, `shy`, `solo`, `locked` per layer + comp `hideShyLayers` flag. Multiple named states per project, each scoped to a comp via filename (`<compId>_<stateId>.json`).

Capture tags every layer with DNA (same format as Memory Banks — see `docs/ARCHITECTURE.md`). Apply only touches layers present at capture time; new layers untouched, missing layers skipped silently. Locked layers temporarily unlocked during apply to ensure writes, then re-locked.

**State UI:** combo input (active state name, doubles as rename field) + dropdown arrow. Dropdown lists all states + "Create New State..." at bottom. States auto-increment IDs, rename inline.

Right-click Capture btn → color picker (see `docs/features/05-color-picker.md`).

---

## Dev Log
- 1: Initial implementation.
- 2: applyLayerStates now disables hideShyLayers before writing layer props and restores the saved value at the end — fixes shy mode not being restored when it was off at apply time.
