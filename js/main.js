const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');

// --- SVG icon strings ---
const SVG = {
    select:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>`,
    capture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/></svg>`
};

// --- Storage Setup (data lives adjacent to the .aep in _HLM_Data/) ---
function getDataDir(projPath) {
    return path.join(path.dirname(projPath), '_HLM_Data');
}
// Bank files are namespaced by comp: _HLM_Data/<compId>_<bankId>.json
function getSavePath(projPath, compId, bankId) {
    return path.join(getDataDir(projPath), `${compId}_${bankId}.json`);
}
function getConfigPath(projPath) {
    return path.join(getDataDir(projPath), '_bankConfig.json');
}
function ensureDataDir(projPath) {
    const dir = getDataDir(projPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

// --- Default Config (3 banks each, IDs 1-3, nextId starts at 4) ---
function makeDefaultConfig() {
    return {
        kfBanks: [
            { id: 'KfBank_1', name: 'KF Bank A' },
            { id: 'KfBank_2', name: 'KF Bank B' },
            { id: 'KfBank_3', name: 'KF Bank C' }
        ],
        layBanks: [
            { id: 'LayBank_1', name: 'Lay Bank A' },
            { id: 'LayBank_2', name: 'Lay Bank B' },
            { id: 'LayBank_3', name: 'Lay Bank C' }
        ],
        layStates: [
            { id: 'State_1', name: 'State A' },
            { id: 'State_2', name: 'State B' },
            { id: 'State_3', name: 'State C' }
        ],
        nextId: 4,
        bankColors: {}   // bankId / stateId -> custom hex color for cap-active state
    };
}

let currentConfig   = makeDefaultConfig();
let currentProjPath = null;
let currentCompId   = null;
let currentCompName = null;
let activeStateId   = 'State_1';

// --- Color Picker ---
let _aeLabels     = null;   // cached AE label colors (null = not yet fetched)
let _pickerBankId = null;   // which bank/state the open picker is targeting

function fetchAELabels(cb) {
    if (_aeLabels) { cb(_aeLabels); return; }
    csInterface.evalScript('getAELabelData()', raw => {
        try { _aeLabels = JSON.parse(raw); } catch(e) { _aeLabels = []; }
        cb(_aeLabels);
    });
}

function buildColorPicker() {
    const picker = document.createElement('div');
    picker.id        = 'hlmColorPicker';
    picker.className = 'color-picker-popup';
    picker.style.display = 'none';
    picker.innerHTML = `
        <div id="cpSwatchGrid" class="cp-swatch-grid"></div>
        <div class="cp-hex-row">
            <span class="cp-hash">#</span>
            <input type="text" id="cpHexInput" maxlength="6" placeholder="rrggbb" spellcheck="false">
            <button id="cpApplyBtn" class="cp-btn">OK</button>
        </div>
        <button id="cpResetBtn" class="cp-reset-btn">Reset to default</button>
    `;
    document.body.appendChild(picker);

    document.getElementById('cpApplyBtn').addEventListener('click', () => {
        const val = document.getElementById('cpHexInput').value.trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{6}$/.test(val)) applyPickerColor('#' + val.toUpperCase());
    });
    document.getElementById('cpHexInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('cpApplyBtn').click();
    });
    document.getElementById('cpResetBtn').addEventListener('click', () => applyPickerColor(null));
}

function openColorPicker(bankId, anchorEl) {
    _pickerBankId = bankId;
    const picker   = document.getElementById('hlmColorPicker');
    const hexInput = document.getElementById('cpHexInput');
    const current  = currentConfig.bankColors[bankId];
    hexInput.value = current ? current.replace('#', '') : '';
    picker.style.display = 'block';

    fetchAELabels(labels => {
        const grid = document.getElementById('cpSwatchGrid');
        grid.innerHTML = '';
        labels.forEach(lbl => {
            const sw = document.createElement('div');
            sw.className = 'cp-swatch';
            if (lbl.hex) {
                sw.style.backgroundColor = lbl.hex;
                sw.title = lbl.name || `Label ${lbl.index}`;
                sw.addEventListener('click', () => applyPickerColor(lbl.hex));
            } else {
                // Label with no color — show as placeholder slot
                sw.classList.add('cp-swatch-empty');
                sw.title = lbl.name ? `${lbl.name} (no color set)` : `Label ${lbl.index} (no color set)`;
            }
            grid.appendChild(sw);
        });
        positionPicker(picker, anchorEl);
    });

    // Position immediately with whatever dimensions are available; will reflow
    // after labels load but that's fine for the initial paint
    positionPicker(picker, anchorEl);
}

function positionPicker(picker, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    picker.style.left = '0px';
    picker.style.top  = '0px';
    const pw = picker.offsetWidth  || 170;
    const ph = picker.offsetHeight || 110;
    let left = rect.left;
    let top  = rect.bottom + 3;
    if (left + pw > window.innerWidth)  left = window.innerWidth  - pw - 2;
    if (left < 2)                        left = 2;
    if (top  + ph > window.innerHeight)  top  = rect.top - ph - 3;
    if (top  < 2)                        top  = 2;
    picker.style.left = left + 'px';
    picker.style.top  = top  + 'px';
}

function applyPickerColor(hex) {
    if (!_pickerBankId) return;
    if (hex) {
        currentConfig.bankColors[_pickerBankId] = hex;
    } else {
        delete currentConfig.bankColors[_pickerBankId];
    }
    saveConfig();
    refreshBankIndicators();
    refreshStateIndicator();
    closeColorPicker();
}

function closeColorPicker() {
    const picker = document.getElementById('hlmColorPicker');
    if (picker) picker.style.display = 'none';
    _pickerBankId = null;
}

// Applies (or removes) a custom cap-active color on a button via inline style.
// Falls back to the default amber (controlled by CSS .cap-active) when no custom color is set.
function applyCapButtonColor(btn, bankId, isActive) {
    if (isActive && currentConfig.bankColors[bankId]) {
        const hex = currentConfig.bankColors[bankId];
        btn.style.backgroundColor = hex;
        btn.style.borderColor      = hex;
    } else {
        btn.style.backgroundColor = '';
        btn.style.borderColor      = '';
    }
}

// --- Config Persistence (per AE project, not per comp) ---
function loadConfig(projPath) {
    const cfgPath = getConfigPath(projPath);
    if (fs.existsSync(cfgPath)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            // Backfill layStates for configs saved before this feature existed
            if (!cfg.layStates)   cfg.layStates   = makeDefaultConfig().layStates;
            if (!cfg.bankColors)  cfg.bankColors   = {};
            return cfg;
        } catch (e) {}
    }
    return makeDefaultConfig();
}
function saveConfig() {
    if (!currentProjPath) return;
    ensureDataDir(currentProjPath);
    fs.writeFileSync(getConfigPath(currentProjPath), JSON.stringify(currentConfig), 'utf8');
}

// --- Render Bank Row (order: [Sel] [Name] [Cap] [×]) ---
function renderBankRow(type, bank) {
    const row = document.createElement('div');
    row.className = 'row';
    const isKf = type === 'kf';

    const selBtn = document.createElement('button');
    selBtn.id        = `sel_${bank.id}`;
    selBtn.className = 'icon-btn';
    selBtn.innerHTML = SVG.select;
    selBtn.title     = isKf ? 'Restore saved keyframe positions' : 'Recall saved layer selection';
    selBtn.addEventListener('click', () => selectData(type, bank.id, `name_${bank.id}`));

    const nameInput = document.createElement('input');
    nameInput.type  = 'text';
    nameInput.value = bank.name;
    nameInput.id    = `name_${bank.id}`;
    nameInput.addEventListener('input', () => {
        bank.name = nameInput.value;
        saveConfig();
    });

    const capBaseTitle = isKf
        ? 'Capture current keyframe positions. Warning: Adding more keyframes after capture will alter the state.'
        : 'Capture current selection into this layer memory bank';
    const capBtn = document.createElement('button');
    capBtn.id              = `cap_${bank.id}`;
    capBtn.className       = 'icon-btn';
    capBtn.innerHTML       = SVG.capture;
    capBtn.title           = capBaseTitle;
    capBtn.dataset.baseTitle = capBaseTitle;
    capBtn.addEventListener('click', () => captureData(type, bank.id));
    capBtn.addEventListener('contextmenu', e => { e.preventDefault(); openColorPicker(bank.id, capBtn); });

    const clrBtn = document.createElement('button');
    clrBtn.className = 'clr-btn';
    clrBtn.textContent = '×';
    clrBtn.title = 'Clear this bank for the current comp';
    clrBtn.addEventListener('click', () => {
        if (!currentProjPath || !currentCompId) return;
        const fp = getSavePath(currentProjPath, currentCompId, bank.id);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        refreshBankIndicators();
    });

    row.appendChild(selBtn);
    row.appendChild(nameInput);
    row.appendChild(capBtn);
    row.appendChild(clrBtn);
    return row;
}

function renderAll() {
    const kfContainer  = document.getElementById('kfBanksContainer');
    const layContainer = document.getElementById('layBanksContainer');
    kfContainer.innerHTML  = '';
    layContainer.innerHTML = '';
    currentConfig.kfBanks.forEach(bank  => kfContainer.appendChild(renderBankRow('kf', bank)));
    currentConfig.layBanks.forEach(bank => layContainer.appendChild(renderBankRow('lay', bank)));
    refreshBankIndicators();
    syncStatesUI();
}

// --- Add / Remove Banks ---
function addBank(type) {
    const id   = type === 'kf' ? `KfBank_${currentConfig.nextId}`  : `LayBank_${currentConfig.nextId}`;
    const name = type === 'kf' ? `KF Bank ${currentConfig.nextId}` : `Lay Bank ${currentConfig.nextId}`;
    currentConfig.nextId++;
    (type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks).push({ id, name });
    saveConfig();
    renderAll();
}
function removeBank(type) {
    const banks = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    if (banks.length === 0) return;
    banks.pop();
    saveConfig();
    renderAll();
}

// --- Active Comp Label ---
function updateCompLabel(name) {
    const el = document.getElementById('activeCompLabel');
    if (!el) return;
    el.textContent = name ? `● ${name}` : 'No Active Comp';
    if (name) {
        el.classList.remove('flash');
        void el.offsetWidth; // force reflow so animation restarts cleanly
        el.classList.add('flash');
        el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
    }
}

// --- Bank Indicators (cap button color + tooltip count) ---
function getBankCount(projPath, compId, bankId) {
    try {
        const fp = getSavePath(projPath, compId, bankId);
        if (!fs.existsSync(fp)) return 0;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (data.layers)    return data.layers.length;
        if (data.ids)       return data.ids.length;      // backward compat
        if (data.keyframes) return data.keyframes.length;
    } catch(e) {}
    return 0;
}
function refreshBankIndicators() {
    [...currentConfig.kfBanks, ...currentConfig.layBanks].forEach(({ id }) => {
        const btn = document.getElementById(`cap_${id}`);
        if (!btn) return;
        const count = (currentProjPath && currentCompId)
            ? getBankCount(currentProjPath, currentCompId, id) : 0;
        btn.classList.toggle('cap-active', count > 0);
        applyCapButtonColor(btn, id, count > 0);
        const base = btn.dataset.baseTitle || '';
        btn.title = count > 0 ? `${base} (${count} saved)` : base;
    });
}

// --- Layer States ---

function syncStatesUI() {
    const input = document.getElementById('stateNameInput');
    if (!input) return;
    // Validate activeStateId is still present in current config
    if (!activeStateId || !currentConfig.layStates.find(s => s.id === activeStateId)) {
        activeStateId = currentConfig.layStates.length > 0 ? currentConfig.layStates[0].id : null;
    }
    if (activeStateId) {
        const state = currentConfig.layStates.find(s => s.id === activeStateId);
        input.value = state ? state.name : '';
    } else {
        input.value = '';
    }
    refreshStateIndicator();
}

function renderStatesDropdown() {
    const list  = document.getElementById('stateDropdownList');
    const input = document.getElementById('stateNameInput');
    list.innerHTML = '';

    currentConfig.layStates.forEach(state => {
        const item = document.createElement('div');
        item.className   = 'dropdown-item' + (state.id === activeStateId ? ' active' : '');
        item.textContent = state.name;
        item.addEventListener('click', () => {
            activeStateId = state.id;
            input.value   = state.name;
            list.style.display = 'none';
            refreshStateIndicator();
        });
        list.appendChild(item);
    });

    const createItem = document.createElement('div');
    createItem.className   = 'dropdown-item create-new';
    createItem.textContent = 'Create New State...';
    createItem.addEventListener('click', () => {
        list.style.display = 'none';
        addState();
    });
    list.appendChild(createItem);
}

function addState() {
    const id   = `State_${currentConfig.nextId}`;
    const name = `State ${currentConfig.nextId}`;
    currentConfig.nextId++;
    currentConfig.layStates.push({ id, name });
    activeStateId = id;
    saveConfig();
    const input = document.getElementById('stateNameInput');
    if (input) input.value = name;
    refreshStateIndicator();
}

function refreshStateIndicator() {
    const btn = document.getElementById('captureStateBtn');
    if (!btn) return;
    const hasData = !!(
        currentProjPath && currentProjPath !== 'UNSAVED' &&
        currentCompId && activeStateId &&
        fs.existsSync(getSavePath(currentProjPath, currentCompId, activeStateId))
    );
    btn.classList.toggle('cap-active', hasData);
    if (activeStateId) applyCapButtonColor(btn, activeStateId, hasData);
}

function captureStateData() {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');
    if (!activeStateId)
        return alert('No active state selected.');

    ensureDataDir(currentProjPath);
    const timestamp = Date.now();
    csInterface.evalScript(`captureLayerStates("${activeStateId}", ${timestamp})`, aeDataStr => {
        if (aeDataStr.indexOf('ERROR') !== -1) return alert(aeDataStr);
        fs.writeFileSync(getSavePath(currentProjPath, currentCompId, activeStateId), aeDataStr, 'utf8');
        refreshStateIndicator();
    });
}

function applyStateData() {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');
    if (!activeStateId)
        return alert('No active state selected.');

    const filePath = getSavePath(currentProjPath, currentCompId, activeStateId);
    if (!fs.existsSync(filePath)) return alert('This state is empty — capture it first.');

    const state    = currentConfig.layStates.find(s => s.id === activeStateId);
    const stateName  = state ? state.name : activeStateId;
    const safeFilePath = filePath.replace(/\\/g, '\\\\');
    csInterface.evalScript(`applyLayerStates("${safeFilePath}", "${stateName}")`, result => {
        if (result && result.indexOf('ERROR') !== -1) alert(result);
    });
}

// --- Polling Loop ---
// Fires once immediately on startup (for fast initial load), then every 1000ms.
let _lastPolledProjPath = null;
let _lastPolledCompId   = null;

function _applyContext(ctx) {
    // Project changed (new .aep opened, or first load)
    if (ctx.projPath !== 'UNSAVED' && ctx.projPath !== _lastPolledProjPath) {
        _lastPolledProjPath = ctx.projPath;
        currentProjPath     = ctx.projPath;
        currentConfig       = loadConfig(ctx.projPath);
        // Reset active state to first state of the new project's config
        activeStateId = currentConfig.layStates.length > 0 ? currentConfig.layStates[0].id : null;
        renderAll();
    }
    // Active comp changed
    if (ctx.compId !== _lastPolledCompId) {
        _lastPolledCompId = ctx.compId;
        currentCompId     = ctx.compId;
        currentCompName   = ctx.compName;
        updateCompLabel(ctx.compName);
        refreshBankIndicators();
        refreshStateIndicator();
    }
}

function startPolling() {
    const poll = () => {
        csInterface.evalScript('getProjectAndCompContext()', raw => {
            let ctx;
            try { ctx = JSON.parse(raw); } catch(e) { ctx = { projPath: 'UNSAVED', compId: null, compName: null }; }
            _applyContext(ctx);
        });
    };
    poll();                          // immediate call — don't wait 1s on first load
    setInterval(poll, 1000);
}

// --- Capture / Select ---
function captureData(type, bankId) {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');

    ensureDataDir(currentProjPath);
    const timestamp  = Date.now();
    const scriptCall = type === 'lay'
        ? `captureLayers("${bankId}", ${timestamp})`
        : `captureKeyframes("${bankId}", ${timestamp})`;

    csInterface.evalScript(scriptCall, aeDataStr => {
        if (aeDataStr.indexOf('ERROR') !== -1) return alert(aeDataStr);
        fs.writeFileSync(getSavePath(currentProjPath, currentCompId, bankId), aeDataStr, 'utf8');
        refreshBankIndicators();
    });
}

function selectData(type, bankId, labelId) {
    if (!currentProjPath || currentProjPath === 'UNSAVED')
        return alert('Please save your After Effects project first!');
    if (!currentCompId)
        return alert('Please open a composition first.');

    const filePath = getSavePath(currentProjPath, currentCompId, bankId);
    if (!fs.existsSync(filePath)) return alert('This memory bank is currently empty.');
    const bankName     = document.getElementById(labelId).value;
    const safeFilePath = filePath.replace(/\\/g, '\\\\');
    const scriptCall   = type === 'lay'
        ? `selectLayersFromFile("${safeFilePath}", "${bankName}")`
        : `selectKeyframesFromFile("${safeFilePath}", "${bankName}")`;
    csInterface.evalScript(scriptCall, result => {
        if (result && result.indexOf('ERROR') !== -1) alert(result);
    });
}

// --- Event Listeners ---
document.getElementById('addKfBank').addEventListener('click',    () => addBank('kf'));
document.getElementById('removeKfBank').addEventListener('click', () => removeBank('kf'));
document.getElementById('addLayBank').addEventListener('click',    () => addBank('lay'));
document.getElementById('removeLayBank').addEventListener('click', () => removeBank('lay'));

document.getElementById('searchBtn').addEventListener('click', () => {
    const term    = document.getElementById('searchInput').value;
    const b64Term = btoa(unescape(encodeURIComponent(term)));
    csInterface.evalScript(`searchLayersB64("${b64Term}")`);
});
document.getElementById('reloadBtn').addEventListener('click', () => location.reload());
document.getElementById('soloBtn').addEventListener('click', () => csInterface.evalScript('isolateSolo()'));
document.getElementById('shyBtn').addEventListener('click',  () => csInterface.evalScript('isolateShyFocus()'));
document.getElementById('lockBtn').addEventListener('click', () => csInterface.evalScript('isolateLock()'));

// States
document.getElementById('captureStateBtn').addEventListener('click', captureStateData);
document.getElementById('captureStateBtn').addEventListener('contextmenu', e => {
    e.preventDefault();
    if (activeStateId) openColorPicker(activeStateId, e.currentTarget);
});
document.getElementById('applyStateBtn').addEventListener('click',   applyStateData);

document.getElementById('stateNameInput').addEventListener('input', () => {
    if (!activeStateId) return;
    const state = currentConfig.layStates.find(s => s.id === activeStateId);
    if (state) {
        state.name = document.getElementById('stateNameInput').value;
        saveConfig();
    }
});

document.getElementById('stateDropdownBtn').addEventListener('click', () => {
    const list   = document.getElementById('stateDropdownList');
    const isOpen = list.style.display === 'block';
    if (isOpen) {
        list.style.display = 'none';
    } else {
        renderStatesDropdown();
        list.style.display = 'block';
    }
});

// Close dropdown / color picker when clicking anywhere outside them
document.addEventListener('click', e => {
    const list = document.getElementById('stateDropdownList');
    if (list && !e.target.closest('.state-combo-wrap')) {
        list.style.display = 'none';
    }
    const picker = document.getElementById('hlmColorPicker');
    if (picker && picker.style.display !== 'none' && !e.target.closest('#hlmColorPicker')) {
        closeColorPicker();
    }
});

// Render with defaults immediately, then polling takes over once AE responds
buildColorPicker();
renderAll();
startPolling();

// --- Narrow sidepanel layout: toggle .narrow on body via ResizeObserver ---
(function () {
    if (typeof ResizeObserver === 'undefined') return;
    const BREAKPOINT = 200;
    new ResizeObserver(entries => {
        document.body.classList.toggle('narrow', entries[0].contentRect.width < BREAKPOINT);
    }).observe(document.body);
}());
