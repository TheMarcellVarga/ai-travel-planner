import { expect, test } from "@playwright/test";

test("homepage and planner remain usable at phone, tablet, and desktop widths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plan a route", exact: true })).toBeVisible();
    await expect(page.locator(".demo-destination")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/planner");
    await expect(page.getByLabel("What kind of trip?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Compose new routes" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("demo account keeps unconnected features disabled", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Your demo workspace." })).toBeVisible();
  await page.getByText("Account features", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Paid plans unavailable" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Upgrade To Pro" })).toHaveCount(0);
});
