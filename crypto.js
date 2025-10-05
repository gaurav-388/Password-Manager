// This file will contain all the cryptographic functions for the password manager.
// We will use the Web Crypto API for encryption and decryption.

const SALT = 'some-random-salt'; // In a real app, this should be unique per user and stored with the encrypted data.
const ITERATIONS = 100000;

async function deriveKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(data, key) {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encoder.encode(data)
    );
    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedData)),
    };
}

async function decrypt(encryptedData, key) {
    const decoder = new TextDecoder();
    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(encryptedData.iv),
        },
        key,
        new Uint8Array(encryptedData.data)
    );
    return decoder.decode(decryptedData);
}