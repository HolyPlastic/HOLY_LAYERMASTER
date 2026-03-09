# Context Listener & Event System

See `docs/ARCHITECTURE.md` for full system description.

**Files:** `js/main.js` → `startContextListener()`, `_applyContext()` | `jsx/hostscript.jsx` → IIFE at bottom of file

This feature doc tracks changes to the listener logic specifically.

---

## Dev Log
- 1: Replaced polling timer with CSXSEvent listener — eliminates cursor flicker.
- 2: Boot sequence wrapped in try/catch blocks with console.error logging so errors surface in CEP DevTools on reload.
- 3: `_applyContext` now calls `renderAll()` on the first UNSAVED response (sets `_lastKnownProjPath = 'UNSAVED'` to prevent repeats) — rescue render if boot renderAll silently failed.
- 4: `_applyContext` loadConfig call made async with callback — required by removal of Node.js fs/path dependency.