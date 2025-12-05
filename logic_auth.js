document.addEventListener('DOMContentLoaded', () => {
    
    // --- GOOGLE LOGIN (Sidebar) ---
    const savedUser = localStorage.getItem('google_user');
    if (savedUser) {
        updateGoogleUI(JSON.parse(savedUser));
    }

    const loginBtn = document.getElementById('btn-google-login');
    if(loginBtn) {
        loginBtn.onclick = async () => {
            try {
                // Call Main Process for Google Login
                const response = await window.electronAPI.googleLogin();
                
                if (response.success) {
                    localStorage.setItem('google_user', JSON.stringify(response.user));
                    updateGoogleUI(response.user);
                } else {
                    alert("Google Login failed");
                }
            } catch (err) {
                console.error(err);
            }
        };
    }

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if(logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('google_user');
            toggleGoogleUI(false);
        };
    }
});

function updateGoogleUI(user) {
    const img = document.getElementById('user-avatar');
    if(img && user.photoUrl) img.src = user.photoUrl;

    const nameEl = document.getElementById('user-name');
    if(nameEl) nameEl.innerText = user.displayName;

    toggleGoogleUI(true);
}

function toggleGoogleUI(isLoggedIn) {
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    
    if(isLoggedIn) {
        loginSection.classList.add('hidden');
        profileSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        profileSection.classList.add('hidden');
    }
}