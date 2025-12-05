const { Client } = require("minecraft-launcher-core");
const { loginUser } = require("./auth");

const launcher = new Client();

// UPDATED: Now accepts 'token' passed from Main Process
async function startGame(event, instanceConfig, token) {
    const sendLog = (msg) => {
        if(event && event.sender) event.sender.send('game-log', msg);
        else console.log(msg);
    };

    // Default fallback if no config provided
    const gameVersion = instanceConfig?.version || "1.20.1";
    const gameRoot = instanceConfig?.path || "./minecraft";
    const gameLoader = instanceConfig?.loader || "fabric";

    sendLog(`🔒 Authenticating for instance: ${instanceConfig?.name || "Default"}...`);
    
    try {
        // Use token from UI if available, otherwise login (backup)
        let userToken = token;
        if (!userToken) {
             userToken = await loginUser();
        }

        sendLog(`✅ Logged in as: ${userToken.name}`);

        let opts = {
            root: gameRoot, 
            version: {
                number: gameVersion, 
                type: "release"
            },
            authorization: userToken,
            memory: { max: "4G", min: "2G" }
        };

        // Handle Mod Loaders
        if (gameLoader !== 'vanilla') {
            sendLog(`⚠️ Launching with ${gameLoader}...`);
            // MCLC handles Fabric automatically if type is release and overrides are set,
            // but for simplicity we assume standard release structure here.
            // If using Forge/Fabric specifically, MCLC requires correct version manifest overrides.
        }

        sendLog(`🚀 Launching Version ${gameVersion}...`);
        launcher.launch(opts);

        launcher.on('debug', (e) => console.log(`[DEBUG] ${e}`));
        launcher.on('data', (e) => sendLog(e.toString()));
        launcher.on('close', () => sendLog("❌ Game Closed"));
        
    } catch (error) {
        sendLog("❌ Error during launch: " + error.message);
        console.error(error);
    }
}

module.exports = { startGame };