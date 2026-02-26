const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');

// --- Storage Setup ---
// JSON files live in a '_HLM_Data' folder directly adjacent to the .aep file.
// This keeps bank data portable with the project and prevents cross-project
// collisions without relying on a global user-data directory.
function getProjectDataDir(projPath) {
    const dir = path.join(path.dirname(projPath), '_HLM_Data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    return dir;
}

function getSavePath(projPath, bankId) {
    return path.join(getProjectDataDir(projPath), `${bankId}.json`);
}

function getConfigPath(projPath) {
    return path.join(getProjectDataDir(projPath), '_bankConfig.json');
}

// --- Logic ---

function captureData(type, bankId) {
    csInterface.evalScript('getProjectPath()', (projPath) => {
        if (projPath === "UNSAVED") return alert("Please save your project first!");
        
        // We generate a timestamp so we can filter out old "pasted" layers in the same project
        const timestamp = Date.now();
        const scriptCall = type === 'lay' 
            ? `captureLayers("${bankId}", ${timestamp})` 
            : `captureKeyframes("${bankId}", ${timestamp})`;

        csInterface.evalScript(scriptCall, (aeDataStr) => {
            if (aeDataStr.indexOf("ERROR") !== -1) return alert(aeDataStr);
            
            const filePath = getSavePath(projPath, bankId);
            fs.writeFileSync(filePath, aeDataStr, 'utf8');
        });
    });
}

function selectData(type, bankId, inputId) {
    csInterface.evalScript('getProjectPath()', (projPath) => {
        if (projPath === "UNSAVED") return alert("Please save your project first!");
        
        const filePath = getSavePath(projPath, bankId);
        if (!fs.existsSync(filePath)) return alert("This bank is currently empty.");
        
        const bankName = document.getElementById(inputId).value;
        const safeFilePath = filePath.replace(/\\/g, '\\\\');
        
        const scriptCall = type === 'lay'
            ? `selectLayersFromFile("${safeFilePath}", "${bankName}")`
            : `selectKeyframesFromFile("${safeFilePath}", "${bankName}")`;

        csInterface.evalScript(scriptCall, result => {
            if (result && result.indexOf('ERROR') !== -1) alert(result);
        });
    });
}

// --- UI Rendering & Dynamic Banks (Existing Logic maintained) ---

let currentConfig = { kfBanks: [], layBanks: [], nextId: 1 };

function addBank(type) {
    const bankList = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    const prefix = type === 'kf' ? 'KF Bank' : 'Lay Bank';
    const id = `${type.charAt(0).toUpperCase()}${type.slice(1)}Bank_${currentConfig.nextId++}`;
    bankList.push({ id: id, name: `${prefix} ${String.fromCharCode(64 + bankList.length + 1)}` });
    saveConfigAndRender();
}

function removeBank(type) {
    const bankList = type === 'kf' ? currentConfig.kfBanks : currentConfig.layBanks;
    if (bankList.length > 0) {
        bankList.pop();
        saveConfigAndRender();
    }
}

function saveConfigAndRender() {
    csInterface.evalScript('getProjectPath()', (projPath) => {
        if (projPath !== "UNSAVED") {
            fs.writeFileSync(getConfigPath(projPath), JSON.stringify(currentConfig), 'utf8');
        }
        renderAll();
    });
}

function renderAll() {
    renderContainer('kfBanksContainer', currentConfig.kfBanks, 'kf');
    renderContainer('layBanksContainer', currentConfig.layBanks, 'lay');
}

function renderContainer(containerId, banks, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    banks.forEach(bank => {
        const row = document.createElement('div');
        row.className = 'row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = bank.name;
        input.id = `input_${bank.id}`;
        input.onchange = (e) => { bank.name = e.target.value; saveConfigAndRender(); };
        
        const capBtn = document.createElement('button');
        capBtn.innerText = 'Cap';
        capBtn.onclick = () => captureData(type, bank.id);
        
        const selBtn = document.createElement('button');
        selBtn.innerText = 'Sel';
        selBtn.onclick = () => selectData(type, bank.id, input.id);
        
        row.appendChild(input);
        row.appendChild(capBtn);
        row.appendChild(selBtn);
        container.appendChild(row);
    });
}

// Standard project loading logic
function refreshOnLoad(retries) {
    // Use 'projPath' so it doesn't shadow the imported 'path' module above.
    csInterface.evalScript('getProjectPath()', (projPath) => {
        if (projPath === "UNSAVED" || !projPath) {
            if (retries > 0) setTimeout(() => refreshOnLoad(retries - 1), 600);
            return;
        }
        const cfgPath = getConfigPath(projPath);
        if (fs.existsSync(cfgPath)) {
            currentConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            renderAll();
        }
    });
}

// Init
document.getElementById('addKfBank').addEventListener('click', () => addBank('kf'));
document.getElementById('removeKfBank').addEventListener('click', () => removeBank('kf'));
document.getElementById('addLayBank').addEventListener('click', () => addBank('lay'));
document.getElementById('removeLayBank').addEventListener('click', () => removeBank('lay'));
document.getElementById('searchBtn').addEventListener('click', () => {
    const term = document.getElementById('searchInput').value;
    const b64Term = btoa(unescape(encodeURIComponent(term)));
    csInterface.evalScript(`searchLayersB64("${b64Term}")`);
});
document.getElementById('reloadBtn').addEventListener('click', () => location.reload());

renderAll();
refreshOnLoad(10);