# HLM Roadmap

Unimplemented features from the original design intent. Not bugs — planned work.

---

## Select Lineage (Hierarchy Tools)

Buttons to select parents, children, or expression-linked layers of the current selection.

- "Select Parents" — walk up the `layer.parent` chain.
- "Select Children" — scan all layers for `layer.parent === selectedLayer`.
- "Select Expression Links" — scan all layer properties for expressions referencing selected layers.

**Why:** Essential for rigging and complex parent-chain management. No equivalent in native AE UI.

---

## Extended Search (Effects & Comments)

Current search only checks `layer.name`. Planned: also search `layer.comment` and iterate `layer.effects` for effect names.

**Note from build notes:** AE's native search is poor at finding by effect name or comment — this would be a strong power-user differentiator.

**Performance concern:** Iterating effects on every layer in large comps may be slow. Consider a metadata cache (JS object mapping `layerId → { name, comment, effects[] }`) built once per comp context and invalidated on comp change.

---

## Metadata Caching (Performance)

For comps with 500+ layers, the current simple loop search will lag as more search parameters are added. Suggested approach: cache layer metadata to a JS object on comp load, search against the cache rather than querying AE directly each time. Invalidate cache on `com.hlm.contextChanged`.

---

## Open Design Questions

- Should Select Lineage be part of the Search section or its own section?
- Extended search: single input with type selector, or separate inputs per field?
