document.addEventListener('DOMContentLoaded', () => {
    const masterPasswordSection = document.getElementById('master-password-section');
    const mainContent = document.getElementById('main-content');
    const setMasterPasswordButton = document.getElementById('set-master-password');
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

    setMasterPasswordButton.addEventListener('click', async () => {
        const masterPassword = masterPasswordInput.value;
        if (masterPassword.length < 8) {
            alert('Master password must be at least 8 characters long.');
            return;
        }
        try {
            encryptionKey = await deriveKey(masterPassword);
            masterPasswordSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            loadVault();
        } catch (error) {
            console.error('Error deriving key:', error);
            alert('Could not set master password. Please try again.');
        }
    });

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

    async function saveVault() {
        const encryptedVault = await encrypt(JSON.stringify(vault), encryptionKey);
        localStorage.setItem('vault', JSON.stringify(encryptedVault));
    }

    async function loadVault() {
        const encryptedVault = localStorage.getItem('vault');
        if (encryptedVault) {
            try {
                const decryptedVault = await decrypt(JSON.parse(encryptedVault), encryptionKey);
                vault = JSON.parse(decryptedVault);
                renderVault();
            } catch (error) {
                console.error('Error decrypting vault:', error);
                alert('Could not decrypt vault. Master password may be incorrect.');
            }
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

        vault.push({ website, username, password });
        await saveVault();
        renderVault();

        websiteInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
    });

    vaultContent.addEventListener('click', async (event) => {
        const target = event.target;
        const index = target.dataset.index;

        if (target.classList.contains('view-password')) {
            alert(`Password: ${vault[index].password}`);
        }

        if (target.classList.contains('delete-credential')) {
            if (confirm('Are you sure you want to delete this credential?')) {
                vault.splice(index, 1);
                await saveVault();
                renderVault();
            }
        }

        if (target.classList.contains('edit-credential')) {
            const newWebsite = prompt('Enter new website:', vault[index].website);
            const newUsername = prompt('Enter new username:', vault[index].username);
            const newPassword = prompt('Enter new password:', vault[index].password);

            if (newWebsite && newUsername && newPassword) {
                vault[index] = { website: newWebsite, username: newUsername, password: newPassword };
                await saveVault();
                renderVault();
            }
        }
    });
});