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
- 5: `loadConfig` async callback wrapped in a robust `try/catch` block to prevent exceptions from being silently swallowed by the C++ engine.
- 6: Explicit `[HLM Trace]` console logging added to `_applyContext` and `renderAll` to verify execution flow during async boot sequences.
- 8: Fixed comp switching not working — root cause: `afterActiveItemChanged` fires before `app.project.activeItem` is updated, so `_dispatchContext()` read the old comp ID and `_applyContext`'s guard suppressed the update. Fix: added `$.sleep(50)` in `_dispatchContext()` in `jsx/hostscript.jsx` before reading context. Also added a `mouseenter`-debounced re-fetch in `startContextListener()` in `js/main.js` as a passive safety net for any cases the AE event still misses — 300ms debounce, no timer, no cursor flicker.
- 9: `$.sleep(50)` in JSX was unreliable — blocks ExtendScript thread but AE's C++ activeItem doesn't settle during that window. Moved delay to JS via 100ms setTimeout in `com.hlm.contextChanged` listener — ignores event payload, re-fetches from scratch. Also added JSX reload on panel boot so ↻ picks up JSX changes without AE restart. — `jsx/hostscript.jsx:1213`, `js/main.js:665,1413`
- 10: Added `app.activeViewer.setActive()` call in `_dispatchContext()` before reading `app.project.activeItem` — forces AE to sync the activeItem pointer with the viewer, fixing the root cause where `afterActiveItemChanged` fires before internal state settles. — `jsx/hostscript.jsx:1217`
- 11: Fixed banks not updating on comp switch — added `renderAll()` call to the `if (ctx.compId !== _lastKnownCompId)` branch in `_applyContext()`. Banks now re-render with correct comp data when user switches comp in AE.
- 7: Fixed stale-callback race condition in `refreshBankIndicators` and `refreshStateIndicator` — both now snapshot `currentCompId` (and `activeStateId` for state) at call time, and callbacks guard with `if (_snapCompId !== currentCompId) return` before applying DOM changes. Root cause: 3 AE event listeners + `renderAll()` inside async `loadConfig` callback can produce 6–12 concurrent unguarded callbacks for different comps, resolving in arbitrary order. Also added project-path snapshot guard to `_applyContext`'s `loadConfig` callback — discards if project was switched again while config was loading from disk, preventing config from project A overwriting project B's freshly loaded state. — `js/main.js`: `refreshBankIndicators()`, `refreshStateIndicator()`, `_applyContext()`