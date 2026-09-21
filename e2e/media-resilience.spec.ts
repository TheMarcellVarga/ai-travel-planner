import { expect, test } from "@playwright/test";

test("remote editorial media degrades to bundled route artwork", async ({
  page
}) => {
  await page.route("**/_next/image?*", async (route) => {
    const source = new URL(route.request().url()).searchParams.get("url");

    if (source?.startsWith("http")) {
      await route.abort("failed");
      return;
    }

    await route.continue();
  });

  await page.goto("/");

  const editorialImage = page.locator(".kinetic-story__image");
  await editorialImage.scrollIntoViewIfNeeded();
  await expect(editorialImage).toHaveAttribute(
    "data-media-state",
    "degraded"
  );
  await expect(editorialImage).toHaveAttribute("alt", "");
  await expect(editorialImage).toHaveAttribute(
    "src",
    /route-ribbon-hero\.png/
  );
});
