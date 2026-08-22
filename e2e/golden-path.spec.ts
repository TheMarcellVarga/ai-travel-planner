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
  await expect(page.getByText("Plotting map", { exact: true })).toHaveCount(0);
  await expect(page.locator(".orbital-globe-fallback__mode .route-loading-mark")).toBeVisible();
  const composeButton = page.locator(".route-studio__primary-action");
  await expect(composeButton).toHaveCount(0);
  await expect(page.getByPlaceholder("Jungle riding, cold water, one dramatic stop, low friction transfers...")).toHaveCount(0);
  await expect(page.getByText("Route brief", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Composing route options", { exact: true })).toBeVisible();
  await expect(page.getByText("Route cost", { exact: true })).toBeVisible();
  expect(await page.locator(".route-studio__stop-image").count()).toBeGreaterThanOrEqual(2);

  const routeCards = page.getByRole("region", { name: "Ranked route options" }).getByRole("button");
  await routeCards.nth(1).click();
  await expect(routeCards.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".map-route--active")).toHaveCount(1);
});

test("planner keeps festival typography inside readable panel bounds", async ({
  page
}) => {
  await page.goto("/planner");
  await expect(page.getByRole("region", { name: "Ranked route options" })).toBeVisible();
  await page.getByRole("region", { name: "Ranked route options" }).getByRole("button").nth(3).click();

  const audit = await page.evaluate(() => {
    const selectors = [
      ".route-studio__summary h1",
      ".route-studio__route strong",
      ".route-studio__route small",
      ".route-studio__stops strong",
      ".route-studio__stops span",
      ".route-studio__cost-note",
      ".route-studio__cost-assumptions",
      ".route-studio__estimate-note p"
    ];

    return {
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      text: selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)).map((element) => {
          const rect = element.getBoundingClientRect();
          const parentRect = element.parentElement?.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          return {
            fitsParent: !parentRect || (rect.left >= parentRect.left - 1 && rect.right <= parentRect.right + 1),
            fitsOwnBox: element.scrollWidth <= element.clientWidth + 1,
            fontSize: Number.parseFloat(styles.fontSize)
          };
        })
      )
    };
  });

  expect(audit.pageOverflow).toBe(false);
  expect(
    audit.text.filter((item) => !item.fitsParent || !item.fitsOwnBox),
    "Readable planner text must fit its panel and own box"
  ).toEqual([]);
  expect(audit.text.every((item) => item.fontSize >= 11.2)).toBe(true);
});

test("sign-in keeps the festival treatment within a professional type scale", async ({
  page
}) => {
  await page.goto("/auth");

  const audit = await page.evaluate(() => {
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom
      };
    };

    return {
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      bodyFont: window.getComputedStyle(document.body).fontFamily,
      displayFont: window.getComputedStyle(document.querySelector(".auth-panel h1")!).fontFamily,
      monoFont: window.getComputedStyle(document.querySelector(".auth-panel .eyebrow")!).fontFamily,
      headingFontSize: Number.parseFloat(
        window.getComputedStyle(document.querySelector(".auth-panel h1")!).fontSize
      ),
      cardHeadingFontSizes: Array.from(document.querySelectorAll(".auth-card h2")).map(
        (element) => Number.parseFloat(window.getComputedStyle(element).fontSize)
      ),
      buttonBounds: Array.from(document.querySelectorAll(".auth-card .button")).map(
        (element) => {
          const button = rect(element);
          const parent = rect(element.parentElement ?? element);

          return {
            fitsParent:
              button.left >= parent.left - 1 &&
              button.right <= parent.right + 1 &&
              button.top >= parent.top - 1 &&
              button.bottom <= parent.bottom + 1,
            fontSize: Number.parseFloat(window.getComputedStyle(element).fontSize)
          };
        }
      )
    };
  });

  expect(audit.pageOverflow).toBe(false);
  expect(audit.bodyFont).toContain("Geist");
  expect(audit.displayFont).toContain("Geist");
  expect(audit.monoFont).toContain("Geist Mono");
  expect(audit.headingFontSize).toBeLessThanOrEqual(72);
  expect(audit.cardHeadingFontSizes.every((fontSize) => fontSize <= 36)).toBe(true);
  expect(audit.buttonBounds.every((button) => button.fitsParent)).toBe(true);
  expect(audit.buttonBounds.every((button) => button.fontSize <= 16)).toBe(true);
});

test("signed-out saved routes use a compact empty state on desktop and mobile", async ({
  page
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/saved");

    const audit = await page.evaluate(() => {
      const state = document.querySelector(".saved-vault-shell-empty");
      const card = document.querySelector(".saved-vault-shell-empty .floating-sidebar");
      const heading = document.querySelector(".saved-vault-shell-empty h1");
      const buttons = Array.from(
        document.querySelectorAll(".saved-vault-shell-empty .button")
      );
      const rect = (element: Element) => element.getBoundingClientRect();

      return {
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        cardHeight: card ? rect(card).height : 0,
        headingFits: heading
          ? rect(heading).right <= (heading.parentElement?.getBoundingClientRect().right ?? 0) + 1
          : false,
        buttons: buttons.map((button) => {
          const buttonRect = rect(button);
          const parentRect = rect(button.parentElement ?? button);

          return {
            height: buttonRect.height,
            fitsParent:
              buttonRect.left >= parentRect.left - 1 &&
              buttonRect.right <= parentRect.right + 1
          };
        }),
        hasState: Boolean(state)
      };
    });

    expect(audit.hasState).toBe(true);
    expect(audit.pageOverflow).toBe(false);
    expect(audit.cardHeight).toBeLessThan(360);
    expect(audit.headingFits).toBe(true);
    expect(audit.buttons.every((button) => button.height <= 52 && button.fitsParent)).toBe(true);
  }
});
