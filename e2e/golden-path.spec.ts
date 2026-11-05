import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("demo user can plan, compare, save, publish, and continue to providers", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/auth");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.goto("/planner");
  await expect(page.locator(".route-studio__dock")).toBeHidden();
  await page.getByLabel("What kind of trip?").fill("Find a 10 day surf and hiking route from Lisbon with one stop.");
  await page.getByText("Trip preferences", { exact: true }).click();
  await page.getByRole("textbox", { name: "Origin", exact: true }).fill("Lisbon");
  await page.getByRole("spinbutton", { name: "Trip length days" }).fill("10");
  // Collapsing controls must preserve unsaved preferences.
  const controls = page.getByRole("button", { name: "Route controls" });
  await controls.click();
  await controls.click();
  await expect(page.getByRole("textbox", { name: "Origin", exact: true })).toHaveValue("Lisbon");
  await page.getByRole("button", { name: "Compose new routes" }).click();
  await expect(page.locator("main h1")).toContainText("Breakline");
  const cards = page.getByRole("region", { name: "Ranked route options" }).getByRole("button");
  await expect(cards).toHaveCount(4);
  await cards.nth(1).click();
  await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
  const title = await page.locator("main h1").innerText();
  await page.locator(".route-studio-actions summary").click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".route-studio-actions__message")).toContainText("Saved");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open share", exact: true })).toBeVisible();
  const sharePath = await page.getByRole("link", { name: "Open share", exact: true }).getAttribute("href");
  expect(sharePath).toMatch(/^\/share\/preview-/);
  await page.goto(sharePath!);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  await page.locator(".route-studio-actions summary").click();
  await page.getByRole("button", { name: "Open booking handoff" }).click();
  const providerLink = page.getByRole("link", { name: "Continue to flight search" });
  await expect(providerLink).toHaveAttribute("href", /google\.com\/travel\/flights/, { timeout: 30_000 });
  await expect(providerLink).toHaveAttribute("target", "_blank");
  await page.goto("/saved");
  await expect(page.getByText(title, { exact: true })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open preview share" })).toBeVisible();
});

test("planner failure keeps the brief available for retry", async ({ page }) => {
  await page.route("**/api/trips/plan", route => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.goto("/planner");
  const prompt = page.getByLabel("What kind of trip?");
  await prompt.fill("Hiking from Singapore");
  await page.getByRole("button", { name: "Compose new routes" }).click();
  await expect(page.locator(".route-studio__error")).toContainText("try again");
  await expect(prompt).toHaveValue("Hiking from Singapore");
  await expect(page.getByRole("button", { name: "Compose new routes" })).toBeEnabled();
});

test("Enter submits a valid trip brief and Shift+Enter adds a line", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/trips/plan", route => {
    requests += 1;
    return route.fulfill({ status: 503, json: { error: "Unavailable" } });
  });
  await page.goto("/planner");
  const prompt = page.getByLabel("What kind of trip?");
  await prompt.press("Enter");
  expect(requests).toBe(0);
  await prompt.fill("Hiking from Singapore");
  await prompt.press("Shift+Enter");
  await expect(prompt).toHaveValue("Hiking from Singapore\n");
  expect(requests).toBe(0);
  await prompt.press("Enter");
  await expect(page.locator(".route-studio__error")).toContainText("try again");
  expect(requests).toBe(1);
});

test("selected routes retain reasoning, source attribution, and honest price status", async ({ page }) => {
  await page.goto("/planner");
  await page.getByLabel("What kind of trip?").fill("Find a 10 day surf and hiking route from Lisbon with one stop.");
  await page.getByText("Trip preferences", { exact: true }).click();
  await page.getByRole("textbox", { name: "Origin", exact: true }).fill("Lisbon");
  await page.getByRole("spinbutton", { name: "Trip length days" }).fill("10");
  await page.getByRole("button", { name: "Compose new routes" }).click();

  const routes = page.getByRole("region", { name: "Ranked route options" }).getByRole("button");
  await expect(routes).toHaveCount(4);
  await routes.first().click();
  await expect(page.getByText("No live fare or stay inventory was queried", { exact: true })).toBeVisible();

  const details = page.locator(".route-studio__inspector-details");
  await details.nth(0).locator("summary").click();
  await expect(page.locator(".route-studio__reasons p").first()).toBeVisible();
  await details.nth(1).locator("summary").click();
  await expect(page.locator(".route-studio__stops .media-credit").first()).toBeAttached();

  await page.locator(".route-studio__cost-details summary").click();
  await expect(page.locator(".route-studio__cost-assumptions li").first()).toBeVisible();
  await expect(page.getByText(/External providers own final price and availability/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Search this route on Google Flights/ }))
    .toHaveAttribute("href", /^https:\/\/www\.google\.com\/travel\/flights\?tfs=/);
});
