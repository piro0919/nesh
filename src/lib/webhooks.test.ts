import { describe, expect, it } from "vitest";
import { generateWebhookSecret, signPayload } from "./webhooks";

describe("signPayload", () => {
  it("produces a stable sha256= hex signature for the same body and secret", () => {
    const a = signPayload("hello", "secret");
    const b = signPayload("hello", "secret");
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it("changes with the body", () => {
    expect(signPayload("a", "secret")).not.toBe(signPayload("b", "secret"));
  });

  it("changes with the secret", () => {
    expect(signPayload("body", "s1")).not.toBe(signPayload("body", "s2"));
  });

  it("matches a known HMAC-SHA256 vector (interop-safe)", () => {
    // Independently computable: hmac-sha256("hi", "k") in any language.
    // Verified via: node -e "console.log(require('crypto').createHmac('sha256','k').update('hi').digest('hex'))"
    expect(signPayload("hi", "k")).toBe(
      "sha256=233f8e9a13f278f19758a015d82f51e6e27966f1efc29d2cffb5d1a45ae9dc4c",
    );
  });
});

describe("generateWebhookSecret", () => {
  it("returns a whsec_-prefixed url-safe token", () => {
    const s = generateWebhookSecret();
    expect(s).toMatch(/^whsec_[A-Za-z0-9_-]+$/);
  });

  it("is unique per call", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 32; i++) seen.add(generateWebhookSecret());
    expect(seen.size).toBe(32);
  });
});
