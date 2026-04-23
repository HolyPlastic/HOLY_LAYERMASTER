# HLM Roadmap

Planned work items. Not bugs — design intent that hasn't landed.

> **Canonical source of truth.** Each Holy plugin's own `Docs/ROADMAP.md` is the single source going forward. The workspace-level `HOLY REPOS COLLATED/Roadmap Collation.md` was deprecated 2026-04-13 (see `Roadmap Collation DEPRECATED.md`) — do not reinstate a cross-plugin summary.

---

## Recently shipped (2026-04-20)

- **Keyframe Label DNA — native AE keyframe color as primary bank tag.** KF banks now stamp each captured keyframe with an AE label color (`Property.setKeyLabel`, AE 22.6+) derived from the bank's display color. Recall uses the label as a hard pre-filter before fuzzy scoring — solves the failure mode where moved keyframes with similar values fell below the fuzzy threshold. Schema bumped to v3. KF bank color picker restricted to AE label swatches only (no free hex). Three-tier recall: label-only (clean) → label+fuzzy (shared-color collision) → full-fuzzy (labels cleared / old v1/v2 banks). See `Docs/features/02-memory-banks.md` dev log entries 17–20 and `Docs/ARCHITECTURE.md` "Keyframe Label DNA" section.

---

## Recently shipped (2026-04-13)

Items previously listed here that landed this session. Left as a brief pointer so future agents know the design intent was met; implementation detail lives in the feature docs.

- **Select Expression Links** — shipped. `hlm_selectExpressionLinks()` walks selected layers' property trees, parses `layer("Name")` / `thisComp.layer("Name")` / `layer(N)` patterns, adds matched layers additively. EXPR LINKS button in SELECTA row. See `Docs/features/04-search.md` Dev Log entry 7.
- **Metadata Caching** — shipped. `HLMCache` JS module + `hlm_buildLayerMetadataJSON()` one-pass snapshot built in `_applyContext()` on every comp change. `build()`, `isValid()`, `get()`, `search()`, `invalidate()` exposed. `searchLayersB64` folded to match name OR comment in the same pass. See `Docs/features/04-search.md` Dev Log entry 8.
- **Hunt Tab Pick-Click (Parent / Children / Track Matte)** — shipped. Ported from Holy Expressor. Three dimension rows now combine a text input (editable layer name) with a spiral+cursor trigger button. Arms a 250ms JSX poll loop via `hlm_PC_armPickClick`; clicking a layer in AE dispatches the name through `com.holy.layermaster.pickclick.resolve` into the dimension input. Full-panel veil `#hlmPickClickVeil` + click-to-cancel. Namespace: `Holy.LayerMaster.PickClick`. Files: `js/main_PICKCLICK.js`, `jsx/Modules/host_PICKCLICK.jsx`. See `Docs/features/04-search.md` Dev Log entry 6 and `10-layer-rename.md` Dev Log entry 7.
- **Hunt Tab dimensions wired to real inputs** — parent/children/track-matte `getDimensions()` now reads values from the text inputs populated by pick-click (or typed directly), not from the disabled-placeholder buttons the previous UI had. Parent/Children/TrackMatte filtering in `huntLayers()` is now functional.
- **Shy reverse edge case** — fixed. `isolateShyFocus()` now computes an "effective selection" filtering out `shy && hideShyLayers` layers before evaluating which branch to take — if only shy-hidden layers are selected, effective selection is empty and Branch 1 (simple global toggle) fires instead of incorrectly tripping REVERSE. Same idiom as `isolateSolo()`. See `Docs/features/01-isolation-rail.md` Dev Log entry 7.
- **Pick-click safety rails** — landed in parallel session today (10 s wall-clock timeout + max-tick cap added to both LM and Expressor pick-click poll loops). Replaces/complements the prior 60 s CEP-side safety timeout documented in `04-search.md`.

---

## In flight / partial

- **Extended Search — unify `searchLayersB64` with Hunt's effect-ref path.** `searchLayersB64()` (`jsx/hostscript.jsx:387`) matches name + comment in one pass as of entry 8, but does **not** iterate `layer.effects` for effect names. The Hunt tab's `huntDimEffect` already does this (`hostscript.jsx:1035–1050`), so the effect-scan primitive exists — the remaining work is folding that same pass into `searchLayersB64` for the simple top-bar search. Metadata cache can back this when extended to carry `effects[]` per layer.

- **Composition sensitivity / "Iron out mechanics".** 11 rounds of fixes shipped in `07-context-listener.md` (debounce, `setActive()` pre-read, `renderAll()` on switch, stale-callback snapshot guards). Substantially more robust than the original pessimistic framing. Shy reverse edge case now resolved (see Recently shipped). States edge case suspected by the original roadmap entry has no outstanding bug on file — needs a named repro before it can be treated as in flight vs. resolved.

---

## Planned, not started

- **Metadata cache — carry effect metadata per layer.** Current `HLMCache` shape is `{ id, index, name, comment, shy, solo, locked, enabled, parentId, label }`. Adding `effects: [{ name, matchName }]` would let `searchLayersB64` and Hunt's effect-ref dimension read from the cache rather than iterating effect parades live. Perf concern the original roadmap flagged for 500+ layer comps is otherwise unaddressed for the effect-name path.

- **Select Lineage — section placement design question.** Currently EXPR LINKS sits in SELECTA alongside parent/children pickers. The original roadmap's open question ("own section or part of Search?") is resolved by implementation but no dedicated SELECTA UI section exists — it's inline. Whether to promote SELECTA into its own collapsible section is still open if further lineage tools are added.

---

## Open design questions

- **Extended search UX.** Once effect-name search lands in `searchLayersB64`, should the top-bar search gain a field-type selector (`names | comments | effects | all`), or should effects be an opt-in modifier on top of the current all-pass match?

- **Metadata cache staleness.** Current guard is `liveNumLayers` count. Does not catch rename/comment/effect mutations without a layer add/remove. If the cache feeds more features, consider either (a) rebuild-on-every-context-event, (b) selective invalidation via a user-action hook, or (c) accept staleness for search ops (rebuilt on-demand).

---

## Doc-debt notes (from historical Collation audit)

- Workspace CLAUDE.md previously described a `com.holy.agent.layerCommand` CSEvent listener stub in `js/main.js`. The stub does not exist and none is needed — Holy Agent integration uses direct `cs.evalScript` against `holyAPI_hlm_*` at `jsx/hostscript.jsx:728–810`. This is resolved in both Holy Agent's ARCHITECTURE.md Entry 3 and the HLM CLAUDE.md banner note; left here for historical continuity.
