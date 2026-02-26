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
