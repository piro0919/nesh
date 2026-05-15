import { generateKeyPairSync, randomBytes } from "node:crypto";
import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const PASSWORD = "Test-Password-1234!";

function randomEmail(): string {
  return `e2e-api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nesh-test.local`;
}

type Setup = {
  projectId: string;
  apiKey: string;
  vapidPublicKey: string;
};

/**
 * Sign up, create a project, and extract its IDs from the dashboard so the
 * downstream API tests have something to talk to. Uses the same UI flow as
 * the auth e2e but reads the values out of the rendered DOM instead of
 * stopping at "I see the SDK setup card".
 */
async function setup(page: Page): Promise<Setup> {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(randomEmail());
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/projects(\b|\/)/, { timeout: 15_000 });

  await page
    .getByRole("link", { name: /new project/i })
    .first()
    .click();
  const projectName = `api-${Date.now()}`;
  await page.getByLabel("Name").fill(projectName);
  await page.getByRole("button", { name: /^create/i }).click();

  await page.waitForURL(/\/projects\/[0-9a-f-]{36}\b/, { timeout: 15_000 });
  const url = page.url();
  const projectId = url.match(/\/projects\/([0-9a-f-]{36})/)![1];

  // VAPID public key lives on the dedicated SDK setup sub-route.
  await page.goto(`/projects/${projectId}/sdk`);
  const vapidPublicKey = await page
    .locator("code", { hasText: /^B[A-Za-z0-9_-]{80,}$/ })
    .first()
    .textContent();
  expect(vapidPublicKey).toMatch(/^B[A-Za-z0-9_-]+$/);

  // API key lives on the REST API sub-route; click "Show" to reveal it.
  await page.goto(`/projects/${projectId}/api`);
  await page
    .getByRole("button", { name: /^show$/i })
    .first()
    .click();
  const apiKey = await page
    .locator("code", { hasText: /^nesh_sk_/ })
    .first()
    .textContent();
  expect(apiKey).toMatch(/^nesh_sk_/);

  return { projectId, apiKey: apiKey!, vapidPublicKey: vapidPublicKey! };
}

/**
 * Mint a realistic browser-shaped PushSubscription. Uses a real P-256 keypair
 * so the 65-byte uncompressed public key passes web-push's length validation
 * end-to-end — the previous `BPm.padEnd(86, "x")` hack was rejected by the
 * server-side send pipeline and inflated the `failed` counter.
 *
 * The endpoint host is a sink we don't control, so an actual send attempt
 * resolves as `removed` / `failed`, not `sent`. That's still the correct shape
 * for asserting the API contract.
 */
function fakeSubscription(suffix: string) {
  const { publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const raw = publicKey.export({ format: "der", type: "spki" });
  // Strip 26-byte SPKI prefix → 65-byte uncompressed point starting with 0x04.
  const p256dh = raw.subarray(raw.length - 65).toString("base64url");
  const auth = randomBytes(16).toString("base64url");
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/test-${suffix}-${Date.now()}`,
    keys: { p256dh, auth },
  };
}

test.describe
  .serial("REST API", () => {
    let projectId: string;
    let apiKey: string;
    let request: APIRequestContext;

    test.beforeAll(async ({ browser, playwright }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const s = await setup(page);
      projectId = s.projectId;
      apiKey = s.apiKey;
      await ctx.close();

      // Independent request context — no auth cookies.
      request = await playwright.request.newContext({
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
      });
    });

    test.afterAll(async () => {
      await request.dispose();
    });

    test("Subscribe accepts a valid payload (201)", async () => {
      const res = await request.post(`/api/v1/projects/${projectId}`, {
        data: { ...fakeSubscription("a"), userId: "alice" },
      });
      expect(res.status()).toBe(201);
      expect(await res.json()).toEqual({ ok: true });
    });

    test("Subscribe rejects malformed body (400)", async () => {
      const res = await request.post(`/api/v1/projects/${projectId}`, {
        data: { endpoint: "not-a-url" },
      });
      expect(res.status()).toBe(400);
    });

    test("Subscribe rejects unknown project (404)", async () => {
      const res = await request.post("/api/v1/projects/00000000-0000-0000-0000-000000000000", {
        data: fakeSubscription("b"),
      });
      expect(res.status()).toBe(404);
    });

    test("Send notification requires Bearer auth (401)", async () => {
      const res = await request.post(`/api/v1/projects/${projectId}/notifications`, {
        data: { title: "x", body: "y" },
      });
      expect(res.status()).toBe(401);
    });

    test("Send notification rejects wrong API key (401)", async () => {
      const res = await request.post(`/api/v1/projects/${projectId}/notifications`, {
        headers: { Authorization: "Bearer nesh_sk_wrong" },
        data: { title: "x", body: "y" },
      });
      expect(res.status()).toBe(401);
    });

    test("Send notification with valid Bearer succeeds (201)", async () => {
      const res = await request.post(`/api/v1/projects/${projectId}/notifications`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { title: "Hello", body: "From API test" },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        attempted: expect.any(Number),
        delivered: expect.any(Number),
        removed: expect.any(Number),
        failed: expect.any(Number),
      });
      // Counters must be self-consistent: every attempted subscription is
      // resolved as exactly one of delivered / removed / failed.
      expect(body.delivered + body.removed + body.failed).toBe(body.attempted);
      // At least the subscription minted in test 1 should have been attempted.
      expect(body.attempted).toBeGreaterThanOrEqual(1);
    });

    test("Events endpoint accepts shown / clicked (200) and rejects bad type (400)", async () => {
      // Send a real notification first so we have a notificationId to track.
      const sendRes = await request.post(`/api/v1/projects/${projectId}/notifications`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { title: "Track test", body: "x" },
      });
      expect(sendRes.status()).toBe(201);
      const { id: notificationId } = await sendRes.json();

      for (const type of ["shown", "clicked"] as const) {
        const res = await request.post(
          `/api/v1/projects/${projectId}/notifications/${notificationId}/events`,
          { data: { type } },
        );
        expect(res.status()).toBe(200);
      }

      // Bad event type should fail validation.
      const bad = await request.post(
        `/api/v1/projects/${projectId}/notifications/${notificationId}/events`,
        { data: { type: "exploded" } },
      );
      expect(bad.status()).toBe(400);
    });

    test("OPTIONS preflight returns 204 with CORS headers", async () => {
      const res = await request.fetch(`/api/v1/projects/${projectId}`, { method: "OPTIONS" });
      expect(res.status()).toBe(204);
      expect(res.headers()["access-control-allow-origin"]).toBe("*");
      expect(res.headers()["access-control-allow-methods"]).toContain("POST");
    });
  });
