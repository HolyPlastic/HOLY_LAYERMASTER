# Layer Rename + Hunt

**Files:**
- `index.html` — tab nav, `#isoWrap`, `#tab-content`, hunt panel, rename panel
- `css/style.css` — sections 15a–15d (isolation wrap, tabs, hunt, rename)
- `js/main.js` — `initTabs()`, `switchTab()`, advanced rename handler, hunt tab handler
- `jsx/hostscript.jsx` → `renameAdvanced()`, `huntLayers()`, `huntBulkAction()`

---

## Overview

The panel was reorganised around a four-tab system: **MEMORY**, **STATES**, **HUNT**, and **RENAME**. A collapsible **ISOLATION** bar sits persistently above the tab nav and is shared between MEMORY and HUNT tabs.

---

## Tab System

Tabs are implemented via `initTabs()` / `switchTab()` in `main.js` (copied from Scripture). Mouse-wheel over the tab bar cycles tabs. `activeTab` state is local to `main.js` and not persisted (each tab renders fresh on switch, and the DOM state is sufficient).

The MEMORY tab contains KF Memory and Layer Memory banks wrapped in `#sectionsContainer` (preserving drag-drop reordering). STATES, HUNT, and RENAME each own their own section.

---

## ISOLATION Bar

Moved from inline in `#hp-frame` to a wrapped collapsible zone (`#isoWrap`). The `#isolationBar` header has `class="section-header" data-body-id="isoBody"`, so the existing `.section-star` click handler handles collapse/expand automatically. The `#isoBody` has `class="section-body iso-body"` with dedicated `.iso-btn` styles.

Solo/Shy/Lock buttons call `isolateSolo()`, `isolateShyFocus()`, and `isolateLock()` respectively — unchanged from previous implementation.

---

## RENAME Tab

Replaces the old inline rename section with a full-featured panel.

**Scope dropdown:**
- `layers` — selected layers in active comp
- `project` — selected items in Project panel (CompItems & FolderItems)
- `both` — both of the above

**Mode buttons:** SRCH / PFX / SFX (existing behaviour preserved)

**Options:**
- **Case sensitive** — affects the search string match (replace always verbatim)
- **Preserve numbers** — in suffix mode, extracts trailing integers from original name and re-appends them after the suffix
- **Exclude** — reveals a second text field; any layer whose name contains the exclude string is skipped entirely

All options are passed via `opts` JSON object to `renameAdvanced()` in JSX. The JS handler Base64-encodes the text fields before bridging.

---

## HUNT Tab

Multi-dimensional search panel replacing the old single-input Search section.

**Core row:** Hunt fire button + search input + INV toggle + DIM toggle

**Options:**
- **Within Selected** — constrains results to already-selected layers
- **Project-wide** — scans all comps, selects matching layers and highlights their containing comps in the Project panel

**Dimensions section** (collapsible sub-section):
- Names (checkbox, checked by default)
- Label — label colour dropdown (1–8)
- Parent — text field for parent layer name
- Children — text field for child layer name
- Track Matte — text field for matte layer name
- Effect refs — experimental; scans effect property trees for expression strings
- Comments — searches layer comments alongside names

**Exclude row:** Toggle + text field with `[null]` / `[camera]` / `[audio]` / `[light]` token autocomplete. Typing `[` shows a suggestion popup in grey; Tab accepts the first token.

**Pattern detection section** (collapsible sub-section, collapsed by default):
- Displays auto-generated pattern chips for matched layers — requires 2+ layers sharing a base prefix
- Chips are clickable: fills the search input and re-fires the hunt
- Each chip has a `×` quarantine button: moves pattern to a QUARANTINE stash below the section (collapsed by default)
- Quarantined patterns can be clicked to restore them
- `+/-` controls adjust the minimum layer-count threshold (default: 2)
- Quarantine state is session-only (not persisted)

**Bulk actions:** SOLO / UNSOLO / LOCK / UNLK / SHY / UNSHY buttons apply the corresponding isolation action to all currently selected (matched) layers.

---

## JSX Functions

`renameAdvanced(mode, text1B64, text2B64, optsStr)` — full rename with scope, case, preserve numbers, exclude. Single undo group.

`huntLayers(payloadStr)` — multi-dimensional search. Returns `{ matched: count, patterns: [...] }`. All opacity resets and selections are wrapped in one undo group. Project-wide mode selects CompItems in `app.project.selection`.

`huntBulkAction(action)` — applies solo/unsolo/lock/unlock/shy/unshy to selected layers in one undo group.

Helper functions shared between rename and hunt: `escapeRegExp()`, `replaceAllInName()`, `nameContains()`, `extractTrailingNumber()`.

---

## Dev Log

- 1: Initial implementation — search/replace, prefix, suffix modes with Base64 bridge encoding.
- 2: Added `holyAPI_hlm_renameSelectedLayers()` and `holyAPI_hlm_renameProjectWide()` wrapper functions before context IIFE in `hostscript.jsx`. `holyAPI_hlm_renameProjectWide` iterates `app.project.item(i)` for project-wide rename of layers and/or comps. Exposed for Holy Agent Phase 4 LayerMaster bridge.
- 3: `holyAPI_hlm_renameProjectWide` updated — added `dryRun` 4th param (bool/string), `FolderItem` scope pass (`scope === "folders" || scope === "all"`), `preview` array for dry-run results, `foldersRenamed` counter, `totalItems` in return payload for diagnostics. FolderItem block wrapped in try/catch — if `FolderItem` is not in scope it returns an `"error"` key with the caught message rather than silently killing the loop. `split().join()` used throughout (not `.replace()`) for global replace within names.
- 4: Full tab system refactor. Panel reorganised into MEMORY / STATES / HUNT / RENAME tabs. Isolation bar moved to collapsible `#isoWrap` above tab nav. Old inline search and rename sections removed from `#sectionsContainer`. `initTabs()` / `switchTab()` added to `main.js` (copied from Scripture pattern). Advanced rename via `renameAdvanced()` with scope dropdown, case sensitivity, preserve numbers, exclude. Hunt tab built with multi-dimensional search (names, labels, parent, children, track matte, effect refs, comments), INV/DIM toggles, within-selected and project-wide modes, pattern detection with quarantine, and bulk isolation actions. New JSX: `renameAdvanced()`, `huntLayers()`, `huntBulkAction()`. Token autocomplete for exclude field (`[null]`, `[camera]`, `[audio]`, `[light]`) — type `[` to see suggestions, Tab to accept.
- 5: Bug fix — hunt search found nothing when `dims.name` checkbox was unticked. Root cause: the matching loop only incremented score when `dims.name` was explicitly checked; with the checkbox off, score always stayed 0 and `isMatch` always returned false. Fixed in `huntLayers()` by adding `anyDimActive` check and an `else if (!anyDimActive && searchTerm.length)` fallback that treats a bare search term as an implicit name search regardless of checkbox state. Also fixed the JS guard (line 881) to include `!payload.dims.name` so unticked name checkbox alone triggers the "enter a search term" alert.
- 6: Scope dropdown third option text changed from "Both" to "Project Items + Contents" for clarity. `index.html` line 410.
- 7: Hunt tab — Parent, Children, Track Matte text inputs replaced with `<button class="hunt-pick-btn">` placeholder elements. Same element IDs kept so `getDimensions()` and `wireDimToggle` JS continue to work unchanged (`button.value` returns `""` which is falsy, matching the existing JSX truthy guards on `parentName`/`childName`/`matteName`). Buttons show a person-silhouette SVG and "pick layer" label, dashed border, disabled state until checkbox enables them. CSS region 20 in `style.css`. Real pick-click implementation pending Holy Agent v2 port.
