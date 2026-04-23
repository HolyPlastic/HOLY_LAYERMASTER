// ==========================================================
// PickClick Host Controller — Holy Layer Master port
// Ported from Holy Expressor host_PICKCLICK.jsx.
// LM-specific simplification: resolves to layer NAME only
// (not property path). No he_GET_SelPath_Simple dependency.
// ==========================================================

// ----------------------------------------------------------
// JSX load confirmation (non-blocking)
// ----------------------------------------------------------
try {
  $.writeln("[JSX LOG] host_PICKCLICK.jsx (LM) Loaded \u2714");
} catch (_) {}

// ----------------------------------------------------------
// Constants
// ----------------------------------------------------------
var HLM_PICKCLICK_EVENT_RESOLVE = "com.holy.layermaster.pickclick.resolve";
var HLM_PICKCLICK_EVENT_CANCEL  = "com.holy.layermaster.pickclick.cancel";
var HLM_PICKCLICK_EVENT_TRACE   = "com.holy.layermaster.pickclick.trace";
var HLM_PICKCLICK_POLL_DELAY    = 250;
// Max-tick cap — complements frontend 10s setTimeout in main_PICKCLICK.js.
// 40 ticks * 250ms = 10s. Catches cases where the CEP listener is silent or
// the app loses focus, so polling can't loop indefinitely on its own.
var HLM_PICKCLICK_MAX_POLL_TICKS = 40;

// ----------------------------------------------------------
// PlugPlug bootstrap (required for CSXSEvent dispatch)
// ----------------------------------------------------------
var hlm_PC__plugPlugLoaded = false;

function hlm_PC_ensurePlugPlug() {
  if (hlm_PC__plugPlugLoaded) return true;

  try {
    if (typeof CSXSEvent !== "undefined") {
      hlm_PC__plugPlugLoaded = true;
      return true;
    }
  } catch (_) {}

  try {
    if (typeof ExternalObject !== "undefined") {
      new ExternalObject("lib:PlugPlugExternalObject");
      hlm_PC__plugPlugLoaded = (typeof CSXSEvent !== "undefined");
      return hlm_PC__plugPlugLoaded;
    }
  } catch (e) {
    hlm_PC_trace("PlugPlug load failed: " + e);
  }

  return false;
}

// ----------------------------------------------------------
// Internal state
// ----------------------------------------------------------
var hlm_PC_state = {
  active:          false,
  sessionId:       "",
  baselineLayerSig: "",   // layer-level coarse signature
  taskId:          null,
  pollTicks:       0      // tick counter for HLM_PICKCLICK_MAX_POLL_TICKS guard
};

// ----------------------------------------------------------
// Trace helper — fires CEP trace event for diagnostics
// ----------------------------------------------------------
function hlm_PC_trace(msg, data) {
  if (!hlm_PC_ensurePlugPlug()) return;

  try {
    var evt = new CSXSEvent();
    evt.type = HLM_PICKCLICK_EVENT_TRACE;
    evt.data = JSON.stringify({
      msg:       msg,
      data:      data || null,
      sessionId: hlm_PC_state.sessionId || null,
      active:    hlm_PC_state.active
    });
    evt.dispatch();
  } catch (_) {}
}

// ----------------------------------------------------------
// Coarse selection signature (cheap, for change detection)
// Returns a string fingerprint of current layer selection.
// Changes whenever the user clicks a different layer in the timeline.
// ----------------------------------------------------------
function hlm_PC_getLayerSignature() {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "NO_COMP";

    var layers = null;
    try { layers = comp.selectedLayers; } catch (_) { layers = null; }
    var count = (layers && layers.length) ? layers.length : 0;

    if (count === 0) return "L0";

    // Fingerprint: count + first layer name + last layer name (cheap)
    var first = "";
    var last  = "";
    try { first = layers[0].name + ":" + layers[0].id; } catch (_) {}
    try { last  = layers[count - 1].name + ":" + layers[count - 1].id; } catch (_) {}

    return "L" + count + "|" + first + "|" + last;
  } catch (_) {
    return "SIG_ERR";
  }
}

// ----------------------------------------------------------
// Event dispatch
// ----------------------------------------------------------
function hlm_PC_dispatch(type, payload) {
  if (!hlm_PC_ensurePlugPlug()) return false;
  if (typeof CSXSEvent === "undefined") return false;

  try {
    var evt = new CSXSEvent();
    evt.type = type;
    evt.data = JSON.stringify(payload || {});
    evt.dispatch();
    return true;
  } catch (e) {
    hlm_PC_trace("dispatch failed: " + String(e));
    return false;
  }
}

// ----------------------------------------------------------
// Poll scheduling
// ----------------------------------------------------------
function hlm_PC_scheduleNext() {
  if (!hlm_PC_state.active) return;

  if (hlm_PC_state.taskId) {
    try { app.cancelTask(hlm_PC_state.taskId); } catch (_) {}
  }

  hlm_PC_state.taskId = app.scheduleTask(
    "$.global.hlm_PC_poll()",
    HLM_PICKCLICK_POLL_DELAY,
    false
  );
}

// ----------------------------------------------------------
// Poll loop
// Resolves when a DIFFERENT layer is selected relative to baseline.
// For LM the resolution payload is simply { layerName, layerId }.
// ----------------------------------------------------------
function hlm_PC_poll() {
  if (!hlm_PC_state.active) return;

  // Max-tick cap — complements frontend 10s setTimeout. If the CEP listener
  // is silent or the app loses focus, the frontend may not deliver cancel;
  // this guard stops the schedule chain on the backend side.
  hlm_PC_state.pollTicks = (hlm_PC_state.pollTicks || 0) + 1;
  if (hlm_PC_state.pollTicks >= HLM_PICKCLICK_MAX_POLL_TICKS) {
    hlm_PC_trace("backend-timeout: MAX_POLL_TICKS reached", {
      ticks: hlm_PC_state.pollTicks,
      cap:   HLM_PICKCLICK_MAX_POLL_TICKS
    });

    var timeoutSession = hlm_PC_state.sessionId;

    hlm_PC_state.active           = false;
    hlm_PC_state.sessionId        = "";
    hlm_PC_state.baselineLayerSig = "";
    hlm_PC_state.taskId           = null;
    hlm_PC_state.intent           = "";
    hlm_PC_state.pollTicks        = 0;

    hlm_PC_dispatch(HLM_PICKCLICK_EVENT_CANCEL, {
      sessionId: timeoutSession,
      reason:    "backend-timeout"
    });
    // Do NOT call scheduleNext — chain stops here.
    return;
  }

  var sig = hlm_PC_getLayerSignature();

  // Only resolve when signature has actually changed from baseline
  if (sig !== hlm_PC_state.baselineLayerSig && sig !== "NO_COMP" && sig !== "L0" && sig !== "SIG_ERR") {
    hlm_PC_trace("layer selection changed — resolving", { from: hlm_PC_state.baselineLayerSig, to: sig });

    // Capture layer name for CEP
    var layerName = "";
    var layerId   = -1;
    try {
      var comp = app.project.activeItem;
      if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        layerName = comp.selectedLayers[0].name;
        layerId   = comp.selectedLayers[0].id;
      }
    } catch (_) {}

    var session = hlm_PC_state.sessionId;
    var intent  = hlm_PC_state.intent || "";

    hlm_PC_state.active          = false;
    hlm_PC_state.sessionId       = "";
    hlm_PC_state.baselineLayerSig = "";
    hlm_PC_state.taskId          = null;
    hlm_PC_state.intent          = "";
    hlm_PC_state.pollTicks       = 0;

    hlm_PC_dispatch(HLM_PICKCLICK_EVENT_RESOLVE, {
      sessionId: session,
      intent:    intent,
      layerName: layerName,
      layerId:   layerId
    });
    return;
  }

  hlm_PC_scheduleNext();
}

// Expose poll for scheduler
$.global.hlm_PC_poll = hlm_PC_poll;

// ----------------------------------------------------------
// Arm
// ----------------------------------------------------------
function hlm_PC_armPickClick(jsonStr) {
  hlm_PC_trace("arm called", jsonStr);

  var data = {};
  try {
    if (jsonStr && jsonStr.length) data = JSON.parse(jsonStr);
  } catch (_) {}

  if (hlm_PC_state.active) {
    hlm_PC_trace("arm replacing existing session");
    hlm_PC_cancelPickClick(
      JSON.stringify({ reason: "replaced", sessionId: hlm_PC_state.sessionId })
    );
  }

  var sessionId = data.sessionId || ("pc-" + (new Date()).getTime());
  var intent    = data.intent || "";

  hlm_PC_state.active           = true;
  hlm_PC_state.sessionId        = sessionId;
  hlm_PC_state.intent           = intent;
  hlm_PC_state.baselineLayerSig = hlm_PC_getLayerSignature();
  hlm_PC_state.taskId           = null;
  hlm_PC_state.pollTicks        = 0;

  hlm_PC_trace("arm complete", {
    sessionId: sessionId,
    intent:    intent,
    baseline:  hlm_PC_state.baselineLayerSig
  });

  hlm_PC_scheduleNext();

  return JSON.stringify({ ok: true, sessionId: sessionId });
}

// ----------------------------------------------------------
// Cancel
// ----------------------------------------------------------
function hlm_PC_cancelPickClick(jsonStr) {
  hlm_PC_trace("cancel called", jsonStr);

  var data = {};
  try {
    if (jsonStr && jsonStr.length) data = JSON.parse(jsonStr);
  } catch (_) {}

  var sessionId = data.sessionId || hlm_PC_state.sessionId;
  var reason    = data.reason || "cancelled";

  if (hlm_PC_state.taskId) {
    try { app.cancelTask(hlm_PC_state.taskId); } catch (_) {}
  }

  if (hlm_PC_state.active) {
    hlm_PC_state.active           = false;
    hlm_PC_state.sessionId        = "";
    hlm_PC_state.baselineLayerSig = "";
    hlm_PC_state.taskId           = null;
    hlm_PC_state.intent           = "";
    hlm_PC_state.pollTicks        = 0;

    hlm_PC_dispatch(HLM_PICKCLICK_EVENT_CANCEL, {
      sessionId: sessionId,
      reason:    reason
    });
  }

  return JSON.stringify({ ok: true, sessionId: sessionId });
}
