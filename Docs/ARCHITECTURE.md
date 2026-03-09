# HLM Architecture

Cross-cutting systems. Read this when touching storage, the CEP bridge, DNA tagging, or anything that spans multiple features.

---

## CEP Bridge

JS → JSX calls go through `csInterface.evalScript(scriptString, callback)`. The bridge is **async** — the callback receives a string (always a string). Parse JSON defensively:

```js
csInterface.evalScript('myFunction()', raw => {
    try { const data = JSON.parse(raw); } catch(e) { /* handle */ }
});
```

Events flow the other way via `CSXSEvent`. The hostscript dispatches `com.hlm.contextChanged` when the active project or comp changes. JS listens with `csInterface.addEventListener`.

---

## DNA Persistence Engine

**Files:** `jsx/hostscript.jsx` → `generateUID()`, `cleanComment()`, `findLayerByTag()`

Every captured layer gets a tag written into its AE comment field:
```
[HLM:<bankId>:<instanceId>:<timestamp>]
```
- `instanceId` — 12-char base-36 UID (~3.6T combinations)
- One tag per bank per layer. `cleanComment()` strips the old tag before writing a new one. Tags from other banks are untouched.

**Recall order:**
1. **Primary** — `app.project.layerByID(id)` — O(1), exact.
2. **Fallback** — `findLayerByTag()` scans all layer comments in the active comp. Handles pre-comps, cross-project copies, and ID changes. O(n) — may lag on 1000+ layer comps.

**Known limitations of DNA tagging:**
- **Pre-comp wipe (keyframes):** Pre-composing destroys and recreates layers with new IDs. Layer DNA survives (tag travels with the layer). Keyframe memory does **not** survive — keyframe indices are comp-specific and break on pre-comp. This is a hard AE API limitation.
- **Clone multiplier:** Duplicating a layer (`Cmd+D`) copies the comment tag. On recall, both the original and clone will be selected.
- **Cross-contamination:** Copying a tagged layer into a different comp brings the tag with it. Recall in the new comp may incorrectly select that layer.
- **User destruction:** If a user or another script clears all layer comments, DNA tracking is permanently lost for that bank. No recovery path.

---

## Locked Layer Handling

ExtendScript can set `layer.selected = true` on locked layers even though the UI doesn't allow it. This means isolation and selection operations can target locked layers. Visual selection feedback (bounding box) does not appear in the Comp window for locked layers — this is an AE limitation and is accepted behaviour.

To force the timeline to scroll/refresh after operating on locked layers:
```js
app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
```
This is already called at the end of all three isolation functions.

---

## Storage Layout

All data lives in `_HLM_Data/` adjacent to the `.aep` file. Project must be saved before any capture/recall.

```
_HLM_Data/
├── _bankConfig.json           # global: bank/state names, icons, colors, nextId counter
├── <compId>_<bankId>.json     # per-comp bank data (layers or keyframes)
└── <compId>_<stateId>.json    # per-comp layer state snapshot
```

`loadConfig()` backfills missing fields on load — older configs without `layStates`, `bankColors`, or `iconIdx` are silently upgraded. Safe to add new fields to config without a migration.

---

## Context Listener

**Files:** `js/main.js` → `startContextListener()`, `_applyContext()` | `jsx/hostscript.jsx` → IIFE at bottom of file

- On boot: one `evalScript('getProjectAndCompContext()')` to sync immediately.
- On change: hostscript fires `com.hlm.contextChanged` via `CSXSEvent` on three AE events (`afterActiveItemChanged`, `afterItemAdded` × 2). Three listeners for cross-version AE compatibility.
- `_applyContext()` guards against redundant reloads with `_lastKnownProjPath` / `_lastKnownCompId`.
- Project path change → full config reload + re-render.
- Comp ID change only → update label + refresh indicators (no re-render).

---

## Dev Log
- 1: Initial architecture documented.
- 2: Added DNA limitations (clone multiplier, cross-contamination, pre-comp keyframe break, user destruction). Added locked layer handling section.
- 3: File I/O moved from Node.js fs module in main.js to ExtendScript File/Folder API helpers (hlm_*) in hostscript.jsx — eliminates --mixed-context requirement and restores CEP DevTools console output.
