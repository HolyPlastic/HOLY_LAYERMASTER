# Layer Rename

**Files:** `js/main.js` (LAYER RENAME region) | `jsx/hostscript.jsx` → `renameSelectedLayers()` | `index.html` → `#renameBody` | `css/style.css` → section 19

Renames all selected layers in the active comp. Three mutually-exclusive modes selectable via toggle buttons:

- **SRCH** (Search & Replace) — two text inputs: find text + replace text. Replaces all occurrences in every selected layer name globally.
- **PFX** (Prefix) — one text input. Prepends text to each selected layer name.
- **SFX** (Suffix) — one text input. Appends text to each selected layer name.

**UI:** mode toggle row (SRCH | PFX | SFX) + fire row (apply button left, one or two inputs right). Second input hidden in PFX/SFX modes. All input text is Base64-encoded before passing through the CEP bridge to avoid injection.

The rename is wrapped in a single undo group ("Rename Selected Layers").

---

## Dev Log
- 1: Initial implementation — search/replace, prefix, suffix modes with Base64 bridge encoding.
