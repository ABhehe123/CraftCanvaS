const fs = require('fs');
const path = require('path');
const { app, shell } = require('electron');

// Define where instances are stored
const INSTANCES_DIR = path.join(app.getPath('userData'), 'instances');

// Ensure the directory exists
if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true });
}

// 1. Get All Instances
function getInstances() {
    if (!fs.existsSync(INSTANCES_DIR)) return [];
    
    return fs.readdirSync(INSTANCES_DIR).map(dir => {
        const configPath = path.join(INSTANCES_DIR, dir, 'instance.json');
        if (fs.existsSync(configPath)) {
            try {
                return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            } catch(e) { return null; }
        }
        return null;
    }).filter(i => i !== null);
}

// 2. Create Instance
function createInstance(name, version, loader) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const dir = path.join(INSTANCES_DIR, id);
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const config = {
        id,
        name,
        version,
        loader,
        created: Date.now(),
        path: dir
    };

    fs.writeFileSync(path.join(dir, 'instance.json'), JSON.stringify(config, null, 2));
    return config;
}

// 3. Delete Instance
function deleteInstance(id) {
    const dir = path.join(INSTANCES_DIR, id);
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        return true;
    }
    return false;
}

// 4. Open Folder
function openInstanceFolder(id) {
    const dir = path.join(INSTANCES_DIR, id);
    if (fs.existsSync(dir)) {
        shell.openPath(dir);
    }
}

module.exports = { getInstances, createInstance, deleteInstance, openInstanceFolder };