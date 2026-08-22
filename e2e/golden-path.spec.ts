import { expect, test } from "@playwright/test";

test("demo user can plan, save, publish, share, and hand off a route", async ({
  page
}) => {
  test.setTimeout(60_000);

  await page.addInitScript(() => {
    Object.defineProperty(window, "__wildRouteOpenedUrls", {
      configurable: false,
      value: [] as string[]
    });
    window.open = ((url?: string | URL) => {
      (window as typeof window & { __wildRouteOpenedUrls: string[] })
        .__wildRouteOpenedUrls.push(String(url));
      return null;
    }) as typeof window.open;
  });

  await page.goto("/auth");
  await page.getByRole("button", { name: "Enter Demo Mode" }).click();
  await expect(page).toHaveURL(/\/saved$/);

  await page.goto("/planner");
  await expect(page.getByRole("region", { name: "Ranked route options" })).toBeVisible();
  const routeControls = page.getByRole("button", { name: "Route controls" });
  await routeControls.click();
  await expect(routeControls).toHaveAttribute("aria-expanded", "false");
  await routeControls.click();
  await expect(routeControls).toHaveAttribute("aria-expanded", "true");

  await page
    .getByPlaceholder(
      "Jungle riding, cold water, one dramatic stop, low friction transfers..."
    )
    .fill(
      "Find a 10 day surf and hiking route from Lisbon with one stop."
    );
  await page.getByRole("textbox", { name: "Origin" }).fill("Lisbon");
  await page.getByRole("spinbutton", { name: "Trip length days" }).fill("10");
  await page.getByRole("button", { name: "Compose new routes" }).click();

  await expect(page.locator("main h1")).toContainText("Breakline");
  await routeControls.click();
  await expect(
    page.getByText(
      "Demo persistence: this route set is kept only for the current app instance and is not durable."
    )
  ).toBeVisible();
  const routeTitle = await page.locator("main h1").innerText();

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved in this browser's demo vault.")).toBeVisible();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const publishMessage = page.locator(".route-studio-actions__message");
  await expect(publishMessage).toContainText("Published preview at /share/");
  const sharePath = await publishMessage.locator("a").getAttribute("href");
  expect(sharePath).toMatch(/^\/share\/preview-/);

  await page.goto(sharePath!);
  await expect(page.getByRole("heading", { level: 1, name: routeTitle })).toBeVisible();
  await expect(
    page.getByText("Availability: external provider search required.", {
      exact: false
    })
  ).toBeVisible();
  await expect(
    page.getByText("external provider inventory was not queried.", {
      exact: false
    })
  ).toBeVisible();

  const handoffResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/routes/") &&
      response.url().endsWith("/handoff") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Open booking handoff" }).click();
  const handoffResponse = await handoffResponsePromise;
  expect(handoffResponse.ok()).toBe(true);
  const handoffPayload = (await handoffResponse.json()) as {
    links: Array<{ url: string }>;
  };
  expect(handoffPayload.links[0]?.url).toMatch(/google\.com\/travel\/flights/);
  const openedUrls = await page.evaluate(
    () =>
      (window as typeof window & { __wildRouteOpenedUrls: string[] })
        .__wildRouteOpenedUrls
  );
  expect(openedUrls[0]).toBe(handoffPayload.links[0]?.url);
  await expect(page.getByText("Opened booking handoff.")).toBeVisible();

  await page.goto("/saved");
  await expect(page.getByText(routeTitle, { exact: true })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open preview share" })).toBeVisible();
});

test("planner exposes guarded composition loading, multi-stop cost, and media attribution", async ({
  page
}) => {
  await page.route("**/api/trips/plan", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await page.goto("/planner");
  await expect(page.getByRole("region", { name: "Ranked route options" })).toBeVisible();
  await expect(page.getByText("Route cost", { exact: true })).toBeVisible();
  await expect(page.getByText("planning_estimate", { exact: false })).toBeVisible();
  await expect(page.getByText("Media:", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "2 stops 2 hops" }).click();
  await page.getByRole("button", { name: "Compose new routes" }).click();

  await expect(page.getByText("Plotting route options")).toBeVisible();
  const composeButton = page.locator(".route-studio__primary-action");
  await expect(composeButton).toHaveAttribute("aria-busy", "true");
  await expect(composeButton).toBeDisabled();
  await expect(page.getByText("Route cost", { exact: true })).toBeVisible();
  expect(await page.locator(".route-studio__stop-image").count()).toBeGreaterThanOrEqual(2);

  const routeCards = page.getByRole("region", { name: "Ranked route options" }).getByRole("button");
  await routeCards.nth(1).click();
  await expect(routeCards.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".map-route--active")).toHaveCount(1);
});
