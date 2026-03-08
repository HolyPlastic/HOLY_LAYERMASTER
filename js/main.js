const csInterface = new CSInterface();
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────
// #region BANK ICON POOL
// Random icons assigned to banks at creation; stored as index in bank.iconIdx
// ─────────────────────────────────────────────────────
const BANK_ICONS = [
    // 0: wave
    `<svg viewBox="0 0 12 7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M.5 3.5c1-3 2.5-3 3 0s2 3 3 0 2-3 3 0 1 3 2 0"/></svg>`,
    // 1: diamond
    `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5,0.8 9.2,5 5,9.2 0.8,5"/></svg>`,
    // 2: triangle
    `<svg viewBox="0 0 10 9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5,0.8 9.2,8.5 0.8,8.5"/></svg>`,
    // 3: crosshair circle
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="3.2"/><line x1="5.5" y1=".5" x2="5.5" y2="2.2"/><line x1="5.5" y1="8.8" x2="5.5" y2="10.5"/><line x1=".5" y1="5.5" x2="2.2" y2="5.5"/><line x1="8.8" y1="5.5" x2="10.5" y2="5.5"/></svg>`,
    // 4: hexagon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5.5,0.8 9.8,3.1 9.8,7.9 5.5,10.2 1.2,7.9 1.2,3.1"/></svg>`,
    // 5: lightning bolt
    `<svg viewBox="0 0 8 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.5.5H3L.5 5.5h3L1.5 10.5l6-6.5H4.5z"/></svg>`,
    // 6: star
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="5.5,0.5 6.57,4.43 10.5,5.5 6.57,6.57 5.5,10.5 4.43,6.57 0.5,5.5 4.43,4.43"/></svg>`,
    // 7: arrow right
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="1.5" y1="5.5" x2="9.5" y2="5.5"/><polyline points="6.5,2.5 9.5,5.5 6.5,8.5"/></svg>`,
    // 8: eye
    `<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M.5 4C2 1.5 3.8.5 6 .5 8.2.5 10 1.5 11.5 4 10 6.5 8.2 7.5 6 7.5 3.8 7.5 2 6.5.5 4z"/><circle cx="6" cy="4" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    // 9: grid / four squares
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="3.5" height="3.5" rx=".5"/><rect x="6.5" y="1" width="3.5" height="3.5" rx=".5"/><rect x="1" y="6.5" width="3.5" height="3.5" rx=".5"/><rect x="6.5" y="6.5" width="3.5" height="3.5" rx=".5"/></svg>`,
    // 10: layers / stack
    `<svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 3l5 2.5 5-2.5-5-2.5z"/><path d="M1 6l5 2.5 5-2.5"/><path d="M1 4.5l5 2.5 5-2.5"/></svg>`,
    // 11: octagon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3.5.7h4l2.8 2.8v4L7.5 10.3h-4L.7 7.5v-4z"/></svg>`,
    // 12: moon
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M8 7A4.5 4.5 0 014 2.5a4.5 4.5 0 100 9A4.5 4.5 0 008 7z"/></svg>`,
    // 13: circle + ring
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="5.5" r="4.5" stroke-width="1.1"/><circle cx="5.5" cy="5.5" r="1.8" stroke-width="1.1"/></svg>`,
    // 14: plus / cross bold
    `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="5.5" y1="1.5" x2="5.5" y2="9.5"/><line x1="1.5" y1="5.5" x2="9.5" y2="5.5"/></svg>`,
    // 15: X bold
    `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>`,
];

// Default color palette for auto-assigning to new banks
const BANK_PALETTE = [
    '#ff7c44', // orange
    '#44aaff', // blue
    '#44e8aa', // mint
    '#aa44ff', // purple
    '#ffcc44', // amber
    '#ff4488', // pink
    '#44e8ff', // cyan
    '#aaff44', // lime
    '#ff6655', // coral
    '#7755ff', // violet
    '#55ff99', // green
    '#ff99bb', // rose
];
// #endregion

// ─────────────────────────────────────────────────────
// #region SVG ICON STRINGS (for select / capture / close)
// ─────────────────────────────────────────────────────
const SVG = {
    // icons-cursor-sting — select / recall
    select:  `<svg viewBox="0 0 9.98 9.98" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9.17,5.27l-2.69.92c-.13.05-.24.15-.28.28l-.92,2.69c-.13.38-.66.41-.83.05L.55,1.15c-.19-.39.22-.79.6-.6l8.07,3.89c.36.18.33.7-.05.83Z"/></svg>`,
    // icons-lens-split — capture / focus
    capture: `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="3.59" y1="3.59" x2=".5" y2=".5"/><line x1="10.5" y1="10.5" x2="7.41" y2="7.41"/><path d="M7.41,3.59c-1.05-1.05-2.76-1.05-3.82,0-1.05,1.05-1.05,2.76,0,3.82,1.05,1.05,2.76,1.05,3.82,0,1.05-1.05,1.05-2.76,0-3.82Z"/></svg>`,
    // icons-cross-diagonal — delete / clear
    close:   `<svg viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="10.5" y1=".5" x2=".5" y2="10.5"/><line x1=".5" y1=".5" x2="10.5" y2="10.5"/></svg>`
};
// #endregion

// ─────────────────────────────────────────────────────
// #region STORAGE SETUP
// ─────────────────────────────────────────────────────
function getDataDir(projPath) {
    return path.join(path.dirname(projPath), '_HLM_Data');
}
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
// #endregion

// ─────────────────────────────────────────────────────
// #region DEFAULT CONFIG
// ─────────────────────────────────────────────────────
function makeDefaultConfig() {
    return {
        kfBanks: [
            { id: 'KfBank_1', name: 'KF Bank A', iconIdx: 5 },
            { id: 'KfBank_2', name: 'KF Bank B', iconIdx: 0 },
            { id: 'KfBank_3', name: 'KF Bank C', iconIdx: 4 }
        ],
        layBanks: [
            { id: 'LayBank_1', name: 'Lay Bank A', iconIdx: 6 },
            { id: 'LayBank_2', name: 'Lay Bank B', iconIdx: 9 },
            { id: 'LayBank_3', name: 'Lay Bank C', iconIdx: 8 }
        ],
        layStates: [
            { id: 'State_1', name: 'State A' },
            { id: 'State_2', name: 'State B' },
            { id: 'State_3', name: 'State C' }
        ],
        nextId: 4,
        sectionOrder: ['kf', 'lay', 'states', 'search', 'rename'],
        bankColors: {
            'KfBank_1':  '#ff7c44',
            'KfBank_2':  '#44aaff',
            'KfBank_3':  '#44e8aa',
            'LayBank_1': '#aa44ff',
            'LayBank_2': '#ffcc44',
            'LayBank_3': '#ff4488',
        }
    };
}

let currentConfig   = makeDefaultConfig();
let currentProjPath = null;
let currentCompId   = null;
let currentCompName = null;
let activeStateId   = 'State_1';
// #endregion

// ─────────────────────────────────────────────────────
// #region HELPERS
// ─────────────────────────────────────────────────────
function getBankColor(bankId) {
    return currentConfig.bankColors[bankId] || '#ff7c44';
}

function getBankIconSvg(bank) {
    const idx = (bank.iconIdx !== undefined) ? (bank.iconIdx % BANK_ICONS.length) : 0;
    return BANK_ICONS[idx];
}
// #endregion

// ─────────────────────────────────────────────────────
// #region COLOR PICKER (delegates to HLMColorPicker module in colorpicker.js)
// ─────────────────────────────────────────────────────
let _aeLabels = null;

function fetchAELabels(cb) {
    if (_aeLabels) { cb(_aeLabels); return; }
    csInterface.evalScript('getAELabelData()', raw => {
        try { _aeLabels = JSON.parse(raw); } catch(e) { _aeLabels = []; }
        cb(_aeLabels);
    });
}

// Thin wrapper so existing call-sites stay unchanged
function openColorPicker(bankId, anchorEl) {
    HLMColorPicker.open(bankId, anchorEl, currentConfig.bankColors[bankId]);
}
// #endregion

// ─────────────────────────────────────────────────────
// #region CONFIG PERSISTENCE
// ─────────────────────────────────────────────────────
function loadConfig(projPath) {
    const cfgPath = getConfigPath(projPath);
    if (fs.existsSync(cfgPath)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            // Backfill missing fields
            if (!cfg.layStates)  cfg.layStates  = makeDefaultConfig().layStates;
            if (!cfg.bankColors) cfg.bankColors  = {};
            if (!cfg.sectionOrder) cfg.sectionOrder = ['kf', 'lay', 'states', 'search', 'rename'];

            // Ensure every bank has iconIdx and a color
            const allBanks = [...cfg.kfBanks, ...cfg.layBanks];
            allBanks.forEach((bank, i) => {
                if (bank.iconIdx === undefined) {
                    bank.iconIdx = i % BANK_ICONS.length;
                }
                if (!cfg.bankColors[bank.id]) {
                    cfg.bankColors[bank.id] = BANK_PALETTE[i % BANK_PALETTE.length];
                }
            });
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
// #endregion

// ─────────────────────────────────────────────────────
// #region RENDER BANK ROW
// Order: [Sel — bank icon, fully colored] [Name input] [Cap — smaller] [×]
// ─────────────────────────────────────────────────────
function renderBankRow(type, bank) {
    const row = document.createElement('div');
    row.className = 'row';
    const isKf = type === 'kf';

    // SELECT button — shows bank's random icon, always fully colored by JS
    const selBtn = document.createElement('button');
    selBtn.id        = `sel_${bank.id}`;
    selBtn.className = 'icon-btn sel-btn';
    selBtn.innerHTML = getBankIconSvg(bank);
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

    // CAPTURE button — smaller; neutral unless bank has data
    const capBaseTitle = isKf
        ? 'Capture current keyframe positions. Warning: Adding more keyframes after capture will alter the state.'
        : 'Capture current selection into this layer memory bank';
    const capBtn = document.createElement('button');
    capBtn.id              = `cap_${bank.id}`;
    capBtn.className       = 'icon-btn cap-btn';
    capBtn.innerHTML       = SVG.capture;
    capBtn.title           = capBaseTitle;
    capBtn.dataset.baseTitle = capBaseTitle;
    capBtn.addEventListener('click', () => captureData(type, bank.id));

    // CLEAR button
    const clrBtn = document.createElement('button');
    clrBtn.className = 'clr-btn';
    clrBtn.innerHTML = SVG.close;
    clrBtn.title = 'Clear this bank for the current comp';
    clrBtn.addEventListener('click', () => {
        if (!currentProjPath || !currentCompId) return;
        const fp = getSavePath(currentProjPath, currentCompId, bank.id);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        refreshBankIndicators();
    });

    // STACK: sel-btn on top, cap-btn beneath — narrow mode CSS handles the stacked layout
    const stack = document.createElement('div');
    stack.className = 'bank-btn-stack';
    stack.appendChild(selBtn);
    stack.appendChild(capBtn);

    // Wire up right-click context menu (clear / colours) on both buttons
    if (window._attachBankContextMenu) {
        window._attachBankContextMenu(bank.id, capBtn, selBtn);
    }

    row.appendChild(stack);
    row.appendChild(nameInput);
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
// #endregion

// ─────────────────────────────────────────────────────
// #region ADD / REMOVE BANKS
// ─────────────────────────────────────────────────────
function addBank(type) {
    const id   = type === 'kf' ? `KfBank_${currentConfig.nextId}`  : `LayBank_${currentConfig.nextId}`;
    const name = type === 'kf' ? `KF Bank ${currentConfig.nextId}` : `Lay Bank ${currentConfig.nextId}`;
    const iconIdx = Math.floor(Math.random() * BANK_ICONS.length);
    currentConfig.nextId++;

    const banks = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    banks.push({ id, name, iconIdx });

    // Auto-assign a palette color to the new bank
    if (!currentConfig.bankColors[id]) {
        const allBanks = [...currentConfig.kfBanks, ...currentConfig.layBanks];
        const colorIdx = (allBanks.length - 1) % BANK_PALETTE.length;
        currentConfig.bankColors[id] = BANK_PALETTE[colorIdx];
    }

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
// #endregion

// ─────────────────────────────────────────────────────
// #region ACTIVE COMP LABEL
// ─────────────────────────────────────────────────────
function updateCompLabel(name) {
    const el = document.getElementById('activeCompLabel');
    if (!el) return;
    el.textContent = name ? name.toUpperCase() : 'NO ACTIVE COMP';
    if (name) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
        el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
    }
}
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK INDICATORS
// Select button — always solid with bank color
// Capture button — theme-colored border/icon if has data; plain if empty
// ─────────────────────────────────────────────────────
function getBankCount(projPath, compId, bankId) {
    try {
        const fp = getSavePath(projPath, compId, bankId);
        if (!fs.existsSync(fp)) return 0;
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (data.layers)    return data.layers.length;
        if (data.ids)       return data.ids.length;
        if (data.keyframes) return data.keyframes.length;
    } catch(e) {}
    return 0;
}

function refreshBankIndicators() {
    [...currentConfig.kfBanks, ...currentConfig.layBanks].forEach(bank => {
        const { id } = bank;
        const capBtn = document.getElementById(`cap_${id}`);
        const selBtn = document.getElementById(`sel_${id}`);
        if (!capBtn || !selBtn) return;

        const count   = (currentProjPath && currentCompId) ? getBankCount(currentProjPath, currentCompId, id) : 0;
        const hasData = count > 0;
        const color   = getBankColor(id);

        // SELECT: always fully colored with bank's theme color
        selBtn.style.backgroundColor = color;
        selBtn.style.borderColor     = color;
        selBtn.style.color           = '#0d0d0f';

        // CAPTURE: outline + icon in theme color when data exists; plain when empty
        capBtn.classList.toggle('cap-active', hasData);
        if (hasData) {
            capBtn.style.backgroundColor = 'transparent';
            capBtn.style.borderColor     = color;
            capBtn.style.color           = color;
        } else {
            capBtn.style.backgroundColor = '';
            capBtn.style.borderColor     = '';
            capBtn.style.color           = '';
        }

        // Tooltip
        const base = capBtn.dataset.baseTitle || '';
        capBtn.title = hasData ? `${base} (${count} saved)` : base;
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region LAYER STATES
// ─────────────────────────────────────────────────────
function syncStatesUI() {
    const input = document.getElementById('stateNameInput');
    if (!input) return;
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
    if (activeStateId) {
        const color = getBankColor(activeStateId);
        if (hasData) {
            btn.style.backgroundColor = 'transparent';
            btn.style.borderColor     = color;
            btn.style.color           = color;
        } else {
            btn.style.backgroundColor = '';
            btn.style.borderColor     = '';
            btn.style.color           = '';
        }
    }
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

    const state      = currentConfig.layStates.find(s => s.id === activeStateId);
    const stateName  = state ? state.name : activeStateId;
    const safeFilePath = filePath.replace(/\\/g, '\\\\');
    csInterface.evalScript(`applyLayerStates("${safeFilePath}", "${stateName}")`, result => {
        if (result && result.indexOf('ERROR') !== -1) alert(result);
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region CONTEXT / EVENT-DRIVEN UPDATE
// No polling. AE fires a CSXSEvent when project or active comp changes;
// we sync once on boot, then react to those events only.
// ─────────────────────────────────────────────────────
let _lastKnownProjPath = null;
let _lastKnownCompId   = null;

function _applyContext(ctx) {
    if (!ctx) return;
    if (ctx.projPath && ctx.projPath !== 'UNSAVED' && ctx.projPath !== _lastKnownProjPath) {
        _lastKnownProjPath = ctx.projPath;
        currentProjPath    = ctx.projPath;
        currentConfig      = loadConfig(ctx.projPath);
        activeStateId      = currentConfig.layStates.length > 0 ? currentConfig.layStates[0].id : null;
        renderAll();
        HLMDragDrop.applyOrder(currentConfig.sectionOrder);
    }
    if (ctx.compId !== _lastKnownCompId) {
        _lastKnownCompId = ctx.compId;
        currentCompId    = ctx.compId;
        currentCompName  = ctx.compName;
        updateCompLabel(ctx.compName);
        refreshBankIndicators();
        refreshStateIndicator();
    }
}

function startContextListener() {
    function _fetchContext() {
        csInterface.evalScript('getProjectAndCompContext()', raw => {
            let ctx;
            try { ctx = JSON.parse(raw); } catch(e) { ctx = { projPath: 'UNSAVED', compId: null, compName: null }; }
            _applyContext(ctx);
            // If we got UNSAVED on boot, retry after 2s in case AE wasn't ready
            if (!ctx.projPath || ctx.projPath === 'UNSAVED') {
                setTimeout(_fetchContext, 2000);
            }
        });
    }
    _fetchContext();
    // React to changes fired from hostscript.jsx — no timer, no cursor flicker
    csInterface.addEventListener('com.hlm.contextChanged', event => {
        let ctx;
        try { ctx = JSON.parse(event.data); } catch(e) { return; }
        _applyContext(ctx);
    });
}
// #endregion

// ─────────────────────────────────────────────────────
// #region CAPTURE / SELECT
// ─────────────────────────────────────────────────────
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
// #endregion

// ─────────────────────────────────────────────────────
// #region LAYER RENAME
// ─────────────────────────────────────────────────────
(function () {
    let renameMode = 'search'; // 'search' | 'prefix' | 'suffix'

    const modeBtns = {
        search: document.getElementById('renameModeSearch'),
        prefix: document.getElementById('renameModePrefix'),
        suffix: document.getElementById('renameModeSuffix'),
    };
    const input1 = document.getElementById('renameInput1');
    const input2 = document.getElementById('renameInput2');

    function setMode(mode) {
        renameMode = mode;
        Object.keys(modeBtns).forEach(k => {
            modeBtns[k].classList.toggle('rename-mode-active', k === mode);
        });
        if (mode === 'search') {
            input1.placeholder = 'Search\u2026';
            input2.style.display = '';
        } else if (mode === 'prefix') {
            input1.placeholder = 'Prefix text\u2026';
            input2.style.display = 'none';
        } else {
            input1.placeholder = 'Suffix text\u2026';
            input2.style.display = 'none';
        }
    }

    modeBtns.search.addEventListener('click', () => setMode('search'));
    modeBtns.prefix.addEventListener('click', () => setMode('prefix'));
    modeBtns.suffix.addEventListener('click', () => setMode('suffix'));

    document.getElementById('renameFireBtn').addEventListener('click', () => {
        const t1 = input1.value;
        const t2 = renameMode === 'search' ? input2.value : '';
        if (!t1 && renameMode !== 'search') return alert('Please enter some text.');
        if (renameMode === 'search' && !t1) return alert('Please enter a search term.');
        const b64t1 = btoa(unescape(encodeURIComponent(t1)));
        const b64t2 = btoa(unescape(encodeURIComponent(t2)));
        csInterface.evalScript(`renameSelectedLayers("${renameMode}", "${b64t1}", "${b64t2}")`, result => {
            if (result && result.indexOf('ERROR') !== -1) alert(result);
        });
    });
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region BANK CONTEXT MENU
// Right-click sel or cap button → dropdown with Clear + Colours
// ─────────────────────────────────────────────────────
(function () {
    const menu    = document.getElementById('bankContextMenu');
    const itmClear   = document.getElementById('bankCtxClear');
    const itmColours = document.getElementById('bankCtxColours');
    let _activeBankId  = null;
    let _activeCapBtn  = null;

    function showMenu(x, y, bankId, capBtn) {
        _activeBankId = bankId;
        _activeCapBtn = capBtn;
        menu.style.left    = x + 'px';
        menu.style.top     = y + 'px';
        menu.style.display = 'block';
    }

    function hideMenu() {
        menu.style.display = 'none';
        _activeBankId = null;
        _activeCapBtn = null;
    }

    // Attach right-click to a bank's sel + cap buttons
    function attachBankContextMenu(bankId, capBtn, selBtn) {
        function onCtx(e) {
            e.preventDefault();
            e.stopPropagation();
            showMenu(e.clientX, e.clientY, bankId, capBtn);
        }
        capBtn.addEventListener('contextmenu', onCtx);
        selBtn.addEventListener('contextmenu', onCtx);
    }

    itmClear.addEventListener('click', () => {
        if (!_activeBankId || !currentProjPath || !currentCompId) { hideMenu(); return; }
        const fp = getSavePath(currentProjPath, currentCompId, _activeBankId);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        refreshBankIndicators();
        hideMenu();
    });

    itmColours.addEventListener('click', () => {
        const bankId = _activeBankId;
        const anchor = _activeCapBtn;
        hideMenu();
        if (bankId && anchor) openColorPicker(bankId, anchor);
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#bankContextMenu')) hideMenu();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideMenu();
    });

    // Expose so renderBankRow can wire up buttons after DOM build
    window._attachBankContextMenu = attachBankContextMenu;
}());
// #endregion

// ─────────────────────────────────────────────────────
// #region EVENT LISTENERS
// ─────────────────────────────────────────────────────
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
document.getElementById('applyStateBtn').addEventListener('click', applyStateData);

// Clear active state data
document.getElementById('clearStateBtn').addEventListener('click', () => {
    if (!currentProjPath || !currentCompId || !activeStateId) return;
    const fp = getSavePath(currentProjPath, currentCompId, activeStateId);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    refreshStateIndicator();
});

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

// Close state dropdown when clicking outside (picker close is handled by the module)
document.addEventListener('click', e => {
    const list = document.getElementById('stateDropdownList');
    if (list && !e.target.closest('.state-combo-wrap')) {
        list.style.display = 'none';
    }
});

// ─────────────────────────────────────────────────────
// Section collapse — click star to toggle section-body
// ─────────────────────────────────────────────────────
document.querySelectorAll('.section-star').forEach(star => {
    star.addEventListener('click', e => {
        const header = e.currentTarget.closest('.section-header');
        if (!header) return;
        const bodyId = header.dataset.bodyId;
        if (!bodyId) return;
        const body = document.getElementById(bodyId);
        if (!body) return;
        const isNowCollapsed = body.classList.toggle('section-collapsed');
        e.currentTarget.classList.toggle('star-collapsed', isNowCollapsed);
    });
});
// #endregion

// ─────────────────────────────────────────────────────
// #region NARROW LAYOUT (ResizeObserver)
// ─────────────────────────────────────────────────────
(function () {
    if (typeof ResizeObserver === 'undefined') return;
    const BREAKPOINT = 150;
    new ResizeObserver(entries => {
        document.body.classList.toggle('narrow', entries[0].contentRect.width < BREAKPOINT);
    }).observe(document.body);
}());
// #endregion

// ─────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────
HLMColorPicker.init({
    fetchSwatches: function (cb) { fetchAELabels(cb); },
    onApply: function (targetId, hex) {
        currentConfig.bankColors[targetId] = hex;
        saveConfig();
        refreshBankIndicators();
        refreshStateIndicator();
    },
    onReset: function (targetId) {
        delete currentConfig.bankColors[targetId];
        const allBanks = [...currentConfig.kfBanks, ...currentConfig.layBanks];
        const idx = allBanks.findIndex(b => b.id === targetId);
        if (idx >= 0) currentConfig.bankColors[targetId] = BANK_PALETTE[idx % BANK_PALETTE.length];
        saveConfig();
        refreshBankIndicators();
        refreshStateIndicator();
    }
});
renderAll();
HLMDragDrop.init({
    sectionsContainerId : 'sectionsContainer',
    sectionIdAttr       : 'data-section-id',
    getOrder            : () => currentConfig.sectionOrder,
    onSectionDrop       : function (newOrder) {
        currentConfig.sectionOrder = newOrder;
        saveConfig();
    },
    rowContainers : [
        { containerId: 'kfBanksContainer',  type: 'kf'  },
        { containerId: 'layBanksContainer', type: 'lay' },
    ],
    onRowDrop : function (type, fromIdx, insertAt) {
        const banks = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
        banks.splice(insertAt, 0, banks.splice(fromIdx, 1)[0]);
        saveConfig();
        renderAll();
    },
});
HLMDragDrop.applyOrder(currentConfig.sectionOrder);
startContextListener();