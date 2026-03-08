# Drag & Drop

**Files:** `js/hlm-dragdrop.js` (HLMDragDrop module) | `js/main.js` → `HLMDragDrop.init()`, `HLMDragDrop.applyOrder()`

Self-contained module on HTML5 DnD API. No external libraries. Injects own indicator CSS. Three drag contexts:

---

## Section Reordering
Drag any section header to reorder the four collapsible sections. Order persisted as `sectionOrder` in config. `HLMDragDrop.applyOrder(order)` called on boot to restore saved order.

## Bank Row Reordering
Drag the Select button (colored icon, left of each bank row) to reorder banks. `draggable="true"` is stamped on every `.sel-btn` handle eagerly at init time and re-stamped via `MutationObserver` whenever `renderAll()` rebuilds rows. Gate in `dragstart`: only proceeds if `e.target.closest(handleSel)` matches — ordinary clicks are unaffected because `dragstart` does not fire without mouse movement beyond the drag threshold.

## Isolation Bar Button Reordering
Drag any ISO button to reorder SOLO / SHY / LOCK. Bar detects own orientation (horizontal vs vertical) and adjusts drop indicator accordingly.

## Index Math
`_calcInsertAt(fromIdx, targetIdx, insertBefore)` adjusts for the post-splice index shift so drop position always matches the visual indicator.

---

## Dev Log
- 2024-07-29: Initial implementation — section, row, and ISO bar drag contexts.
- 2. Fix row drag: replaced dynamic-draggable mousedown gate with MutationObserver pre-tagging — CEP/Chromium evaluates draggable at mousedown time, before handlers run, so dynamic setting was never seen.
