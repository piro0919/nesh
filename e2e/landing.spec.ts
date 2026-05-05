import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero, dashboard preview, and CTAs for unauthenticated visitors", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Web Push notifications");
    await expect(page.getByRole("link", { name: "Get started — free" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View on GitHub" })).toBeVisible();
    // The branded sections we shipped earlier:
    await expect(page.getByText("The dashboard", { exact: true })).toBeVisible();
    await expect(page.getByText("How it works", { exact: true })).toBeVisible();
    await expect(page.getByText("FAQ", { exact: true })).toBeVisible();
  });

  test("Get started CTA links to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get started — free" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});

test("dashboard routes redirect unauthenticated users to sign-in", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/sign-in/);
});
