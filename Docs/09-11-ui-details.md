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
- 2024-07-29: Initial implementation. Breakpoint set at 150px.
