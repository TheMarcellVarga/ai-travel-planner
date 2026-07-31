import { expect, test } from "@playwright/test";

test("remote destination media degrades to bundled route artwork", async ({
  page
}) => {
  await page.route("**/_next/image?*", async (route) => {
    const source = new URL(route.request().url()).searchParams.get("url");

    if (source?.includes("images.unsplash.com")) {
      await route.abort("failed");
      return;
    }

    await route.continue();
  });

  await page.goto("/");

  const leadDestinationImage = page.locator(".atlas-feature__image");
  await expect(leadDestinationImage).toHaveAttribute(
    "data-media-state",
    "degraded"
  );
  await expect(leadDestinationImage).toHaveAttribute(
    "alt",
    /Local Wild Route artwork is shown/
  );
  await expect(leadDestinationImage).toHaveAttribute(
    "src",
    /route-ribbon-hero\.png/
  );
});
