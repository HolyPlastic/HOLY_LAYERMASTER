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

## ⚠️ Critical HTML Requirements

**Section drag will silently fail if these are missing from `index.html`.**

1. All draggable sections must be wrapped in a single container: `<div id="sectionsContainer">`. This is what `HLMDragDrop.init({ sectionsContainerId: 'sectionsContainer' })` looks for.

2. Each section must be wrapped in its own div with a `data-section-id` attribute matching its key in `sectionOrder`:
```html
<div data-section-id="kf">
    <div class="section-header" ...>...</div>
    <div class="section-body" ...>...</div>
</div>
```

3. When adding a new section to `index.html`, you **must**:
   - Wrap it in `<div data-section-id="yourKey">...</div>` inside `sectionsContainer`
   - Add `'yourKey'` to `sectionOrder` in `makeDefaultConfig()` in `main.js`
   - Add `'yourKey'` to the `sectionOrder` backfill in `loadConfig()` in `main.js`

Failing to do any of these means `applyOrder()` and `_initSectionDrag()` cannot find the section and drag silently does nothing.

---

## Dev Log
- 1: Initial implementation — section, row, and ISO bar drag contexts.
- 2: Fix row drag: replaced dynamic-draggable mousedown gate with MutationObserver pre-tagging — CEP/Chromium evaluates draggable at mousedown time, before handlers run, so dynamic setting was never seen.
- 3: Fix section drag: added missing `sectionsContainer` wrapper div and `data-section-id` attributes to all section wrappers in `index.html`. These are required by the drag module and were absent after a new section (rename) was added by another agent without following the correct pattern.
- 4: Fixed silent row-drag failure caused by async refactoring: Chromium `MutationObserver` microtasks frequently drop when DOM changes are triggered from inside a native C++ `csInterface.evalScript` callback. Added explicit `HLMDragDrop.refresh()` method to manually re-tag `.sel-btn` handles synchronously after async renders.