document.addEventListener('DOMContentLoaded', () => {
    const el = (id) => document.getElementById(id);

    function updateRam(val) {
        if(el('sett-ram')) {
            el('sett-ram').value = val;
            el('lbl-ram').innerText = val + " GB";
        }
    }

    // LOAD SETTINGS
    window.loadSettingsUI = async () => {
        const s = await window.electronAPI.getSettings();
        
        // RAM
        if(el('sett-ram')) {
            const ram = parseInt(s.maxMemory) || 4;
            el('sett-ram').value = ram;
            el('lbl-ram').innerText = ram + " GB";
        }
    };

    // SAVE SETTINGS
    if(el('btn-save-settings')) {
        el('btn-save-settings').onclick = async () => {
            const ram = el('sett-ram').value;

            const settings = {
                maxMemory: ram + "G",
                minMemory: "2G", 
                javaPath: "java"
            };
            
            await window.electronAPI.saveSettings(settings);
            alert("Settings Saved!");
        };
    }

    // UPDATE RAM LABEL (Live)
    if(el('sett-ram')) {
        el('sett-ram').oninput = (e) => el('lbl-ram').innerText = e.target.value + " GB";
    }

    // PRESETS
    if(el('btn-preset-low')) el('btn-preset-low').onclick = () => updateRam(2);
    if(el('btn-preset-med')) el('btn-preset-med').onclick = () => updateRam(6);
    if(el('btn-preset-high')) el('btn-preset-high').onclick = () => updateRam(12);
});