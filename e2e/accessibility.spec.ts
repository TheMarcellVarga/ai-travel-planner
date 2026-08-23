import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const criticalRoutes = [
  { path: "/", name: "homepage" },
  { path: "/planner", name: "planner" },
  { path: "/auth", name: "authentication" },
  { path: "/saved", name: "saved routes" },
  { path: "/account", name: "account" }
] as const;

const keyboardFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical"
  );

  expect(seriousViolations).toEqual([]);
}

async function expectSequentialKeyboardOrder(page: Page) {
  const expectedOrder = await page
    .locator(keyboardFocusableSelector)
    .evaluateAll((elements) =>
      elements.flatMap((element, index) => {
        const htmlElement = element as HTMLElement;
        const styles = window.getComputedStyle(htmlElement);
        const closedDetails = htmlElement.closest("details:not([open])");
        const isDisclosureSummary = htmlElement.tagName === "SUMMARY";
        const rect = htmlElement.getBoundingClientRect();
        const intersectsViewport =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;
        const isVisible =
          htmlElement.getRootNode() === document &&
          htmlElement.getClientRects().length > 0 &&
          intersectsViewport &&
          styles.display !== "none" &&
          styles.visibility !== "hidden" &&
          !htmlElement.closest("[hidden], [inert]") &&
          (!closedDetails || isDisclosureSummary);

        if (!isVisible) {
          return [];
        }

        const keyboardOrderId = `keyboard-order-${index}`;
        htmlElement.dataset.keyboardOrderId = keyboardOrderId;

        return [
          {
            id: keyboardOrderId,
            description:
              htmlElement.getAttribute("aria-label") ||
              htmlElement.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ||
              htmlElement.getAttribute("name") ||
              htmlElement.tagName.toLowerCase()
          }
        ];
      })
    );

  expect(expectedOrder.length).toBeGreaterThan(0);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  for (const expectedElement of expectedOrder) {
    let focusedElementId: string | undefined;

    for (let attempt = 0; attempt < 3 && !focusedElementId; attempt += 1) {
      await page.keyboard.press("Tab");
      focusedElementId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.dataset.keyboardOrderId
      );
    }

    expect(
      focusedElementId,
      `Expected keyboard focus to reach “${expectedElement.description}” in DOM order.`
    ).toBe(expectedElement.id);
  }
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

for (const route of criticalRoutes) {
  test(`${route.name} exposes every visible control in sequential keyboard order`, async ({
    page
  }) => {
    await page.goto(route.path);
    await expect(page.locator("main")).toBeVisible();
    await expectSequentialKeyboardOrder(page);
  });
}

test("demo account and saved-route controls remain sequentially keyboard accessible", async ({
  page
}) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Enter Demo Mode" }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expectSequentialKeyboardOrder(page);

  await page.goto("/account");
  await expect(page.locator("main")).toBeVisible();
  await expectSequentialKeyboardOrder(page);
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
