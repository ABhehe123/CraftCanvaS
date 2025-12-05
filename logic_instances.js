document.addEventListener('DOMContentLoaded', () => {
    // Button Bindings
    const btnCreate = document.getElementById('btn-create-inst');
    if(btnCreate) {
        btnCreate.onclick = async () => {
            const name = document.getElementById('new-inst-name').value;
            const ver = document.getElementById('new-inst-ver').value;
            const loader = document.getElementById('new-inst-loader').value;
            
            if(!name) return alert("Enter Name");
            await window.electronAPI.createInstance(name, ver, loader);
            document.getElementById('modal-new-inst').classList.add('hidden');
            window.loadInstancesUI();
        };
    }

    const btnLaunch = document.getElementById('btn-launch');
    if(btnLaunch) {
        btnLaunch.onclick = async () => {
            const id = document.getElementById('play-select-instance').value;
            if(!id || id.includes('Select')) return alert("Select an instance first");

            document.getElementById('launch-status').innerText = "Authenticating...";
            
            // 1. TRIGGER MICROSOFT LOGIN POPUP
            const authRes = await window.electronAPI.microsoftLogin();
            if(!authRes.success) {
                document.getElementById('launch-status').innerText = "Login Failed: " + authRes.error;
                return;
            }
            
            document.getElementById('launch-status').innerText = "Launching...";
            
            // 2. Launch Game with Token
            // You need to pass the token to your launch handler in main.js
            // For now, we assume the main process handles the token caching or pass it here:
            window.electronAPI.launchInstance(id, authRes.user); 
        };
    }
});

window.loadInstancesUI = async () => {
    const grid = document.getElementById('grid-instances');
    const playSelect = document.getElementById('play-select-instance');
    
    if(!grid || !playSelect) return;

    const instances = await window.electronAPI.getInstances();
    
    // Clear & Populate
    grid.innerHTML = '';
    playSelect.innerHTML = '<option>Select Instance...</option>';

    if(instances.length === 0) {
        grid.innerHTML = '<p style="padding:20px;">No instances found.</p>';
        return;
    }

    instances.forEach(inst => {
        // Add to Play Dropdown
        playSelect.innerHTML += `<option value="${inst.id}">${inst.name} (${inst.version})</option>`;

        // Add to Grid
        const card = document.createElement('div');
        card.className = 'instance-card';
        card.innerHTML = `
            <div style="font-size:3rem; margin-bottom:10px;">🧊</div>
            <h3 style="margin:5px 0;">${inst.name}</h3>
            <p style="color:#777; font-size:0.8rem;">${inst.version} • ${inst.loader}</p>
            
            <div style="display:flex; gap:5px; margin-top:10px;">
                <button onclick="window.electronAPI.openInstanceFolder('${inst.id}')" style="background:#444; border:none; color:white; padding:5px; border-radius:4px; flex:1; cursor:pointer;">📂 Open</button>
                <button onclick="window.electronAPI.deleteInstance('${inst.id}').then(window.loadInstancesUI)" style="background:#d63031; border:none; color:white; padding:5px; border-radius:4px; flex:1; cursor:pointer;">🗑️ Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
};