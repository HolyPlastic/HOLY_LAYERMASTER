function getProjectPath() {
    if (!app.project.file) return "UNSAVED";
    return app.project.file.fsName;
}
// =======================
// LAYER LOGIC
// =======================
function captureLayers() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var ids = [];
    for (var i = 0; i < comp.selectedLayers.length; i++) {
        ids.push(comp.selectedLayers[i].id);
    }
    return JSON.stringify({ compId: comp.id, ids: ids });
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

    // Safety check to ensure we are in the correct Comp
    if (data.compId !== comp.id) return "ERROR: This bank was captured in a different composition!";

    app.beginUndoGroup("Recall Layers: " + undoName);
    var currentlySelected = comp.selectedLayers;
    for (var s = 0; s < currentlySelected.length; s++) currentlySelected[s].selected = false;

    for (var j = 0; j < data.ids.length; j++) {
        // O(1) direct lookup, highly optimized
        var layer = app.project.layerByID(data.ids[j]);
        if (layer) layer.selected = true;
    }
    app.endUndoGroup();
    return "SUCCESS";
}
// =======================
// KEYFRAME LOGIC
// =======================
function getPropPath(prop) {
    var path = [];
    var current = prop;
    while (current.parentProperty !== null) {
        path.unshift(current.matchName);
        current = current.parentProperty;
    }
    return path.join("::");
}
function resolvePropPath(layer, pathStr) {
    var parts = pathStr.split("::");
    var current = layer;
    try {
        for (var i = 0; i < parts.length; i++) current = current.property(parts[i]);
        return current;
    } catch(e) { return null; }
}
function captureKeyframes() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var kfData = [];
    var selProps = comp.selectedProperties;

    for (var p = 0; p < selProps.length; p++) {
        var prop = selProps[p];
        if (prop.propertyType === PropertyType.PROPERTY && prop.numKeys > 0 && prop.selectedKeys.length > 0) {
            var layer = prop.propertyGroup(prop.propertyDepth);
            kfData.push({
                layerId: layer.id,
                propPath: getPropPath(prop),
                keys: prop.selectedKeys.slice(0)
            });
        }
    }
    return JSON.stringify({ compId: comp.id, keyframes: kfData });
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

    if (data.compId !== comp.id) return "ERROR: This bank was captured in a different composition!";

    app.beginUndoGroup("Recall Keyframes: " + undoName);
    var selProps = comp.selectedProperties;
    for (var i = 0; i < selProps.length; i++) {
        var p = selProps[i];
        if (p.propertyType === PropertyType.PROPERTY) {
            for (var k = 0; k < p.selectedKeys.length; k++) p.setSelectedAtKey(p.selectedKeys[k], false);
        }
    }
    for (var j = 0; j < data.keyframes.length; j++) {
        var kf = data.keyframes[j];
        var layer = app.project.layerByID(kf.layerId);
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
// Base64 used to avoid quote escaping injection issues from user input
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