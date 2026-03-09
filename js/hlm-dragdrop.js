/**
 * HLMDragDrop — Portable drag-and-drop reordering module for CEP panels
 * ─────────────────────────────────────────────────────────────────────
 * Supports two reordering modes:
 *   • Section reordering — drag a section header to reorder top-level sections
 *   • Row reordering     — drag a specific handle element to reorder rows within a container
 *
 * Built on the HTML5 Drag-and-Drop API (native to CEP/Chromium, no libraries needed).
 * Completely self-contained: injects its own indicator CSS, manages its own state.
 *
 * ── USAGE ────────────────────────────────────────────────────────────
 *
 *   HLMDragDrop.init({
 *       // Required
 *       sectionsContainerId : 'sectionsContainer',
 *       sectionIdAttr       : 'data-section-id',
 *       getOrder            : () => currentConfig.sectionOrder,
 *       onSectionDrop       : (newOrder) => { currentConfig.sectionOrder = newOrder; saveConfig(); },
 *
 *       // Optional — bank/row containers
 *       rowContainers : [
 *           { containerId: 'kfBanksContainer',  type: 'kf'  },
 *           { containerId: 'layBanksContainer', type: 'lay' },
 *       ],
 *       onRowDrop : (type, fromIdx, insertAt) => {
 *           // insertAt is already adjusted for the splice shift — just do:
 *           const arr = type === 'kf' ? config.kfBanks : config.layBanks;
 *           arr.splice(insertAt, 0, arr.splice(fromIdx, 1)[0]);
 *           saveConfig();
 *           renderAll();
 *       },
 *
 *       // Optional — CSS selectors (these are the defaults)
 *       sectionHeaderSelector : '.section-header',   // drag handle for sections
 *       rowSelector           : '.row',               // each draggable row
 *       rowDragHandle         : '.sel-btn',           // element within row that initiates drag
 *
 *       // Optional — CSS class names applied during drag (must exist in your stylesheet)
 *       sectionDraggingClass  : 'section-dragging',
 *       rowDraggingClass      : 'bank-dragging',
 *
 *       // Optional — accent color for the drop indicator line (CSS var or hex)
 *       indicatorColor        : 'var(--accent)',
 *   });
 *
 *   // Call this on boot and whenever a saved order is loaded from config:
 *   HLMDragDrop.applyOrder(['id1', 'id2', 'id3', 'id4']);
 *
 * ── REQUIRED STYLESHEET RULES ────────────────────────────────────────
 *   The module injects its own indicator element CSS.
 *   You still need these rules in your stylesheet for cursor + fade feedback:
 *
 *   .section-header[draggable="true"]        { cursor: grab; }
 *   .section-header[draggable="true"]:active { cursor: grabbing; }
 *   .section-star                            { cursor: pointer; }   (overrides grab on star)
 *   .section-dragging                        { opacity: 0.4; transition: opacity 0.15s ease-in-out; }
 *   .sel-btn                                 { cursor: grab; }
 *   .sel-btn:active                          { cursor: grabbing; }
 *   .bank-dragging                           { opacity: 0.4; transition: opacity 0.15s ease-in-out; }
 *
 * ─────────────────────────────────────────────────────────────────────
 */

/* global HLMDragDrop */
const HLMDragDrop = (function () {

    // ── Private state ────────────────────────────────────────────────
    let _o  = {};   // options, set by init()
    let _drag = { type: null, rowType: null, fromIdx: null, overIdx: null };
    let _indicator = null;

    // ── CSS injection ────────────────────────────────────────────────
    // Injects the drop-indicator styles once so the module is stylesheet-free.
    function _injectCSS() {
        if (document.getElementById('hlm-dragdrop-style')) return;
        const color = _o.indicatorColor || 'var(--accent, #ff7c44)';
        const style = document.createElement('style');
        style.id = 'hlm-dragdrop-style';
        style.textContent = [
            '.hlm-drop-indicator{',
                'position:fixed;height:2px;pointer-events:none;z-index:9999;display:none;',
                'background:' + color + ';border-radius:1px;',
            '}',
            '.hlm-drop-indicator::before,.hlm-drop-indicator::after{',
                'content:"";position:absolute;top:50%;',
                'width:5px;height:5px;border-radius:50%;transform:translateY(-50%);',
                'background:' + color + ';',
            '}',
            '.hlm-drop-indicator::before{left:-1px;}',
            '.hlm-drop-indicator::after{right:-1px;}',
        ].join('');
        document.head.appendChild(style);
    }

    // ── Drop indicator ───────────────────────────────────────────────
    function _createIndicator() {
        if (_indicator) return;
        const el = document.createElement('div');
        el.className = 'hlm-drop-indicator';
        document.body.appendChild(el);
        _indicator = el;
    }

    function _showIndicator(rect, insertBefore) {
        if (!_indicator) return;
        _indicator.style.display = 'block';
        _indicator.style.top     = (insertBefore ? rect.top - 1 : rect.bottom - 1) + 'px';
        _indicator.style.left    = rect.left  + 'px';
        _indicator.style.width   = rect.width + 'px';
    }

    function _hideIndicator() {
        if (_indicator) _indicator.style.display = 'none';
        _drag.overIdx = null;
    }

    // ── Ghost image ──────────────────────────────────────────────────
    // Clone the element off-screen, hand it to setDragImage, then remove it.
    // The browser captures it as a bitmap immediately so the timeout removal is safe.
    function _ghost(el, offsetX, offsetY, dataTransfer) {
        const g = el.cloneNode(true);
        g.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
            + 'opacity:0.55;pointer-events:none;overflow:hidden;'
            + 'width:' + el.offsetWidth + 'px;';
        document.body.appendChild(g);
        dataTransfer.setDragImage(g, offsetX, offsetY);
        dataTransfer.setData('text/plain', '');   // required for DnD to proceed in CEP/Chromium
        dataTransfer.effectAllowed = 'move';
        setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 0);
    }

    // ── Index math ───────────────────────────────────────────────────
    // After splicing fromIdx out, all indices >= fromIdx shift down by 1.
    // This computes the correct insertion index in the post-removal array.
    function _calcInsertAt(fromIdx, targetIdx, insertBefore) {
        const adj = targetIdx > fromIdx ? targetIdx - 1 : targetIdx;
        return insertBefore ? adj : adj + 1;
    }

    // ── Internal DOM reorder ─────────────────────────────────────────
    function _applyOrderToDOM(container, order) {
        const attr = _o.sectionIdAttr;
        order.forEach(function (id) {
            const wrap = container.querySelector('[' + attr + '="' + id + '"]');
            if (wrap) container.appendChild(wrap);
        });
    }

 // ── Section drag ─────────────────────────────────────────────────
    function _initSectionDrag() {
        const container = document.getElementById(_o.sectionsContainerId);
        if (!container) return;

        const wrapSel      = '[' + _o.sectionIdAttr + ']';
        const headerSel    = _o.sectionHeaderSelector || '.section-header';
        const draggingCls  = _o.sectionDraggingClass  || 'section-dragging';

        // Eagerly stamp draggable="true" on section headers
        function _tagSectionHeaders() {
            container.querySelectorAll(headerSel).forEach(function (h) {
                h.setAttribute('draggable', 'true');
                
                // Explicitly disable dragging on the star to prevent browser UX glitches
                // when clicking inside a draggable parent container.
                const star = h.querySelector('.section-star');
                if (star) star.setAttribute('draggable', 'false');
            });
        }
        
        // Tag initially and observe for newly added sections
        _tagSectionHeaders();
        new MutationObserver(_tagSectionHeaders).observe(container, { childList: true });

        container.addEventListener('dragstart', function (e) {
            // Prevent dragging if the user is interacting with the section star
            if (e.target.closest('.section-star')) {
                e.preventDefault();
                return;
            }

            const header = e.target.closest(headerSel);
            if (!header) return;
            const wrap = header.closest(wrapSel);
            if (!wrap) return;

            const order = _o.getOrder();
            _drag.type    = 'section';
            _drag.fromIdx = order.indexOf(wrap.getAttribute(_o.sectionIdAttr));

            _ghost(wrap, Math.round(wrap.offsetWidth / 2), 16, e.dataTransfer);
            wrap.classList.add(draggingCls);
        });

        container.addEventListener('dragover', function (e) {
            if (_drag.type !== 'section') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetWrap = e.target.closest(wrapSel);
            if (!targetWrap) return;

            const order     = _o.getOrder();
            const targetIdx = order.indexOf(targetWrap.getAttribute(_o.sectionIdAttr));
            if (targetIdx === _drag.fromIdx) { _hideIndicator(); return; }

            const rect = targetWrap.getBoundingClientRect();
            _drag.overIdx = targetIdx;
            _showIndicator(rect, e.clientY < rect.top + rect.height / 2);
        });

        container.addEventListener('dragleave', function (e) {
            if (_drag.type !== 'section') return;
            if (!container.contains(e.relatedTarget)) _hideIndicator();
        });

        container.addEventListener('drop', function (e) {
            if (_drag.type !== 'section') return;
            e.preventDefault();
            _hideIndicator();

            const targetWrap = e.target.closest(wrapSel);
            if (!targetWrap) return;

            const order      = _o.getOrder();
            const draggedId  = order[_drag.fromIdx];
            const targetId   = targetWrap.getAttribute(_o.sectionIdAttr);
            if (draggedId === targetId) return;

            const targetIdx    = order.indexOf(targetId);
            const rect         = targetWrap.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + rect.height / 2;

            const newOrder = order.filter(function (id) { return id !== draggedId; });
            newOrder.splice(_calcInsertAt(_drag.fromIdx, targetIdx, insertBefore), 0, draggedId);

            // Reorder the DOM immediately, then let the consumer persist the new order
            _applyOrderToDOM(container, newOrder);
            if (_o.onSectionDrop) _o.onSectionDrop(newOrder);
        });

        container.addEventListener('dragend', function () {
            container.querySelectorAll('.' + draggingCls)
                .forEach(function (w) { w.classList.remove(draggingCls); });
            _hideIndicator();
            _drag.type    = null;
            _drag.fromIdx = null;
            _drag.overIdx = null;
        });
    }

    // ── Row drag ─────────────────────────────────────────────────────
    function _initRowDrag() {
        (_o.rowContainers || []).forEach(function (cfg) {
            const container  = document.getElementById(cfg.containerId);
            if (!container) return;

            const rowType    = cfg.type;
            const rowSel     = _o.rowSelector    || '.row';
            const handleSel  = _o.rowDragHandle  || '.sel-btn';
            const draggingCls = _o.rowDraggingClass || 'bank-dragging';

            // CEP/Chromium decides whether an element is draggable at mousedown time —
            // before any JS event handlers run. Setting draggable="true" dynamically
            // inside a mousedown handler is therefore too late and dragstart never fires.
            // Fix: eagerly stamp draggable="true" on every handle now, and re-stamp
            // whenever renderAll() replaces the container's children.
            function _tagHandles() {
                container.querySelectorAll(handleSel).forEach(function (h) {
                    h.setAttribute('draggable', 'true');
                });
            }
            _tagHandles();
            new MutationObserver(_tagHandles).observe(container, { childList: true });

            container.addEventListener('dragstart', function (e) {
                // Only honour drags that originate from the designated handle element
                if (!e.target.closest(handleSel)) return;
                const row = e.target.closest(rowSel);
                if (!row) return;

                const rows    = Array.from(container.querySelectorAll(rowSel));
                const fromIdx = rows.indexOf(row);
                if (fromIdx < 0) return;

                _drag.type    = 'row';
                _drag.rowType = rowType;
                _drag.fromIdx = fromIdx;

                _ghost(row, 12, 12, e.dataTransfer);
                row.classList.add(draggingCls);
            });

            container.addEventListener('dragover', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const targetRow = e.target.closest(rowSel);
                if (!targetRow) return;

                const rows      = Array.from(container.querySelectorAll(rowSel));
                const targetIdx = rows.indexOf(targetRow);
                if (targetIdx < 0 || targetIdx === _drag.fromIdx) { _hideIndicator(); return; }

                const rect = targetRow.getBoundingClientRect();
                _drag.overIdx = targetIdx;
                _showIndicator(rect, e.clientY < rect.top + rect.height / 2);
            });

            container.addEventListener('dragleave', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                if (!container.contains(e.relatedTarget)) _hideIndicator();
            });

            container.addEventListener('drop', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                e.preventDefault();
                _hideIndicator();

                const targetRow = e.target.closest(rowSel);
                if (!targetRow) return;

                const rows      = Array.from(container.querySelectorAll(rowSel));
                const targetIdx = rows.indexOf(targetRow);
                if (targetIdx < 0 || targetIdx === _drag.fromIdx) return;

                const rect         = targetRow.getBoundingClientRect();
                const insertBefore = e.clientY < rect.top + rect.height / 2;
                const insertAt     = _calcInsertAt(_drag.fromIdx, targetIdx, insertBefore);

                // Consumer handles array mutation and re-render
                if (_o.onRowDrop) _o.onRowDrop(rowType, _drag.fromIdx, insertAt);
            });

            container.addEventListener('dragend', function (e) {
                const row = e.target && e.target.closest ? e.target.closest(rowSel) : null;
                if (row) row.classList.remove(draggingCls);
                _hideIndicator();
                if (_drag.rowType === rowType) {
                    _drag.type    = null;
                    _drag.rowType = null;
                    _drag.fromIdx = null;
                    _drag.overIdx = null;
                }
            });
        });
    }

    // ── Iso bar drag ──────────────────────────────────────────────────────────────────────────
    function _initIsoDrag() {
        const barId   = _o.isoBarId;
        const btnSel  = _o.isoBtnSelector || '.iso-btn';
        if (!barId) return;
        const bar = document.getElementById(barId);
        if (!bar) return;

        if (!document.getElementById('hlm-iso-drag-style')) {
            const s = document.createElement('style');
            s.id = 'hlm-iso-drag-style';
            s.textContent = '.iso-dragging{opacity:0.4;transition:opacity 0.15s ease-in-out;}';
            document.head.appendChild(s);
        }

        let _pendingBtn = null;

        bar.addEventListener('mousedown', function (e) {
            const btn = e.target.closest(btnSel);
            if (btn) { btn.setAttribute('draggable', 'true'); _pendingBtn = btn; }
        });
        bar.addEventListener('mouseup', function () {
            var btn = _pendingBtn;
            if (btn) { setTimeout(function () { btn.removeAttribute('draggable'); }, 50); _pendingBtn = null; }
        });
        bar.addEventListener('dragstart', function (e) {
            const btn = e.target.closest(btnSel);
            if (!btn || btn !== _pendingBtn) return;
            const btns = Array.from(bar.querySelectorAll(btnSel));
            _drag.type    = 'iso';
            _drag.fromIdx = btns.indexOf(btn);
            _ghost(btn, Math.round(btn.offsetWidth / 2), Math.round(btn.offsetHeight / 2), e.dataTransfer);
            btn.classList.add('iso-dragging');
        });
        bar.addEventListener('dragover', function (e) {
            if (_drag.type !== 'iso') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const targetBtn = e.target.closest(btnSel);
            if (!targetBtn) return;
            const btns      = Array.from(bar.querySelectorAll(btnSel));
            const targetIdx = btns.indexOf(targetBtn);
            if (targetIdx < 0 || targetIdx === _drag.fromIdx) { _hideIndicator(); return; }
            const rect = targetBtn.getBoundingClientRect();
            const isVertical = bar.offsetHeight > bar.offsetWidth;
            const insertBefore = isVertical
                ? e.clientY < rect.top  + rect.height / 2
                : e.clientX < rect.left + rect.width  / 2;
            _drag.overIdx = targetIdx;
            _showIndicator(rect, insertBefore);
        });
        bar.addEventListener('dragleave', function (e) {
            if (_drag.type !== 'iso') return;
            if (!bar.contains(e.relatedTarget)) _hideIndicator();
        });
        bar.addEventListener('drop', function (e) {
            if (_drag.type !== 'iso') return;
            e.preventDefault();
            _hideIndicator();
            const targetBtn = e.target.closest(btnSel);
            if (!targetBtn) return;
            const btns      = Array.from(bar.querySelectorAll(btnSel));
            const targetIdx = btns.indexOf(targetBtn);
            if (targetIdx < 0 || targetIdx === _drag.fromIdx) return;
            const rect = targetBtn.getBoundingClientRect();
            const isVertical = bar.offsetHeight > bar.offsetWidth;
            const insertBefore = isVertical
                ? e.clientY < rect.top  + rect.height / 2
                : e.clientX < rect.left + rect.width  / 2;
            const insertAt = _calcInsertAt(_drag.fromIdx, targetIdx, insertBefore);
            const ordered = Array.from(bar.querySelectorAll(btnSel));
            const moved = ordered.splice(_drag.fromIdx, 1)[0];
            ordered.splice(insertAt, 0, moved);
            ordered.forEach(function (b) { bar.appendChild(b); });
            if (_o.onIsoDrop) _o.onIsoDrop(ordered.map(function (b) { return b.id; }));
        });
        bar.addEventListener('dragend', function (e) {
            const btn = e.target && e.target.closest ? e.target.closest(btnSel) : null;
            if (btn) { btn.classList.remove('iso-dragging'); btn.removeAttribute('draggable'); }
            if (_pendingBtn) { _pendingBtn.removeAttribute('draggable'); _pendingBtn = null; }
            _hideIndicator();
            if (_drag.type === 'iso') { _drag.type = null; _drag.fromIdx = null; _drag.overIdx = null; }
        });
    }

  // ── Public API ───────────────────────────────────────────────────
    return {

        /**
         * Initialise the drag system. Safe to call multiple times (re-initialises).
         *
         * @param {object}   opts
         * @param {string}   opts.sectionsContainerId  ID of the element holding all section-wraps
         * @param {string}   opts.sectionIdAttr        Attribute on each wrap identifying it, e.g. 'data-section-id'
         * @param {Function} opts.getOrder             Returns the current order array, e.g. () => config.sectionOrder
         * @param {Function} opts.onSectionDrop        Called with (newOrder[]) after a section is dropped
         * @param {Array}    [opts.rowContainers]      [{containerId, type}] — one per draggable row list
         * @param {Function} [opts.onRowDrop]          Called with (type, fromIdx, insertAt) after a row is dropped
         * @param {string}   [opts.sectionHeaderSelector]  Default: '.section-header'
         * @param {string}   [opts.rowSelector]            Default: '.row'
         * @param {string}   [opts.rowDragHandle]          Default: '.sel-btn'
         * @param {string}   [opts.sectionDraggingClass]   Default: 'section-dragging'
         * @param {string}   [opts.rowDraggingClass]       Default: 'bank-dragging'
         * @param {string}   [opts.indicatorColor]         CSS color for the drop line. Default: var(--accent, #ff7c44)
         */
        init: function (opts) {
            _o = opts;
            _injectCSS();
            _createIndicator();
            _initSectionDrag();
            _initRowDrag();
            _initIsoDrag();
        },

        /**
         * Apply a section order to the DOM.
         * Call this on boot and whenever a saved order is loaded from config.
         *
         * @param {string[]} order — section IDs in the desired top-to-bottom display order
         */
        applyOrder: function (order) {
            const container = document.getElementById(_o.sectionsContainerId);
            if (!container || !order) return;
            _applyOrderToDOM(container, order);
        },

        /**
         * Refresh drag handles on dynamically rendered rows.
         * Call this synchronously after async DOM updates to bypass CEP observer microtask drops.
         */
        /**
         * Refresh drag handles on dynamically rendered rows.
         * Call this synchronously after async DOM updates to bypass CEP observer microtask drops.
         */
        refresh: function () {
            if (!_o || !_o.rowContainers) {
                console.log('[HLM Trace] 🟡 DragDrop refresh aborted: module not initialized yet.');
                return;
            }
            
            _o.rowContainers.forEach(function (cfg) {
                const container  = document.getElementById(cfg.containerId);
                if (!container) return;
                
                const handleSel  = _o.rowDragHandle || '.sel-btn';
                const handles = container.querySelectorAll(handleSel);
                
                handles.forEach(function (h) {
                    h.setAttribute('draggable', 'true');
                });
                
                console.log(`[HLM Trace] DragDrop tagged ${handles.length} handles in #${cfg.containerId}`);
            });
        }

    };

}());