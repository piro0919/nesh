import { expect, test } from "@playwright/test";

function randomEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nesh-test.local`;
}

const PASSWORD = "Test-Password-1234!";

test("sign up, create a project, and see SDK setup", async ({ page }) => {
  const email = randomEmail();

  // Sign up
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  // After sign-up the app routes us into /projects (or onto sign-in if email
  // confirmation is required — the local Supabase config has confirmations off).
  await page.waitForURL(/\/projects(\b|\/)/, { timeout: 15_000 });

  // Empty state shows both a header button and an empty-state CTA — either is fine.
  await page.getByRole("link", { name: /new project/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/new$/);

  // Create a project with a unique name.
  const projectName = `e2e-proj-${Date.now()}`;
  await page.getByLabel("Name").fill(projectName);
  await page.getByRole("button", { name: /^create/i }).click();

  // Land on the project overview. VAPID keys are auto-generated and surfaced
  // on the dedicated SDK setup sub-route.
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}\b/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  const projectId = page.url().match(/\/projects\/([0-9a-f-]{36})/)![1];
  await page.goto(`/projects/${projectId}/sdk`);
  await expect(page.getByRole("heading", { name: /SDK setup/i }).first()).toBeVisible();
  await expect(page.getByText(/apiBase/).first()).toBeVisible();

  // Sign out from the header
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
