# HLM Architecture

Cross-cutting systems. Read this when touching storage, the CEP bridge, DNA tagging, or anything that spans multiple features.

---

## CEP Bridge

JS → JSX calls go through `csInterface.evalScript(scriptString, callback)`. The bridge is **async** — the callback receives a string (always a string). 

**⚠️ CRITICAL ARCHITECTURE TRAP: The Silent Callback**
Because callbacks are invoked by the native C++ engine, standard browser error bubbling does not apply. If your callback code throws an error (e.g., parsing bad JSON, referencing an undefined variable), the C++ engine swallows the error silently. Nothing will log to DevTools. The panel will simply halt.

You must parse JSON defensively and wrap the entire callback in a `try/catch`:

```js
csInterface.evalScript('myFunction()', raw => {
    try { 
        if (!raw || raw.indexOf('ERROR') === 0) throw new Error(raw);
        const data = JSON.parse(raw); 
        // ... do stuff ...
    } catch(e) { 
        console.error('[HLM] Fatal error in callback:', e);
        // ALWAYS provide a fallback execution path here
    }
});
```

Events flow the other way via CSXSEvent. The hostscript dispatches com.hlm.contextChanged when the active project or comp changes. JS listens with csInterface.addEventListener.

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

## Keyframe Label DNA (secondary tagging layer)

**Files:** `jsx/hostscript.jsx` → `captureKeyframes`, `selectKeyframesFromFile` | `js/main.js` → `_nearestLabelIndex`, `captureData`, `HLMColorPicker.init onApply`

Keyframe banks carry a second identity layer on top of the comment-tag DNA: each captured keyframe is stamped with an AE native keyframe label color (`Property.setKeyLabel`, shipped AE 22.6 Aug 2022). The label index (1–16) is derived from the bank's display color via `_nearestLabelIndex` — Euclidean RGB distance against `_aeLabels` (the user's 16 preference-defined label colors).

**Recall priority on a v3 bank (has `labelIndex` in JSON):**
1. Filter all keys on the property to those where `prop.keyLabel(ki) === kf.labelIndex`
2. If filtered count ≤ `capturedCount` → select all directly. No fuzzy scoring needed.
3. If filtered count > `capturedCount` (shared-color collision — two banks same label, same property) → run fuzzy scorer restricted to that filtered pool.
4. If filtered count = 0 (labels manually cleared) → `labelWarning` flag set, fall back to full fuzzy.

**v1/v2 banks** (no `labelIndex` in JSON) route directly to the existing fuzzy path unchanged.

**Schema versions:**
- `schemaVersion: 1` — index-only recall (legacy)
- `schemaVersion: 2` — fuzzy fingerprint (`propSequence` added)
- `schemaVersion: 3` — label DNA (`labelIndex`, `capturedCount` per kf record)

**Color picker enforcement:** KF bank color picker opens in label-only mode (native hex input hidden) — users can only pick from the 16 AE label swatches. Layer banks retain the full free-hex picker. This enforces a consistent label→bank color mapping.

**Known limitations of label DNA:**
- **Manual clear:** The user can right-click any keyframe in AE's timeline and change its label. This silently removes the bank tag. Recall detects this (`labelWarning`) and falls back to fuzzy.
- **Shared-color collision:** Two KF banks mapping to the same AE label index on the same property of the same layer are ambiguous to the label filter. Fuzzy scoring within the filtered pool resolves them, but reliability degrades if keyframes have moved significantly. A collision warning toast fires when the user assigns a color that maps to an already-used label index.
- **Stamp verification:** `captureKeyframes` verifies the first key's stamp with a read-back (`keyLabel(ki) === labelIndex`) before writing `labelIndex` to JSON. If stamping fails (older AE, unsupported property type), the record has no `labelIndex` and recall silently uses fuzzy — no false-positive warning.
- **API naming:** The getter is `Property.keyLabel(keyIndex)` but the setter is `Property.setLabelAtKey(keyIndex, labelIndex)` — NOT `setKeyLabel`. This asymmetry is an AE API quirk.

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

---

## Metadata Cache (HLMCache)

**Files:** `js/main.js` → `HLMCache` module | `jsx/hostscript.jsx` → `hlm_buildLayerMetadataJSON()`

On every `_applyContext()` call (comp or project change), `HLMCache.build(compId)` fires `evalScript('hlm_buildLayerMetadataJSON()')`. The JSX iterates `comp.numLayers` once and returns a JSON snapshot: `{ compId, numLayers, layers: { [id]: { name, comment, shy, solo, locked, enabled, parentId, label } } }`.

The JS-side cache (`HLMCache`) stores this snapshot in memory and exposes:
- `HLMCache.get(layerId)` — O(1) lookup by layer id
- `HLMCache.search(term)` — name/comment substring search against cached data
- `HLMCache.isValid(liveNumLayers)` — staleness check (compare cached vs live numLayers)
- `HLMCache.invalidate()` — explicit invalidation after write operations

**Why a JS-side cache?** CEP's `evalScript` is async and carries per-call overhead. Building once on context change and querying the in-memory object is far cheaper than re-iterating in JSX on every search or hunt. JSX-side functions (`searchLayersB64`, `huntLayers`, etc.) still do the final AE API work (setting `layer.selected`) — the cache serves as a filter / pre-computation layer on the JS side.

---

## Dev Log
- 1: Initial architecture documented.
- 2: Added DNA limitations (clone multiplier, cross-contamination, pre-comp keyframe break, user destruction). Added locked layer handling section.
- 3: File I/O moved from Node.js fs module in main.js to ExtendScript File/Folder API helpers (hlm_*) in hostscript.jsx — eliminates --mixed-context requirement and restores CEP DevTools console output.
- 4: Added HLMCache metadata cache system. `hlm_buildLayerMetadataJSON()` in hostscript.jsx provides one-pass layer snapshot. `HLMCache` JS module stores it, exposes get/search/isValid/invalidate. Rebuilt on every `_applyContext()` comp change. See `Docs/features/04-search.md` for details.
- 5: Added Keyframe Label DNA section. Documents the secondary tagging layer using AE native keyframe label colors (AE 22.6+), the three-tier recall priority (label-only → label+fuzzy → full-fuzzy fallback), schema version history (v1/v2/v3), color picker enforcement, and known limitations (manual clear, shared-color collision, stamp verification). See `Docs/features/02-memory-banks.md` dev log entries 17–20 for implementation detail.
