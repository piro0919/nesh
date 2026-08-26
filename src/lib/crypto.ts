import { webcrypto } from "node:crypto";

let cachedKey: webcrypto.CryptoKey | null = null;

async function getKey(): Promise<webcrypto.CryptoKey> {
  if (cachedKey) return cachedKey;
  const raw = process.env.VAPID_KEY_ENCRYPTION_KEY;
  if (!raw) throw new Error("VAPID_KEY_ENCRYPTION_KEY is not set");
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length !== 32) {
    throw new Error("VAPID_KEY_ENCRYPTION_KEY must decode to 32 bytes");
  }
  cachedKey = await webcrypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
  return cachedKey;
}

// Format: "<iv-base64url>.<ciphertext+tag-base64url>"
const CIPHER_DELIMITER = ".";

export async function encryptString(plain: string): Promise<string> {
  const key = await getKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ct = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return `${Buffer.from(iv).toString("base64url")}${CIPHER_DELIMITER}${Buffer.from(ct).toString("base64url")}`;
}

export async function decryptString(cipher: string): Promise<string> {
  const idx = cipher.indexOf(CIPHER_DELIMITER);
  if (idx <= 0) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(cipher.slice(0, idx), "base64url");
  const ct = Buffer.from(cipher.slice(idx + 1), "base64url");
  const key = await getKey();
  const pt = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export function isEncrypted(value: string): boolean {
  // Encrypted values always contain the delimiter; raw VAPID base64url keys never do.
  return value.includes(CIPHER_DELIMITER);
}
