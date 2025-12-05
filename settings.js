const fs = require('fs');
const path = require('path');
const https = require('https');

const libDir = path.join(__dirname, 'libs');
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir);

const files = [
    { url: "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js", name: "fabric.min.js" },
    { url: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js", name: "tf.min.js" },
    { url: "https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js", name: "upscaler.js" },
    { url: "https://cdn.jsdelivr.net/npm/@upscalerjs/default-model@latest/dist/umd/index.min.js", name: "upscaler-model.js" }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) { reject(response.statusCode); return; }
            response.pipe(file);
            file.on('finish', () => { file.close(resolve); console.log(`Downloaded ${path.basename(dest)}`); });
        }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err.message); });
    });
};

(async () => {
    console.log("Setting up libs...");
    for (const f of files) await download(f.url, path.join(libDir, f.name));
    console.log("Done.");
})();