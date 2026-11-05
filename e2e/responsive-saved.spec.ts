import { expect, test } from "@playwright/test";

test("saved routes stay compact and actionable on small screens", async ({ page, context }) => {
  await context.addCookies([{
    name: "wild_route_demo_user",
    value: "demo@example.com",
    url: "http://127.0.0.1:3217"
  }]);

  for (const width of [320, 390, 672, 900, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/saved");
    const layout = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const header = box(".site-header");
      const title = box(".planner-stage-title");
      const action = box(".vault-plan-action");
      const panels = Array.from(document.querySelectorAll(".vault-panel"), (element) => element.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        headerBottom: header.bottom,
        titleTop: title.top,
        actionBottom: action.bottom,
        firstPanelTop: panels[0].top,
        panels: panels.map(({ left, right }) => ({ left, right }))
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.headerBottom).toBeLessThanOrEqual(layout.titleTop);
    expect(layout.firstPanelTop - layout.actionBottom).toBeLessThan(60);
    expect(layout.panels.every(({ left, right }) => left >= 0 && right <= width)).toBe(true);
    await expect(page.getByRole("link", { name: "Plan a route" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plan a route" })).toBeEnabled();
  }
  await page.getByRole("link", { name: "Plan a route" }).click();
  await expect(page).toHaveURL(/\/planner$/);
});
