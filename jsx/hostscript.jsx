// =======================
// UTILITIES
// =======================
function getProjectPath() {
    if (!app.project.file) return "UNSAVED";
    return app.project.file.fsName;
}

// Returns project path + active comp info in one call — used by the JS polling loop
function getProjectAndCompContext() {
    var projPath = app.project.file ? app.project.file.fsName : "UNSAVED";
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        return JSON.stringify({ projPath: projPath, compId: null, compName: null });
    }
    return JSON.stringify({ projPath: projPath, compId: comp.id, compName: comp.name });
}

// 12-char base-36 UID — dual random call gives ~3.6T combinations
function generateUID() {
    var part1 = Math.random().toString(36).substr(2);
    var part2 = Math.random().toString(36).substr(2);
    return (part1 + part2).substr(0, 12).toUpperCase();
}

// Strips all [HLM:<bankId>:*:*] tags from a comment string for a given bank
function cleanComment(comment, bankId) {
    var re = new RegExp("\\[HLM:" + bankId + ":[A-Z0-9]+:[0-9]+\\]\\s*", "g");
    return comment.replace(re, "").replace(/\s+$/, "");
}

// Scan all layers in comp for a matching [HLM:<bankId>:<instanceId>:...] tag
function findLayerByTag(comp, bankId, instanceId) {
    var tagStr = "[HLM:" + bankId + ":" + instanceId + ":";
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.comment && layer.comment.indexOf(tagStr) !== -1) return layer;
    }
    return null;
}

// =======================
// LAYER LOGIC
// =======================
function captureLayers(bankId, timestamp) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";
    if (!comp.selectedLayers.length) return "ERROR: No layers selected.";

    app.beginUndoGroup("Capture Layers");
    var records = [];
    for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];
        var instanceId = generateUID();
        var tag = "[HLM:" + bankId + ":" + instanceId + ":" + timestamp + "]";
        var cleaned = cleanComment(layer.comment || "", bankId);
        layer.comment = cleaned ? cleaned + " " + tag : tag;
        records.push({ id: layer.id, instanceId: instanceId });
    }
    app.endUndoGroup();
    return JSON.stringify({ compId: comp.id, bankId: bankId, layers: records });
}

function selectLayersFromFile(filePath, undoName) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var f = new File(filePath);
    if (!f.exists) return "ERROR: Memory bank not found.";
    f.open('r');
    var dataStr = f.read();
    f.close();

    var data;
    try { data = JSON.parse(dataStr); } catch(e) { return "ERROR: Corrupt memory bank data."; }

    app.beginUndoGroup("Recall Layers: " + undoName);

    // Deselect all current selections
    var currentlySelected = comp.selectedLayers;
    for (var s = 0; s < currentlySelected.length; s++) currentlySelected[s].selected = false;

    // Backward compat: old format stored data.ids (flat array), new format uses data.layers
    var records = data.layers;
    if (!records && data.ids) {
        records = [];
        for (var b = 0; b < data.ids.length; b++) records.push({ id: data.ids[b], instanceId: null });
    }
    if (!records) records = [];

    for (var j = 0; j < records.length; j++) {
        var rec = records[j];
        var layer = null;

        // Primary: O(1) lookup by stored layer.id — favors original over any duplicate/clone
        var candidate = app.project.layerByID(rec.id);
        if (candidate && candidate.containingComp && candidate.containingComp.id === comp.id) {
            layer = candidate;
        }

        // Fallback: scan active comp comments for DNA tag (handles pre-comp / cross-project moves)
        if (!layer && rec.instanceId && data.bankId) {
            layer = findLayerByTag(comp, data.bankId, rec.instanceId);
        }

        if (layer) layer.selected = true;
    }

    app.endUndoGroup();
    return "SUCCESS";
}

// =======================
// KEYFRAME LOGIC
// =======================
function getPropPath(prop) {
    var parts = [];
    var current = prop;
    while (current.parentProperty !== null) {
        parts.unshift(current.matchName);
        current = current.parentProperty;
    }
    return parts.join("::");
}

function resolvePropPath(layer, pathStr) {
    var parts = pathStr.split("::");
    var current = layer;
    try {
        for (var i = 0; i < parts.length; i++) current = current.property(parts[i]);
        return current;
    } catch(e) { return null; }
}

function captureKeyframes(bankId, timestamp) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var selProps = comp.selectedProperties;

    // Pre-check before opening undo group
    var hasKeys = false;
    for (var check = 0; check < selProps.length; check++) {
        var cp = selProps[check];
        if (cp.propertyType === PropertyType.PROPERTY && cp.numKeys > 0 && cp.selectedKeys.length > 0) {
            hasKeys = true;
            break;
        }
    }
    if (!hasKeys) return "ERROR: No properties with selected keyframes found.";

    app.beginUndoGroup("Capture Keyframes");

    var layerTagMap = {}; // layerId -> instanceId — one tag per unique layer per capture
    var kfData = [];

    for (var p = 0; p < selProps.length; p++) {
        var prop = selProps[p];
        if (prop.propertyType === PropertyType.PROPERTY && prop.numKeys > 0 && prop.selectedKeys.length > 0) {
            var layer = prop.propertyGroup(prop.propertyDepth);

            // Tag the layer once per capture session, reuse instanceId for all its properties
            if (!layerTagMap[layer.id]) {
                var instanceId = generateUID();
                layerTagMap[layer.id] = instanceId;
                var tag = "[HLM:" + bankId + ":" + instanceId + ":" + timestamp + "]";
                var cleaned = cleanComment(layer.comment || "", bankId);
                layer.comment = cleaned ? cleaned + " " + tag : tag;
            }

            kfData.push({
                layerId: layer.id,
                instanceId: layerTagMap[layer.id],
                propPath: getPropPath(prop),
                keys: prop.selectedKeys.slice(0)
            });
        }
    }

    app.endUndoGroup();
    return JSON.stringify({ compId: comp.id, bankId: bankId, keyframes: kfData });
}

function selectKeyframesFromFile(filePath, undoName) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var f = new File(filePath);
    if (!f.exists) return "ERROR: Memory bank not found.";
    f.open('r');
    var dataStr = f.read();
    f.close();

    var data;
    try { data = JSON.parse(dataStr); } catch(e) { return "ERROR: Corrupt memory bank data."; }

    app.beginUndoGroup("Recall Keyframes: " + undoName);

    // Deselect all currently selected keyframes
    // Snapshot selectedKeys before iterating to avoid mutation-during-iteration bug
    var selProps = comp.selectedProperties;
    for (var i = 0; i < selProps.length; i++) {
        var p = selProps[i];
        if (p.propertyType === PropertyType.PROPERTY) {
            var keySnapshot = p.selectedKeys.slice(0);
            for (var k = 0; k < keySnapshot.length; k++) p.setSelectedAtKey(keySnapshot[k], false);
        }
    }

    var kfRecords = data.keyframes || [];
    for (var j = 0; j < kfRecords.length; j++) {
        var kf = kfRecords[j];
        var layer = null;

        // Primary: O(1) lookup by stored layer.id — favors original over any duplicate/clone
        var candidate = app.project.layerByID(kf.layerId);
        if (candidate && candidate.containingComp && candidate.containingComp.id === comp.id) {
            layer = candidate;
        }

        // Fallback: scan active comp comments for DNA tag (handles pre-comp / cross-project moves)
        if (!layer && kf.instanceId && data.bankId) {
            layer = findLayerByTag(comp, data.bankId, kf.instanceId);
        }

        if (layer) {
            layer.selected = true;
            var prop = resolvePropPath(layer, kf.propPath);
            if (prop) {
                for (var m = 0; m < kf.keys.length; m++) {
                    if (kf.keys[m] <= prop.numKeys) prop.setSelectedAtKey(kf.keys[m], true);
                }
            }
        }
    }

    app.endUndoGroup();
    return "SUCCESS";
}

// =======================
// SEARCH LOGIC
// =======================
// Base64 used to avoid quote-escaping / injection issues from user input
var Base64 = {
    decode: function(s) {
        var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
        var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for(i=0;i<64;i++){e[A.charAt(i)]=i;}
        for(x=0;x<L;x++){
            c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
            while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
        }
        return r;
    }
};
function searchLayersB64(b64Term) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return alert("Select a comp.");

    var term = decodeURIComponent(escape(Base64.decode(b64Term))).toLowerCase();

    app.beginUndoGroup("Search Layers");
    var currentlySelected = comp.selectedLayers;
    for (var s = 0; s < currentlySelected.length; s++) currentlySelected[s].selected = false;

    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name.toLowerCase().indexOf(term) !== -1) {
            comp.layer(i).selected = true;
        }
    }
    app.endUndoGroup();
}

// =======================
// LAYER STATES LOGIC
// =======================

// captureLayerStates: records enabled/shy/solo/locked for every layer in the comp,
// plus the comp's master hideShyLayers flag. Tags each layer with a DNA comment
// using the same [HLM:<stateId>:<instanceId>:<timestamp>] format as banks.
function captureLayerStates(stateId, timestamp) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    app.beginUndoGroup("Capture Layer States");

    var records = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer      = comp.layer(i);
        var instanceId = generateUID();
        var tag        = "[HLM:" + stateId + ":" + instanceId + ":" + timestamp + "]";
        var cleaned    = cleanComment(layer.comment || "", stateId);
        layer.comment  = cleaned ? cleaned + " " + tag : tag;
        records.push({
            id:         layer.id,
            instanceId: instanceId,
            enabled:    layer.enabled,
            shy:        layer.shy,
            solo:       layer.solo,
            locked:     layer.locked
        });
    }

    app.endUndoGroup();
    return JSON.stringify({
        compId:        comp.id,
        stateId:       stateId,
        hideShyLayers: comp.hideShyLayers,
        layers:        records
    });
}

// applyLayerStates: restores enabled/shy/solo/locked for layers that were part of
// the saved state. Layers created after capture are left untouched. Missing layers
// are skipped silently. Lookup is by layer.id first, DNA tag fallback second.
function applyLayerStates(filePath, stateName) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var f = new File(filePath);
    if (!f.exists) return "ERROR: State file not found.";
    f.open('r');
    var dataStr = f.read();
    f.close();

    var data;
    try { data = JSON.parse(dataStr); } catch(e) { return "ERROR: Corrupt state data."; }

    app.beginUndoGroup("Apply Layer State: " + stateName);

    // Build id -> record and instanceId -> record lookup maps
    var idMap       = {};
    var instanceMap = {};
    var records     = data.layers || [];
    for (var r = 0; r < records.length; r++) {
        idMap[records[r].id] = records[r];
        if (records[r].instanceId) instanceMap[records[r].instanceId] = records[r];
    }

    // Temporarily disable hideShyLayers so all layers remain accessible during apply.
    // We restore (or set) the saved value after all layer properties are written.
    var savedHideShy = comp.hideShyLayers;
    comp.hideShyLayers = false;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var rec   = idMap[layer.id] || null;

        // DNA fallback: scan comment for matching [HLM:<stateId>:<instanceId>:...] tag
        if (!rec && data.stateId && layer.comment) {
            var tagPrefix = "[HLM:" + data.stateId + ":";
            var tagIdx    = layer.comment.indexOf(tagPrefix);
            if (tagIdx !== -1) {
                var rest     = layer.comment.substring(tagIdx + tagPrefix.length);
                var colonIdx = rest.indexOf(":");
                if (colonIdx !== -1) {
                    var iid = rest.substring(0, colonIdx);
                    if (instanceMap[iid]) rec = instanceMap[iid];
                }
            }
        }

        // Only touch layers that were present when the state was captured
        if (rec) {
            // Temporarily unlock so we can reliably set all properties
            var wasLocked = layer.locked;
            if (wasLocked) layer.locked = false;
            layer.enabled = rec.enabled;
            layer.shy     = rec.shy;
            layer.solo    = rec.solo;
            layer.locked  = (rec.locked !== undefined) ? rec.locked : wasLocked;
        }
    }

    // Restore the saved hideShyLayers state (or revert to previous if not captured).
    comp.hideShyLayers = (typeof data.hideShyLayers !== 'undefined') ? data.hideShyLayers : savedHideShy;

    app.endUndoGroup();
    return "SUCCESS";
}

// =======================
// AE LABEL COLORS
// =======================

// Returns the 16 user-defined AE label colors + names as a JSON string.
// Encoding must be CP1252 so AE's raw preference bytes decode correctly.
function getAELabelData() {
    $.appEncoding = 'CP1252';
    var colorSection = "Label Preference Color Section 5";
    var nameSection  = "Label Preference Text Section 7";
    var labelData    = [];

    for (var i = 1; i <= 16; i++) {
        var rawColor  = app.preferences.getPrefAsString(colorSection, "Label Color ID 2 # " + i, PREFType.PREF_Type_MACHINE_INDEPENDENT);
        var labelName = app.preferences.getPrefAsString(nameSection,  "Label Text ID 2 # "  + i, PREFType.PREF_Type_MACHINE_INDEPENDENT);

        // Convert each raw byte to a 2-digit hex character
        var hexColor = "";
        for (var j = 0; j < rawColor.length; j++) {
            var hexByte = rawColor.charCodeAt(j).toString(16).toUpperCase();
            hexColor += (hexByte.length < 2 ? "0" + hexByte : hexByte);
        }

        // AE stores ARGB (8 hex chars); we want the last 6 (RGB only)
        var finalHex = hexColor.length >= 6 ? hexColor.substring(hexColor.length - 6) : null;

        // Skip labels that returned no usable color data
        if (!finalHex || finalHex === "000000") {
            labelData.push({ index: i, name: labelName || ("Label " + i), hex: null });
        } else {
            labelData.push({ index: i, name: labelName || ("Label " + i), hex: "#" + finalHex });
        }
    }

    return JSON.stringify(labelData);
}

// =======================
// LAYER RENAME LOGIC
// =======================

// renameSelectedLayers: renames selected layers in the active comp.
// mode: "search" | "prefix" | "suffix"
// text1B64: search term (search mode) or the prefix/suffix text (other modes)
// text2B64: replace term (search mode only)
function renameSelectedLayers(mode, text1B64, text2B64) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please open a composition.";

    var selected = comp.selectedLayers;
    if (!selected.length) return "ERROR: Please select at least one layer.";

    var text1 = decodeURIComponent(escape(Base64.decode(text1B64)));
    var text2 = (text2B64 && text2B64.length) ? decodeURIComponent(escape(Base64.decode(text2B64))) : "";

    app.beginUndoGroup("Rename Selected Layers");

    for (var i = 0; i < selected.length; i++) {
        var name = selected[i].name;
        if (mode === "search") {
            // Global search-and-replace
            if (text1.length) {
                selected[i].name = name.split(text1).join(text2);
            }
        } else if (mode === "prefix") {
            selected[i].name = text1 + name;
        } else if (mode === "suffix") {
            selected[i].name = name + text1;
        }
    }

    app.endUndoGroup();
    return "SUCCESS";
}

// =======================
// ISOLATION MODE
// =======================

// Solo: toggle solo on selected layers.
// The reverse trigger (un-solo) checks ONLY visible (non-shy-hidden) layers —
// hidden layers that AE can't solo are excluded from the condition but the
// action still applies to the full selection (AE will simply ignore hidden ones).
function isolateSolo() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return;
    var selected = comp.selectedLayers;
    if (!selected.length) return;

    app.beginUndoGroup("Isolation Mode");

    // "Visible" = selected layers AE will actually respond to for solo.
    // Shy-hidden layers (shy=true while hideShyLayers is on) cannot be soloed by AE.
    var visible = [];
    for (var i = 0; i < selected.length; i++) {
        if (!(selected[i].shy && comp.hideShyLayers)) visible.push(selected[i]);
    }

    // If only hidden layers are selected there is nothing actionable to do.
    if (!visible.length) { app.endUndoGroup(); return; }

    // Reverse trigger: based on visible layers only — hidden ones are ignored.
    var allSolo = true;
    for (var j = 0; j < visible.length; j++) {
        if (!visible[j].solo) { allSolo = false; break; }
    }

    // Apply only to visible layers; shy-hidden layers cannot be soloed by AE.
    for (var k = 0; k < visible.length; k++) {
        visible[k].solo = !allSolo;
    }

    app.endUndoGroup();
    app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
}

// Shy Focus — three branches:
//   1. No selection         → toggle global shy mode on/off.
//   2. ALL selected shy=true AND hideShyLayers=true
//                           → REVERSE: un-shy every layer + turn global mode off.
//   3. Otherwise            → FOCUS: selected=visible, others=shy, global mode forced ON.
function isolateShyFocus() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return;
    var selected = comp.selectedLayers;

    app.beginUndoGroup("Isolation Mode");

    // --- Branch 1: no selection — simple global toggle ---
    if (!selected.length) {
        comp.hideShyLayers = !comp.hideShyLayers;
        app.endUndoGroup();
        app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
        return;
    }

    // --- Branch 2: global shy mode is already ON — REVERSE (clear everything) ---
    // After Focus mode the focused layers have shy=false, so checking allSelectedShy
    // would always fail for any layer the user can click. The correct signal is simply
    // that hideShyLayers is on: pressing shy again with a selection → reverse.
    if (comp.hideShyLayers) {
        comp.hideShyLayers = false;
        for (var j = 1; j <= comp.numLayers; j++) comp.layer(j).shy = false;
        app.endUndoGroup();
        app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
        return;
    }

    // --- Branch 3: FOCUS — selected visible, everything else shy, global mode ON ---
    var selectedIds = {};
    for (var k = 0; k < selected.length; k++) selectedIds[selected[k].id] = true;

    for (var m = 1; m <= comp.numLayers; m++) {
        var layer = comp.layer(m);
        layer.shy = !selectedIds[layer.id];
    }
    comp.hideShyLayers = true;

    app.endUndoGroup();
    app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
}

// Lock: if ALL selected are locked -> unlock all; else -> lock all.
// layer.selected = true allows script access on locked layers.
function isolateLock() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return;
    var selected = comp.selectedLayers;
    if (!selected.length) return;

    app.beginUndoGroup("Isolation Mode");

    var allLocked = true;
    for (var i = 0; i < selected.length; i++) {
        if (!selected[i].locked) { allLocked = false; break; }
    }
    for (var j = 0; j < selected.length; j++) {
        selected[j].locked = !allLocked;
    }

    app.endUndoGroup();
    app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
}

(function () {
    function _dispatchContext() {
        var ctx;
        try { ctx = getProjectAndCompContext(); } catch (e) { return; }
        var evt  = new CSXSEvent();
        evt.type = 'com.hlm.contextChanged';
        evt.data = ctx;
        evt.dispatch();
    }
    try { app.addEventListener('afterActiveItemChanged', function () { _dispatchContext(); }); } catch (e) {}
    try { app.project.addEventListener('afterItemAdded', function () { _dispatchContext(); }); } catch (e) {}
    try { app.addEventListener('afterItemAdded', function () { _dispatchContext(); }); } catch (e) {}
}());
