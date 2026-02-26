const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');

// --- Storage Setup ---
const userDataFolder = csInterface.getSystemPath(SystemPath.USER_DATA);
const memoryDir = path.join(userDataFolder, 'HolyLayerMaster_BankData');
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

function getSavePath(projectPath, bankId) {
    const safeHash = projectPath.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(memoryDir, `${safeHash}_${bankId}.json`);
}
function getConfigPath(projectPath) {
    const safeHash = projectPath.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(memoryDir, `${safeHash}_bankConfig.json`);
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

let currentConfig = makeDefaultConfig();
let currentProjPath = null;

// --- Config Persistence (per AE project) ---
function loadConfig(projPath) {
    const cfgPath = getConfigPath(projPath);
    if (fs.existsSync(cfgPath)) {
        try { return JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) {}
    }
    return makeDefaultConfig();
}
function saveConfig() {
    if (!currentProjPath) return;
    fs.writeFileSync(getConfigPath(currentProjPath), JSON.stringify(currentConfig), 'utf8');
}

// --- Render ---
function renderBankRow(type, bank) {
    const row = document.createElement('div');
    row.className = 'row';

    const capBtn = document.createElement('button');
    capBtn.id = `cap_${bank.id}`;
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

    row.appendChild(capBtn);
    row.appendChild(nameInput);
    row.appendChild(selBtn);
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

// --- Cap Button Indicators ---
function refreshBankIndicators() {
    if (!currentProjPath) return;
    [...currentConfig.kfBanks, ...currentConfig.layBanks].forEach(({ id }) => {
        const btn = document.getElementById(`cap_${id}`);
        if (!btn) return;
        btn.classList.toggle('cap-active', fs.existsSync(getSavePath(currentProjPath, id)));
    });
}

// Retries until AE returns a real project path (handles panel-load race with AE init)
function refreshOnLoad(attempts) {
    csInterface.evalScript('getProjectPath()', projPath => {
        if (projPath !== 'UNSAVED') {
            currentProjPath = projPath;
            currentConfig = loadConfig(projPath);
            renderAll();
        } else if (attempts > 0) {
            setTimeout(() => refreshOnLoad(attempts - 1), 600);
        }
    });
}

// --- Capture / Select ---
function captureData(type, bankId) {
    csInterface.evalScript('getProjectPath()', projPath => {
        if (projPath === 'UNSAVED') return alert('Please save your After Effects project first!');
        const scriptCall = type === 'lay' ? 'captureLayers()' : 'captureKeyframes()';
        csInterface.evalScript(scriptCall, aeDataStr => {
            if (aeDataStr.indexOf('ERROR') !== -1) return alert(aeDataStr);
            fs.writeFileSync(getSavePath(projPath, bankId), aeDataStr, 'utf8');
            refreshBankIndicators();
        });
    });
}
function selectData(type, bankId, labelId) {
    csInterface.evalScript('getProjectPath()', projPath => {
        if (projPath === 'UNSAVED') return alert('Please save your After Effects project first!');
        const filePath = getSavePath(projPath, bankId);
        if (!fs.existsSync(filePath)) return alert('This memory bank is currently empty.');
        const bankName = document.getElementById(labelId).value;
        const safeFilePath = filePath.replace(/\\/g, '\\\\');
        const scriptCall = type === 'lay'
            ? `selectLayersFromFile("${safeFilePath}", "${bankName}")`
            : `selectKeyframesFromFile("${safeFilePath}", "${bankName}")`;
        csInterface.evalScript(scriptCall, result => {
            if (result && result.indexOf('ERROR') !== -1) alert(result);
        });
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

// Render defaults immediately, then swap in per-project config once AE is ready
renderAll();
refreshOnLoad(10); // up to 10 retries × 600ms = 6 seconds of patience
