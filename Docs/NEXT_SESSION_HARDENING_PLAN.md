# Holy LayerMaster — Hardening Patch Plan

**Status:** Ready for next Talos session (not yet dispatched)
**Created:** 2026-04-14
**Source:** Cross-audit 2026-04-14 (see `HOLY REPOS COLLATED/Roadmap Collation.md` + this session's HLM audit)
**Index doc:** `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md`

---

## Mission

A single coherent hardening session across five HLM items that surfaced in the 2026-04-14 audit. No single "big thing" — instead, one user-flagged UX issue, two silent-correctness bugs, one half-shipped infrastructure completion, and one small cleanup. All fit in a ~2-hour Talos session if run with file-ownership discipline across parallel subagents.

**Priority order (execute top-down):**

1. **Patterns tab UX fix** (user flagged: "Patterns tab broken — investigate before anything else")
2. **Hunt projectWide children bug** (silent false negatives)
3. **Hunt "Effect refs" actually search effect names** (shipped feature currently broken)
4. **HLMCache JSX consumer wiring** (the big perf completion)
5. **Delete orphan `Holy_LayerNames.jsx` + write HLM concepts block for Agent system prompt** (cleanup + unblocks future deep Agent↔HLM integration)

---

## Hard constraints

1. **No human testing.** Validation is via Node test harness where possible + CDP probes against `localhost:6907` + AE MCP (`Holy Invocations After Effects toolkit`) for JSX-level checks. For JSX behaviour that only shows up on real comps, dispatch a small test AE project via `app.newProject()` + `addComp()` + synthetic layers within the MCP session.
2. **Stay out of** `.git/`, `.claude/worktrees/`, `_archive/`, `Backup/`, `_backup/`, `node_modules/`, `Docs/zz_Archive+Deprecated docs DO NOT EDIT/`, anything with "archive" or "backup" in the name.
3. **Do not run git commands.**
4. **File ownership** — each subagent owns a distinct set of files, no concurrent edits. See §"Sub-agent decomposition" below.
5. **Honest failure reporting.** Mark status ✅ only with real evidence. Document blockers in the Dev Log, don't fake.

---

## Open question for user (resolve before Item 1 ships)

**The Patterns tab "broken" report may be a UX problem rather than a code bug.**

Hypothesis (from audit): the inverted quarantine model shipped 2026-04-13 in dev log entry 13 made `selectaActivated` default to `[]`. On every comp load, all detected patterns land in the `#selectaQuarantineList` column, and the main `#selectaPatternChips` area shows the empty-state message "Drag your main patterns here". The user likely sees the main area and concludes "no patterns showing at all".

Code path is intact (verified against `js/main.js:1780–1890` and `hostscript.jsx:1409–1500` in the 2026-04-14 audit).

**Talos should ask the user at session start:** "When you say Patterns tab is broken — do you see patterns listed in the QUARANTINE column (bottom/right) with the main chip area showing a 'Drag your main patterns here' message? Or do you see no patterns anywhere at all, neither quarantine nor active?"

If the answer is the former: Item 1 is the auto-activate fix below.
If the answer is the latter: Item 1 becomes "investigate — pattern detection itself is failing", and the scope changes.

**Proceed with the auto-activate fix as default** unless the user says no patterns appear anywhere.

---

## Work items

### Item 1 — Patterns tab auto-activate on comp load (user-flagged P0)

**Problem:** `selectaActivated` defaults to `[]`; all detected patterns hide in quarantine; main chip area shows empty-state.

**Fix:** In `js/main.js` — when `refreshPatternChips()` runs and detects that `selectaActivated` is empty AND `eligible.length > 0`, auto-populate `activated` with the top N patterns (N = 5) sorted by `count` descending. Persist the result via the existing per-comp config write path so the auto-activation is stable across reloads (users can still drag-demote unwanted ones to quarantine).

**Files (owned by Subagent A):**
- `js/main.js` — around `refreshPatternChips()` (per audit: lines 1780–1863). Verify exact location — line numbers drift.

**Acceptance:**
- On a comp with ≥5 detected patterns and no prior activation state, main chip area shows 5 chips and quarantine shows the rest
- On a comp with <5 patterns, all are activated (none go to quarantine)
- On a comp where the user has previously dragged items, existing state is preserved (no auto-activate fires)
- Toggle off behaviour: dragging an auto-activated chip to quarantine writes to config and the next reload respects it
- CDP probe: reload panel, read `document.querySelectorAll('#selectaPatternChips .ha-chip').length` — expect ≥1 when comp has patterns

**Risk:** Auto-activation must not fire on comps where user has explicitly set empty activation (legitimate "I want nothing active" state). Distinguish "never configured" (no config entry) from "configured to empty" (config entry exists with empty array). Use a sentinel like `config.selectaActivatedInitialised: true` to mark first-run completion.

---

### Item 2 — Hunt projectWide children scan uses wrong comp (silent bug)

**Problem:** Inside `huntLayers()` children-search loop, `for (var ci = 1; ci <= comp.numLayers; ci++)` iterates the ACTIVE comp even when the layer being tested lives in another comp (projectWide mode). Cross-comp children silently return false. Also crashes if `projectWide && !comp`.

**Fix:** Use `targets[mi].comp.numLayers` and `targets[mi].comp.layer(ci)` instead of the outer `comp` variable.

**Files (owned by Subagent B — different file from A):**
- `jsx/hostscript.jsx` — inside `huntLayers()` at approximately lines 1232–1241. Verify location.

**Acceptance:**
- In a project with 2 comps (Comp A contains parent layer, Comp B contains child layer named "X"), Hunt projectWide for children "X" finds the child layer in Comp B
- When `projectWide=false`, behaviour unchanged — only active-comp children evaluated
- No crash when projectWide=true but no active comp (defensive null check)

**Test approach:** Build a synthetic test project via AE MCP: two comps with parent/child relationship across them, run `hlm_huntLayers` with projectWide flags, assert result.

---

### Item 3 — Hunt "Effect refs" actually search effect names (shipped feature currently broken)

**Problem:** The feature advertises "scans effect property trees for effect names" but the code at `hostscript.jsx:1245–1268` iterates `propTree.property(i).property("ADBE Effect Built In Params")` and scans for `Opacity`/`Position`/`Scale`/`Rotation` strings — a transform-property matchName, not an effect path. Never matches by effect name.

**Fix:** Replace the nested transform-scan with a direct iteration of the layer's effect parade and a name comparison:
```javascript
// Get layer's effects group
var effects = layer.property("ADBE Effects Parade");
if (!effects || effects.numProperties === 0) return 0;
var hits = 0;
for (var e = 1; e <= effects.numProperties; e++) {
  if (nameContains(effects.property(e).name, searchTerm, caseSensitive)) hits++;
}
return hits;
```

**Files (owned by Subagent B — same file as Item 2, handled sequentially within that subagent):**
- `jsx/hostscript.jsx` — `huntDimEffect` section.

**Acceptance:**
- On a layer with "Gaussian Blur" and "Levels" effects, Hunt dimension "Effect refs" with search term "blur" returns that layer
- On a layer with no effects, returns 0 (no crash)
- Empty `searchTerm` guard: returns 0 without iterating
- Case-sensitivity toggle respected

**Test approach:** AE MCP — build a comp, add a Gaussian Blur effect to a layer, call `hlm_huntLayers` with search term "blur" and Effect refs dimension enabled, assert match.

---

### Item 4 — HLMCache JSX consumers (the big infrastructure completion)

**Problem:** `HLMCache` module exists in `js/main.js:907–978` and rebuilds on every comp switch. But NO JSX function consumes it — all 7 `⚠️ PERF: iterates all layers — candidate for metadata caching when cache system is implemented` annotations remain. The cache is vestigial. On a 500+ layer comp, every search/hunt/state-capture is still O(N) per JSX round-trip.

**Fix:**
1. Extend `HLMCache` with a `search(predicate)` method that returns an array of `layerId`s matching the predicate — runs entirely on the JS side against the cached metadata, no JSX round-trip.
2. Add a JSX helper `hlm_selectByIds(idsJson)` (or similar) at `jsx/hostscript.jsx` that takes a JSON array of layer IDs and selects just those layers. No iteration of `numLayers` on the JSX side.
3. Refactor `searchLayersB64()` panel-side call: JS calls `HLMCache.search()` to get matching IDs, then calls `hlm_selectByIds(JSON.stringify(ids))`. JSX side of `searchLayersB64` can stay for direct-JSX use but the panel flow is now cache-first.
4. Apply the same pattern to at least one Hunt flow and one state-capture flow to prove the model works.

**Scope discipline:** Do NOT refactor all 7 annotated functions in one session. Ship 2-3 as proof-of-model. The remaining annotations should point to the working HLMCache pattern so future sessions continue the migration.

**Files (owned by Subagent C — different from A and B):**
- `js/main.js` — `HLMCache` module around lines 907–978
- `jsx/hostscript.jsx` — add `hlm_selectByIds` helper; do NOT touch existing functions owned by Subagent B

**Cache invalidation hooks:** Already exist at `main.js:971–975` per audit. Verify they fire after any cache-stale operation (state capture/apply, rename, DNA-comment write). Add hooks where missing.

**Acceptance:**
- `HLMCache.search(predicate)` exists and returns correct layer IDs against a known fixture
- `hlm_selectByIds` exists and selects exactly the passed IDs
- At least one hot path (search or hunt) uses the cache-first flow
- The `⚠️ PERF` annotations on migrated functions are updated to `✅ MIGRATED — uses HLMCache` or removed
- Dev log entry documents which functions migrated, which remain, and the pattern

**Risk:** Cache staleness. If the user captures state, renames a layer, or otherwise mutates DNA-comment-bearing metadata, the cache must be invalidated. Audit the existing `HLMCache.invalidate()` call sites and ensure every write op triggers it.

**Perf validation (no human needed):** Build a synthetic 200-layer comp via AE MCP, measure panel→JSX round trip time before/after on `searchLayersB64`. Expect meaningful reduction (target: >2x faster on the cache-hit path). Log numbers in Dev Log.

---

### Item 5 — Cleanup + Agent prompt HLM concepts block

**Problem A:** `Holy-LayerMaster-Repo/Holy_LayerNames.jsx` is a 361-line legacy ScriptUI panel in the repo root. Zero references anywhere. Rename tab supersedes it. Dead weight.

**Problem B:** BEN'S TODO line 100: "Agent must be able to explain HLM concepts on demand — system prompt section needed before deep HLM integration". This is a blocker for future Agent↔HLM deep features.

**Fix:**
1. Delete `Holy-LayerMaster-Repo/Holy_LayerNames.jsx`. Confirm zero references via a grep across all active files first.
2. Draft a ~150-line "HLM concepts" block for the Agent system prompt covering: MEMORY banks (capture/apply/recall), SELECTA (patterns, activation, quarantine), HUNT (dimensions, projectWide, Effect refs), RENAME, STATES (DNA tags), isolation rail (shy/solo/invert), per-comp config. Include concrete examples of what users typically ask.
3. Locate the Agent system prompt assembly — likely in `Holy-Agent-Repo/js/holy-agent-chat.js` (`buildSystemPrompt()`) under an ambient-context section or a similar dynamic-context slot. Add the HLM concepts block as a `SCRIPT_KNOWLEDGE` entry (category key `hlm-concepts` or similar — match existing convention).

**Files (owned by Subagent D — different from A, B, C):**
- DELETE: `Holy-LayerMaster-Repo/Holy_LayerNames.jsx`
- MODIFY: `Holy-Agent-Repo/js/holy-agent-chat.js` (add SCRIPT_KNOWLEDGE entry)
- ADD: `Holy-LayerMaster-Repo/Docs/features/[appropriate feature doc]` — draft the concepts text here first, then embed into Agent prompt

**Cross-repo note:** This is the one item that touches Holy Agent code. All other items stay entirely within HLM. Flag to user if the Agent side expansion feels out of scope.

**Acceptance:**
- Grep confirms zero references to `Holy_LayerNames.jsx` before deletion
- File deleted
- Agent `buildSystemPrompt()` produces a prompt that includes the HLM concepts block when intent classifier hits an HLM-related category (or always, if the prompt budget allows)
- Ask Agent "how do I capture a layer state?" via CDP eval or AE MCP — verify response references MEMORY banks and the capture flow (not generic AE advice)

---

## File inventory

### Owned by Subagent A (Patterns tab UX)
- `Holy-LayerMaster-Repo/js/main.js`

### Owned by Subagent B (Hunt correctness bugs — Items 2 + 3)
- `Holy-LayerMaster-Repo/jsx/hostscript.jsx`

### Owned by Subagent C (HLMCache wiring)
- `Holy-LayerMaster-Repo/js/main.js` **(COLLISION with A — sequence B after A completes, or split `main.js` work carefully)**
- `Holy-LayerMaster-Repo/jsx/hostscript.jsx` **(COLLISION with B — sequence C after B completes)**

### Owned by Subagent D (Cleanup + Agent prompt)
- DELETE `Holy-LayerMaster-Repo/Holy_LayerNames.jsx`
- MODIFY `Holy-Agent-Repo/js/holy-agent-chat.js`
- ADD text to an HLM feature doc (pick the most appropriate, e.g. `Docs/features/00-overview.md` if it exists)

### Owned by Talos directly (no subagent)
- `Holy-LayerMaster-Repo/Docs/features/` — Dev Log entries (one per item, append-only, per HLM conventions)
- `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md` — finalize on completion
- `HOLY REPOS COLLATED/CLAUDE.md` — CHECK IN entry at top, rotate oldest if already 3

---

## Sub-agent decomposition guidance

**Critical cross-cutting risk:** Subagents A and C both want `js/main.js`. Subagents B and C both want `jsx/hostscript.jsx`. Serialize to avoid conflicts:

**Recommended sequencing:**

1. **Phase 1 (parallel):** Launch Subagent A (Patterns tab, `main.js`) + Subagent B (Hunt bugs, `hostscript.jsx`) + Subagent D (Cleanup + Agent prompt, different files entirely) as ONE multi-Agent message. All three work in parallel without file collision.
2. **Phase 2 (sequential after A + B):** Launch Subagent C (HLMCache wiring). C now has exclusive access to both `main.js` and `hostscript.jsx`.
3. **Phase 3 (sequential, Talos):** Write dev log entries per item; finalize index doc; update CHECK IN in workspace CLAUDE.md.

**Alternative if Phase 1 finishes fast:** Merge Subagent C's work into the same multi-Agent launch as Phase 2, running it solo.

Each subagent: opus model, max effort. Each receives its own task section from this doc verbatim.

---

## Acceptance criteria (session-level)

1. ✅ Item 1 — Patterns tab auto-activate working; CDP reload shows active chips
2. ✅ Item 2 — projectWide children cross-comp bug fixed; AE MCP synthetic test passes
3. ✅ Item 3 — Hunt Effect refs matches effect names; AE MCP synthetic test passes
4. ✅ Item 4 — At least 2 JSX hot paths migrated to HLMCache-first flow; perf numbers logged
5. ✅ Item 5 — Orphan JSX file deleted; Agent prompt includes HLM concepts block; probe confirms Agent explains HLM concepts correctly
6. ✅ Dev Log entries added for each item in the appropriate HLM feature doc
7. ✅ Index doc at COLLATED root finalized with status + evidence
8. ✅ CHECK IN entry added to workspace CLAUDE.md (rotate oldest if 3 already present)

---

## Holy ecosystem permissions

When dispatched, the Talos session should confirm the user is granting:
- **Holy Invocations After Effects toolkit** (AE MCP `run_script`) — needed for synthetic test-comp generation for Items 2, 3, 4 validation
- CDP access on `localhost:6907` via raw WebSocket per `Skills/cep-debug/SKILL.md`

---

## Out of scope (do not do)

- Fixing all 7 `⚠️ PERF` annotated functions in Item 4 — cap at 2-3 as proof-of-model
- Metadata cache extensions beyond what Items 2-4 require
- Drag-drop horizontal stacking (deferred per BEN'S TODO)
- Composition sensitivity work (11 rounds shipped, one open edge case — separate effort)
- Any Holy Expressor changes (user requirement: don't touch Expressor)
- Any Holy Scripture changes (not in audit scope)

---

## End of plan
