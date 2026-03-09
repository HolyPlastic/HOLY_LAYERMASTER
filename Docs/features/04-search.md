# Search

**Files:** `js/main.js` (listener) | `jsx/hostscript.jsx` → `searchLayersB64()`
**UI Section:** Search

Selects layers in the active comp whose names contain the search string (case-insensitive). Fires on button click only — no live filtering.

Search term is Base64-encoded in JS before passing to ExtendScript via `evalScript` to avoid quote-escaping/injection issues. Custom `Base64.decode` used in JSX (native `atob` unavailable in ExtendScript).

Clears existing selection before applying result.

---

## Dev Log
- 1: Initial implementation with Base64 encoding.
