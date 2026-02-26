const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');

// --- Storage Setup (data lives adjacent to the .aep in _HLM_Data/) ---
function getDataDir(projPath) {
    return path.join(path.dirname(projPath), '_HLM_Data');
}
// Bank files are namespaced by comp: _HLM_Data/<compId>_<bankId>.json
// This gives each composition its own independent captured data per bank slot.
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
        nextId: 4
    };
}

let currentConfig   = makeDefaultConfig();
let currentProjPath = null;
let currentCompId   = null;
let currentCompName = null;

// --- Config Persistence (per AE project, not per comp) ---
function loadConfig(projPath) {
    const cfgPath = getConfigPath(projPath);
    if (fs.existsSync(cfgPath)) {
        try { return JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) {}
    }
    return makeDefaultConfig();
}
function saveConfig() {
    if (!currentProjPath) return;
    ensureDataDir(currentProjPath);
    fs.writeFileSync(getConfigPath(currentProjPath), JSON.stringify(currentConfig), 'utf8');
}

// --- Render ---
function renderBankRow(type, bank) {
    const row = document.createElement('div');
    row.className = 'row';

    const capBtn = document.createElement('button');
    capBtn.id = `cap_${bank.id}`;
    capBtn.className = 'cap-btn';
    capBtn.textContent = 'Cap';
    capBtn.addEventListener('click', () => captureData(type, bank.id));

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = bank.name;
    nameInput.id = `name_${bank.id}`;
    nameInput.addEventListener('input', () => {
        bank.name = nameInput.value;
        saveConfig();
    });

    const selBtn = document.createElement('button');
    selBtn.id = `sel_${bank.id}`;
    selBtn.textContent = 'Sel';
    selBtn.addEventListener('click', () => selectData(type, bank.id, `name_${bank.id}`));

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

    row.appendChild(capBtn);
    row.appendChild(nameInput);
    row.appendChild(selBtn);
    row.appendChild(clrBtn);
    return row;
}

function renderAll() {
    const kfContainer = document.getElementById('kfBanksContainer');
    const layContainer = document.getElementById('layBanksContainer');
    kfContainer.innerHTML = '';
    layContainer.innerHTML = '';
    currentConfig.kfBanks.forEach(bank => kfContainer.appendChild(renderBankRow('kf', bank)));
    currentConfig.layBanks.forEach(bank => layContainer.appendChild(renderBankRow('lay', bank)));
    refreshBankIndicators();
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

// --- Cap Button Indicators + Count ---
// Reads count from the bank JSON so the Cap button shows e.g. "Cap·4"
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
        btn.textContent = count > 0 ? `Cap·${count}` : 'Cap';
    });
}

// --- Polling Loop ---
// Fires once immediately on startup (for fast initial load), then every 1000ms.
// Detects project changes AND active comp switches — updates state and UI accordingly.
let _lastPolledProjPath = null;
let _lastPolledCompId   = null;

function _applyContext(ctx) {
    // Project changed (new .aep opened, or first load)
    if (ctx.projPath !== 'UNSAVED' && ctx.projPath !== _lastPolledProjPath) {
        _lastPolledProjPath = ctx.projPath;
        currentProjPath = ctx.projPath;
        currentConfig = loadConfig(ctx.projPath);
        renderAll();
    }
    // Active comp changed (user switched comps, opened or closed one)
    if (ctx.compId !== _lastPolledCompId) {
        _lastPolledCompId = ctx.compId;
        currentCompId   = ctx.compId;
        currentCompName = ctx.compName;
        updateCompLabel(ctx.compName);
        refreshBankIndicators();
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
    const timestamp = Date.now();
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
    const bankName = document.getElementById(labelId).value;
    const safeFilePath = filePath.replace(/\\/g, '\\\\');
    const scriptCall = type === 'lay'
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
    const term = document.getElementById('searchInput').value;
    const b64Term = btoa(unescape(encodeURIComponent(term)));
    csInterface.evalScript(`searchLayersB64("${b64Term}")`);
});
document.getElementById('reloadBtn').addEventListener('click', () => location.reload());

// Render with defaults immediately, then polling takes over once AE responds
renderAll();
startPolling();
