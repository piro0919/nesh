import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero, dashboard preview, and CTAs for unauthenticated visitors", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Web Push notifications");
    // Multiple "Start free" CTAs (header, hero, final) — assert at least one is visible.
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the docs" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Web Push only/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /From signup to first send/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
  });

  test("Start free CTA links to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start free" }).first().click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});

test("dashboard routes redirect unauthenticated users to sign-in", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/sign-in/);
});
