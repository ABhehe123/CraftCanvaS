const { google } = require('google-auth-library');
const http = require('http');
const url = require('url');
const { shell } = require('electron');

const CLIENT_ID = '340569121090-06pf7683jj4t9ci680bo29m423d12f8f7.apps.googleusercontent.com';
const CLIENT_SECRET = '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gG_';

async function signInWithGoogle() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                if (req.url.indexOf('/?code=') > -1) {
                    const qs = new url.URL(req.url, 'http://localhost').searchParams;
                    const code = qs.get('code');
                    
                    res.end('Login successful! You can close this tab.');
                    server.close();

                    // Create client again with same port to exchange code
                    const port = server.address().port;
                    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, `http://127.0.0.1:${port}`);
                    
                    const { tokens } = await oauth2Client.getToken(code);
                    oauth2Client.setCredentials(tokens);

                    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
                    const userInfo = await oauth2.userinfo.get();
                    
                    resolve({
                        displayName: userInfo.data.name,
                        email: userInfo.data.email,
                        photoUrl: userInfo.data.picture,
                        tags: ["firST UseRS"]
                    });
                }
            } catch (e) {
                reject(e);
                server.close();
            }
        });

        server.listen(0, async () => {
            const port = server.address().port;
            const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, `http://127.0.0.1:${port}`);
            
            const authorizeUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: [
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email'
                ]
            });

            shell.openExternal(authorizeUrl);
        });
    });
}

module.exports = { signInWithGoogle };