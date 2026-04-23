# Active Comp Header

**Files:** `js/main.js` → `updateCompLabel()` | `index.html` → `#activeCompLabel`

Displays active comp name in uppercase at top of panel. Shows `NO ACTIVE COMP` when none open. CSS flash animation plays on comp change for visual feedback.

## Dev Log
- 2024-07-29: Initial implementation.

---

# Section Collapse

**Files:** `js/main.js` (querySelectorAll delegation) | `css/style.css` → `.section-collapsed`, `.star-collapsed`

Click the star icon in any section header to toggle collapse. Toggles `section-collapsed` on body, `star-collapsed` on icon. Not persisted between sessions.

## Dev Log
- 2024-07-29: Initial implementation.

---

# Narrow Layout Mode

**Files:** `js/main.js` (ResizeObserver IIFE) | `css/style.css` → `body.narrow`

`ResizeObserver` on `document.body`. Below **150px** width: adds `.narrow` to body → bank button pairs stack vertically. Feature-detection guard: `typeof ResizeObserver !== 'undefined'`.

## Dev Log
- 1: Initial implementation. Breakpoint set at 150px.
- 2: Extended `ResizeObserver` to also apply `body.bank-wide` class at ≥260px — triggers larger bank cell buttons (sel: 38×38px, cap: 34×13px) and shows `.bank-cell-name` label inputs beneath each cell. `NARROW_BP` constant renamed from `BREAKPOINT` for clarity alongside new `WIDE_BP = 260`.

---

# Hunt Tab UI Polish

**Files:** `css/style.css` → Hunt tab selectors

Adjusted sizing for Hunt tab checkboxes and inputs for better readability.

## Dev Log
- 1: Hunt tab checkbox label font-size increased from 7.5px to 9px, gap from 3px to 5px, checkbox size from 8px to 10px. Added gap: 8px to hunt-option-row, gap: 4px to hunt-dim-item. Bumped hunt-sub-input and hunt-label-select font-size from 7px to 8.5px.
