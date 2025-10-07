document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');
    const emailInput = document.getElementById('email');
    const masterPasswordInput = document.getElementById('master-password');
    const generatePasswordButton = document.getElementById('generate-password');
    const generatedPasswordInput = document.getElementById('generated-password');
    const passwordLengthInput = document.getElementById('password-length');
    const passwordLengthValue = document.getElementById('password-length-value');
    const includeUppercase = document.getElementById('include-uppercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');
    const copyPasswordButton = document.getElementById('copy-password');
    const addCredentialButton = document.getElementById('add-credential');
    const websiteInput = document.getElementById('website');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const vaultContent = document.getElementById('vault-content');

    let encryptionKey;
    let vault = [];

    // --- Authentication ---

    async function hashMasterPassword(password) {
        // In a real app, you'd use a library like bcrypt.js on the frontend
        // For simplicity, we'll use a simple hash (NOT SECURE FOR PRODUCTION)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    registerButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const masterPassword = masterPasswordInput.value;

        if (!email || masterPassword.length < 8) {
            alert('Please provide a valid email and a master password of at least 8 characters.');
            return;
        }

        const masterPasswordHash = await hashMasterPassword(masterPassword);

        try {
            const response = await fetch('http://localhost:5000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, masterPasswordHash }),
            });

            if (response.ok) {
                alert('Registration successful! Please log in.');
            } else {
                const error = await response.json();
                alert(`Registration failed: ${error.msg}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration.');
        }
    });

    loginButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const masterPassword = masterPasswordInput.value;

        if (!email || !masterPassword) {
            alert('Please provide both email and master password.');
            return;
        }

        const masterPasswordHash = await hashMasterPassword(masterPassword);

        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, masterPasswordHash }),
            });

            if (response.ok) {
                const { token } = await response.json();
                localStorage.setItem('token', token);
                
                encryptionKey = await deriveKey(masterPassword);
                authSection.classList.add('hidden');
                mainContent.classList.remove('hidden');
                loadVault();
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login.');
        }
    });


    // --- Password Generation ---

    passwordLengthInput.addEventListener('input', () => {
        passwordLengthValue.textContent = passwordLengthInput.value;
    });

    generatePasswordButton.addEventListener('click', () => {
        const length = passwordLengthInput.value;
        let charset = 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers.checked) charset += '0123456789';
        if (includeSymbols.checked) charset += '!@#$%^&*()';

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        generatedPasswordInput.value = password;
    });

    copyPasswordButton.addEventListener('click', () => {
        generatedPasswordInput.select();
        document.execCommand('copy');
        alert('Password copied to clipboard!');
    });

    // --- Vault Management (to be updated) ---

    async function saveVault() {
        // This will be replaced with API calls
        const encryptedVault = await encrypt(JSON.stringify(vault), encryptionKey);
        localStorage.setItem('vault', JSON.stringify(encryptedVault));
    }

    async function loadVault() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/credentials', {
                headers: { 'x-auth-token': token },
            });

            if (response.ok) {
                const credentials = await response.json();
                vault = [];
                for (const cred of credentials) {
                    const decryptedPassword = await decrypt({
                        iv: JSON.parse(cred.iv),
                        data: JSON.parse(cred.encryptedPassword)
                    }, encryptionKey);
                    vault.push({ ...cred, password: decryptedPassword });
                }
                renderVault();
            } else {
                alert('Failed to load vault.');
            }
        } catch (error) {
            console.error('Error loading vault:', error);
        }
    }

    function renderVault() {
        vaultContent.innerHTML = '';
        vault.forEach((credential, index) => {
            const credentialElement = document.createElement('div');
            credentialElement.classList.add('credential-item');
            credentialElement.innerHTML = `
                <div>
                    <strong>${credential.website}</strong> - <span>${credential.username}</span>
                </div>
                <div>
                    <button class="view-password" data-index="${index}">View</button>
                    <button class="edit-credential" data-index="${index}">Edit</button>
                    <button class="delete-credential" data-index="${index}">Delete</button>
                </div>
            `;
            vaultContent.appendChild(credentialElement);
        });
    }

    addCredentialButton.addEventListener('click', async () => {
        const website = websiteInput.value;
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!website || !username || !password) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const encrypted = await encrypt(password, encryptionKey);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    website,
                    username,
                    encryptedPassword: JSON.stringify(encrypted.data),
                    iv: JSON.stringify(encrypted.iv),
                }),
            });

            if (response.ok) {
                loadVault();
                websiteInput.value = '';
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                alert('Failed to add credential.');
            }
        } catch (error) {
            console.error('Error adding credential:', error);
        }
    });

    vaultContent.addEventListener('click', async (event) => {
        const target = event.target;
        const index = target.dataset.index;
        const credential = vault[index];

        if (target.classList.contains('view-password')) {
            alert(`Password: ${credential.password}`);
        }

        if (target.classList.contains('delete-credential')) {
            if (confirm('Are you sure you want to delete this credential?')) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:5000/api/credentials/${credential._id}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token },
                    });

                    if (response.ok) {
                        loadVault();
                    } else {
                        alert('Failed to delete credential.');
                    }
                } catch (error) {
                    console.error('Error deleting credential:', error);
                }
            }
        }

        if (target.classList.contains('edit-credential')) {
            const newWebsite = prompt('Enter new website:', credential.website);
            const newUsername = prompt('Enter new username:', credential.username);
            const newPassword = prompt('Enter new password:', credential.password);

            if (newWebsite && newUsername && newPassword) {
                try {
                    const encrypted = await encrypt(newPassword, encryptionKey);
                    const token = localStorage.getItem('token');

                    const response = await fetch(`http://localhost:5000/api/credentials/${credential._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token,
                        },
                        body: JSON.stringify({
                            website: newWebsite,
                            username: newUsername,
                            encryptedPassword: JSON.stringify(encrypted.data),
                            iv: JSON.stringify(encrypted.iv),
                        }),
                    });

                    if (response.ok) {
                        loadVault();
                    } else {
                        alert('Failed to update credential.');
                    }
                } catch (error) {
                    console.error('Error updating credential:', error);
                }
            }
        }
    });
});