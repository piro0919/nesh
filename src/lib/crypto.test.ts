import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  // 32 bytes, base64-encoded — same shape as the production env var.
  process.env.VAPID_KEY_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("crypto", () => {
  it("round-trips encryptString → decryptString", async () => {
    const { encryptString, decryptString } = await import("./crypto");
    const plain = "vapid-private-key-FAKE-1234567890";
    const cipher = await encryptString(plain);
    expect(cipher).not.toBe(plain);
    expect(cipher).toContain(".");
    expect(await decryptString(cipher)).toBe(plain);
  });

  it("produces a different ciphertext for the same plaintext (random IV)", async () => {
    const { encryptString } = await import("./crypto");
    const plain = "same-input";
    const a = await encryptString(plain);
    const b = await encryptString(plain);
    expect(a).not.toBe(b);
  });

  it("isEncrypted returns true for ciphertext, false for raw", async () => {
    const { encryptString, isEncrypted } = await import("./crypto");
    const cipher = await encryptString("hello");
    expect(isEncrypted(cipher)).toBe(true);
    expect(isEncrypted("BNlIY3qXi-vapid-public-style-base64url")).toBe(false);
  });

  it("decryptString rejects malformed input", async () => {
    const { decryptString } = await import("./crypto");
    await expect(decryptString("no-delimiter")).rejects.toThrow();
    await expect(decryptString(".missing-iv")).rejects.toThrow();
  });
});
