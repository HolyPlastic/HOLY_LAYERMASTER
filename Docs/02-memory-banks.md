# Memory Banks

**Files:** `js/main.js` → `renderBankRow()`, `captureData()`, `selectData()`, `addBank()`, `removeBank()`
**UI Sections:** KF Memory, Layer Memory

Named banks for saving and recalling selections. Config (names, icons, colors) is global across projects; data is per-composition. Banks can be added/removed dynamically; order is drag-reorderable (see `docs/features/08-drag-drop.md`).

**UI structure per bank:** stacked [Select icon btn / Capture btn] + name input + clear btn.
- Select btn: always solid with bank color.
- Capture btn: accent-outlined when bank has data for the current comp. Tooltip shows saved item count.
- Right-click either Select or Capture → context dropdown: Clear (same as ×) | Colours (opens color picker).

For DNA tagging and storage layout see `docs/ARCHITECTURE.md`.

---

## 2.1 Keyframe Memory Banks

**JSX:** `captureKeyframes()`, `selectKeyframesFromFile()`, `getPropPath()`, `resolvePropPath()`

Captures selected keyframes by `matchName` property path + key indices. One DNA tag per unique layer per capture; all properties on that layer share the tag.

Recall: resolves path via `resolvePropPath`, calls `setSelectedAtKey` per saved index. Indices exceeding current `numKeys` are skipped silently.

> ⚠️ Adding/removing keyframes after capture shifts indices → incorrect recall. Surfaced in Capture button tooltip.

---

## 2.2 Layer Memory Banks

**JSX:** `captureLayers()`, `selectLayersFromFile()`

Captures selected layers by `layer.id` + DNA `instanceId`. Recall: O(1) by `layer.id` first, DNA tag scan fallback.

Backward compat: old `data.ids` flat array is promoted to `data.layers` format transparently on recall.

---

## Dev Log
- 2024-07-29: Initial implementation of KF and Layer banks with DNA tagging.
- 2. Right-click on sel or cap button now shows a context dropdown (Clear / Colours) replacing the old direct right-click-to-colorpicker on cap button only.
