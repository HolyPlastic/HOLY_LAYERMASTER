function getProjectPath() {
    if (!app.project.file) return "UNSAVED";
    return app.project.file.fsName;
}

// Utility to generate a random instance ID for DNA tagging.
// Uses two separate Math.random() calls combined in base-36 to give
// ~3.6 trillion unique combinations — collision risk is negligible.
function generateUID() {
    return Math.random().toString(36).substr(2, 7).toUpperCase() +
           Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Clean previous Holy Layer Master tags from a comment
function cleanComment(comment, bankId) {
    var regex = new RegExp("\\[HLM:" + bankId + ":.*?\\]", "g");
    return comment.replace(regex, "").replace(/\s+$/, "");
}

// =======================
// LAYER LOGIC
// =======================

function captureLayers(bankId, timestamp) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";
    
    var layersData = [];
    app.beginUndoGroup("HLM: Capture DNA");
    
    for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];
        var instanceId = generateUID();
        
        // DNA Tagging: Append to comment
        var currentComment = cleanComment(layer.comment, bankId);
        var tag = "[HLM:" + bankId + ":" + instanceId + ":" + timestamp + "]";
        layer.comment = (currentComment === "" ? tag : currentComment + " " + tag);
        
        layersData.push({
            id: layer.id,
            instanceId: instanceId
        });
    }
    app.endUndoGroup();
    
    return JSON.stringify({ 
        compId: comp.id, 
        bankId: bankId, 
        timestamp: timestamp, 
        layers: layersData 
    });
}

function selectLayersFromFile(filePath, undoName) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";
    
    var f = new File(filePath);
    if (!f.exists) return "ERROR: Bank file missing.";
    f.open('r');
    var data = JSON.parse(f.read());
    f.close();
    
    app.beginUndoGroup("Holy Layer Master: Recall " + undoName);
    
    // Deselect all
    for (var s = 1; s <= comp.numLayers; s++) comp.layer(s).selected = false;
    
    for (var i = 0; i < data.layers.length; i++) {
        var item = data.layers[i];
        var found = false;
        
        // 1. Primary Lookup: Direct ID (Fastest)
        var layer = app.project.layerByID(item.id);
        if (layer && layer.containingComp.id === comp.id) {
            layer.selected = true;
            found = true;
        }
        
        // 2. Fallback: DNA Scan (survives pre-comp)
        if (!found) {
            var tagPattern = "[HLM:" + data.bankId + ":" + item.instanceId + ":" + data.timestamp + "]";
            for (var L = 1; L <= comp.numLayers; L++) {
                var checkLayer = comp.layer(L);
                if (checkLayer.comment.indexOf(tagPattern) !== -1) {
                    checkLayer.selected = true;
                    break;
                }
            }
        }
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

function captureKeyframes(bankId, timestamp) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Select a comp.";
    
    var kfData = [];
    var selProps = comp.selectedProperties;
    
    app.beginUndoGroup("HLM: Tag Keyframe Layers");
    for (var p = 0; p < selProps.length; p++) {
        var prop = selProps[p];
        if (prop.propertyType === PropertyType.PROPERTY && prop.numKeys > 0 && prop.selectedKeys.length > 0) {
            var layer = prop.propertyGroup(prop.propertyDepth);
            var instanceId = generateUID();
            
            // Tag the layer so we can find the property even if pre-comped
            var currentComment = cleanComment(layer.comment, bankId);
            var tag = "[HLM:" + bankId + ":" + instanceId + ":" + timestamp + "]";
            layer.comment = (currentComment === "" ? tag : currentComment + " " + tag);

            kfData.push({
                layerId: layer.id,
                instanceId: instanceId,
                propPath: getPropPath(prop),
                keys: prop.selectedKeys.slice(0)
            });
        }
    }
    app.endUndoGroup();
    
    return JSON.stringify({ compId: comp.id, bankId: bankId, timestamp: timestamp, keyframes: kfData });
}

function selectKeyframesFromFile(filePath, undoName) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Select a comp.";
    
    var f = new File(filePath);
    f.open('r');
    var data = JSON.parse(f.read());
    f.close();
    
    app.beginUndoGroup("Holy Layer Master: Recall " + undoName);
    
    // Deselect current keys.
    // IMPORTANT: snapshot selectedKeys into a plain array BEFORE the loop —
    // setSelectedAtKey modifies the live selectedKeys collection in-place,
    // which would cause indices to shift and skip keys if iterated directly.
    var selProps = comp.selectedProperties;
    for (var i = 0; i < selProps.length; i++) {
        var p = selProps[i];
        if (p.propertyType === PropertyType.PROPERTY) {
            var keySnapshot = p.selectedKeys.slice(0);
            for (var k = 0; k < keySnapshot.length; k++) p.setSelectedAtKey(keySnapshot[k], false);
        }
    }

    for (var j = 0; j < data.keyframes.length; j++) {
        var kf = data.keyframes[j];
        var targetLayer = null;
        
        // 1. Try ID
        var l = app.project.layerByID(kf.layerId);
        if (l && l.containingComp.id === comp.id) {
            targetLayer = l;
        } else {
            // 2. Try DNA Fallback
            var tagPattern = "[HLM:" + data.bankId + ":" + kf.instanceId + ":" + data.timestamp + "]";
            for (var m = 1; m <= comp.numLayers; m++) {
                if (comp.layer(m).comment.indexOf(tagPattern) !== -1) {
                    targetLayer = comp.layer(m);
                    break;
                }
            }
        }

        if (targetLayer) {
            targetLayer.selected = true;
            var prop = resolvePropPath(targetLayer, kf.propPath);
            if (prop) {
                for (var n = 0; n < kf.keys.length; n++) {
                    if (kf.keys[n] <= prop.numKeys) prop.setSelectedAtKey(kf.keys[n], true);
                }
            }
        }
    }
    app.endUndoGroup();
    return "SUCCESS";
}

// Search Logic remains the same (renamed for HLM)
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
    if (!comp || !(comp instanceof CompItem)) return;
    var term = decodeURIComponent(escape(Base64.decode(b64Term))).toLowerCase();
    app.beginUndoGroup("HLM: Search");
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name.toLowerCase().indexOf(term) !== -1) comp.layer(i).selected = true;
        else comp.layer(i).selected = false;
    }
    app.endUndoGroup();
}