// ============================================================
// Search & Replace Names  —  dockable ScriptUI panel
//
// INSTALL:  Drop into  .../Scripts/ScriptUI Panels/
//           then launch via  Window > searchReplaceName
//
// SCOPE:
//   [x] Project items  — selected comps & folders in Project panel
//   [x] Comp layers    — selected layers in ANY open composition
//
// MODES (mutually exclusive):
//   [ ] Prefix        — prepends Replace value to each name
//   [ ] Suffix        — appends  Replace value to each name
//   [ ] Full Replace  — renames entirely, preserving/assigning numbers
//   (none ticked)     — standard Search & Replace
//
// Case Sensitive checkbox only affects what is searched/matched.
// The Replace field is always inserted verbatim.
// ============================================================

{
    function SearchReplaceNames(thisObj) {

        // ── Build UI ─────────────────────────────────────────
        function buildUI(thisObj) {

            var myPanel = (thisObj instanceof Panel)
                ? thisObj
                : new Window("palette", "Search & Replace Names", undefined, { resizeable: true });

            myPanel.orientation   = "column";
            myPanel.alignChildren = ["fill", "top"];
            myPanel.spacing       = 8;
            myPanel.margins       = 12;

            // ---- SCOPE section ----
            var scopePanel = myPanel.add("panel", undefined, "Scope");
            scopePanel.orientation   = "column";
            scopePanel.alignChildren = ["left", "top"];
            scopePanel.spacing       = 4;
            scopePanel.margins       = [10, 14, 10, 8];

            var chkProject = scopePanel.add("checkbox", undefined, "Selected project items  (comps & folders)");
            var chkLayers  = scopePanel.add("checkbox", undefined, "Selected layers in compositions");
            chkProject.value = true;
            chkLayers.value  = true;

            // ---- FIELDS section ----
            var fieldsPanel = myPanel.add("panel", undefined, "Names");
            fieldsPanel.orientation   = "column";
            fieldsPanel.alignChildren = ["fill", "top"];
            fieldsPanel.spacing       = 6;
            fieldsPanel.margins       = [10, 14, 10, 10];

            // Search row
            var searchGroup = fieldsPanel.add("group");
            searchGroup.orientation   = "row";
            searchGroup.alignChildren = ["left", "center"];

            var searchLabel = searchGroup.add("statictext", undefined, "Search:");
            searchLabel.preferredSize.width = 54;
            var searchField = searchGroup.add("edittext", undefined, "Old Name");
            searchField.preferredSize.width = 200;

            // Replace row
            var replaceGroup = fieldsPanel.add("group");
            replaceGroup.orientation   = "row";
            replaceGroup.alignChildren = ["left", "center"];

            var replaceLabel = replaceGroup.add("statictext", undefined, "Replace:");
            replaceLabel.preferredSize.width = 54;
            var replaceField = replaceGroup.add("edittext", undefined, "New Name");
            replaceField.preferredSize.width = 200;

            // Case sensitive checkbox — lives under the search field,
            // disabled automatically whenever Search is greyed out
            var chkCaseSensitive = fieldsPanel.add("checkbox", undefined, "Case sensitive search");
            chkCaseSensitive.value = true;

            // ---- MODE section ----
            var modePanel = myPanel.add("panel", undefined, "Mode");
            modePanel.orientation   = "column";
            modePanel.alignChildren = ["fill", "top"];
            modePanel.spacing       = 6;
            modePanel.margins       = [10, 14, 10, 10];

            // Prefix + Suffix side by side
            var affixGroup = modePanel.add("group");
            affixGroup.orientation   = "row";
            affixGroup.alignChildren = ["left", "center"];
            affixGroup.spacing       = 20;

            var chkPrefix = affixGroup.add("checkbox", undefined, "Prefix");
            var chkSuffix = affixGroup.add("checkbox", undefined, "Suffix");

            // Full Replace on its own line
            var chkFullReplace = modePanel.add("checkbox", undefined, "Full Replace  (rename entirely, keep/assign numbers)");

            // ---- Rename button ----
            var btnRename = myPanel.add("button", undefined, "Rename Selected");
            btnRename.alignment = "fill";

            // ── Shared helper: sync field states to active mode ──
            // Search field AND case sensitive checkbox are both
            // only relevant in standard Search & Replace mode.
            function syncFields() {
                var anySpecialMode = chkPrefix.value || chkSuffix.value || chkFullReplace.value;
                searchField.enabled      = !anySpecialMode;
                searchLabel.enabled      = !anySpecialMode;
                chkCaseSensitive.enabled = !anySpecialMode;
            }

            // ── Mode checkbox mutual exclusivity ─────────────
            chkPrefix.onClick = function () {
                if (chkPrefix.value) {
                    chkSuffix.value      = false;
                    chkFullReplace.value = false;
                }
                syncFields();
            };

            chkSuffix.onClick = function () {
                if (chkSuffix.value) {
                    chkPrefix.value      = false;
                    chkFullReplace.value = false;
                }
                syncFields();
            };

            chkFullReplace.onClick = function () {
                if (chkFullReplace.value) {
                    chkPrefix.value = false;
                    chkSuffix.value = false;
                }
                syncFields();
            };

            // ── Rename button ─────────────────────────────────
            btnRename.onClick = function () {

                if (!chkProject.value && !chkLayers.value) {
                    alert("Please tick at least one Scope checkbox.");
                    return;
                }

                var searchStr     = searchField.text;
                var replaceStr    = replaceField.text;
                var caseSensitive = chkCaseSensitive.value;

                var mode = "search";
                if (chkPrefix.value)           mode = "prefix";
                else if (chkSuffix.value)      mode = "suffix";
                else if (chkFullReplace.value) mode = "full";

                if (mode === "search" && searchStr === "") {
                    alert("Search field cannot be empty in standard Search & Replace mode.");
                    return;
                }

                doRename(
                    searchStr,
                    replaceStr,
                    mode,
                    caseSensitive,
                    chkProject.value,
                    chkLayers.value
                );
            };

            // ── Panel layout & resize ─────────────────────────
            myPanel.layout.layout(true);
            myPanel.layout.resize();
            myPanel.onResizing = myPanel.onResize = function () {
                this.layout.resize();
            };

            return myPanel;
        }

        // ── Helpers ──────────────────────────────────────────

        /**
         * Escapes a string so it is safe to use inside a RegExp.
         * Handles any special regex characters someone might type
         * into the Search field (dots, brackets, parens, etc.).
         */
        function escapeRegExp(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }

        /**
         * Replaces all occurrences of searchStr within name,
         * inserting replaceStr verbatim. Respects caseSensitive flag.
         *
         * Using RegExp rather than split/join so we can pass the
         * case-insensitive flag cleanly.
         */
        function replaceAll(name, searchStr, replaceStr, caseSensitive) {
            var flags   = caseSensitive ? "g" : "gi";
            var pattern = new RegExp(escapeRegExp(searchStr), flags);
            return name.replace(pattern, replaceStr);
        }

        /**
         * Returns true if name contains searchStr, respecting case flag.
         */
        function nameContains(name, searchStr, caseSensitive) {
            if (caseSensitive) {
                return name.indexOf(searchStr) !== -1;
            }
            return name.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1;
        }

        /**
         * Extracts a trailing integer from a name string.
         * "Comp 3"  → { number: 3,  base: "Comp" }
         * "BG_12"   → { number: 12, base: "BG" }
         * "Intro"   → { number: null, base: "Intro" }
         */
        function extractTrailingNumber(name) {
            var match = name.match(/([\s_\-]?)(\d+)\s*$/);
            if (match) {
                return {
                    number: parseInt(match[2], 10),
                    base:   name.substring(0, name.length - match[0].length)
                };
            }
            return { number: null, base: name };
        }

        /**
         * Core rename — called on button click so all AE state is fresh.
         * mode: "search" | "prefix" | "suffix" | "full"
         */
        function doRename(searchStr, replaceStr, mode, caseSensitive, useProject, useLayers) {

            if (!app.project) { alert("No project is open."); return; }

            app.beginUndoGroup("Search & Replace Names");
            var targets      = [];
            var renamedCount = 0;

            // ── Collect project-panel targets ─────────────────
            if (useProject) {
                var sel = app.project.selection;
                for (var i = 0; i < sel.length; i++) {
                    if (sel[i] instanceof CompItem || sel[i] instanceof FolderItem) {
                        targets.push(sel[i]);
                    }
                }
            }

            // ── Collect selected layers across ALL open comps ─
            // Avoids app.project.activeItem which is unreliable
            // from a dockable panel (changes with panel focus).
            if (useLayers) {
                for (var p = 1; p <= app.project.numItems; p++) {
                    var projItem = app.project.item(p);
                    if (projItem instanceof CompItem) {
                        for (var q = 1; q <= projItem.numLayers; q++) {
                            if (projItem.layer(q).selected) {
                                targets.push(projItem.layer(q));
                            }
                        }
                    }
                }
            }

            if (targets.length === 0) {
                app.endUndoGroup();
                alert("Nothing to rename.\n\nMake sure items are selected in the Project panel or that layers are selected in a composition, then try again.");
                return;
            }

            // ── Mode: Search & Replace ────────────────────────
            if (mode === "search") {

                for (var n = 0; n < targets.length; n++) {
                    var oldName = targets[n].name;
                    if (nameContains(oldName, searchStr, caseSensitive)) {
                        targets[n].name = replaceAll(oldName, searchStr, replaceStr, caseSensitive);
                        renamedCount++;
                    }
                }

            // ── Mode: Prefix ──────────────────────────────────
            } else if (mode === "prefix") {

                for (var a = 0; a < targets.length; a++) {
                    targets[a].name = replaceStr + targets[a].name;
                    renamedCount++;
                }

            // ── Mode: Suffix ──────────────────────────────────
            } else if (mode === "suffix") {

                for (var b = 0; b < targets.length; b++) {
                    targets[b].name = targets[b].name + replaceStr;
                    renamedCount++;
                }

            // ── Mode: Full Replace (with number preservation) ─
            } else if (mode === "full") {

                var parsed      = [];
                var usedNumbers = {};

                for (var k = 0; k < targets.length; k++) {
                    var parsed_item = extractTrailingNumber(targets[k].name);
                    parsed.push(parsed_item);
                    if (parsed_item.number !== null) {
                        usedNumbers[parsed_item.number] = true;
                    }
                }

                var seqCounter = 1;

                for (var m = 0; m < targets.length; m++) {
                    var newName;

                    if (parsed[m].number !== null) {
                        newName = replaceStr + " " + parsed[m].number;

                    } else if (targets.length === 1) {
                        newName = replaceStr;

                    } else {
                        while (usedNumbers[seqCounter]) seqCounter++;
                        newName = replaceStr + " " + seqCounter;
                        usedNumbers[seqCounter] = true;
                        seqCounter++;
                    }

                    targets[m].name = newName;
                    renamedCount++;
                }
            }

            app.endUndoGroup();

            // ── Feedback ──────────────────────────────────────
            if (renamedCount === 0) {
                alert(
                    "Done — nothing was renamed.\n\n" +
                    "No selected item's name contained \"" + searchStr + "\"" +
                    (caseSensitive ? " (case sensitive)." : " (case insensitive).")
                );
            } else {
                alert(renamedCount + " item(s) renamed successfully.");
            }
        }

        // ── Launch ───────────────────────────────────────────
        var pal = buildUI(thisObj);
        if (pal !== null && pal instanceof Window) {
            pal.center();
            pal.show();
        }
    }

    SearchReplaceNames(this);
}