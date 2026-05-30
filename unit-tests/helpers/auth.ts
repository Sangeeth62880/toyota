import { type Page, expect } from "@playwright/test";

/**
 * Log in as the Admin user and wait until the admin dashboard is fully loaded.
 *
 * Uses the email/password credentials defined in `.env.test`.
 * After submission the function waits for the URL to settle on `/admin/dashboard`.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@toyota-portal.com";
  const password = process.env.ADMIN_PASSWORD ?? "Toyota@123";

  await page.goto("/login");

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL("**/admin/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

/**
 * Log in as the Sales Officer user and wait until the officer dashboard loads.
 *
 * Uses the email/password credentials defined in `.env.test`.
 * After submission the function waits for the URL to settle on `/officer/dashboard`.
 */
export async function loginAsOfficer(page: Page): Promise<void> {
  const email = process.env.OFFICER_EMAIL ?? "officer@toyota-portal.com";
  const password = process.env.OFFICER_PASSWORD ?? "Toyota@123";

  await page.goto("/login");

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL("**/officer/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/officer\/dashboard/);
}
