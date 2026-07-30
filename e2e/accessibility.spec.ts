import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const criticalRoutes = [
  { path: "/", name: "homepage" },
  { path: "/planner", name: "planner" },
  { path: "/auth", name: "authentication" },
  { path: "/saved", name: "saved routes" }
] as const;

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical"
  );

  expect(seriousViolations).toEqual([]);
}

for (const route of criticalRoutes) {
  test(`${route.name} has no serious automated accessibility violations`, async ({
    page
  }) => {
    await page.goto(route.path);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });
}

test("keyboard users can skip directly to the main content", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
});

test("reduced motion disables meaningful animation and transition durations", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  expect(
    await page.evaluate(() => {
      const maximumAllowedDurationMs = 1;

      const parseDurationList = (value: string) =>
        value.split(",").map((duration) => {
          const normalizedDuration = duration.trim();
          return normalizedDuration.endsWith("ms")
            ? Number.parseFloat(normalizedDuration)
            : Number.parseFloat(normalizedDuration) * 1_000;
        });

      return [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => element.getClientRects().length > 0)
        .flatMap((element) => {
          const styles = window.getComputedStyle(element);
          const durations = [
            ...parseDurationList(styles.animationDuration),
            ...parseDurationList(styles.transitionDuration)
          ];

          return durations.some(
            (duration) => duration > maximumAllowedDurationMs
          )
            ? [
                {
                  element: element.tagName.toLowerCase(),
                  animationDuration: styles.animationDuration,
                  transitionDuration: styles.transitionDuration
                }
              ]
            : [];
        });
    })
  ).toEqual([]);
});
