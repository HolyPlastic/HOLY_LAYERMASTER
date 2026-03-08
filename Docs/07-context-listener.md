# Context Listener & Event System

See `docs/ARCHITECTURE.md` for full system description.

**Files:** `js/main.js` → `startContextListener()`, `_applyContext()` | `jsx/hostscript.jsx` → IIFE at bottom of file

This feature doc tracks changes to the listener logic specifically.

---

## Dev Log
- 2024-07-29: Replaced polling timer with CSXSEvent listener — eliminates cursor flicker.
