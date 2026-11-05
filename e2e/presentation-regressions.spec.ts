import { expect, test, type Page } from "@playwright/test";

async function composeRoute(page: Page) {
  await page.goto("/planner");
  const controls = page.getByRole("button", { name: "Route controls" });
  if (await controls.getAttribute("aria-expanded") === "false") await controls.click();
  await page.getByLabel("What kind of trip?").fill("Find a 10 day surf and hiking route from Lisbon with one stop.");
  await page.getByText("Trip preferences", { exact: true }).click();
  await page.getByRole("textbox", { name: "Origin", exact: true }).fill("Lisbon");
  await page.getByRole("spinbutton", { name: "Trip length days" }).fill("10");
  await page.getByRole("button", { name: "Compose new routes" }).click();
  await expect(page.locator("main h1")).toContainText("Breakline");
}

test("planner keeps festival typography inside readable panel bounds", async ({
  page
}) => {
  await composeRoute(page);
  await expect(page.getByRole("region", { name: "Ranked route options" })).toBeVisible();
  await page.getByRole("region", { name: "Ranked route options" }).getByRole("button").nth(3).click();

  const audit = await page.evaluate(() => {
    const selectors = [
      ".route-studio__summary h1",
      ".route-studio__route strong",
      ".route-studio__route small",
      ".route-studio__stops strong",
      ".route-studio__stops article > span",
      ".route-studio__cost-note",
      ".route-studio__cost-assumptions",
      ".route-studio__estimate-note p"
    ];
    const metadataSelectors = [
      ".route-studio__inspector > .media-credit",
      ".route-studio__stops .media-credit",
      ".route-studio__reasons p",
      ".route-studio__cost-note",
      ".route-studio__cost-assumptions"
    ];

    const boundsFor = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();

      return {
        fitsParent: !parentRect || (rect.left >= parentRect.left - 1 && rect.right <= parentRect.right + 1),
        fitsOwnBox: element.scrollWidth <= element.clientWidth + 1
      };
    };

    return {
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      mediaRatio: (() => {
        const media = document.querySelector(".route-studio__inspector-media");
        if (!media) return null;
        const rect = media.getBoundingClientRect();
        return rect.width / rect.height;
      })(),
      sourceBelowMedia: (() => {
        const media = document.querySelector(".route-studio__inspector-media");
        const source = document.querySelector(".route-studio__inspector > .media-credit");
        if (!media || !source) return false;
        return source.getBoundingClientRect().top >= media.getBoundingClientRect().bottom - 1;
      })(),
      stopImageSizes: Array.from(document.querySelectorAll(".route-studio__stop-image")).map(
        (element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }
      ),
      text: selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)).map((element) => {
          const styles = window.getComputedStyle(element);

          return {
            ...boundsFor(element),
            fontSize: Number.parseFloat(styles.fontSize)
          };
        })
      ),
      metadata: metadataSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)).map(boundsFor)
      )
    };
  });

  expect(audit.pageOverflow).toBe(false);
  expect(audit.mediaRatio).toBeGreaterThan(1.65);
  expect(audit.mediaRatio).toBeLessThan(1.9);
  expect(audit.sourceBelowMedia).toBe(true);
  expect(audit.stopImageSizes.every((size) => size.width >= 52 && size.height >= 52)).toBe(true);
  expect(
    audit.text.filter((item) => !item.fitsParent || !item.fitsOwnBox),
    "Readable planner text must fit its panel and own box"
  ).toEqual([]);
  expect(
    audit.metadata.filter((item) => !item.fitsParent || !item.fitsOwnBox),
    "Planner metadata must wrap inside its panel"
  ).toEqual([]);
  expect(audit.text.every((item) => item.fontSize >= 11.2)).toBe(true);
});

test("planner keeps header, route cards, and reading surfaces collision-free", async ({
  page
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await composeRoute(page);

  const tabletHeader = await page.evaluate(() => {
    const brand = document.querySelector(".site-corner-brand")!.getBoundingClientRect();
    const command = document.querySelector(".site-command")!.getBoundingClientRect();

    return {
      brandRight: brand.right,
      commandLeft: command.left
    };
  });

  expect(tabletHeader.brandRight).toBeLessThanOrEqual(tabletHeader.commandLeft);

  await page.setViewportSize({ width: 390, height: 844 });

  const mobileLayout = await page.evaluate(() => {
    const header = document.querySelector(".site-header")!.getBoundingClientRect();
    const summary = document.querySelector(".route-studio__summary")!.getBoundingClientRect();
    const dock = document.querySelector(".route-studio__dock")!;
    const inspector = document.querySelector(".route-studio__inspector")!;

    return {
      headerBottom: header.bottom,
      summaryTop: summary.top,
      dockClientWidth: dock.clientWidth,
      dockScrollWidth: dock.scrollWidth,
      inspectorOverflow: getComputedStyle(inspector).overflow
    };
  });

  expect(mobileLayout.headerBottom).toBeLessThanOrEqual(mobileLayout.summaryTop);
  expect(mobileLayout.dockScrollWidth).toBeLessThanOrEqual(mobileLayout.dockClientWidth + 1);
  expect(mobileLayout.inspectorOverflow).toBe("visible");

  await page.getByRole("button", { name: "Route controls" }).click();

  const mobileControls = await page.evaluate(() => {
    const controls = document.querySelector(".route-studio__controls")!.getBoundingClientRect();
    const columnCount = (selector: string) =>
      getComputedStyle(document.querySelector(selector)!)
        .gridTemplateColumns.split(" ")
        .filter(Boolean).length;

    return {
      height: controls.height,
      shapeColumns: columnCount(".route-studio-form__segments--shape"),
      stopColumns: columnCount(".route-studio-form__segments--stops")
    };
  });

  expect(mobileControls.height).toBeLessThan(1000);
  expect(mobileControls.shapeColumns).toBe(2);
  expect(mobileControls.stopColumns).toBe(3);
});

test("sign-in and demo access keep a professional type scale", async ({
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
      displayFont: window.getComputedStyle(document.querySelector(".auth-simple__heading h1")!).fontFamily,
      headingFontSize: Number.parseFloat(
        window.getComputedStyle(document.querySelector(".auth-simple__heading h1")!).fontSize
      ),
      demoActionVisible: Boolean(document.querySelector("form[action='/api/auth/demo'] .button")),
      buttonBounds: Array.from(document.querySelectorAll(".auth-simple__card .button")).map(
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
  expect(audit.demoActionVisible).toBe(true);
  expect(audit.headingFontSize).toBeLessThanOrEqual(44);
  expect(audit.buttonBounds.every((button) => button.fitsParent)).toBe(true);
  expect(audit.buttonBounds.every((button) => button.fontSize <= 16)).toBe(true);
});

test("signed-out saved routes use a compact empty state on desktop and mobile", async ({
  page
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 320, height: 844 }
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

test("festival supporting copy keeps a readable line weight", async ({ page }) => {
  await page.goto("/");

  const weights = await page.evaluate(() =>
    [
      ".atlas-hero__lede",
      ".route-console__header small",
      ".route-console__route small",
      ".atlas-section__heading p",
      ".footer-departure p:not(.eyebrow)"
    ].map((selector) =>
      Number.parseInt(window.getComputedStyle(document.querySelector(selector)!).fontWeight, 10)
    )
  );

  expect(weights.every((weight) => weight >= 500)).toBe(true);
});

test("festival composition keeps structural surfaces level", async ({ page }) => {
  await page.goto("/");

  const audit = await page.evaluate(() => {
    const levelSelectors = [
      ".site-corner-brand",
      ".site-command",
    ];
    const rotationFor = (selector: string) => {
      const transform = getComputedStyle(document.querySelector(selector)!).transform;
      const matrix = transform.match(/^matrix\(([^)]+)\)$/);
      const values = matrix ? matrix[1].split(",").map(Number) : [];
      return values.length >= 2 ? (Math.atan2(values[1], values[0]) * 180) / Math.PI : 0;
    };
    const rotations = levelSelectors.map(rotationFor);
    const consoleTransform = getComputedStyle(
      document.querySelector(".route-console")!
    ).transform;
    const matrix = consoleTransform.match(/^matrix\(([^)]+)\)$/);
    const values = matrix ? matrix[1].split(",").map(Number) : [];
    const consoleAngle = values.length >= 2 ? (Math.atan2(values[1], values[0]) * 180) / Math.PI : 0;

    return { rotations, consoleAngle };
  });

  expect(audit.rotations.every((rotation) => Math.abs(rotation) <= 0.05)).toBe(true);
  expect(Math.abs(audit.consoleAngle)).toBeLessThanOrEqual(0.7);
});
