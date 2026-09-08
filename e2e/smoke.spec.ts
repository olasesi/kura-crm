import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders and links to sign in", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /enterprise customer relationships/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /sign in to kura crm/i })).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});
