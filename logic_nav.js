let browseIconInterval = null;
let particleInterval = null;

window.switchTab = (tabId) => {
    // 1. Hide all tabs
    document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
    
    // 2. Deactivate nav buttons
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // 3. Hide details if open
    const dv = document.getElementById('detail-view');
    if(dv) dv.classList.add('hidden');
    
    // 4. Show Target
    const target = document.getElementById(`tab-${tabId}`);
    const btn = document.getElementById(`nav-${tabId}`);
    
    if(target) target.classList.remove('hidden');
    if(btn) btn.classList.add('active');

    // 5. CHANGE BACKGROUNDS & HANDLE LOGIC
    const content = document.getElementById('main-content');
    
    // Reset background by default
    content.style.backgroundImage = 'none';

    if (tabId === 'play') {
        content.style.backgroundImage = "url('assets/tab_ui images/Grass.png')";
    } 
    else if (tabId === 'instances') {
        content.style.backgroundImage = "url('assets/tab_ui images/Ocean.png')";
        setTimeout(() => { if(window.loadInstancesUI) window.loadInstancesUI(); }, 50);
    }
    else if (tabId === 'browse') {
        if(window.currentBrowseType) window.switchBrowseType(window.currentBrowseType);
        else content.style.backgroundImage = "url('assets/tab_ui images/End.png')";
    }
    else if (tabId === 'about') {
        // Use End background for About tab because it looks nice
        content.style.backgroundImage = "url('assets/tab_ui images/End.png')";
    }
    else if (tabId === 'studio') {
        if(window.terminateStudio) window.terminateStudio();
        setTimeout(() => {
            if(window.initStudio) window.initStudio();
        }, 100);
    }
};

// ... Rest of animations code remains same ...
const browseIcons = [
    'assets/tab_ui images/eye.png',
    'assets/tab_ui images/redstone.png',
    'assets/tab_ui images/sun.png'
];
let browseIdx = 0;

function startBrowseAnimations() {
    const img = document.getElementById('browse-icon-img');
    if(!img) return;

    if(browseIconInterval) clearInterval(browseIconInterval);
    browseIconInterval = setInterval(() => {
        browseIdx = (browseIdx + 1) % browseIcons.length;
        img.src = browseIcons[browseIdx];
    }, 5000); 

    const btn = document.getElementById('nav-browse');
    if(!btn) return;

    if(particleInterval) clearInterval(particleInterval);
    particleInterval = setInterval(() => {
        spawnParticle(btn);
    }, 800); 
}

function spawnParticle(parent) {
    const p = document.createElement('div');
    p.classList.add('particle');
    
    // Random Start Pos within button
    const rect = parent.getBoundingClientRect();
    // We append to parent to keep position relative
    
    const startX = 20 + Math.random() * 20; // Near the icon
    const startY = 20 + Math.random() * 20;

    p.style.left = startX + 'px';
    p.style.top = startY + 'px';

    // Random direction
    const tx = (Math.random() - 0.5) * 50 + 'px';
    const ty = (Math.random() - 1.0) * 50 + 'px'; // Move Up mostly

    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    p.style.animation = `particle-anim 2s forwards`;

    parent.appendChild(p);
    
    // Cleanup
    setTimeout(() => { p.remove(); }, 2000);
}

// Default tab
document.addEventListener('DOMContentLoaded', () => {
    startBrowseAnimations();
    window.switchTab('play'); 
});