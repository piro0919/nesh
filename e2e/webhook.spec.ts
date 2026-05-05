import { createHmac, timingSafeEqual } from "node:crypto";
import { type AddressInfo, createServer, type Server } from "node:http";
import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const PASSWORD = "Test-Password-1234!";

function randomEmail(): string {
  return `e2e-wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nesh-test.local`;
}

type Hit = {
  body: string;
  signature: string;
  event: string;
};

function startReceiver(): { server: Server; url: () => string; hits: Hit[] } {
  const hits: Hit[] = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      hits.push({
        body,
        signature: String(req.headers["x-nesh-signature"] ?? ""),
        event: String(req.headers["x-nesh-event"] ?? ""),
      });
      res.writeHead(200);
      res.end();
    });
  });
  server.listen(0, "127.0.0.1");
  const url = () => {
    const addr = server.address() as AddressInfo;
    return `http://127.0.0.1:${addr.port}/`;
  };
  return { server, url, hits };
}

async function setup(page: Page): Promise<{ projectId: string; apiKey: string; secret: string }> {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(randomEmail());
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/projects(\b|\/)/, { timeout: 15_000 });

  await page.getByRole("link", { name: /new project/i }).click();
  await page.getByLabel("Name").fill(`wh-${Date.now()}`);
  await page.getByRole("button", { name: /^create/i }).click();
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}\b/, { timeout: 15_000 });
  const projectId = page.url().match(/\/projects\/([0-9a-f-]{36})/)![1];

  // Reveal API key (first "Show" button on the page is the API key card).
  await page
    .getByRole("button", { name: /^show$/i })
    .first()
    .click();
  const apiKey = (await page
    .locator("code", { hasText: /^nesh_sk_/ })
    .first()
    .textContent())!;

  return { projectId, apiKey, secret: "" };
}

async function configureWebhook(page: Page, url: string): Promise<string> {
  await page.getByLabel("Endpoint URL").fill(url);
  await page.getByRole("button", { name: /create webhook/i }).click();
  await expect(page.getByText("Saved.")).toBeVisible({ timeout: 5_000 });

  // The SecretRow is rendered only when the page sees the webhook row, which
  // happens on the next server-rendered visit. revalidatePath doesn't bring
  // the SecretRow into the existing client tree, so reload to pick it up.
  await page.reload();

  // Reveal the secret. After reload, "Show" buttons exist for the API key
  // card AND the webhook secret row — the webhook one is the second.
  await page
    .getByRole("button", { name: /^show$/i })
    .nth(1)
    .click();
  const secret = (await page
    .locator("code", { hasText: /^whsec_/ })
    .first()
    .textContent())!;
  return secret;
}

function verifySignature(body: string, header: string, secret: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

test.describe
  .serial("Webhook delivery", () => {
    let receiver: ReturnType<typeof startReceiver>;
    let projectId: string;
    let apiKey: string;
    let secret: string;
    let request: APIRequestContext;

    test.beforeAll(async ({ browser, playwright }) => {
      receiver = startReceiver();

      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const s = await setup(page);
      projectId = s.projectId;
      apiKey = s.apiKey;
      secret = await configureWebhook(page, receiver.url());
      await ctx.close();

      request = await playwright.request.newContext({
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
      });
    });

    test.afterAll(async () => {
      await request.dispose();
      await new Promise<void>((resolve) => receiver.server.close(() => resolve()));
    });

    test("fires a signed notification.sent payload after a REST send", async () => {
      const before = receiver.hits.length;

      const send = await request.post(`/api/v1/projects/${projectId}/notifications`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { title: "Webhook test", body: "Should fire" },
      });
      expect(send.status()).toBe(201);
      const { id: notificationId } = await send.json();

      // Webhook delivery is fire-and-best-effort but awaited inside the action,
      // so by the time the response returns it should have hit our receiver.
      // Allow a small grace period for slow CI machines.
      await expect.poll(() => receiver.hits.length, { timeout: 10_000 }).toBeGreaterThan(before);

      const hit = receiver.hits[receiver.hits.length - 1];
      expect(hit.event).toBe("notification.sent");
      expect(hit.signature).toMatch(/^sha256=[0-9a-f]{64}$/);
      expect(verifySignature(hit.body, hit.signature, secret)).toBe(true);

      const payload = JSON.parse(hit.body);
      expect(payload).toMatchObject({
        type: "notification.sent",
        notification: {
          id: notificationId,
          project_id: projectId,
          title: "Webhook test",
          body: "Should fire",
        },
      });
    });
  });
