  HOLY_LAYERMASTER - Project Specification


  Overview
  HOLY_LAYERMASTER is an Adobe After Effects (Ae) extension designed to streamline layer and keyframe management through
  persistent memory banks, composition-specific state snapshots, and advanced isolation tools.

  ---

  1. Core Systems & Logic


  A. Persistence Engine ("DNA Tagging")
   * Mechanism: When objects are "captured" into a bank or state, HLM assigns a unique ID to the layer and appends a
     hidden metadata tag to the layer's comment: [HLM:<bankId>:<instanceId>:<timestamp>].
   * Recall Logic:
       1. Primary: O(1) lookup by internal layer.id.
       2. Fallback: Recursive scan of all layer comments for the DNA tag. This handles scenarios where layers are copied
          between projects, pre-composed, or the internal ID changes.
   * Citations: jsx/hostscript.jsx -> captureLayers(), findLayerByTag(), selectLayersFromFile().


  B. Memory Banks (Keyframe & Layer)
   * Keyframe Memory: Saves the matchName property path and specific keyframe indices. Recall restores the selection of
     those specific keys.
   * Layer Memory: Saves a selection set of layers. Recall re-selects them.
   * Management: Banks can be dynamically added/removed. The UI tracks "active" banks (those containing data for the
     current comp) via colored indicators.
   * Citations: js/main.js -> renderBankRow(), jsx/hostscript.jsx -> captureKeyframes(), getPropPath().


  C. Layer States
   * Scope: Captures the "total timeline state" including enabled, shy, solo, and locked status for every layer, plus
     the comp's global hideShyLayers flag.
   * Transcomposition Awareness: States are saved in JSON files named by <compId>_<stateId>.json. This ensures states
     are specific to the composition they were captured in.
   * Citations: jsx/hostscript.jsx -> captureLayerStates(), applyLayerStates().


  D. Isolation Rail (Top Buttons)
   * Solo Button: Toggles solo on selected layers. Reverse: If all visible selected layers are already soloed, it
     un-solos them.
   * Lock Button: Toggles lock on selected layers. Reverse: If all selected are locked, it unlocks them.
   * Shy Focus Button (Nuanced Logic):
       * No Selection: Toggles the comp's global "Hide Shy Layers" switch.
       * Global Shy is ON: Disables global shy and un-shies all layers in the comp (Reset mode).
       * Focus (Selection exists): Un-shies selected layers, shies all non-selected layers, and enables global "Hide Shy
         Layers".
   * Citations: jsx/hostscript.jsx -> isolateSolo(), isolateShyFocus(), isolateLock().


  E. Search & UI
   * Search: Selects layers where the name contains the search string (case-insensitive). Uses Base64 encoding to pass
     strings safely to ExtendScript.
   * Polling: The panel polls Ae every 1000ms to detect project/comp changes and refresh indicators.
   * Color Sync: The panel fetches the user's custom AE Label colors to allow "theming" bank indicators.
   * Citations: js/main.js -> startPolling(), fetchAELabels(), jsx/hostscript.jsx -> getAELabelData().

  ---

  2. Technical Architecture


   * Frontend: HTML5 / CSS3 / JavaScript (CEP).
   * Backend: ExtendScript (JSX) for Ae API interaction.
   * Storage:
       * Root: _HLM_Data/ folder created adjacent to the .aep file.
       * Config: _bankConfig.json (Global names, bank counts, custom hex colors).
       * Data: Individual .json files for every bank/state per composition.
   * Communication: CSInterface.evalScript() for JS-to-JSX calls.


  3. Known Issues / Maintenance Notes
   * Shy Logic: The "Focus" mode currently relies on the global hideShyLayers state to determine if it should "Reset" or
     "Focus".
   * Performance: DNA tag scanning is O(n) per layer; in comps with 1000+ layers, bank recall may have a slight delay.
