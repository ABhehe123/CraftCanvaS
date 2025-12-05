const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// --- IMPORTS ---
const { loginUser } = require('./auth'); 
const { signInWithGoogle } = require('./google_auth_main'); 
const { getInstances, createInstance, deleteInstance, openInstanceFolder } = require('./instances'); 
const { startGame } = require('./launcher'); 

// --- SETTINGS ---
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const settingsManager = {
    load: () => {
        try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
        catch { return { maxMemory: "4G", minMemory: "2G", javaPath: "java" }; }
    },
    save: (data) => fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2))
};

let modLogic;
try { modLogic = require('./mods'); } catch (e) { console.log("Mods logic pending..."); }

let mainWindow; // Store reference

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 1400, height: 900, 
        backgroundColor: '#121212', 
        webPreferences: { 
            preload: path.join(__dirname, 'preload.js'), 
            nodeIntegration: false, 
            contextIsolation: true,
            webSecurity: false 
        } 
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('index.html');
    
    // --- CLOSE CONFIRMATION LOGIC ---
    mainWindow.on('close', (e) => {
        e.preventDefault(); // Stop close immediately
        // Ask renderer if it's okay to close (check for unsaved studio changes)
        mainWindow.webContents.send('check-unsaved-changes');
    });

    // Handle Headers
    mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (d, c) => {
        if(d.responseHeaders['x-frame-options']) delete d.responseHeaders['x-frame-options'];
        if(d.responseHeaders['content-security-policy']) delete d.responseHeaders['content-security-policy'];
        c({ cancel: false, responseHeaders: d.responseHeaders });
    });
}

// --- IPC HANDLERS ---

// 1. CONFIRM CLOSE (From Renderer)
ipcMain.on('app-close-confirmed', () => {
    mainWindow.destroy(); // Force close
});

// 2. EXPORT IMAGE (Triggered by Editor Save)
ipcMain.handle('export-image', async (e, dataUrl, extension) => {
    const win = BrowserWindow.getFocusedWindow();
    
    // Open Save Dialog
    const { filePath } = await dialog.showSaveDialog(win, { 
        title: 'Save Edited Image',
        defaultPath: `edited_image.${extension}`,
        filters: [
            { name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }
        ]
    });
    
    if (filePath) {
        // Remove base64 header
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return { success: true, path: filePath };
    }
    return { success: false, canceled: true };
});

// 3. SETTINGS
ipcMain.handle('get-settings', () => settingsManager.load());
ipcMain.handle('save-settings', (_, s) => settingsManager.save(s));

// 4. INSTANCES
ipcMain.handle('get-instances', () => getInstances());
ipcMain.handle('create-instance', (_, n, v, l) => createInstance(n, v, l));
ipcMain.handle('delete-instance', (_, id) => deleteInstance(id));
ipcMain.handle('open-instance-folder', (_, id) => openInstanceFolder(id));

// 5. AUTH
ipcMain.handle('microsoft-login', async () => {
    try {
        const userProfile = await loginUser(); 
        return { success: true, user: userProfile };
    } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('google-login', async () => {
    try {
        const user = await signInWithGoogle();
        return { success: true, user };
    } catch (e) { return { success: false, error: e.message }; }
});

// 6. LAUNCH
ipcMain.on('launch-game', (event, instanceId, userToken) => {
    const instance = getInstances().find(i => i.id === instanceId);
    if(instance) startGame(event, instance, userToken); 
});

// 7. DOWNLOADS
ipcMain.handle('download-file', async (e, url, defaultName) => {
    const win = BrowserWindow.getFocusedWindow();
    const { filePath } = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        title: "Download File"
    });

    if (filePath) {
        return new Promise((resolve) => {
            const file = fs.createWriteStream(filePath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve({ success: true, path: filePath });
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => {});
                resolve({ success: false, error: err.message });
            });
        });
    }
    return { success: false, canceled: true };
});

// 8. PROJECT SAVING (.cavs) (FIXED: Uses Dialog)
ipcMain.handle('save-project', async (e, content, filePathToUse) => {
    // If we have a valid absolute path, overwrite it (Updates existing file)
    if (filePathToUse && path.isAbsolute(filePathToUse)) {
        fs.writeFileSync(filePathToUse, content);
        return { success: true, path: filePathToUse };
    }

    // Otherwise, Open "Save As" Dialog
    const win = BrowserWindow.getFocusedWindow();
    const { filePath } = await dialog.showSaveDialog(win, { 
        title: 'Save Project',
        filters: [{ name: 'CraftCanvas Project', extensions: ['cavs'] }] 
    });

    if (filePath) {
        fs.writeFileSync(filePath, content);
        return { success: true, path: filePath };
    }
    return { success: false };
});

ipcMain.handle('open-project', async () => {
    const { filePaths } = await dialog.showOpenDialog({ filters: [{ name: 'Canvas File', extensions: ['cavs'] }] });
    if (filePaths[0]) {
        return { success: true, content: fs.readFileSync(filePaths[0], 'utf-8'), path: filePaths[0] };
    }
    return { success: false };
});

// 9. API
ipcMain.handle('scan-dir', async (e, type) => {
    const assetDir = path.join(__dirname, 'assets', type);
    if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });
    return fs.readdirSync(assetDir).map(f => `assets/${type}/${f}`);
});

ipcMain.handle('search-mods', async (e, ...args) => modLogic ? await modLogic.searchMods(...args) : []);
ipcMain.handle('get-mod-details', async (e, ...args) => modLogic ? await modLogic.getModDetails(...args) : null);
ipcMain.handle('get-mod-versions', async (e, ...args) => modLogic ? await modLogic.getModVersions(...args) : []);
ipcMain.handle('get-all-game-versions', async () => modLogic ? await modLogic.getAllGameVersions() : []);
ipcMain.handle('get-all-loaders', async () => modLogic ? await modLogic.getAllLoaders() : []);

ipcMain.on('open-external', (_, url) => shell.openExternal(url));

app.whenReady().then(createWindow);