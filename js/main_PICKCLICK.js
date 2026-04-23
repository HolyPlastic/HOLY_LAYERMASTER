// ==========================================================
// PickClick Frontend Module — Holy Layer Master
// Ported from Holy Expressor main_PICKCLICK.js.
// LM-specific: resolves to layer NAME populated into Hunt tab
// dimension inputs (Parent / Children / Track Matte).
// Namespace: Holy.LayerMaster.PickClick
// Events: com.holy.layermaster.pickclick.*
// ==========================================================

if (typeof Holy !== "object") Holy = {};
if (typeof Holy.LayerMaster !== "object") Holy.LayerMaster = {};

(function () {
  "use strict";

  // csInterface is declared in main.js — shared global (module loads after main.js)
  var cs = (typeof csInterface !== "undefined") ? csInterface : new CSInterface();

  // ----------------------------------------------------------
  // Trace listener (host -> CEP diagnostics)
  // ----------------------------------------------------------
  cs.addEventListener(
    "com.holy.layermaster.pickclick.trace",
    function (event) {
      var data = null;
      try {
        if (event && typeof event.data === "object") {
          data = event.data;
        } else if (event && typeof event.data === "string" && event.data.length) {
          data = JSON.parse(event.data);
        }
      } catch (_) {
        data = null;
      }
      console.log("[HLM.PICKCLICK][trace]", data || (event ? event.data : null));
    }
  );

  var EVENT_RESOLVE = "com.holy.layermaster.pickclick.resolve";
  var EVENT_CANCEL  = "com.holy.layermaster.pickclick.cancel";

  var active          = false;
  var sessionId       = "";
  var resolveHandler  = null;
  var cancelHandler   = null;
  var resolveListener = null;
  var cancelListener  = null;
  var veilEl          = null;
  var veilListenerBound = false;
  var safetyTimer     = null;
  var SAFETY_TIMEOUT_MS = 10000; // 10-second safety cancel (pick-click audit 2026-04-13)

  function getVeilEl() {
    if (!veilEl) veilEl = document.getElementById("hlmPickClickVeil");
    return veilEl;
  }

  function setVeilActive(isActive) {
    var el = getVeilEl();
    if (!el) return;
    el.classList.toggle("is-active", !!isActive);
  }

  function ensureVeilListener() {
    if (veilListenerBound) return;
    var el = getVeilEl();
    if (!el) return;

    el.addEventListener("click", function () {
      if (!active) return;
      cancelPickClick("veil");
    });

    veilListenerBound = true;
  }

  function escapeForEvalScript(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, "\\\"")
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, "\\n");
  }

  function parseEventData(event) {
    if (!event || typeof event.data === "undefined") return null;
    if (typeof event.data === "object") return event.data;
    if (typeof event.data === "string" && event.data.length) {
      try { return JSON.parse(event.data); } catch (err) { return null; }
    }
    return null;
  }

  function removeListeners() {
    if (cs && typeof cs.removeEventListener === "function") {
      if (resolveListener) cs.removeEventListener(EVENT_RESOLVE, resolveListener);
      if (cancelListener)  cs.removeEventListener(EVENT_CANCEL,  cancelListener);
    }
    resolveListener = null;
    cancelListener  = null;
  }

  function clearSafetyTimer() {
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  }

  function resetState() {
    active         = false;
    sessionId      = "";
    resolveHandler = null;
    cancelHandler  = null;
    setVeilActive(false);
    removeListeners();
    clearSafetyTimer();
    // Reset all pick buttons back to idle state
    _setAllPickButtonsArmed(false);
  }

  // ----------------------------------------------------------
  // Pick button visual state helpers
  // ----------------------------------------------------------
  var PICK_BTN_IDS = ["hlmPickParentBtn", "hlmPickChildrenBtn", "hlmPickMatteBtn"];

  function _setAllPickButtonsArmed(isArmed) {
    for (var i = 0; i < PICK_BTN_IDS.length; i++) {
      var btn = document.getElementById(PICK_BTN_IDS[i]);
      if (btn) btn.classList.toggle("is-armed", !!isArmed);
    }
  }

  function _setPickButtonArmed(btnId, isArmed) {
    var btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle("is-armed", !!isArmed);
  }

  // ----------------------------------------------------------
  // cancelPickClick
  // ----------------------------------------------------------
  function cancelPickClick(reason) {
    if (!active) return;

    var payload = { sessionId: sessionId, reason: reason || "cancelled" };
    var handler = cancelHandler;
    resetState();

    if (cs && typeof cs.evalScript === "function") {
      var encoded = escapeForEvalScript(JSON.stringify(payload));
      cs.evalScript('hlm_PC_cancelPickClick("' + encoded + '")', function (res) {
        console.log("[HLM.PICKCLICK] cancel result:", res);
      });
    }

    if (typeof handler === "function") {
      try { handler(payload); } catch (err) { console.warn("[HLM.PICKCLICK] cancel handler error:", err); }
    }
  }

  // ----------------------------------------------------------
  // armPickClick
  // options: { intent, onResolve, onCancel, btnId }
  //   intent:    "parent" | "children" | "trackMatte"
  //   onResolve: function(payload) — payload.layerName
  //   onCancel:  function(payload)
  //   btnId:     id of the trigger button (to arm its visual state)
  // ----------------------------------------------------------
  function armPickClick(options) {
    if (!options) options = {};

    if (active) {
      cancelPickClick("replaced");
    }

    sessionId      = "pc-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
    resolveHandler = options.onResolve || null;
    cancelHandler  = options.onCancel  || null;

    ensureVeilListener();
    setVeilActive(true);
    if (options.btnId) _setPickButtonArmed(options.btnId, true);

    // Safety timeout — cancel after 10 s if user does nothing
    // Complements backend MAX_POLL_TICKS cap in host_PICKCLICK.jsx: frontend timeout
    // catches cases where the backend hangs or CSXS events don't deliver.
    safetyTimer = setTimeout(function () {
      cancelPickClick("timeout");
    }, SAFETY_TIMEOUT_MS);

    resolveListener = function (event) {
      var payload = parseEventData(event);
      if (!payload || payload.sessionId !== sessionId) return;

      var handler = resolveHandler;
      var intent  = payload.intent || "";
      clearSafetyTimer();
      resetState();

      if (typeof handler === "function") {
        try { handler(payload); } catch (err) { console.warn("[HLM.PICKCLICK] resolve handler error:", err); }
      }
    };

    cancelListener = function (event) {
      var payload = parseEventData(event) || {};
      if (payload.sessionId && payload.sessionId !== sessionId) return;

      var handler = cancelHandler;
      clearSafetyTimer();
      resetState();

      if (typeof handler === "function") {
        try { handler(payload); } catch (err) { console.warn("[HLM.PICKCLICK] cancel handler error:", err); }
      }
    };

    if (cs && typeof cs.addEventListener === "function") {
      cs.addEventListener(EVENT_RESOLVE, resolveListener);
      cs.addEventListener(EVENT_CANCEL,  cancelListener);
    }

    if (cs && typeof cs.evalScript === "function") {
      var armPayload = { sessionId: sessionId, intent: options.intent || "" };
      var encodedPayload = escapeForEvalScript(JSON.stringify(armPayload));
      cs.evalScript('hlm_PC_armPickClick("' + encodedPayload + '")', function (res) {
        console.log("[HLM.PICKCLICK] arm result:", res);
      });
    }

    active = true;
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------
  Holy.LayerMaster.PickClick = {
    arm:    armPickClick,
    cancel: cancelPickClick
  };

})();
