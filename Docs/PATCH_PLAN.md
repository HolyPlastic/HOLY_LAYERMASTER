# Patch Plan — HLM Hardening Session (2026-04-14)

> Authored by Talos from `Docs/NEXT_SESSION_HARDENING_PLAN.md` + one user-added item (Item 6). This doc is the live source of truth for the session. The original brief is preserved for reference but no longer updated.

Last updated: 2026-04-14

---

## Phases

### Phase 1 — Parallel (Subagents A, B, D)

1. [ ] **Item 1 — Patterns tab auto-activate on comp load** (Subagent A, `js/main.js`)
   - Files: `Holy-LayerMaster-Repo/js/main.js` — `refreshPatternChips()` (~lines 1780–1890; verify).
   - Change: when no prior activation state exists for a comp (sentinel `config.selectaActivatedInitialised !== true`) AND `eligible.length > 0`, auto-populate `activated` with top N=5 patterns by `count` desc; persist sentinel + activation via existing per-comp config write path.
   - Self-test: CDP eval after panel reload — `document.querySelectorAll('#selectaPatternChips .ha-chip').length` ≥ 1 on a comp with patterns; drag-to-quarantine survives a reload (existing state preserved).
   - User-test: none.

2. [ ] **Item 2 — Hunt projectWide children cross-comp fix** (Subagent B, `jsx/hostscript.jsx`)
   - Files: `Holy-LayerMaster-Repo/jsx/hostscript.jsx` — `huntLayers()` children branch (~1232–1241; verify).
   - Change: replace `comp.numLayers` / `comp.layer(ci)` with `targets[mi].comp.numLayers` / `targets[mi].comp.layer(ci)`; defensive null-guard when `projectWide && !comp`.
   - Self-test: AE MCP — spawn fresh project, two comps, parent in Comp A, child "X" in Comp B; call `hlm_huntLayers` with projectWide + children dim + term "X"; assert Comp B child returned.
   - User-test: none.

3. [ ] **Item 3 — Hunt "Effect refs" match effect names** (Subagent B, same file, sequential within B)
   - Files: `Holy-LayerMaster-Repo/jsx/hostscript.jsx` — `huntDimEffect` section (~1245–1268; verify).
   - Change: replace nested transform-scan with direct `layer.property("ADBE Effects Parade")` iteration + name compare (`nameContains` + case toggle). Guard empty term → 0. Guard no effects → 0.
   - Self-test: AE MCP — add Gaussian Blur to a solid; call `hlm_huntLayers` with Effect refs on + term "blur"; assert match. Second run with no effects → 0.
   - User-test: none.

4. [ ] **Item 5 — Cleanup orphan JSX + Agent HLM concepts block** (Subagent D, cross-repo)
   - Files: DELETE `Holy-LayerMaster-Repo/Holy_LayerNames.jsx` (after grep-confirm zero refs); MODIFY `Holy-Agent-Repo/js/holy-agent-chat.js` (`buildSystemPrompt()` → add SCRIPT_KNOWLEDGE entry keyed `hlm-concepts`); ADD a drafting section in `Holy-LayerMaster-Repo/Docs/features/00-overview.md` if such a doc exists, else `01-isolation-rail.md` top matter, or a new `00-concepts.md`.
   - Concepts block content (~150 lines): MEMORY banks (capture/apply/recall), SELECTA (patterns, activation, quarantine, inverted model), HUNT (dimensions, projectWide, Effect refs, trackMatte), RENAME, STATES (DNA tags), isolation rail (shy/solo/invert), per-comp config, plus concrete example prompts the user would ask.
   - Self-test: CDP eval against Holy Agent panel — send message "how do I capture a layer state?"; inspect intercepted system prompt payload for the HLM concepts section.
   - User-test: none.

### Phase 2 — Sequential (Subagent C — after A + B)

5. [ ] **Item 4 — HLMCache JSX consumer wiring** (Subagent C, `js/main.js` + `jsx/hostscript.jsx`)
   - Files: `Holy-LayerMaster-Repo/js/main.js` (HLMCache module ~907–978); `Holy-LayerMaster-Repo/jsx/hostscript.jsx` (add `hlm_selectByIds` helper).
   - Change: (a) extend `HLMCache` with `search(predicate) → [layerId]`; (b) add `hlm_selectByIds(idsJson)`; (c) refactor panel-side of `searchLayersB64` to cache-first; (d) apply same pattern to 1 Hunt flow + 1 state-capture flow as proof-of-model. Cap at 3 migrations total — remaining `⚠️ PERF` annotations updated to point at the working HLMCache pattern.
   - Cache invalidation: audit `HLMCache.invalidate()` hooks (~971–975); ensure every mutation (state capture/apply, rename, DNA write, comp switch) triggers it.
   - Self-test: AE MCP — spawn 200-layer synthetic comp; time panel→JSX round trip on `searchLayersB64` pre/post; log numbers. Target >2× speedup on cache-hit path.
   - User-test: none.

### Phase 3 — Sequential (Subagent E — after C)

6. [ ] **Item 6 (NEW) — Inverse layer references ("Who references me?")** (Subagent E, `js/main.js` + `jsx/hostscript.jsx` + `index.html` + `css/`)
   - Origin: User request this session — the existing `hlm_selectExpressionLinks()` provides the forward direction ("what do my expressions reference?"); the complement is missing. Extends HLM's lineage toolkit.
   - **Scope:**
     - JSX: new `hlm_selectInverseRefs()` — for each currently selected layer L, iterate every layer in the active comp (and, if a `projectWide` flag is on, every other comp too). For each other layer, walk the property tree looking for:
       1. **Expression references to L** — any `canSetExpression` property whose `.expression` string matches `layer\("L.name"\)`, `thisComp\.layer\("L.name"\)`, `layer\(L.index\)`, or `thisComp\.layer\(L.index\)`. Regex extracted from the existing forward-direction parser.
       2. **Effect layer-pick-param references to L** — iterate `ADBE Effects Parade`; within each effect group, inspect layer-picker properties. Layer-reference effect params return a `Layer` object from `property.value` on the relevant param types (matchName patterns like `"ADBE Layer Control"`, or `Property.propertyValueType === PropertyValueType.LAYER_INDEX`). Test `val === L` or `val.index === L.index && val.containingComp === L.containingComp`.
       3. **Track-matte references to L** — `otherLayer.trackMatteLayer === L`.
     - Collect distinct matching layers → add to selection (additive, mirrors EXPR LINKS semantics).
     - Return JSON: `{ ok, selected: [{ compName, layerName, viaExpression, viaEffect, viaTrackMatte }], count }`.
   - **Adapt don't-edit — Holy Expressor source of inspiration:**
     - Property-tree walker: copy/adapt `traverseNode()` pattern from `Holy-Expressor-Repo-2/jsx/Modules/host_UTILS.jsx:993` (depth-first walk by `numProperties` + `.property(ci)`, leaf check via `canSetExpression`).
     - matchName/path helpers: study `host_UTILS.jsx` lines 116–260 for matchName traversal but translate into HLM-prefixed (`hlm_`) private helpers. **Do not import, require, or edit Expressor** — copy code into HLM files.
   - **UI:** new `INV REFS` button in `index.html` next to the existing `EXPR LINKS` button (`selectExprLinksBtn`). Same CSS class (`ctrl-btn`). Tooltip: "Select all layers whose expressions, effects, or track mattes reference the selected layer(s)". JS listener in `main.js` next to the existing `selectExprLinksBtn` listener.
   - **projectWide toggle:** optional. If trivial to implement (single modifier-key or shared with Hunt's projectWide), add it; otherwise ship comp-only for this iteration and note projectWide as follow-up.
   - **Self-test approach (AE MCP):**
     1. Spawn fresh project with one comp, 4 layers: `Target`, `HasExpr` (position expression referencing `Target`), `HasEffect` (Set Matte / layer-picker effect pointing to `Target`), `HasMatte` (trackMatteLayer = `Target`).
     2. Select `Target`; call `hlm_selectInverseRefs()`; assert returned JSON contains the three referrers and their correct flags.
     3. Second comp in same project has a layer also referencing `Target` — with projectWide off, not returned; with projectWide on, returned.
   - **Acceptance:**
     - All three reference types detected on the synthetic fixture.
     - No false positives when only unrelated layers present.
     - Selection is additive (does not deselect current).
     - Empty selection → no-op with informative console message.
     - Dev log entry added to `Docs/features/04-search.md` as entry N+1 continuing the SELECTA lineage; ROADMAP.md updated.
   - User-test: none.

### Phase 4 — Talos close (Items not delegated)

7. [ ] Dev Log entries per item in appropriate `Docs/features/*.md`.
8. [ ] Finalize `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md` with status + evidence per item.
9. [ ] Add CHECK IN entry to `HOLY REPOS COLLATED/CLAUDE.md` (rotate oldest if 3 present).
10. [ ] Update `.talos/NOTES.md` Current Status / Next Action.

---

## Dependency chain

- Items 1, 2, 3, 5 independent → Phase 1 parallel (A, B, D).
- Item 4 (C) touches `js/main.js` (collides with A) and `jsx/hostscript.jsx` (collides with B) → blocked by 1 + 2 + 3.
- Item 6 (E) touches same files as C → blocked by 4.
- Phase 4 (Talos close) blocked by all.

## Stop-points (user testing)

None this session. User explicitly instructed no human testing; all validation via Node harnesses / CDP / AE MCP synthetic comps.

## Assumption baked into plan

The Patterns tab "broken" open question in `NEXT_SESSION_HARDENING_PLAN.md` is unresolved at dispatch. Proceeding with the default auto-activate fix (Item 1); if the real issue is pattern-detection itself, the fix is benign (only runs when `eligible.length > 0`).

## Research findings / pre-flight gotchas

- HLM already ships the FORWARD direction of reference tracing (`hlm_selectExpressionLinks`, EXPR LINKS button). Item 6 extends the INVERSE direction using the same regex parsing plus effect-layer-param inspection and track-matte inverse.
- Holy Expressor's `host_UTILS.jsx` has a mature property-tree traversal (`traverseNode()` at line 993) and matchName helpers — source of adaptation for Item 6. **Copy, do not edit, do not require.**
- CEP Chromium rejects Playwright `connectOverCDP`. All CDP probes must use raw WebSocket per `Skills/cep-debug/SKILL.md`.
- ExtendScript is ES3 — subagents touching `.jsx` must honour the trap list in workspace `CLAUDE.md`.
- Holy Agent system prompt assembly (Item 5) uses a SCRIPT_KNOWLEDGE pattern — subagent must locate the existing slot and match the convention rather than bolt on a new system.
