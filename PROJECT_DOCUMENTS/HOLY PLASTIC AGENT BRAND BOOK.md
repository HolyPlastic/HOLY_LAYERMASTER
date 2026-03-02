# HOLYPLASTIC.EXE — TECHNO-BRUTALIST DESIGN MANIFEST

### Version 1.0 | February 2026 | Classification: MACHINE-READABLE / AGENT-READY

---

> **PURPOSE:** This document is the single source of truth for all UI generated under the `holyplastic.exe` brand. It converts aesthetic "vibe" into mathematical constraints. Every value herein is non-negotiable unless flagged as `[TUNABLE]`. Coding agents must treat this as a hard rule set, not a style suggestion.

---

## SECTION 1 — LOGICAL DESIGN TOKENS

### 1.1 Color System

|Token Name|Hex Value|Usage Rule|
|---|---|---|
|`--hp-void`|`#000000`|Background: absolute black only. No near-black substitutes.|
|`--hp-surface`|`#0A0A0A`|Elevated panel surface. Max 1 level of depth.|
|`--hp-border`|`#1A1A1A`|Default structural border. Grid lines, panel edges.|
|`--hp-border-active`|`#2E2E2E`|Border on hover/focus state (before glow activates).|
|`--hp-signal-green`|`#00FF41`|Primary accent. Terminal green. CRT phosphor reference.|
|`--hp-signal-amber`|`#FFB800`|Secondary accent. Warning states, secondary labels.|
|`--hp-signal-white`|`#F0F0F0`|Primary text. Data readouts. Never pure `#FFFFFF`.|
|`--hp-signal-dim`|`#666666`|Inactive labels, placeholder text, disabled state copy.|
|`--hp-danger`|`#FF2D2D`|Error state only. Not for decoration.|
|`--hp-glow-green`|`rgba(0, 255, 65, 0.15)`|CRT glow base layer. Used in box-shadow spread.|
|`--hp-glow-amber`|`rgba(255, 184, 0, 0.12)`|Amber glow variant for secondary active states.|

**Rule:** No gradients except the approved CRT glow effect (see Section 2). No opacity layers on background colors — use explicit hex values only.

---

### 1.2 Typography Tokens

|Token Name|Value|Usage|
|---|---|---|
|`--hp-font-engine`|`'JetBrains Mono', 'IBM Plex Mono', monospace`|All technical data: button labels, coordinates, status codes, readouts|
|`--hp-font-display`|`'Arial Black', 'Impact', sans-serif`|Large headers, primary narrative titles only|
|`--hp-font-body`|`'Inter', 'Arial', sans-serif`|Long-form content only. Minimum 14px.|
|`--hp-size-xs`|`8px`|Sub-labels, framing annotations. Uppercase + letter-spacing: 0.1em|
|`--hp-size-sm`|`10px`|Secondary data readouts. Uppercase only.|
|`--hp-size-base`|`12px`|Default button labels. Monospace engine font.|
|`--hp-size-md`|`14px`|Body copy minimum.|
|`--hp-size-lg`|`18px`|Section sub-headers.|
|`--hp-size-xl`|`24px`|Primary headers. Display font.|
|`--hp-size-2xl`|`36px–72px`|Hero/impact headers. Display font. [TUNABLE]|
|`--hp-weight-data`|`400`|Engine font weight for data|
|`--hp-weight-label`|`700`|Bold for button labels and active states|
|`--hp-tracking-data`|`0.08em`|Letter-spacing for all monospace labels|
|`--hp-tracking-sub`|`0.15em`|Letter-spacing for XS sub-labels|

---

### 1.3 Stroke & Geometry Tokens

|Token Name|Value|Usage|
|---|---|---|
|`--hp-stroke-hair`|`0.75px`|SVG primitive segment outlines. The brand signature weight.|
|`--hp-stroke-thin`|`1px`|Grid lines, panel borders, idle state borders.|
|`--hp-stroke-active`|`1.5px`|Hover/focus border weight increase.|
|`--hp-stroke-heavy`|`2px`|Accent borders on primary actions only.|
|`--hp-radius`|`0px`|All border-radius values. No exceptions.|
|`--hp-grid-micro`|`4px`|SVG segment alignment grid. All micro positioning must snap to this.|
|`--hp-grid-layout`|`8px`|Structural padding and module positioning.|
|`--hp-gap-segment`|`2px`|Gap between rhombus segments (p1, p2, p3). Must be exact.|
|`--hp-gap-module`|`8px`|Gap between component modules.|
|`--hp-gap-section`|`24px`|Gap between layout sections.|

---

### 1.4 Motion Tokens

|Token Name|Value|Usage|
|---|---|---|
|`--hp-duration-flicker`|`50ms`|Activation sync-flicker (opacity pulse).|
|`--hp-duration-fast`|`100ms`|Segment highlight on hover.|
|`--hp-duration-base`|`200ms`|Standard state transitions.|
|`--hp-easing-snap`|`cubic-bezier(0.25, 0.46, 0.45, 0.94)`|Default easing. Mechanical snap feel.|
|`--hp-easing-hard`|`steps(4, end)`|Flicker and CRT-style frame-step animations.|
|`--hp-opacity-flicker-on`|`1`|Flicker keyframe high.|
|`--hp-opacity-flicker-off`|`0.6`|Flicker keyframe low.|

---

## SECTION 2 — A2UI COMPONENT SCHEMA (Agent-to-UI Specification)

> This section defines the rendering logic for the two core primitives. Agents must follow these schemas exactly. No creative interpretation permitted.

---

### 2.1 Rhombus Button (RHB) — Multi-Segment Assembly

**Classification:** Primary interactive element. Used for actions, mode toggles, and primary CTAs.

**Anatomy:** A rhombus button consists of **three mandatory segments** rendered as adjacent SVG polygons or CSS clip-path shapes:

```
[  p1: LEFT CAP  ][  p2: CENTER BODY  ][  p3: RIGHT CAP  ]
```

**Rendering Rules:**

- Each segment is a **parallelogram** with a consistent skew angle of **45 degrees** on the left and right edges.
- `p1` skews right-to-left (opening bevel).
- `p2` is the primary rectangular data body (variable width).
- `p3` skews left-to-right (closing bevel, mirror of p1).
- All segments share the same height. Default height: **24px** (3 × `--hp-grid-layout`). [TUNABLE]
- Segment borders: `--hp-stroke-hair` (0.75px), color: `--hp-border`.
- Gap between segments: `--hp-gap-segment` (2px) filled with `--hp-void` background.
- Background fill of all segments: `--hp-void` (#000000) at idle.

**Label Placement:**

- Label lives in `p2` (center body) only.
- Font: `--hp-font-engine`. Size: `--hp-size-base`. Weight: `--hp-weight-label`.
- Color: `--hp-signal-white`. Text-transform: uppercase.
- Tracking: `--hp-tracking-data`.

**State: IDLE**

```
border: 0.75px solid #1A1A1A
background: #000000
color: #F0F0F0
box-shadow: none
```

**State: HOVER (Segment-Isolated)**

- Only the segment currently under the cursor changes state. Neighboring segments remain IDLE.
- The hovered segment:

```
border: 1.5px solid #2E2E2E
box-shadow: 0 0 6px 1px rgba(0, 255, 65, 0.15), 0 0 2px 0px rgba(0, 255, 65, 0.3)
transition: border var(--hp-duration-fast) var(--hp-easing-snap),
            box-shadow var(--hp-duration-fast) var(--hp-easing-snap)
```

**State: ACTIVE/PRESSED**

1. Apply flicker animation on mousedown:

```css
@keyframes hp-flicker {
  0%   { opacity: 1; }
  25%  { opacity: 0.6; }
  50%  { opacity: 1; }
  75%  { opacity: 0.6; }
  100% { opacity: 1; }
}
animation: hp-flicker 50ms steps(4, end);
```

2. Fill `p2` background: `#001A00` (dark terminal green tint).
3. Label color: `--hp-signal-green`.
4. Border color: `--hp-signal-green`, weight: `--hp-stroke-active`.

**State: DISABLED**

```
opacity: 0.35
pointer-events: none
border-color: #1A1A1A
color: #666666
```

**Hit-Box Rule (see Section 3):** The interactive hit area of each segment extends by **4px** on all sides beyond the visible stroke boundary. This is invisible padding and must not affect visual spacing between segments.

---

### 2.2 Diamond Checkbox (DCB) — State Toggle Primitive

**Classification:** Boolean state indicator. Replaces all standard `<input type="checkbox">` elements in the system.

**Anatomy:** A single square element, rotated 45 degrees (CSS `transform: rotate(45deg)`), creating a diamond shape.

**Base Dimensions:** `16px × 16px` before rotation. Effective visual diamond: approx `22px × 22px` diagonal. Hitbox: `32px × 32px` centered (see Section 3).

**Rendering Rules:**

- Container: `display: inline-flex; align-items: center; justify-content: center; cursor: pointer;`
- The diamond element:

```css
.hp-diamond {
  width: 16px;
  height: 16px;
  transform: rotate(45deg);
  border: 0.75px solid var(--hp-border);       /* #1A1A1A */
  background: var(--hp-void);                   /* #000000 */
  position: relative;
  transition: border-color var(--hp-duration-fast) var(--hp-easing-snap),
              box-shadow var(--hp-duration-fast) var(--hp-easing-snap);
}
```

**State: UNCHECKED / IDLE**

```
border: 0.75px solid #1A1A1A
background: #000000
box-shadow: none
```

**State: HOVER (Unchecked)**

```
border: 1.5px solid #2E2E2E
box-shadow: 0 0 5px 1px rgba(0, 255, 65, 0.12)
```

**State: CHECKED**

```
border: 1.5px solid #00FF41
background: #001A00
box-shadow: 0 0 8px 2px rgba(0, 255, 65, 0.2), inset 0 0 4px rgba(0, 255, 65, 0.1)
```

- Inner fill indicator: A smaller diamond (`6px × 6px`, same rotation) centered inside, filled `--hp-signal-green`. This is the "check mark" equivalent.

**State: CHECKED + HOVER**

```
box-shadow: 0 0 12px 3px rgba(0, 255, 65, 0.3), inset 0 0 6px rgba(0, 255, 65, 0.15)
```

**Activation Flicker:** On toggle (both check and uncheck), apply `hp-flicker` animation (50ms) to the entire diamond element.

**Label Pairing:** DCB elements are always paired with a text label:

- Label: `--hp-font-engine`, `--hp-size-base`, `--hp-signal-dim` at idle.
- On CHECKED state, label color transitions to `--hp-signal-white`.
- Gap between diamond and label: 8px (`--hp-grid-layout`).

---

### 2.3 Panel / Module Container

**Rendering Rules:**

- Background: `--hp-surface` (#0A0A0A).
- Border: `--hp-stroke-thin` (1px) solid `--hp-border` (#1A1A1A).
- Radius: `--hp-radius` (0px). No exceptions.
- Internal padding: multiples of `--hp-grid-layout` (8px). Minimum: 16px.
- Modules are separated by `--hp-gap-module` (8px) gaps, not dividers.
- Structural dividers (horizontal rules): 1px solid `#1A1A1A`. No ornamental rules.

---

### 2.4 Sub-Label Framing Element

**Pattern:** A thin vertical line (1px, `--hp-border`) paired with uppercase text.

```css
.hp-sub-label {
  font-family: var(--hp-font-engine);
  font-size: var(--hp-size-xs);       /* 8px */
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--hp-tracking-sub);  /* 0.15em */
  color: var(--hp-signal-dim);        /* #666666 */
  border-left: 1px solid #1A1A1A;
  padding-left: 6px;
}
```

---

## SECTION 3 — USABILITY GUARDRAILS

> The aesthetic is intentionally "hostile." These rules prevent hostility from crossing into inaccessibility. Non-negotiable for shipped product.

---

### 3.1 The Hit-Box Rule

**The Problem:** 0px radii and 0.75px strokes create visually small, precise targets that are mechanically satisfying but practically unmissable at small sizes.

**The Rule:** Every interactive element must have a minimum touch/click target of **32px × 32px**, regardless of its visual dimensions.

- Implement via invisible padding, `::before`/`::after` pseudo-element expansion, or wrapping `<button>` with `min-height: 32px; min-width: 32px`.
- The visual component remains unaffected. Only the interactive hit area expands.
- On desktop (pointer: fine), minimum acceptable hit area: **24px × 24px**.

```css
/* Universal hit-box enforcement */
.hp-interactive {
  position: relative;
}
.hp-interactive::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  min-width: 32px;
  min-height: 32px;
  width: 100%;
  height: 100%;
}
```

---

### 3.2 Contrast Guardrail

**Rule:** All text must meet WCAG AA contrast minimum (4.5:1 for normal text, 3:1 for large text ≥18px bold).

**Pre-approved pairings (always compliant):**

|Foreground|Background|Contrast|Use|
|---|---|---|---|
|`#F0F0F0`|`#000000`|18.1:1|Primary text on void|
|`#00FF41`|`#000000`|12.6:1|Active accent on void|
|`#FFB800`|`#000000`|9.4:1|Amber accent on void|
|`#F0F0F0`|`#0A0A0A`|17.5:1|Primary text on surface|
|`#666666`|`#000000`|5.7:1|Dim text on void (passes AA)|

**Warning:** `--hp-signal-dim` (#666666) on `--hp-surface` (#0A0A0A) passes AA at 5.6:1 but **only at 12px+**. Do not use for text below 12px.

---

### 3.3 Density Guardrail (Cognitive Load)

**The Problem:** High-density grids risk obscuring primary actions under visual noise.

**Rules:**

1. **One Primary Action Per Module.** Each panel/module may contain only one `p1/p2/p3` Rhombus Button designated as the primary CTA. All others are secondary (dimmer border, no glow at idle).
2. **Directional Labeling.** Any grid with 4+ elements must include at least one directional anchor: a label, arrow indicator, or section header using `--hp-sub-label` framing.
3. **Active Element Contrast Delta.** The active/hover state of any element must be visually distinguishable from its idle neighbors within 200ms of interaction. The CRT glow satisfies this requirement.
4. **Maximum Nesting Depth:** 2 levels. A panel inside a panel. No further nesting.

---

### 3.4 Focus State (Keyboard Accessibility)

**Rule:** The CRT glow IS the focus indicator. Do not remove it. Do not replace it with `outline: none` without providing an equivalent.

```css
.hp-interactive:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #000000,
              0 0 0 3px #00FF41,
              0 0 10px 2px rgba(0, 255, 65, 0.25);
}
```

This provides: inner void gap (maintains visual cleanliness), green border ring, and phosphor glow — maintaining the aesthetic while being keyboard-accessible.

---

### 3.5 Typography Minimum Floor

- **Never** use `--hp-font-engine` below `8px`.
- **Never** use `--hp-font-body` below `14px`.
- Sub-labels at `8px` must always be uppercase, spaced, and on a non-text-dense area of the layout.
- Measure line-length for body copy: Maximum 70 characters per line. The density aesthetic applies to grid elements, not paragraph text.

---

## SECTION 4 — AGENT SYSTEM PROMPT / RULE BOOK

> **Copy the block below verbatim into the system prompt of any coding agent building for the `holyplastic.exe` brand.**

---

```
=== HOLYPLASTIC.EXE DESIGN SYSTEM — AGENT RULE BOOK v1.0 ===

You are building UI for the holyplastic.exe brand.
This is a Techno-Brutalist, industrial-mechanical design system.
Follow every rule below without deviation.

--- VISUAL IDENTITY ---
- Background: #000000 (absolute void). No near-blacks. No gradients on backgrounds.
- One accent color per component: terminal green (#00FF41) OR amber (#FFB800). Not both.
- All borders/strokes are sharp. border-radius is always 0px. No exceptions.
- SVG stroke weight is 0.75px for all primitive outlines.
- Standard border weight is 1px. Hover/active increases to 1.5px.
- Typography uses JetBrains Mono or IBM Plex Mono for all labels, data, and UI copy.
- Use Arial Black or Impact only for large display headers (18px+).

--- GRID RULES ---
- Align ALL element edges to 4px grid increments.
- Use 8px for structural spacing (padding, gaps between modules).
- Use 24px for section-level spacing.
- Gaps between rhombus button segments are exactly 2px.
- Never use fractional pixel values except for 0.75px stroke weights.

--- COMPONENT RULES ---
RHOMBUS BUTTON:
- Always render as three segments: p1 (left cap) | p2 (center body) | p3 (right cap).
- Each segment is a parallelogram at 45-degree skew.
- Hover state illuminates ONLY the segment under the cursor. Not the full button.
- On activation: 50ms opacity flicker (1 → 0.6 → 1 → 0.6 → 1) using steps() easing.
- Active state: green border (1.5px #00FF41), dark green fill (#001A00), green label text.

DIAMOND CHECKBOX:
- Render as a 16px square rotated 45deg. Never use a standard checkbox.
- Checked state: green border (1.5px #00FF41), dark tint fill (#001A00), inner green diamond fill.
- Unchecked hover: subtle green glow box-shadow only.
- On toggle: 50ms flicker animation.

CRT GLOW (hover/focus effect):
- box-shadow: 0 0 6px 1px rgba(0,255,65,0.15), 0 0 2px 0px rgba(0,255,65,0.3)
- This is the ONLY shadow/depth effect permitted. No drop-shadows. No elevation.
- This also serves as the focus-visible indicator. Never use a plain outline instead.

--- ACCESSIBILITY RULES (NON-NEGOTIABLE) ---
- Minimum hit/click area for any interactive element: 32px × 32px (use ::before expansion).
- Minimum text contrast: WCAG AA (4.5:1 for normal, 3:1 for large/bold text).
- Never set font-size below 8px for labels or below 14px for body copy.
- All interactive elements must have visible :focus-visible styles (use the CRT glow).
- Provide aria-label on all icon-only and geometry-only (rhombus/diamond) controls.

--- WHAT YOU MUST NEVER DO ---
- Never use border-radius > 0px.
- Never use gradients (except approved CRT glow in box-shadow).
- Never use drop-shadow, elevation, or "soft" shadows.
- Never use standard checkboxes, radio buttons, or rounded toggles.
- Never substitute a solid rhombus shape for the three-segment assembly.
- Never use more than two font families in one component.
- Never nest more than two levels of panel containers.
- Never place more than one primary-action rhombus button in a single panel.

=== END RULE BOOK ===
```

---

## APPENDIX — QUICK REFERENCE CARD

```
COLORS      void #000000 | surface #0A0A0A | border #1A1A1A
            green #00FF41 | amber #FFB800 | white #F0F0F0 | dim #666666

STROKES     0.75px (SVG primitives) | 1px (borders idle) | 1.5px (borders active)

GRID        4px micro-snap | 8px layout | 24px section | 2px segment gap

RADIUS      0px (always)

TYPE        JetBrains Mono (data/labels) | Arial Black (display only)
            8px xs-label | 10px sm-data | 12px base | 14px body-min

MOTION      50ms flicker (steps) | 100ms hover | 200ms state change

GLOW        box-shadow: 0 0 6px 1px rgba(0,255,65,0.15), 0 0 2px 0px rgba(0,255,65,0.3)

HITBOX      32px × 32px minimum (invisible ::before expansion)
```

---

_holyplastic.exe Design Manifest v1.0 — February 2026_ _Generated from: Phase 1 Deep Research (NotebookLM) + Phase 2 Architectural Synthesis_ _Status: LOCKED — Changes require Lead Architect approval and version bump_