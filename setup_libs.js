const fs = require('fs');
const path = require('path');
const https = require('https');

const libDir = path.join(__dirname, 'libs');
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

const files = [
    // Core
    { url: "https://unpkg.com/fabric@5.3.0/dist/fabric.min.js", name: "fabric.min.js" },
    { url: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js", name: "tf.min.js" },
   // 2. UpscalerJS (Super Resolution)
    {
        url: "https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js",
        name: "upscaler.js"
    },
    // 3. Upscaler Model (Default)
    {
        url: "https://cdn.jsdelivr.net/npm/@upscalerjs/default-model@latest/dist/umd/index.min.js",
        name: "upscaler-model.js"
    },
    // Utilities
    { url: "https://cdn.jsdelivr.net/npm/marked/marked.min.js", name: "marked.min.js" }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => {});
                reject(`Status ${response.statusCode}`);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`✅ Downloaded: ${path.basename(dest)}`);
                    resolve();
                });
            });
        });
        request.on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err.message);
        });
    });
};

(async () => {
    console.log("⬇️  Downloading Libraries...");
    for (const f of files) {
        try { await download(f.url, path.join(libDir, f.name)); } 
        catch (e) { console.error(`❌ Error ${f.name}:`, e); }
    }
    console.log("✨ Setup Complete. RUN 'npm start' NOW.");
})();