const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Auth
    microsoftLogin: () => ipcRenderer.invoke('microsoft-login'),
    googleLogin: () => ipcRenderer.invoke('google-login'),
    
    // Mods
    searchMods: (q, v, l, o, t) => ipcRenderer.invoke('search-mods', q, v, l, o, t),
    getModDetails: (id) => ipcRenderer.invoke('get-mod-details', id),
    getModVersions: (id) => ipcRenderer.invoke('get-mod-versions', id),
    getAllGameVersions: () => ipcRenderer.invoke('get-all-game-versions'),
    getAllLoaders: () => ipcRenderer.invoke('get-all-loaders'),
    downloadFile: (url, name) => ipcRenderer.invoke('download-file', url, name),

    // Studio
    saveProject: (c, n) => ipcRenderer.invoke('save-project', c, n),
    openProject: () => ipcRenderer.invoke('open-project'),
    exportImage: (d, f) => ipcRenderer.invoke('export-image', d, f),
    scanDir: (t) => ipcRenderer.invoke('scan-dir', t),
    pexelsSearch: (q) => ipcRenderer.invoke('pexels-search', q),

    // App Lifecycle (Closing)
    onCheckUnsaved: (callback) => ipcRenderer.on('check-unsaved-changes', callback),
    confirmClose: () => ipcRenderer.send('app-close-confirmed'),

    // Core
    getInstances: () => ipcRenderer.invoke('get-instances'),
    createInstance: (n, v, l) => ipcRenderer.invoke('create-instance', n, v, l),
    deleteInstance: (id) => ipcRenderer.invoke('delete-instance', id),
    openInstanceFolder: (id) => ipcRenderer.invoke('open-instance-folder', id),
    launchInstance: (id, token) => ipcRenderer.send('launch-game', id, token),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (s) => ipcRenderer.invoke('save-settings', s)
});