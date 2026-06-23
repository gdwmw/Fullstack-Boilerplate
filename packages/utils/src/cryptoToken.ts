const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const KEY_LENGTH = 256;
const KEY_USAGE_INFO = "refresh-token-encryption";
const KEY_USAGE_SALT = "netly-refresh-token";

const deriveKey = async (secret: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();

  const keyMaterial = await globalThis.crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);

  return globalThis.crypto.subtle.deriveKey(
    {
      hash: "SHA-256",
      info: encoder.encode(KEY_USAGE_INFO),
      name: "HKDF",
      salt: encoder.encode(KEY_USAGE_SALT),
    },
    keyMaterial,
    { length: KEY_LENGTH, name: ALGORITHM },
    false,
    ["decrypt", "encrypt"],
  );
};

export const encryptToken = async (plaintext: string, secret: string): Promise<string> => {
  const key = await deriveKey(secret);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await globalThis.crypto.subtle.encrypt({ iv, name: ALGORITHM }, key, new TextEncoder().encode(plaintext));

  const ivB64 = Buffer.from(iv).toString("base64url");
  const ciphertextB64 = Buffer.from(ciphertext).toString("base64url");

  return `${ivB64}.${ciphertextB64}`;
};

export const decryptToken = async (encrypted: string, secret: string): Promise<string> => {
  const parts = encrypted.split(".");
  const ivB64 = parts[0];
  const ciphertextB64 = parts[1];

  if (!ivB64 || !ciphertextB64) {
    throw new Error("invalid encrypted token format");
  }

  const key = await deriveKey(secret);
  const iv = Buffer.from(ivB64, "base64url");
  const ciphertext = Buffer.from(ciphertextB64, "base64url");

  const plaintext = await globalThis.crypto.subtle.decrypt({ iv, name: ALGORITHM }, key, ciphertext);

  return new TextDecoder().decode(plaintext);
};
