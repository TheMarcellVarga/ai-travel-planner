import { expect, test } from "@playwright/test";

test("phone layouts keep account navigation and homepage content readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();

    const layout = await page.evaluate(() => {
      const metrics = Array.from(document.querySelectorAll(".route-proof__metrics li"));
      const destinations = Array.from(document.querySelectorAll(".atlas-row"));
      return {
        metricsSeparated: metrics.every((item) => {
          const value = item.querySelector("strong")!.getBoundingClientRect();
          const detail = item.querySelector("div")!.getBoundingClientRect();
          return value.right <= detail.left || value.bottom <= detail.top;
        }),
        destinationsInView: destinations.every((item) => {
          const box = item.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth;
        })
      };
    });
    expect(layout.metricsSeparated).toBe(true);
    expect(layout.destinationsInView).toBe(true);

    await page.locator(".atlas-section").scrollIntoViewIfNeeded();
    expect(await page.locator(".site-header").evaluate((header) => header.getBoundingClientRect().bottom)).toBeLessThan(0);

    await page.goto("/auth");
    const email = page.getByLabel("Demo email address");
    expect(await email.evaluate((input) => parseFloat(getComputedStyle(input).fontSize))).toBeGreaterThanOrEqual(16);
    await page.getByRole("button", { name: "Enter Demo Mode" }).click();
    await expect(page).toHaveURL(/\/saved$/);
    // Next dev redirects form posts to localhost; resume on the configured
    // test origin where the browser's demo cookie was issued.
    await page.goto("/saved");
    await expect(page.locator(".site-command .auth-chip")).toBeVisible();
    await page.locator(".site-command .auth-chip").click();
    await expect(page).toHaveURL(/\/account$/);
    await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  }
});

test("story pins revert when switching to tablet or reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".route-story .pin-spacer")).toHaveCount(2);

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.locator(".route-story .pin-spacer")).toHaveCount(0);
  expect(await page.locator(".route-story__card").first().evaluate((card) => getComputedStyle(card).visibility)).toBe("visible");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".route-story .pin-spacer")).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".route-story .pin-spacer")).toHaveCount(0);
});
