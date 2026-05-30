import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { createClient } from "@supabase/supabase-js";

async function cleanupTestCars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const supabase = createClient(url, key);
    await supabase.from("car_models").delete().eq("name", "E2E Test Car");
  }
}

test.describe("Admin Operations", () => {
  test.beforeEach(async () => {
    await cleanupTestCars();
  });

  test("admin dashboard shows stat cards", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard");
    await page.waitForSelector("h2");
    await expect(page.getByRole("main").getByText("Active Models")).toBeVisible();
    await expect(page.getByRole("main").getByText("Sales Officers")).toBeVisible();
  });

  test("can add and delete a car model", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/cars");
    await page.getByRole("button", { name: "Add Model" }).click();
    await page.waitForSelector('[role="dialog"]');
    
    await page.getByPlaceholder(/model name/i).fill("E2E Test Car");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("E2E Test Car")).toBeVisible();

    const card = page.locator("article").filter({ hasText: "E2E Test Car" });
    await card.hover();
    await card.getByLabel(/Delete/).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator("article").filter({ hasText: "E2E Test Car" })).toHaveCount(0);
  });

  test("slab ladder shows 3 tiers", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/slabs");
    await page.waitForSelector("table");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(page.locator("tbody tr").nth(0)).toContainText("1,000");
    await expect(page.locator("tbody tr").nth(1)).toContainText("2,000");
    await expect(page.locator("tbody tr").nth(2)).toContainText("3,500");
  });

  test("officers page loads with at least one officer", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/officers");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });
});
