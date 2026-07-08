// ─── Ripple v2 Client-Side Crypto Utilities ───────────────────────────────────
// All encryption/decryption happens in the browser using the Web Crypto API.
// The server never receives or stores raw health data.

const PBKDF2_ITERATIONS = 600_000; // NIST 2023 recommendation
const SALT_KEY = "ripple_vault_salt";

/** Get or create a persistent per-device salt stored in localStorage */
export function getOrCreateSalt(): Uint8Array {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

/** Derive an AES-GCM CryptoKey from a passphrase using PBKDF2 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const saltBuffer = salt.buffer instanceof ArrayBuffer ? salt.buffer : new Uint8Array(salt).buffer;
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a plaintext string with AES-GCM. Returns { iv, data } as base64 strings. */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ iv: string; data: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return {
    iv: btoa(Array.from(iv).map((b) => String.fromCharCode(b)).join("")),
    data: btoa(Array.from(new Uint8Array(ciphertext)).map((b) => String.fromCharCode(b)).join("")),
  };
}

/** Decrypt an { iv, data } payload back to a plaintext string. */
export async function decryptData(
  iv: string,
  data: string,
  key: CryptoKey
): Promise<string> {
  const ivArr = atob(iv).split("").map((c) => c.charCodeAt(0));
  const dataArr = atob(data).split("").map((c) => c.charCodeAt(0));
  const ivBuffer = new Uint8Array(ivArr).buffer;
  const dataBuffer = new Uint8Array(dataArr).buffer;
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    dataBuffer
  );
  return new TextDecoder().decode(decrypted);
}

/** The constant passphrase used for ambient (frictionless) vault mode */
export const AMBIENT_PASSPHRASE = "RIPPLE_AMBIENT_VAULT_2026_SECURE";

/** Verification token stored to confirm vault key is correct */
export const VAULT_VERIFICATION_TOKEN = "RIPPLE_VAULT_OK_V2";
export const VAULT_VERIFICATION_KEY = "ripple_vault_verification";
export const VAULT_TYPE_KEY = "ripple_vault_type";
export const VAULT_CONFIGURED_KEY = "ripple_vault_configured";
export const ONBOARDING_KEY = "ripple_onboarding_completed";
export const LEGAL_ACCEPTED_KEY = "ripple_legal_accepted";

/** Encrypt and save a value to localStorage under a given key */
export async function encryptAndSave(
  storageKey: string,
  value: string,
  key: CryptoKey
): Promise<void> {
  const encrypted = await encryptData(value, key);
  localStorage.setItem(storageKey, JSON.stringify(encrypted));
}

/** Load and decrypt a value from localStorage */
export async function loadAndDecrypt(
  storageKey: string,
  key: CryptoKey
): Promise<string | null> {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && "iv" in parsed && "data" in parsed) {
      return await decryptData(parsed.iv, parsed.data, key);
    }
    return stored; // unencrypted legacy data
  } catch {
    return null;
  }
}
