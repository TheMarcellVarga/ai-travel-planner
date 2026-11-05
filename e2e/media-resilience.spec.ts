import { expect, test } from "@playwright/test";

test("editorial destination media degrades to bundled artwork", async ({ page }) => {
  await page.route("**/_next/image?*", async (route) => {
    const source = new URL(route.request().url()).searchParams.get("url");
    if (source?.includes("/editorial/destinations/")) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await page.goto("/");
  const image = page.locator(".demo-destination__media img").first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("data-media-state", "degraded");
  await expect(image).toHaveAttribute("src", /route-ribbon-hero\.png/);
});
