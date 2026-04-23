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

// ⚠️ PERF (unmigrated): iterates all layers — DNA-tag fallback lookup.
// Migration path: HLMCache carries `comment` per layer, so a panel-side caller
// can do `HLMCache.searchPredicate(r => r.comment.indexOf("[HLM:"+bankId+":"+instanceId+":") !== -1)`
// and then hand the single resulting id to `hlm_selectByIds` (or skip this
// helper entirely if only O(1) `app.project.layerByID` is needed). Keeping
// this JSX fallback in place until a consumer refactor (bank-apply / state-
// apply paths) is wired through. See Phase 2, Item 4.
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
// FILE I/O HELPERS
// These replace all Node.js fs/path calls in main.js.
// All paths are built here in JSX using ExtendScript's File/Folder API.
// =======================

// Returns the _HLM_Data folder path next to the project file
function hlm_getDataDir(projPath) {
    var projFile = new File(projPath);
    return projFile.parent.fsName + "/_HLM_Data";
}

// Returns the full path for a bank's JSON file
function hlm_getSavePath(projPath, compId, bankId) {
    return hlm_getDataDir(projPath) + "/" + compId + "_" + bankId + ".json";
}

// Returns the full path for the bank config file.
// Per-comp when compId is supplied; falls back to legacy project-wide path otherwise.
function hlm_getConfigPath(projPath, compId) {
    if (compId && compId !== '' && compId !== 'null' && compId !== 'undefined') {
        return hlm_getDataDir(projPath) + "/" + compId + "_bankConfig.json";
    }
    return hlm_getDataDir(projPath) + "/_bankConfig.json";
}

// Creates the _HLM_Data folder if it doesn't exist. Returns "OK" or "ERROR: ..."
function hlm_ensureDataDir(projPath) {
    var dir = new Folder(hlm_getDataDir(projPath));
    if (!dir.exists) {
        if (!dir.create()) return "ERROR: Could not create data folder.";
    }
    return "OK";
}

// Returns "true" or "false" as a string — used to check if a file exists
function hlm_fileExists(filePath) {
    return (new File(filePath)).exists ? "true" : "false";
}

// Reads a file and returns its contents as a string.
// Returns "ERROR: ..." on failure.
function hlm_readFile(filePath) {
    var f = new File(filePath);
    if (!f.exists) return "ERROR: File not found: " + filePath;
    f.encoding = "UTF-8";
    f.open("r");
    var content = f.read();
    f.close();
    return content;
}

// Writes data (a string) to a file, creating it if needed.
// Returns "OK" or "ERROR: ..."
function hlm_writeFile(filePath, data) {
    var ensureResult = hlm_ensureDataDir(new File(filePath).parent.fsName + "/..");
    // ensureDataDir already handles the parent — we just need the file's direct parent
    var parentFolder = new File(filePath).parent;
    if (!parentFolder.exists) {
        if (!parentFolder.create()) return "ERROR: Could not create folder: " + parentFolder.fsName;
    }
    var f = new File(filePath);
    f.encoding = "UTF-8";
    if (!f.open("w")) return "ERROR: Could not open file for writing: " + filePath;
    f.write(data);
    f.close();
    return "OK";
}

// Deletes a file. Returns "OK" or "ERROR: ..."
function hlm_deleteFile(filePath) {
    var f = new File(filePath);
    if (!f.exists) return "OK"; // already gone — not an error
    return f.remove() ? "OK" : "ERROR: Could not delete file: " + filePath;
}

// Reads the bank config file and returns its JSON string.
// Tries comp-specific config first, then falls back to legacy project-wide config.
// Returns "NOT_FOUND" if neither exists, "ERROR: ..." on failure.
function hlm_readConfig(projPath, compId) {
    var cfgPath = hlm_getConfigPath(projPath, compId);
    var f = new File(cfgPath);
    if (!f.exists) {
        // Migration fallback: use legacy project-wide config if comp-specific doesn't exist yet
        var legacyPath = hlm_getDataDir(projPath) + "/_bankConfig.json";
        var legacyFile = new File(legacyPath);
        if (legacyFile.exists) { f = legacyFile; } else { return "NOT_FOUND"; }
    }
    f.encoding = "UTF-8";
    f.open("r");
    var content = f.read();
    f.close();
    return content;
}

// Writes the bank config JSON string to disk (per-comp when compId is supplied).
// Returns "OK" or "ERROR: ..."
function hlm_writeConfig(projPath, compId, jsonStr) {
    var ensureResult = hlm_ensureDataDir(projPath);
    if (ensureResult !== "OK") return ensureResult;
    var cfgPath = hlm_getConfigPath(projPath, compId);
    var f = new File(cfgPath);
    f.encoding = "UTF-8";
    if (!f.open("w")) return "ERROR: Could not open config for writing.";
    f.write(jsonStr);
    f.close();
    return "OK";
}

// Reads a bank data file and returns a count of items inside it (layers/keyframes/ids).
// Returns the count as a plain number string, e.g. "3", or "0" if empty/missing.
function hlm_getBankCount(projPath, compId, bankId) {
    var fp = hlm_getSavePath(projPath, compId, bankId);
    var f = new File(fp);
    if (!f.exists) return "0";
    f.encoding = "UTF-8";
    f.open("r");
    var raw = f.read();
    f.close();
    try {
        var data = JSON.parse(raw);
        if (data.layers)    return String(data.layers.length);
        if (data.ids)       return String(data.ids.length);
        if (data.keyframes) return String(data.keyframes.length);
    } catch(e) {}
    return "0";
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

// Read a single keyframe's fingerprint (time, value, interp) for fuzzy matching.
// Value is kept as-is for scalars/arrays; objects (mask paths, text docs) → null (value scoring skipped).
function hlm_readKeyFingerprint(prop, idx) {
    var v = null;
    try {
        var raw = prop.keyValue(idx);
        if (typeof raw === 'number' || raw instanceof Array) v = raw;
    } catch (_) {}
    var ii = null, oi = null;
    try { ii = prop.keyInInterpolationType(idx); } catch (_) {}
    try { oi = prop.keyOutInterpolationType(idx); } catch (_) {}
    return { t: prop.keyTime(idx), v: v, ii: ii, oi: oi };
}

// Build the full fingerprint sequence of every key on a property — the "DNA" of that property's animation state at capture time.
function hlm_buildPropSequence(prop) {
    var seq = [];
    for (var k = 1; k <= prop.numKeys; k++) seq.push(hlm_readKeyFingerprint(prop, k));
    return seq;
}

function captureKeyframes(bankId, timestamp, labelIndexStr) {
    var labelIndex = parseInt(labelIndexStr, 10) || 0;
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
                keys: prop.selectedKeys.slice(0),
                propSequence: hlm_buildPropSequence(prop)
            });
        }
    }

    // Label stamping — tag each captured keyframe with the bank's AE label color.
    // Clears any existing keys with this label on the same property first so re-capture is clean.
    // Verifies the stamp actually took (setLabelAtKey unavailable on pre-22.6 AE) before writing
    // labelIndex to JSON — prevents false-positive "labels not found" warnings on recall.
    if (labelIndex > 0) {
        for (var s = 0; s < kfData.length; s++) {
            var stampLayer = app.project.layerByID(kfData[s].layerId);
            if (!stampLayer) continue;
            var stampProp = resolvePropPath(stampLayer, kfData[s].propPath);
            if (!stampProp || !kfData[s].keys.length) continue;
            // Clear existing same-color labels on this property first
            for (var ci = 1; ci <= stampProp.numKeys; ci++) {
                try { if (stampProp.keyLabel(ci) === labelIndex) stampProp.setLabelAtKey(ci, 0); } catch(_) {}
            }
            // Stamp first key and verify the write actually succeeded
            var stampOk = false;
            try {
                stampProp.setLabelAtKey(kfData[s].keys[0], labelIndex);
                stampOk = (stampProp.keyLabel(kfData[s].keys[0]) === labelIndex);
            } catch(_) {}
            if (!stampOk) continue; // setLabelAtKey not available or failed — skip this record
            // Stamp remaining keys
            for (var si = 1; si < kfData[s].keys.length; si++) {
                try { stampProp.setLabelAtKey(kfData[s].keys[si], labelIndex); } catch(_) {}
            }
            kfData[s].capturedCount = kfData[s].keys.length;
            kfData[s].labelIndex = labelIndex;
        }
    }

    app.endUndoGroup();
    return JSON.stringify({
        compId: comp.id,
        bankId: bankId,
        keyframes: kfData,
        frameDuration: comp.frameDuration,
        schemaVersion: 3
    });
}

// ===== FUZZY-MATCH KEYFRAME RECALL =====
// Scores each current keyframe against a banked fingerprint and selects the best match per banked key.
// See Docs/features/02-memory-banks.md for the confidence-matrix design rationale.

function hlm_valuesEqual(a, b, eps) {
    if (a === null || b === null) return false;
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < eps;
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (typeof a[i] !== 'number' || typeof b[i] !== 'number') return false;
            if (Math.abs(a[i] - b[i]) > eps) return false;
        }
        return true;
    }
    return false;
}

// Find the dominant time-offset Δt that best aligns the banked propSequence onto the current prop's keys.
// Returns { offset, support } where support = count of banked keys whose +Δt lands on a current key.
// If no clear signal (support < 2) returns null — no sequence bonus applied.
function hlm_findSequenceOffset(bankedSeq, currentTimes, tEps) {
    if (!bankedSeq || bankedSeq.length < 2 || currentTimes.length < 2) return null;
    // Candidate offsets: every pairing of banked[0..N] to current[0..M], capped to keep it O(n*m) small.
    var bestOffset = 0, bestSupport = 0;
    var bankedCap = Math.min(bankedSeq.length, 20);
    var currentCap = Math.min(currentTimes.length, 60);
    var supportCap = Math.min(bankedSeq.length, 30);
    for (var b = 0; b < bankedCap; b++) {
        for (var c = 0; c < currentCap; c++) {
            var delta = currentTimes[c] - bankedSeq[b].t;
            // Count how many banked keys find a current key at bankedTime + delta.
            // currentTimes is always ascending (AE keyframes are time-ordered) → early-exit once we pass the expected time.
            var support = 0;
            for (var k = 0; k < supportCap; k++) {
                var expected = bankedSeq[k].t + delta;
                for (var m = 0; m < currentTimes.length; m++) {
                    var diff = currentTimes[m] - expected;
                    if (Math.abs(diff) < tEps) { support++; break; }
                    if (diff > tEps) break; // passed the window, no match possible
                }
            }
            if (support > bestSupport) { bestSupport = support; bestOffset = delta; }
        }
    }
    return bestSupport >= 2 ? { offset: bestOffset, support: bestSupport } : null;
}

// Score a single current keyframe against a banked fingerprint. 0–100.
function hlm_scoreKey(prop, currentIdx, bankedFp, bankedDelta, tEps, vEps, expectedTime) {
    var score = 0;
    var cT = prop.keyTime(currentIdx);
    // Time (+40)
    if (Math.abs(cT - bankedFp.t) < tEps) score += 40;
    // Value (+30)
    if (bankedFp.v !== null) {
        var cV = null;
        try {
            var raw = prop.keyValue(currentIdx);
            if (typeof raw === 'number' || raw instanceof Array) cV = raw;
        } catch (_) {}
        if (hlm_valuesEqual(bankedFp.v, cV, vEps)) score += 30;
    } else {
        // Non-scalar value (mask path etc.) — can't compare, give partial credit to avoid starving score.
        score += 15;
    }
    // Interpolation (+20) — both in and out must match
    var cIi = null, cOi = null;
    try { cIi = prop.keyInInterpolationType(currentIdx); } catch (_) {}
    try { cOi = prop.keyOutInterpolationType(currentIdx); } catch (_) {}
    if (cIi === bankedFp.ii && cOi === bankedFp.oi) score += 20;
    // Neighbor delta (+10) — time distance from previous banked key, preserved under uniform shifts
    if (bankedDelta !== null && currentIdx > 1) {
        var cDelta = cT - prop.keyTime(currentIdx - 1);
        if (Math.abs(cDelta - bankedDelta) < tEps) score += 10;
    }
    // Sequence alignment bonus (+15) — current key lands where the dominant Δt expects it
    if (expectedTime !== null && Math.abs(cT - expectedTime) < tEps) score += 15;
    return score;
}

// strictModeStr is "true"/"false" — JS side passes a literal string (evalScript limitation).
function selectKeyframesFromFile(filePath, undoName, strictModeStr) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please select a composition.";

    var f = new File(filePath);
    if (!f.exists) return "ERROR: Memory bank not found.";
    f.open('r');
    var dataStr = f.read();
    f.close();

    var data;
    try { data = JSON.parse(dataStr); } catch(e) { return "ERROR: Corrupt memory bank data."; }

    var strict = (strictModeStr === "true" || strictModeStr === true);
    var threshold = strict ? 95 : 55;
    var ambiguityMargin = 10;
    var tEps = (data.frameDuration || comp.frameDuration) * 0.5;
    var vEps = 0.0001;

    app.beginUndoGroup("Recall Keyframes: " + undoName);

    // Deselect all currently selected keyframes (snapshot to avoid mutation-during-iteration)
    var selProps = comp.selectedProperties;
    for (var i = 0; i < selProps.length; i++) {
        var p = selProps[i];
        if (p.propertyType === PropertyType.PROPERTY) {
            var keySnapshot = p.selectedKeys.slice(0);
            for (var k = 0; k < keySnapshot.length; k++) p.setSelectedAtKey(keySnapshot[k], false);
        }
    }

    var kfRecords = data.keyframes || [];
    var report = { exact: 0, shifted: 0, skipped: 0, total: 0, ambiguous: 0, usedLabel: false, labelWarning: false };

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
        if (!layer) { report.skipped += kf.keys.length; report.total += kf.keys.length; continue; }

        layer.selected = true;
        var prop = resolvePropPath(layer, kf.propPath);
        if (!prop) { report.skipped += kf.keys.length; report.total += kf.keys.length; continue; }

        // ─── Label path: bank has labelIndex → filter by native AE keyframe color ───
        var candidatePool = null;
        var labelHandled = false;
        if (kf.labelIndex && kf.labelIndex > 0) {
            var labelFiltered = [];
            for (var lf = 1; lf <= prop.numKeys; lf++) {
                try { if (prop.keyLabel(lf) === kf.labelIndex) labelFiltered.push(lf); } catch(_) {}
            }
            var capturedCount = kf.capturedCount || kf.keys.length;
            if (labelFiltered.length > 0 && labelFiltered.length <= capturedCount) {
                // Clean unique match — select all found directly, no scoring needed
                report.total += kf.keys.length;
                for (var ls = 0; ls < labelFiltered.length; ls++) {
                    prop.setSelectedAtKey(labelFiltered[ls], true);
                    report.exact++;
                }
                report.usedLabel = true;
                labelHandled = true;
            } else if (labelFiltered.length > capturedCount) {
                // Shared color: more labeled keys than captured — run fuzzy within filtered pool
                candidatePool = labelFiltered;
                report.usedLabel = true;
            } else {
                // No labeled keys found — labels may have been manually cleared, fall back to fuzzy
                report.labelWarning = true;
            }
        }
        if (labelHandled) continue;

        // ─── Legacy path: no propSequence in bank → index-only recall ───
        if (!kf.propSequence) {
            for (var m = 0; m < kf.keys.length; m++) {
                report.total++;
                if (kf.keys[m] <= prop.numKeys) { prop.setSelectedAtKey(kf.keys[m], true); report.exact++; }
                else report.skipped++;
            }
            continue;
        }

        // ─── Fuzzy path: score every current key against each banked fingerprint ───
        // When candidatePool is set (shared-color mode), scoring is restricted to that subset.
        var bankedSeq = kf.propSequence;
        var currentTimes = [];
        if (candidatePool) {
            for (var cti = 0; cti < candidatePool.length; cti++) currentTimes.push(prop.keyTime(candidatePool[cti]));
        } else {
            for (var cti = 1; cti <= prop.numKeys; cti++) currentTimes.push(prop.keyTime(cti));
        }
        var alignment = hlm_findSequenceOffset(bankedSeq, currentTimes, tEps);
        var usedCurrentKeys = {}; // prevent two banked keys collapsing onto same current key

        for (var q = 0; q < kf.keys.length; q++) {
            report.total++;
            var bankedIdx = kf.keys[q]; // 1-based into propSequence
            if (bankedIdx < 1 || bankedIdx > bankedSeq.length) { report.skipped++; continue; }
            var bankedFp = bankedSeq[bankedIdx - 1];
            var bankedDelta = bankedIdx > 1 ? (bankedFp.t - bankedSeq[bankedIdx - 2].t) : null;
            var expectedTime = alignment ? bankedFp.t + alignment.offset : null;

            var bestScore = -1, bestIdx = -1, secondScore = -1;
            var numCand = candidatePool ? candidatePool.length : prop.numKeys;
            for (var ci2 = 0; ci2 < numCand; ci2++) {
                var cidx = candidatePool ? candidatePool[ci2] : (ci2 + 1);
                if (usedCurrentKeys[cidx]) continue;
                var s = hlm_scoreKey(prop, cidx, bankedFp, bankedDelta, tEps, vEps, expectedTime);
                if (s > bestScore) { secondScore = bestScore; bestScore = s; bestIdx = cidx; }
                else if (s > secondScore) { secondScore = s; }
            }

            if (bestScore < threshold) { report.skipped++; continue; }
            if (bestScore - secondScore < ambiguityMargin && secondScore >= threshold) {
                report.ambiguous++; report.skipped++; continue;
            }
            prop.setSelectedAtKey(bestIdx, true);
            usedCurrentKeys[bestIdx] = true;
            if (bestScore >= 95) report.exact++; else report.shifted++;
        }
    }

    app.endUndoGroup();
    var recallMode = report.usedLabel ? (report.labelWarning ? 'label+fuzzy' : 'label') : 'fuzzy';
    return JSON.stringify({
        status: "SUCCESS",
        total: report.total,
        exact: report.exact,
        shifted: report.shifted,
        skipped: report.skipped,
        ambiguous: report.ambiguous,
        strict: strict,
        mode: recallMode,
        labelWarning: report.labelWarning
    });
}

// =======================
// METADATA CACHE BUILDER
// =======================
// Single-pass snapshot of all layers in the active comp.
// Called from JS HLMCache.build() on every context change.
// Returns JSON: { compId, numLayers, layers: { [id]: { id, name, comment, shy, solo, locked, enabled, parentId, label } } }
function hlm_buildLayerMetadataJSON() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return JSON.stringify({ compId: null, numLayers: 0, layers: {} });

    var layers = {};
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var parentId = null;
        try { if (layer.parent) parentId = layer.parent.id; } catch (_) {}
        layers[String(layer.id)] = {
            id:       layer.id,
            index:    layer.index,
            name:     layer.name,
            comment:  layer.comment || "",
            shy:      !!layer.shy,
            solo:     !!layer.solo,
            locked:   !!layer.locked,
            enabled:  !!layer.enabled,
            parentId: parentId,
            label:    layer.label
        };
    }

    return JSON.stringify({ compId: comp.id, numLayers: comp.numLayers, layers: layers });
}

// =======================
// hlm_selectByIds — cache-first selection bridge
// =======================
// Panel-side HLMCache filters metadata locally, then hands off a bare ID list
// to this function over a single evalScript round-trip. O(1) per id via
// app.project.layerByID — no comp-level iteration.
//
// Input: base64(JSON) payload = { ids: ["123","456"], undoName?: string, additive?: bool }
// Semantics: selection is scoped to the active comp; ids pointing at layers in
// other comps are silently skipped (returned in "skipped" count). Additive
// respects current selection; default replaces it.
// Returns JSON: { ok, selected, skipped, compId }
function hlm_selectByIds(b64Payload) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: No active composition.";

    var payload;
    try {
        var json = decodeURIComponent(escape(Base64.decode(b64Payload)));
        payload  = JSON.parse(json);
    } catch (e) {
        return "ERROR: Invalid payload: " + String(e);
    }

    var ids       = (payload && payload.ids) ? payload.ids : [];
    var undoName  = (payload && payload.undoName) ? String(payload.undoName) : "HLM: Select";
    var additive  = !!(payload && payload.additive);

    app.beginUndoGroup(undoName);

    if (!additive) {
        var cleared = comp.selectedLayers;
        for (var s = 0; s < cleared.length; s++) cleared[s].selected = false;
    }

    var selected = 0;
    var skipped  = 0;
    for (var i = 0; i < ids.length; i++) {
        var rawId = ids[i];
        var numId = parseInt(rawId, 10);
        if (isNaN(numId)) { skipped++; continue; }
        var layer = null;
        try { layer = app.project.layerByID(numId); } catch (e1) { layer = null; }
        if (!layer) { skipped++; continue; }
        try {
            if (layer.containingComp && layer.containingComp.id === comp.id) {
                layer.selected = true;
                selected++;
            } else {
                skipped++;
            }
        } catch (e2) { skipped++; }
    }

    app.endUndoGroup();

    // Hand-rolled JSON (json2 polyfill not guaranteed in this file)
    return '{"ok":true,"selected":' + selected + ',"skipped":' + skipped + ',"compId":' + comp.id + '}';
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
// Search layers by name (and comment) in one pass.
// Extended search: matches name OR comment (comment carries DNA tags + user notes).
// JS-side HLMCache.search() can front-load this for display, but actual AE selection
// must happen here (JSX-side) since we set layer.selected.
function searchLayersB64(b64Term) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return alert("Select a comp.");

    var term = decodeURIComponent(escape(Base64.decode(b64Term))).toLowerCase();

    app.beginUndoGroup("Search Layers");
    var currentlySelected = comp.selectedLayers;
    for (var s = 0; s < currentlySelected.length; s++) currentlySelected[s].selected = false;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var nameMatch    = layer.name.toLowerCase().indexOf(term) !== -1;
        var commentMatch = layer.comment && layer.comment.toLowerCase().indexOf(term) !== -1;
        if (nameMatch || commentMatch) layer.selected = true;
    }
    app.endUndoGroup();
}

// =======================
// LAYER STATES LOGIC
// =======================

// ⚠️ PERF (unmigrated — mutation path, no pure cache-first possible): this
// function MUST write DNA tags + state records for every layer in the comp,
// so a panel-side pre-filter doesn't apply. Follow-up: once cache carries
// enabled/shy/solo/locked (it does), we could return only `records` from the
// cache and keep the DNA-write loop. Optimisation saves ~half the work on
// 500+ layer comps. Migration pattern: see SELECTA / huntFireBtn simple-mode
// in main.js. Panel-side caller (main.js `captureStateData`) must call
// `HLMCache.invalidate()` after the evalScript returns — already wired.
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

// ⚠️ PERF (unmigrated — per-layer AE API writes required): applies cannot be
// replaced by `hlm_selectByIds` because each layer's properties (enabled/shy/
// solo/locked) must be mutated JSX-side. Future optimisation: use HLMCache
// to pre-filter the `records` list to only ids present in the active comp,
// then iterate the smaller set. See Phase 2, Item 4 migration pattern.
// Panel-side caller (main.js `applyStateData`) calls `HLMCache.invalidate()`
// on the evalScript callback so the next search reflects the restored state.
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
//   1. No selection (or only shy-hidden layers selected)
//                           → toggle global shy mode on/off.
//   2. hideShyLayers is ON AND effective (visible) selection is non-empty
//                           → REVERSE: un-shy every layer + turn global mode off.
//   3. Otherwise            → FOCUS: selected=visible, others=shy, global mode forced ON.
//
// Edge case fix (Entry 7): filter out shy-hidden layers from the selection before
// deciding the branch. A layer that is shy=true while hideShyLayers=ON cannot be
// interacted with in AE — it must not influence the toggle direction.
// Same filter pattern as isolateSolo() (Entry 3).
function isolateShyFocus() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return;
    var selected = comp.selectedLayers;

    app.beginUndoGroup("Isolation Mode");

    // Compute effective selection: exclude shy-hidden layers (same pattern as isolateSolo).
    // Shy-hidden layers (shy=true while hideShyLayers is ON) are invisible and cannot be
    // reliably acted upon — exclude them from both condition checks and Branch 3 focus set.
    var effective = [];
    for (var ei = 0; ei < selected.length; ei++) {
        if (!(selected[ei].shy && comp.hideShyLayers)) effective.push(selected[ei]);
    }

    // --- Branch 1: no effective selection — simple global toggle ---
    if (!effective.length) {
        comp.hideShyLayers = !comp.hideShyLayers;
        app.endUndoGroup();
        app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
        return;
    }

    // --- Branch 2: global shy mode is already ON AND visible layers are selected — REVERSE ---
    // After Focus mode the focused layers have shy=false, so checking allSelectedShy
    // would always fail for any visible layer the user can click. The correct signal is
    // hideShyLayers being on with a non-empty effective selection → reverse.
    if (comp.hideShyLayers) {
        comp.hideShyLayers = false;
        for (var j = 1; j <= comp.numLayers; j++) comp.layer(j).shy = false;
        app.endUndoGroup();
        app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
        return;
    }

    // --- Branch 3: FOCUS — effective selection visible, everything else shy, global mode ON ---
    var selectedIds = {};
    for (var k = 0; k < effective.length; k++) selectedIds[effective[k].id] = true;

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

// ✅ MIGRATED (fast path) — panel-side `invertBtn` handler in main.js now computes
// the unlocked complement from HLMCache and calls `hlm_selectByIds` in a single
// round-trip. This JSX implementation is retained as the cache-cold fallback
// (used on first click before cache.build() resolves, and as the canonical
// reference for the semantics). See Phase 2, Item 4.
function isolateInvert() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return;

    app.beginUndoGroup("Isolation Mode");

    var selectedIds = {};
    var selected = comp.selectedLayers;
    for (var i = 0; i < selected.length; i++) selectedIds[selected[i].id] = true;

    for (var j = 1; j <= comp.numLayers; j++) {
        var layer = comp.layer(j);
        if (layer.locked) continue;
        if (selectedIds[layer.id]) {
            layer.selected = false;
        } else {
            layer.selected = true;
        }
    }

    app.endUndoGroup();
    app.executeCommand(app.findMenuCommandId("Reveal Selected Layer in Timeline"));
}

// =======================
// holyAPI — Holy Agent bridge surface
// Called via Holy Agent's evalScript when HLM is open.
// Pattern mirrors holyAPI_* in Holy Expressor.
// NOTE: Base64 object is already defined above in the SEARCH LOGIC section.
// =======================

function holyAPI_hlm_isolateSolo() {
    try { isolateSolo(); return "SUCCESS"; } catch(e) { return "ERROR: " + String(e); }
}

function holyAPI_hlm_isolateShyFocus() {
    try { isolateShyFocus(); return "SUCCESS"; } catch(e) { return "ERROR: " + String(e); }
}

function holyAPI_hlm_isolateLock() {
    try { isolateLock(); return "SUCCESS"; } catch(e) { return "ERROR: " + String(e); }
}

function holyAPI_hlm_isolateInvert() {
    try { isolateInvert(); return "SUCCESS"; } catch(e) { return "ERROR: " + String(e); }
}

function holyAPI_hlm_renameSelectedLayers(mode, b64_1, b64_2) {
    try { return renameSelectedLayers(mode, b64_1, b64_2); } catch(e) { return "ERROR: " + String(e); }
}

function holyAPI_hlm_searchLayers(b64Term) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: No active composition.";
    try { searchLayersB64(b64Term); return "SUCCESS"; } catch(e) { return "ERROR: " + String(e); }
}

// ⚠️ PERF (unmigrated — project-wide scope): this path iterates
// `app.project.numItems` and every comp within, not just the active comp.
// HLMCache is per-active-comp, so it can only accelerate the `scope=="layers"`
// path for the currently-active comp. Migration pattern: panel-side splits
// the rename into (a) active-comp subset via HLMCache predicate + a new
// `hlm_renameByIds` JSX helper, (b) other-comps subset via this full-project
// walk. Also: this function RENAMES items — panel-side caller must call
// `HLMCache.invalidate()` on completion. See Phase 2, Item 4.
function holyAPI_hlm_renameProjectWide(findB64, replaceB64, scope, dryRun) {
    if (!app.project) return JSON.stringify({ "error": "No project open." });
    var find    = decodeURIComponent(escape(Base64.decode(findB64)));
    var replace = decodeURIComponent(escape(Base64.decode(replaceB64)));
    if (!find.length) return JSON.stringify({ "error": "Search term cannot be empty." });

    var isDryRun = (dryRun === "true" || dryRun === true);
    if (!isDryRun) app.beginUndoGroup("Holy Agent: Project-Wide Rename");

    var layersRenamed  = 0;
    var compsRenamed   = 0;
    var foldersRenamed = 0;
    var preview        = [];
    var totalItems     = app.project.numItems;

    for (var i = 1; i <= totalItems; i++) {
        var item = app.project.item(i);

        if ((scope === "comps" || scope === "all") && item instanceof CompItem) {
            if (item.name.indexOf(find) !== -1) {
                var newCompName = item.name.split(find).join(replace);
                if (isDryRun) {
                    preview.push({ "type": "comp", "from": item.name, "to": newCompName });
                } else {
                    item.name = newCompName;
                    compsRenamed++;
                }
            }
        }

        // FolderItem block wrapped in try/catch — guards against any CEP bridge
        // context issue where FolderItem might not be in scope. Silently skips
        // rather than crashing the whole loop.
        try {
            if ((scope === "folders" || scope === "all") && item instanceof FolderItem) {
                if (item.name.indexOf(find) !== -1) {
                    var newFolderName = item.name.split(find).join(replace);
                    if (isDryRun) {
                        preview.push({ "type": "folder", "from": item.name, "to": newFolderName });
                    } else {
                        item.name = newFolderName;
                        foldersRenamed++;
                    }
                }
            }
        } catch(folderErr) {
            // FolderItem check failed — surface in return so caller can diagnose
            if (!isDryRun) app.endUndoGroup();
            return JSON.stringify({ "error": "FolderItem check failed: " + String(folderErr), "layersRenamed": layersRenamed, "compsRenamed": compsRenamed, "foldersRenamed": foldersRenamed, "preview": preview });
        }

        if ((scope === "layers" || scope === "all") && item instanceof CompItem) {
            for (var j = 1; j <= item.numLayers; j++) {
                var layer = item.layer(j);
                if (layer.name.indexOf(find) !== -1) {
                    var newLayerName = layer.name.split(find).join(replace);
                    if (isDryRun) {
                        preview.push({ "type": "layer", "from": layer.name, "to": newLayerName, "inComp": item.name });
                    } else {
                        layer.name = newLayerName;
                        layersRenamed++;
                    }
                }
            }
        }
    }

    if (!isDryRun) app.endUndoGroup();

    return JSON.stringify({
        "layersRenamed":  layersRenamed,
        "compsRenamed":   compsRenamed,
        "foldersRenamed": foldersRenamed,
        "preview":        preview,
        "totalItems":     totalItems,
        "error":          null
    });
}

// =======================
// ADVANCED RENAME + HUNT
// =======================

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function replaceAllInName(name, searchStr, replaceStr, caseSensitive) {
    var flags = caseSensitive ? "g" : "gi";
    var pattern = new RegExp(escapeRegExp(searchStr), flags);
    return name.replace(pattern, replaceStr);
}

function nameContains(name, searchStr, caseSensitive) {
    if (caseSensitive) return name.indexOf(searchStr) !== -1;
    return name.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1;
}

function extractTrailingNumber(name) {
    var match = name.match(/([\s_\-]?)(\d+)\s*$/);
    if (match) {
        return {
            "number": parseInt(match[2], 10),
            "base":   name.substring(0, name.length - match[0].length)
        };
    }
    return { "number": null, "base": name };
}

function renameAdvanced(mode, text1B64, text2B64, optsStr) {
    var comp = app.project.activeItem;
    var opts;
    try { opts = JSON.parse(optsStr); } catch(e) { opts = {}; }

    var scope         = opts.scope || "layers";
    var caseSensitive = !!opts.caseSensitive;
    var preserveNums  = !!opts.preserveNumbers;
    var excludeStr   = opts.exclude || "";
    var text1 = decodeURIComponent(escape(Base64.decode(text1B64)));
    var text2 = decodeURIComponent(escape(Base64.decode(text2B64 || "")));

    var targets = [];

    if (scope === "layers" || scope === "both") {
        if (!comp || !(comp instanceof CompItem)) return "ERROR: Please open a composition.";
        var sel = comp.selectedLayers;
        if (!sel.length) return "ERROR: No layers selected in the active composition.";
        for (var s = 0; s < sel.length; s++) targets.push({ target: sel[s], type: "layer" });
    }

    if (scope === "project" || scope === "both") {
        if (!app.project) return "ERROR: No project open.";
        var projSel = app.project.selection;
        for (var p = 0; p < projSel.length; p++) {
            if (projSel[p] instanceof CompItem || projSel[p] instanceof FolderItem) {
                targets.push({ target: projSel[p], type: "project" });
            }
        }
    }

    if (targets.length === 0) return "ERROR: No targets found. Select layers or project items.";

    if (mode === "search" && !text1.length) return "ERROR: Search term cannot be empty.";

    app.beginUndoGroup("Rename Advanced");
    var renamedCount = 0;

    for (var n = 0; n < targets.length; n++) {
        var oldName = targets[n].target.name;
        if (excludeStr.length && nameContains(oldName, excludeStr, true)) continue;

        var newName;

        if (mode === "search") {
            if (!nameContains(oldName, text1, caseSensitive)) continue;
            newName = replaceAllInName(oldName, text1, text2, caseSensitive);
        } else if (mode === "prefix") {
            newName = text1 + oldName;
        } else if (mode === "suffix") {
            if (preserveNums) {
                var parsed = extractTrailingNumber(oldName);
                newName = parsed.base + text1;
                if (parsed.number !== null) newName += " " + parsed.number;
            } else {
                newName = oldName + text1;
            }
        }

        targets[n].target.name = newName;
        renamedCount++;
    }

    app.endUndoGroup();
    if (renamedCount === 0) return "Done — nothing was renamed.";
    return "SUCCESS: " + renamedCount + " item(s) renamed.";
}

// ✅ MIGRATED (simple-mode fast path) — panel-side `huntFireBtn` handler in main.js
// short-circuits to HLMCache.selectByPredicate + hlm_selectByIds when the query
// is a plain name/comment match with no cross-comp / effect-ref / parent-tree
// dimensions. Full-dimensional hunts still flow through this JSX pass. See
// Phase 2, Item 4. Remaining candidate: push more dims (parent/child, matte)
// into HLMCache by extending the metadata snapshot.
function huntLayers(payloadStr) {
    var payload;
    try { payload = JSON.parse(payloadStr); } catch(e) { return "ERROR: Invalid payload: " + String(e); }

    var searchTerm  = payload.search || "";
    var invert      = !!payload.invert;
    var dimNonMatch = !!payload.dimNonMatch;
    var withinSel   = !!payload.withinSel;
    var projectWide = !!payload.projectWide;
    var excludeStr  = payload.exclude || "";
    var dims        = payload.dims || {};

    var comp = app.project.activeItem;
    if (!projectWide && (!comp || !(comp instanceof CompItem))) {
        return "ERROR: Please open a composition first.";
    }

    var targets = [];

    if (projectWide) {
        if (!app.project) return "ERROR: No project open.";
        for (var pi = 1; pi <= app.project.numItems; pi++) {
            var projItem = app.project.item(pi);
            if (projItem instanceof CompItem) {
                for (var li = 1; li <= projItem.numLayers; li++) {
                    targets.push({ layer: projItem.layer(li), comp: projItem });
                }
            }
        }
    } else {
        for (var qi = 1; qi <= comp.numLayers; qi++) {
            targets.push({ layer: comp.layer(qi), comp: comp });
        }
    }

    if (withinSel) {
        var selLayers = comp.selectedLayers;
        var selSet = {};
        for (var si = 0; si < selLayers.length; si++) selSet[selLayers[si].id] = true;
        var filtered = [];
        for (var fi2 = 0; fi2 < targets.length; fi2++) {
            if (selSet[targets[fi2].layer.id]) filtered.push(targets[fi2]);
        }
        targets = filtered;
    }

    if (targets.length === 0) return "ERROR: No layers to search.";

    app.beginUndoGroup("Hunt Layers");

    if (dimNonMatch) {
        for (var d = 0; d < targets.length; d++) targets[d].layer.opacity.setValue(100);
    }

    var matched     = [];
    var excludedSet = {};
    if (excludeStr.length) {
        for (var ei = 0; ei < targets.length; ei++) {
            if (nameContains(targets[ei].layer.name, excludeStr, true)) {
                excludedSet[targets[ei].layer.id] = true;
            }
        }
    }

    var anyDimActive = dims.label || dims.parent || dims.children || dims.trackMatte || dims.effectRef || dims.comment;

    for (var mi = 0; mi < targets.length; mi++) {
        var layer = targets[mi].layer;
        if (excludedSet[layer.id]) continue;

        var score = 0;

        if (dims.name && searchTerm.length) {
            if (nameContains(layer.name, searchTerm, false)) score++;
        } else if (!anyDimActive && searchTerm.length) {
            if (nameContains(layer.name, searchTerm, false)) score++;
        }
        if (dims.label && dims.labelValue) {
            if (String(layer.label) === String(dims.labelValue)) score++;
        }
        if (dims.parent && dims.parentName && layer.parent) {
            if (nameContains(layer.parent.name, dims.parentName, false)) score++;
        }
        if (dims.children && dims.childName) {
            var hasChild = false;
            if (targets[mi].comp) {
                var childComp = targets[mi].comp;
                for (var ci = 1; ci <= childComp.numLayers; ci++) {
                    var cLayer = childComp.layer(ci);
                    if (cLayer.parent === layer) {
                        if (nameContains(cLayer.name, dims.childName, false)) { hasChild = true; break; }
                    }
                }
            }
            if (hasChild) score++;
        }
        if (dims.trackMatte && dims.matteName && layer.trackMatteLayer) {
            if (nameContains(layer.trackMatteLayer.name, dims.matteName, false)) score++;
        }
        if (dims.effectRef) {
            if (searchTerm.length) {
                try {
                    var effects = layer.property("ADBE Effect Parade");
                    if (effects && effects.numProperties > 0) {
                        for (var ei2 = 1; ei2 <= effects.numProperties; ei2++) {
                            try {
                                if (nameContains(effects.property(ei2).name, searchTerm, false)) {
                                    score++;
                                    break;
                                }
                            } catch(e2) {}
                        }
                    }
                } catch(e1) {}
            }
        }
        if (dims.comment && searchTerm.length) {
            if (layer.comment && nameContains(layer.comment, searchTerm, false)) score++;
        }

        var isMatch = (score > 0) || (!searchTerm && !dims.label && !dims.parent && !dims.children && !dims.trackMatte && !dims.effectRef && !dims.comment);
        if (invert) isMatch = !isMatch;

        if (isMatch) {
            matched.push(layer);
            if (dimNonMatch) layer.opacity.setValue(100);
        } else if (dimNonMatch) {
            layer.opacity.setValue(15);
        }
    }

    if (!projectWide && comp) {
        for (var ci2 = 1; ci2 <= comp.numLayers; ci2++) comp.layer(ci2).selected = false;
        for (var mj = 0; mj < matched.length; mj++) matched[mj].selected = true;
    }

    if (projectWide) {
        var foundComps = {};
        for (var fi3 = 0; fi3 < matched.length; fi3++) {
            foundComps[matched[fi3].containingComp.id] = true;
        }
        for (var id in foundComps) {
            for (var ci3 = 1; ci3 <= app.project.numItems; ci3++) {
                if (String(app.project.item(ci3).id) === id) {
                    app.project.item(ci3).selected = true;
                }
            }
        }
    }

    app.endUndoGroup();

    var patterns = [];
    if (matched.length >= 2) {
        patterns = findCommonSubstrings(matched);
    }

    return JSON.stringify({ "matched": matched.length, "patterns": patterns });
}

// Find common substrings across multiple layer names
function findCommonSubstrings(layers) {
    var names = [];
    for (var n = 0; n < layers.length; n++) {
        names.push(layers[n].name);
    }

    var substrCounts = {};
    var minLen = 2;

    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var len = name.length;

        for (var start = 0; start < len; start++) {
            for (var end = start + minLen; end <= len; end++) {
                var substr = name.substring(start, end);

                var appearsInAll = true;
                for (var j = 0; j < names.length; j++) {
                    if (names[j].indexOf(substr) === -1) {
                        appearsInAll = false;
                        break;
                    }
                }

                if (appearsInAll) {
                    if (!substrCounts[substr]) substrCounts[substr] = 0;
                    substrCounts[substr]++;
                }
            }
        }
    }

    var results = [];
    for (var s in substrCounts) {
        if (substrCounts[s] >= 2) {
            results.push({ "pattern": s, "count": substrCounts[s], "label": '"' + s + '"' });
        }
    }

    results.sort(function(a, b) { return b.pattern.length - a.pattern.length; });

    var finalPatterns = [];
    var usedPatterns = {};

    for (var k = 0; k < results.length; k++) {
        var p = results[k].pattern;
        var isSubstring = false;

        for (var existing in usedPatterns) {
            if (p.indexOf(existing) !== -1) {
                isSubstring = true;
                break;
            }
        }

        if (!isSubstring) {
            usedPatterns[p] = true;
            finalPatterns.push(results[k]);
        }
    }

    return finalPatterns;
}

function huntBulkAction(action) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "ERROR: Please open a composition.";
    var selected = comp.selectedLayers;
    if (!selected.length) return "ERROR: No layers selected.";

    app.beginUndoGroup("Hunt Bulk Action");

    if (action === "solo") {
        for (var i = 0; i < selected.length; i++) selected[i].solo = true;
    } else if (action === "unsolo") {
        for (var j = 0; j < selected.length; j++) selected[j].solo = false;
    } else if (action === "lock") {
        for (var k = 0; k < selected.length; k++) selected[k].locked = true;
    } else if (action === "unlock") {
        for (var l = 0; l < selected.length; l++) selected[l].locked = false;
    } else if (action === "shy") {
        for (var m = 0; m < selected.length; m++) selected[m].shy = true;
    } else if (action === "unshy") {
        for (var n = 0; n < selected.length; n++) selected[n].shy = false;
    }

    app.endUndoGroup();
    return "SUCCESS";
}

// ⚠️ PERF (unmigrated — substring-cross-product cost dominates, not layer
// iteration): the outer layer-name collection loop is trivially cache-able
// via `HLMCache` (read `rec.name` for each id), but the real cost here is
// the inner O(L^2) substring enumeration. Migration pattern: pull `names`
// from HLMCache on the panel side, then do the substring counting entirely
// in JS. Frees a whole evalScript round-trip and keeps the hot loop off the
// ExtendScript interpreter. See Phase 2, Item 4.
// Finds substrings (min 2 chars) that appear in at least 2 layer names.
// Unlike findCommonSubstrings (which is used on already-filtered hunt results and requires
// ALL items to share the substring), this counts occurrences across all names independently.
function getCompPatterns(prefixOnly, showFileTypes) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return '[]';
    if (comp.numLayers < 2) return '[]';

    var KNOWN_EXTENSIONS = {
        '.png':1,'.jpg':1,'.jpeg':1,'.mp4':1,'.mov':1,'.gif':1,'.psd':1,'.ai':1,
        '.tga':1,'.exr':1,'.wav':1,'.mp3':1,'.heic':1,'.svg':1,'.bmp':1,'.tif':1,
        '.tiff':1,'.webm':1,'.avi':1,'.mkv':1,'.flac':1,'.aac':1,'.mxf':1,'.r3d':1,
        '.cin':1,'.dpx':1,'.pic':1,'.sgi':1,'.rla':1,'.rpf':1,'.hdr':1,'.jpeg2000':1,
        '.jp2':1,'.jpc':1,'.j2k':1,'.iff':1,'.pbm':1,'.pgm':1,'.ppm':1,'.pnm':1,
        '.wmv':1,'.asf':1,'.mpg':1,'.mpeg':1,'.mpe':1,'.m4v':1,'.f4v':1,'.3gp':1,
        '.3g2':1,'.m2ts':1,'.mts':1,'.ts':1,'.vob':1,'.divx':1,'.xvid':1,'.ogv':1,
        '.ogg':1,'.opus':1,'.wma':1,'.aif':1,'.aiff':1,'.caf':1,'.ac3':1,'.dts':1,
        '.mid':1,'.midi':1,'.kar':1,'.amr':1,'.ape':1,'.wv':1,'.tak':1,'.tta':1
    };

    var names = [];
    for (var gp_i = 1; gp_i <= comp.numLayers; gp_i++) {
        var rawName = comp.layer(gp_i).name;
        if (prefixOnly) {
            var spIdx = rawName.indexOf(' ');
            if (spIdx === -1) continue;
            rawName = rawName.substring(0, spIdx);
        }
        names.push(rawName);
    }

    // Count how many distinct layer names each substring appears in
    var substrCounts = {};
    var minLen = 2;

    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var seen = {};
        for (var start = 0; start < name.length; start++) {
            for (var end = start + minLen; end <= name.length; end++) {
                var substr = name.substring(start, end);
                if (!seen[substr]) {
                    seen[substr] = true;
                    substrCounts[substr] = (substrCounts[substr] || 0) + 1;
                }
            }
        }
    }

    // Keep substrings appearing in >= 2 names
    var results = [];
    for (var s in substrCounts) {
        if (substrCounts[s] >= 2) {
            results.push({ "pattern": s, "count": substrCounts[s], "label": s });
        }
    }

    // Sort longest first, then deduplicate: drop a pattern only if a longer pattern
    // contains it AND matches >= as many names (shorter pattern is redundant subset)
    results.sort(function(a, b) { return b.pattern.length - a.pattern.length; });
    var finalPatterns = [];
    var usedPatterns = {};
    for (var k = 0; k < results.length; k++) {
        var p = results[k].pattern;
        var dominated = false;
        for (var existing in usedPatterns) {
            if (existing.indexOf(p) !== -1 && substrCounts[p] <= substrCounts[existing]) {
                dominated = true;
                break;
            }
        }
        if (!dominated) {
            usedPatterns[p] = true;
            finalPatterns.push(results[k]);
        }
    }

    // Filter out file type extensions unless showFileTypes is true
    if (!showFileTypes) {
        var filtered = [];
        for (var f = 0; f < finalPatterns.length; f++) {
            var pat = finalPatterns[f].pattern.toLowerCase();
            var isExt = false;
            for (var ext in KNOWN_EXTENSIONS) {
                if (pat.indexOf(ext) !== -1) { isExt = true; break; }
            }
            if (!isExt) filtered.push(finalPatterns[f]);
        }
        finalPatterns = filtered;
    }

    // Cap at 12 patterns to keep SELECTA chips readable
    if (finalPatterns.length > 12) finalPatterns = finalPatterns.slice(0, 12);
    return JSON.stringify(finalPatterns);
}

// Selects all layers in the active comp whose name contains the given term (case-sensitive).
// Used by SELECTA pattern buttons — no full hunt payload needed.
function selectLayersByName(term) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return 'ERROR: No active comp.';
    app.beginUndoGroup('SELECTA: Select by pattern');
    for (var sl_i = 1; sl_i <= comp.numLayers; sl_i++) {
        var sl_layer = comp.layer(sl_i);
        sl_layer.selected = (sl_layer.name.indexOf(term) !== -1);
    }
    app.endUndoGroup();
    return 'SUCCESS';
}

// Selects all direct children of every currently selected layer.
// A layer is a child of layer X if layer.parent === X.
function hlm_selectChildren() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return 'ERROR: No active comp.';
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return 'ERROR: No layers selected.';

    // Build a set of selected layer indices for fast lookup
    var parentIndices = {};
    for (var pi = 0; pi < selected.length; pi++) {
        parentIndices[selected[pi].index] = true;
    }

    app.beginUndoGroup('SELECTA: Select Children');
    var foundAny = false;
    for (var ci = 1; ci <= comp.numLayers; ci++) {
        var layer = comp.layer(ci);
        if (layer.parent && parentIndices[layer.parent.index]) {
            layer.selected = true;
            foundAny = true;
        }
    }
    app.endUndoGroup();
    return foundAny ? 'SUCCESS' : 'NONE: No children found for selected layers.';
}

// Selects all layers that are referenced in expression strings on any selected layer's properties.
// Parses expressions for layer("Name") / thisComp.layer("Name") and layer(N) patterns.
// Collected references are added to the selection (does not deselect current selection).
function hlm_selectExpressionLinks() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return 'ERROR: No active comp.';
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return 'ERROR: No layers selected.';

    // Build fast-lookup maps: name -> layer, index -> layer
    var layerByName  = {};
    var layerByIndex = {};
    for (var bi = 1; bi <= comp.numLayers; bi++) {
        var bl = comp.layer(bi);
        layerByName[bl.name]  = bl;
        layerByIndex[bl.index] = bl;
    }

    // Regexes for AE expression layer references
    var reByName  = /(?:thisComp\.)?layer\(\s*"([^"]+)"\s*\)/g;
    var reByIndex = /(?:thisComp\.)?layer\(\s*(\d+)\s*\)/g;

    // targetLayers: keyed by layer id to deduplicate, value = the actual layer object
    var targetLayers = {};

    function scanPropertyTree(propGroup) {
        // Walk the property group tree recursively
        try {
            var count = propGroup.numProperties;
            for (var pi = 1; pi <= count; pi++) {
                var prop = null;
                try { prop = propGroup.property(pi); } catch (_) { continue; }
                if (!prop) continue;

                if (prop.propertyType === PropertyType.PROPERTY) {
                    // Leaf property — check expression
                    var expr = "";
                    try { expr = prop.expression || ""; } catch (_) { expr = ""; }
                    if (!expr.length) continue;

                    // Match by name: layer("Name") or thisComp.layer("Name")
                    reByName.lastIndex = 0;
                    var m;
                    while ((m = reByName.exec(expr)) !== null) {
                        var found = layerByName[m[1]];
                        if (found) targetLayers[found.id] = found;
                    }
                    // Match by index: layer(N) or thisComp.layer(N)
                    reByIndex.lastIndex = 0;
                    var m2;
                    while ((m2 = reByIndex.exec(expr)) !== null) {
                        var idx = parseInt(m2[1], 10);
                        var foundByIdx = layerByIndex[idx];
                        if (foundByIdx) targetLayers[foundByIdx.id] = foundByIdx;
                    }
                } else {
                    // Property group — recurse
                    try { scanPropertyTree(prop); } catch (_) {}
                }
            }
        } catch (_) {}
    }

    app.beginUndoGroup('SELECTA: Select Expression Links');
    var foundAny = false;

    for (var si = 0; si < selected.length; si++) {
        try { scanPropertyTree(selected[si]); } catch (_) {}
    }

    // Select all collected target layers (additive — do not deselect current selection)
    for (var tid in targetLayers) {
        try { targetLayers[tid].selected = true; foundAny = true; } catch (_) {}
    }

    app.endUndoGroup();
    return foundAny ? 'SUCCESS' : 'NONE: No expression-linked layers found.';
}

// Selects the parent layer of every currently selected layer (where one exists).
function hlm_selectParent() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return 'ERROR: No active comp.';
    var selected = comp.selectedLayers;
    if (!selected || !selected.length) return 'ERROR: No layers selected.';

    app.beginUndoGroup('SELECTA: Select Parent');
    var foundAny = false;
    // First deselect all so only parents end up selected
    for (var di = 1; di <= comp.numLayers; di++) comp.layer(di).selected = false;

    // Collect unique parent indices
    var parentSet = {};
    for (var si = 0; si < selected.length; si++) {
        if (selected[si].parent) {
            parentSet[selected[si].parent.index] = true;
        }
    }
    for (var idx in parentSet) {
        comp.layer(parseInt(idx, 10)).selected = true;
        foundAny = true;
    }
    app.endUndoGroup();
    return foundAny ? 'SUCCESS' : 'NONE: Selected layers have no parents.';
}

// =======================
// hlm_selectInverseRefs — "Who references THIS layer?"
// =======================
// Inverse of hlm_selectExpressionLinks. Given the currently-selected layer(s)
// in the active comp, find every OTHER layer that references one of them via:
//   (a) expression — any property whose expression contains
//       layer("Name") | thisComp.layer("Name") | layer(N) | thisComp.layer(N)
//       that resolves to a target layer in the same comp.
//   (b) effect layer-picker param — any effect property with
//       propertyValueType === PropertyValueType.LAYER_INDEX whose .value is the
//       target layer's index.
//   (c) track matte — otherLayer.trackMatteLayer === target.
//
// Selection within the active comp is ADDITIVE (mirrors EXPR LINKS semantics).
// projectWide is deferred this iteration: cross-comp scan is supported if
// optionsJson.projectWide === true, but referrers in other comps are included
// in the returned JSON report only (active comp is not switched, cross-comp
// selection is not mutated — documented choice, see subagent E report).
//
// Input: optional b64(JSON) options: { projectWide?: bool, additive?: bool }
// Returns JSON:
//   { ok:true, count:N, selected:[
//       {compId, compName, layerIndex, layerName,
//        viaExpression, viaEffect, viaTrackMatte} ... ] }
// On error: 'ERROR: ...' plain string (consistent with sibling functions).
function hlm_selectInverseRefs(optionsB64) {
    var activeComp = app.project.activeItem;
    if (!activeComp || !(activeComp instanceof CompItem)) return 'ERROR: No active comp.';
    var targets = activeComp.selectedLayers;
    if (!targets || !targets.length) return 'ERROR: No layers selected.';

    // ---- Options --------------------------------------------------------
    var projectWide = false;
    var additive = true; // mirror EXPR LINKS: additive by default
    if (optionsB64 && String(optionsB64).length) {
        try {
            var rawJson = decodeURIComponent(escape(Base64.decode(String(optionsB64))));
            var opts = JSON.parse(rawJson);
            if (opts) {
                if (opts.projectWide === true) projectWide = true;
                if (opts.additive === false) additive = false;
            }
        } catch (_optErr) { /* ignore — use defaults */ }
    }

    // ---- Target index (dedup by id, grouped by containing comp) ---------
    var targetById = {}; // id -> layer
    var targetsByCompId = {}; // compId -> [layer]
    for (var ti = 0; ti < targets.length; ti++) {
        var tL = targets[ti];
        targetById[tL.id] = tL;
        var cid = tL.containingComp.id;
        if (!targetsByCompId[cid]) targetsByCompId[cid] = [];
        targetsByCompId[cid].push(tL);
    }

    // ---- Regex escape for layer names used in expression patterns -------
    var escapeRegex = function (s) {
        // Reserved regex metacharacters — escape for literal match inside RegExp.
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // ---- Property-tree walker (adapted from Holy Expressor traverseNode)
    // Depth-first. On every leaf with canSetExpression, run exprCallback(prop).
    // On every leaf with propertyValueType === PropertyValueType.LAYER_INDEX,
    // run effectCallback(prop). Returning truthy from either callback short-
    // circuits the whole walk (abort via throw caught by outer try).
    var _abortWalk = {};
    var walkProps = function (node, exprCallback, effectCallback) {
        if (!node) return;
        // Leaf checks ---------------------------------------------------
        try {
            if (node.canSetExpression === true) {
                if (exprCallback && exprCallback(node)) throw _abortWalk;
            }
        } catch (eE) { if (eE === _abortWalk) throw eE; }
        try {
            // PropertyValueType.LAYER_INDEX identifies layer-picker params on
            // effects (Set Matte, Displacement Map, etc.). Guard typeof because
            // PropertyValueType may not be defined in every host.
            if (typeof PropertyValueType !== 'undefined'
                && node.propertyValueType === PropertyValueType.LAYER_INDEX) {
                if (effectCallback && effectCallback(node)) throw _abortWalk;
            }
        } catch (eL) { if (eL === _abortWalk) throw eL; }
        // Recurse -------------------------------------------------------
        var childCount = 0;
        try { childCount = node.numProperties || 0; } catch (_) { childCount = 0; }
        if (!childCount) return;
        for (var ci = 1; ci <= childCount; ci++) {
            var child = null;
            try { child = node.property(ci); } catch (_c) { child = null; }
            if (child) walkProps(child, exprCallback, effectCallback);
        }
    };

    // ---- Results --------------------------------------------------------
    // Keyed by layer id → { layer, viaExpression, viaEffect, viaTrackMatte }
    var referrers = {};

    var recordReferrer = function (layer, flag) {
        var id = layer.id;
        if (!referrers[id]) {
            referrers[id] = {
                "layer": layer,
                "viaExpression": false,
                "viaEffect": false,
                "viaTrackMatte": false
            };
        }
        referrers[id][flag] = true;
    };

    // ---- Scan a single comp against its local targets -------------------
    var scanComp = function (comp, localTargets) {
        if (!comp || !(comp instanceof CompItem)) return;
        if (!localTargets || !localTargets.length) return;

        // Per-target lookups used by all three detection modes.
        var nameRegexes = []; // [{target, reName}]
        var indexMap    = {}; // layerIndex -> target layer (same comp)
        var targetSet   = {}; // id -> layer (fast membership)
        for (var lti = 0; lti < localTargets.length; lti++) {
            var Lt = localTargets[lti];
            targetSet[Lt.id] = Lt;
            indexMap[Lt.index] = Lt;
            var namePat = escapeRegex(Lt.name);
            // Match:  layer("Name")   or   thisComp.layer("Name")
            nameRegexes.push({
                "target": Lt,
                "re": new RegExp('(?:thisComp\\.)?layer\\(\\s*"' + namePat + '"\\s*\\)')
            });
        }
        // Match:  layer(N) or thisComp.layer(N) — numeric index form
        var reByIndex = /(?:thisComp\.)?layer\(\s*(\d+)\s*\)/g;

        for (var li = 1; li <= comp.numLayers; li++) {
            var L = null;
            try { L = comp.layer(li); } catch (_lErr) { L = null; }
            if (!L) continue;
            // Skip self — targets never referrers to themselves.
            if (targetSet[L.id]) continue;

            // (c) Track-matte reference ---------------------------------
            try {
                if (L.trackMatteLayer && targetSet[L.trackMatteLayer.id]) {
                    recordReferrer(L, "viaTrackMatte");
                }
            } catch (_tmErr) {}

            // (a) + (b) — property-tree walk. Use per-layer flags so we can
            // abort the walk once both expression + effect hits are recorded
            // for this layer (no need to keep scanning).
            var hitExpr = false;
            var hitEff  = false;

            var exprCb = function (prop) {
                var expr = "";
                try { expr = prop.expression || ""; } catch (_eE) { expr = ""; }
                if (!expr.length) return false;
                // Name-form checks
                for (var nri = 0; nri < nameRegexes.length; nri++) {
                    if (nameRegexes[nri].re.test(expr)) {
                        recordReferrer(L, "viaExpression");
                        hitExpr = true;
                        break;
                    }
                }
                if (!hitExpr) {
                    // Index-form checks
                    reByIndex.lastIndex = 0;
                    var mi;
                    while ((mi = reByIndex.exec(expr)) !== null) {
                        var idxN = parseInt(mi[1], 10);
                        if (indexMap[idxN]) {
                            recordReferrer(L, "viaExpression");
                            hitExpr = true;
                            break;
                        }
                    }
                }
                return hitExpr && hitEff; // abort only when both satisfied
            };

            var effCb = function (prop) {
                var valIdx = -1;
                try { valIdx = prop.value; } catch (_vE) { valIdx = -1; }
                if (typeof valIdx === 'number' && indexMap[valIdx]) {
                    recordReferrer(L, "viaEffect");
                    hitEff = true;
                }
                return hitExpr && hitEff;
            };

            try { walkProps(L, exprCb, effCb); }
            catch (eW) { if (eW !== _abortWalk) { /* swallow */ } }
        }
    };

    // ---- Execute scan: active comp always; other comps if projectWide --
    app.beginUndoGroup('SELECTA: Select Inverse Refs');

    // Active comp scan — uses only the targets in this comp.
    var activeTargets = targetsByCompId[activeComp.id] || [];
    scanComp(activeComp, activeTargets);

    if (projectWide) {
        // Cross-comp: for each OTHER comp in the project, scan using whatever
        // targets live in THAT comp (mostly empty unless selection spans
        // comps, but still honour the semantics). We deliberately do NOT
        // select cross-comp referrers — active comp selection only. See
        // report JSON for the full projectWide roster.
        var proj = app.project;
        for (var pi = 1; pi <= proj.numItems; pi++) {
            var itm = null;
            try { itm = proj.item(pi); } catch (_pI) { itm = null; }
            if (!itm || !(itm instanceof CompItem)) continue;
            if (itm.id === activeComp.id) continue;
            var localT = targetsByCompId[itm.id] || [];
            if (!localT.length) continue;
            scanComp(itm, localT);
        }
    }

    // ---- Apply selection (active comp only) -----------------------------
    if (!additive) {
        var cur = activeComp.selectedLayers;
        for (var cs = 0; cs < cur.length; cs++) {
            try { cur[cs].selected = false; } catch (_cE) {}
        }
    }
    for (var rid in referrers) {
        if (!referrers.hasOwnProperty(rid)) continue;
        var rec = referrers[rid];
        try {
            if (rec.layer.containingComp && rec.layer.containingComp.id === activeComp.id) {
                rec.layer.selected = true;
            }
        } catch (_sE) {}
    }

    app.endUndoGroup();

    // ---- Build hand-rolled JSON report ----------------------------------
    var jsonEscape = function (s) {
        s = String(s);
        var out = '';
        for (var ci = 0; ci < s.length; ci++) {
            var ch = s.charAt(ci);
            var code = s.charCodeAt(ci);
            if (ch === '\\') out += '\\\\';
            else if (ch === '"') out += '\\"';
            else if (ch === '\n') out += '\\n';
            else if (ch === '\r') out += '\\r';
            else if (ch === '\t') out += '\\t';
            else if (code < 32) {
                var hex = code.toString(16);
                while (hex.length < 4) hex = '0' + hex;
                out += '\\u' + hex;
            } else out += ch;
        }
        return out;
    };

    var items = [];
    for (var rid2 in referrers) {
        if (!referrers.hasOwnProperty(rid2)) continue;
        var rec2 = referrers[rid2];
        var cmp = rec2.layer.containingComp;
        var piece = '{"compId":' + (cmp ? cmp.id : 0)
                  + ',"compName":"' + jsonEscape(cmp ? cmp.name : '') + '"'
                  + ',"layerIndex":' + rec2.layer.index
                  + ',"layerName":"' + jsonEscape(rec2.layer.name) + '"'
                  + ',"viaExpression":' + (rec2.viaExpression ? 'true' : 'false')
                  + ',"viaEffect":' + (rec2.viaEffect ? 'true' : 'false')
                  + ',"viaTrackMatte":' + (rec2.viaTrackMatte ? 'true' : 'false')
                  + '}';
        items.push(piece);
    }

    return '{"ok":true,"count":' + items.length
         + ',"projectWide":' + (projectWide ? 'true' : 'false')
         + ',"selected":[' + items.join(',') + ']}';
}

(function () {
    function _dispatchContext() {
        // Force AE to sync app.project.activeItem with the viewer before reading.
        // afterActiveItemChanged fires BEFORE activeItem updates — setActive() ensures
        // the activeItem pointer settles to the correct comp.
        if (app.activeViewer) app.activeViewer.setActive();
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
