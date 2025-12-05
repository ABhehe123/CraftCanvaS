const { Auth } = require("msmc");

async function loginUser() {
    // 1. Initialize the Auth Manager
    const authManager = new Auth("select_account");

    // 2. Launch the login window (using Electron popup)
    const xboxManager = await authManager.launch("electron");

    // 3. Generate the Minecraft Token
    const token = await xboxManager.getMinecraft();

    // 4. Return the formatted token
    return token.mclc();
}

module.exports = { loginUser };