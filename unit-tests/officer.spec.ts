import { test, expect } from "@playwright/test";
import { loginAsOfficer } from "./helpers/auth";
import { resetTestData } from "./helpers/db";

test.describe("Officer Operations", () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData();
    await loginAsOfficer(page);
    await page.goto("/officer/dashboard");
    await page.waitForSelector("article", { timeout: 15_000 });
  });

  test("dashboard loads with ₹0 payout and all car cards", async ({ page }) => {
    expect(await page.locator("article").count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText("This Month's Incentive")).toBeVisible();
    
    const payout = page
      .getByRole("complementary")
      .locator("div")
      .filter({ hasText: "This Month's Incentive" })
      .getByText(/₹/)
      .last();
    await expect(payout).toContainText("0");
  });

  test("stepper cannot go below zero", async ({ page }) => {
    const firstCard = page.locator("article").first();
    await expect(firstCard.getByLabel(/Decrease/).first()).toBeDisabled();
  });

  test("tier 2 triggers at exactly 4 units — payout = ₹8,000", async ({ page }) => {
    const firstCard = page.locator("article").first();
    const plusButton = firstCard.getByLabel(/Increase/).first();
    for (let i = 0; i < 4; i++) {
      await plusButton.click();
    }

    const payout = page
      .getByRole("complementary")
      .locator("div")
      .filter({ hasText: "This Month's Incentive" })
      .getByText(/₹/)
      .last();
    await expect(payout).toContainText("8,000", { timeout: 8_000 });
  });

  test("tier 3 triggers at exactly 8 units — payout = ₹28,000", async ({ page }) => {
    const firstCard = page.locator("article").first();
    const plusButton = firstCard.getByLabel(/Increase/).first();
    for (let i = 0; i < 8; i++) {
      await plusButton.click();
    }

    const payout = page
      .getByRole("complementary")
      .locator("div")
      .filter({ hasText: "This Month's Incentive" })
      .getByText(/₹/)
      .last();
    await expect(payout).toContainText("28,000", { timeout: 8_000 });
  });

  test("units across multiple models sum correctly", async ({ page }) => {
    const cards = page.locator("article");
    const firstPlus = cards.first().getByLabel(/Increase/).first();
    const secondPlus = cards.nth(1).getByLabel(/Increase/).first();
    await firstPlus.click();
    await firstPlus.click();
    await secondPlus.click();
    await secondPlus.click();
    await secondPlus.click();

    const payout = page
      .getByRole("complementary")
      .locator("div")
      .filter({ hasText: "This Month's Incentive" })
      .getByText(/₹/)
      .last();
    await expect(payout).toContainText("10,000", { timeout: 8_000 });
  });

  test("save persists data across page refresh", async ({ page }) => {
    const firstCard = page.locator("article").first();
    const plusButton = firstCard.getByLabel(/Increase/).first();
    await plusButton.click();
    await plusButton.click();
    await plusButton.click();

    await page.getByRole("button", { name: /Save Progress/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await page.waitForSelector("article");

    const firstCardAfter = page.locator("article").first();
    await expect(firstCardAfter.locator("span").filter({ hasText: /^3$/ })).toBeVisible({ timeout: 5_000 });
  });

  test("past month is fully editable", async ({ page }) => {
    await page.getByLabel("Previous Month").click();
    await page.waitForTimeout(1_500);

    const firstCard = page.locator("article").first();
    await expect(firstCard.getByLabel(/Increase/).first()).toBeEnabled();
  });

  test("future month navigation is disabled", async ({ page }) => {
    const nextButton = page.getByLabel("Next Month");
    await expect(nextButton).toBeDisabled();
  });
});
