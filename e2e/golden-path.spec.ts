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
      "Demo persistence: this route set is kept only for the current local app session."
    )
  ).toBeVisible();
  const routeTitle = await page.locator("main h1").innerText();

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved to your route vault.")).toBeVisible();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const publishMessage = page.locator(".route-studio-actions__message");
  await expect(publishMessage).toContainText("Published at /share/");
  const sharePath = (await publishMessage.innerText()).replace("Published at ", "");

  await page.goto(sharePath);
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
  await expect(page.getByRole("link", { name: new RegExp(`Open ${sharePath}`) })).toBeVisible();
});
