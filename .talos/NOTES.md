# Talos — Manager Notes (Holy LayerMaster Hardening)

> Private scratchpad for the lead Talos on this patch. Terse so a fresh session can pick up fast. **Do not duplicate the patch plan — link.**

## Who I am

Talos for the HLM hardening session dispatched 2026-04-14. Owns NOTES.md, PATCH_PLAN.md, and Dev Log wrap-up. Delegates all code edits to sub-agents A–E.

## Where the plan lives

- [`Docs/PATCH_PLAN.md`](../Docs/PATCH_PLAN.md) — single source of truth (active). Authored from `Docs/NEXT_SESSION_HARDENING_PLAN.md` + one added item (Item 6 — inverse references).
- Original brief: [`Docs/NEXT_SESSION_HARDENING_PLAN.md`](../Docs/NEXT_SESSION_HARDENING_PLAN.md).
- Index doc: `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md`.
- HLM project rules: `CLAUDE.md` at HLM repo root.

## Current status

- **Session complete 2026-04-14.** All 6 items shipped.
- Dev Log entry 10 appended to `Docs/features/04-search.md` with per-item detail.
- Index doc `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md` → ✅ SHIPPED with ship table + empirical-gap note + 4 known follow-ups.
- CHECK IN added to top of workspace `CLAUDE.md` (bottom entry rotated out).
- Next action (for next session / human): run the AE validation pass listed in the index doc "Recommended AE validation pass" section. Watch for regressions in (a) HLMCache staleness after undo/redo, (b) INV REFS effect-layer-param detection fidelity across third-party effects.

## AE MCP toolkit injection — phrase-matched hook

Subagent B reported AE MCP unavailable. User clarified: the AE MCP toolkit is injected by a prompt-phrase hook. Likely trigger: **"Holy Invocations After Effects Toolkit"** AND/OR **"Holy Invocation After Effects Toolkit"** (ambiguous singular vs plural — include BOTH forms in every subagent brief to maximise injection odds).

**B's brief used the plural form alone — either the hook didn't fire for subagents, or it needs the singular form too.** User has seen it work for subagents in a prior session, so it's not broken system-wide — likely the phrase variant.

**Remaining dispatches (C, E):** Include both phrasings verbatim in briefs.

**If AE MCP still doesn't appear:** graceful fallback is code-review + CDP probes. User is OK with this — backups are in place and human validation can happen later. No session blocker.

## Assumption log (user away — no live clarification)

- **Patterns tab "broken" open question** (plan §"Open question for user"): the user instructed "Begin" without resolving. Proceeding with the DEFAULT — auto-activate fix per plan — and documenting this choice. If on session review the real issue was elsewhere (no patterns detected at all), Subagent A's fix is still benign (only fires when `eligible.length > 0`) and the deeper bug will surface separately.

## Process hygiene

- CEP debug port: **6907**. Get page ID fresh from `http://localhost:6907/json` each session.
- CDP connection on CEP Chromium: raw WebSocket only. Playwright `connectOverCDP` fails — documented in workspace `AGENTS.md` session log and in `Skills/cep-debug/SKILL.md`.
- AE MCP `run_script`: available. Subagents doing synthetic-comp validation (B, C, E) have explicit permission to drive it. Confirm AE is open and MCP Bridge Auto panel visible.
- ExtendScript is ES3. Traps documented in workspace `CLAUDE.md` — reserved words as unquoted keys, function decls inside blocks.
- Namespace prefix: `hlm_` for all ExtendScript globals.
- **Do not touch Holy Expressor.** Hard user requirement. Copy code from Expressor freely into HLM, but do not edit Expressor files.
- Stay out of `.git/`, `.claude/worktrees/`, `_archive/`, `Backup/`, `_backup/`, `node_modules/`, `Docs/zz_Archive+Deprecated docs DO NOT EDIT/`.
- Do not run git commands.

## Caveats / live-use

- No human in the loop this session. All validation must be self-driven: Node harnesses, CDP probes, AE MCP synthetic test comps.
- Dev log discipline is append-only per HLM conventions. Entries are written by Talos at session wrap — sub-agents deliver findings/diffs, not dev log entries.

## Testing approach

- **Self-test only.** No user-testing stop-points this session.
- Per-item validation:
  - Item 1: CDP probe `document.querySelectorAll('#selectaPatternChips .ha-chip').length` after reload; inspect config persistence.
  - Item 2: AE MCP — build 2-comp synthetic parent/child project; call `hlm_huntLayers` with projectWide children; assert cross-comp hit.
  - Item 3: AE MCP — add Gaussian Blur to a layer; call `hlm_huntLayers` with Effect refs + search term "blur"; assert match.
  - Item 4: AE MCP — build 200-layer synthetic comp; time `searchLayersB64` before/after; log delta.
  - Item 5: grep confirms zero references pre-delete; CDP eval against Agent to ask "how do I capture a layer state?" expects HLM-specific response.
  - Item 6: AE MCP — build synthetic comp with layer A referenced via expression, effect layer param, and track matte by three other layers; call `hlm_selectInverseRefs` on A; assert all three selected.

## Track boundary (sub-agents)

| Agent | Files owned (exclusive while running) | Phase |
|---|---|---|
| A | `Holy-LayerMaster-Repo/js/main.js` | 1 (parallel) |
| B | `Holy-LayerMaster-Repo/jsx/hostscript.jsx` | 1 (parallel) |
| D | `Holy-LayerMaster-Repo/Holy_LayerNames.jsx` (DELETE), `Holy-Agent-Repo/js/holy-agent-chat.js` | 1 (parallel) |
| C | `js/main.js` + `jsx/hostscript.jsx` | 2 (after A + B) |
| E | `js/main.js` + `jsx/hostscript.jsx` + `index.html` + `css/*.css` (for INV REFS button) | 3 (after C) |

Never launch two agents that overlap on a file.

## Outstanding design questions

- Should INV REFS button go in the SELECTA row (next to EXPR LINKS) or promote SELECTA to its own collapsible section per ROADMAP.md:34 note? — deferring: co-locate with EXPR LINKS for now.

## End-of-session checklist

1. All subagent diffs reviewed in Talos context (not trusted blind).
2. Dev log entries written per item in appropriate `Docs/features/*.md`.
3. `HOLY REPOS COLLATED/HOLY_LAYERMASTER_HARDENING_INDEX.md` status → ✅ SHIPPED (or 🔴 BLOCKED with specifics).
4. CHECK IN entry in workspace `CLAUDE.md` (rotate oldest if 3).
5. Final line to user: "NOTES updated, plan at step N, next Talos can resume."
