import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsOfficer } from "./helpers/auth";

test.describe("Authentication & Access Control", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("admin login redirects to /admin/dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("officer login redirects to /officer/dashboard", async ({ page }) => {
    await loginAsOfficer(page);
    await expect(page).toHaveURL(/\/officer\/dashboard/);
  });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
