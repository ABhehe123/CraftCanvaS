let currentBrowseType = 'mod';
let projectVersionsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!window.electronAPI) return;

    // --- OPTIMIZED FILTER LOADING (Parallel) ---
    // We start searching immediately so the user sees results
    window.searchContent('mod', true);

    // Fetch filters in background
    Promise.all([
        window.electronAPI.getAllGameVersions().catch(() => []),
        window.electronAPI.getAllLoaders().catch(() => ['fabric', 'forge'])
    ]).then(([versions, loaders]) => {
        const fill = (id, items) => {
            const el = document.getElementById(id);
            if(el) {
                // Keep the first "Any" option
                while (el.options.length > 1) el.remove(1);
                items.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`);
            }
        };

        fill('browse-filter-ver', versions);
        fill('browse-filter-loader', loaders);
        fill('new-inst-ver', versions);
        fill('new-inst-loader', loaders);
        console.log("Filters loaded.");
    });

    // --- EVENTS ---
    const sBtn = document.getElementById('btn-browse-search');
    if(sBtn) sBtn.onclick = () => window.searchContent(currentBrowseType, true);
    
    const sInput = document.getElementById('browse-search');
    if(sInput) sInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') window.searchContent(currentBrowseType, true); });

    const cBtn = document.getElementById('btn-close-detail');
    if(cBtn) cBtn.onclick = () => document.getElementById('detail-view').classList.add('hidden');
    
    const dlBtn = document.getElementById('btn-confirm-download');
    if(dlBtn) dlBtn.onclick = confirmDownload;
});

window.switchBrowseType = (type) => {
    currentBrowseType = type;
    
    document.querySelectorAll('.browse-cat-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.browse-cat-btn');
    btns.forEach(b => {
        if(b.innerText.toLowerCase().includes(type === 'resourcepack' ? 'resource' : type)) {
            b.classList.add('active');
        }
    });

    const content = document.getElementById('main-content');
    if (content) {
        if (type === 'mod') content.style.backgroundImage = "url('assets/tab_ui images/End.png')";
        else if (type === 'resourcepack') content.style.backgroundImage = "url('assets/tab_ui images/Kingdom.png')";
        else if (type === 'shader') content.style.backgroundImage = "url('assets/tab_ui images/Wither.png')";
    }
    
    window.searchContent(type, true);
};

window.searchContent = async (type, reset = true) => {
    const grid = document.getElementById('browse-grid'); 
    if (!grid) return;

    if (reset) grid.innerHTML = '<p style="padding:20px; color:#aaa;">Loading...</p>';

    const query = document.getElementById('browse-search').value || '';
    const version = document.getElementById('browse-filter-ver').value;
    const loader = document.getElementById('browse-filter-loader').value;

    try {
        const results = await window.electronAPI.searchMods(query, version, loader, 0, type);
        if (reset) grid.innerHTML = ''; 

        if (!results || results.length === 0) {
            grid.innerHTML = '<p style="padding:20px;">No results found.</p>';
            return;
        }

        results.forEach(item => {
            const card = document.createElement('div');
            card.className = 'mod-card'; 
            
            const iconUrl = item.icon_url || 'https://cdn.modrinth.com/assets/logo.svg';
            const desc = item.description || 'No description available.';
            const author = item.author || 'Unknown';
            
            let dls = item.downloads;
            if(dls > 1000000) dls = (dls/1000000).toFixed(1) + 'M';
            else if(dls > 1000) dls = (dls/1000).toFixed(0) + 'k';

            const date = new Date(item.date_modified).toLocaleDateString();

            card.innerHTML = `
                <img src="${iconUrl}" class="mod-icon">
                <div class="mod-info">
                    <div class="mod-title">${item.title}</div>
                    <div class="mod-desc">${desc}</div>
                    <div class="mod-author">by ${author}</div>
                </div>
                <div class="mod-stats">
                    <div class="stat-row">📥 ${dls}</div>
                    <div class="stat-row">📅 ${date}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openDetails(item.project_id);
            });
            
            grid.appendChild(card);
        });
    } catch (e) { 
        console.error(e);
        grid.innerHTML = '<p style="padding:20px; color:red;">Error fetching data. Check internet.</p>';
    }
};

async function openDetails(id) {
    const view = document.getElementById('detail-view');
    if(!view) return;
    
    view.classList.remove('hidden');
    document.getElementById('detail-title').innerText = "Loading...";
    document.getElementById('detail-desc-short').innerText = "";
    document.getElementById('markdown-body').innerHTML = ""; // Clear old content
    
    try {
        const details = await window.electronAPI.getModDetails(id);
        
        document.getElementById('detail-title').innerText = details.title;
        document.getElementById('detail-desc-short').innerText = details.description;
        document.getElementById('detail-icon').src = details.icon_url || 'https://cdn.modrinth.com/assets/logo.svg';
        document.getElementById('markdown-body').innerHTML = marked.parse(details.body || "No description provided.");

        const installBtn = document.getElementById('btn-install-main');
        installBtn.onclick = async () => {
            installBtn.innerText = "Fetching Versions...";
            projectVersionsCache = await window.electronAPI.getModVersions(id);
            installBtn.innerText = "Install";
            
            const vSelect = document.getElementById('dl-version-select');
            const lSelect = document.getElementById('dl-loader-select');
            vSelect.innerHTML = ''; lSelect.innerHTML = '';

            const vers = new Set();
            const loades = new Set();
            projectVersionsCache.forEach(v => {
                v.game_versions.forEach(gv => vers.add(gv));
                v.loaders.forEach(l => loades.add(l));
            });

            Array.from(vers).sort().reverse().forEach(v => vSelect.innerHTML += `<option value="${v}">${v}</option>`);
            Array.from(loades).forEach(l => lSelect.innerHTML += `<option value="${l}">${l}</option>`);

            document.getElementById('modal-download-selection').classList.remove('hidden');
        };
    } catch(e) {
        alert("Failed to load details");
        view.classList.add('hidden');
    }
}

async function confirmDownload() {
    const ver = document.getElementById('dl-version-select').value;
    const loader = document.getElementById('dl-loader-select').value;
    const match = projectVersionsCache.find(v => v.game_versions.includes(ver) && v.loaders.includes(loader));
    
    if(match && match.files[0]) {
        document.getElementById('modal-download-selection').classList.add('hidden');
        await window.electronAPI.downloadFile(match.files[0].url, match.files[0].filename);
        alert(`Download started: ${match.files[0].filename}`);
    } else {
        alert("No file found for this specific version/loader combination.");
    }
}