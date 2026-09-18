import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Same route source as the Pages prerender step, so a new benchmark is covered
// here without an edit (src/data/routes.test.ts guards the static list).
import { collectRoutes } from "../scripts/prerender-routes.mjs";

// A page fits its viewport when the document is no wider than the viewport.
// Anything else shows up on a phone as a horizontal scrollbar and a nav or
// hero that runs off the right edge.
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Viewports that must fit: a common phone and a portrait tablet. */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 }
];

const REGISTRY = resolve(fileURLToPath(import.meta.url), "../../src/data/benchmarks.ts");
const routes = ["/", ...collectRoutes(REGISTRY).map(route => `/${route}`)];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route} has no horizontal overflow`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        expect(await horizontalOverflow(page)).toBe(0);
      });
    }

    test("the comparison panel with a live Plotly chart fits", async ({ page }) => {
      await page.goto("/benchmarks/bubble3?tab=results");
      await page.locator(".js-plotly-plot").first().waitFor({ timeout: 30_000 });
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBe(0);
    });

    test("the benchmark index table view fits", async ({ page }) => {
      await page.goto("/benchmarks");
      await page.getByRole("button", { name: /table|list/i }).first().click();
      await page.locator("table").first().waitFor();
      expect(await horizontalOverflow(page)).toBe(0);
    });

    test("the validation ledger fits", async ({ page }) => {
      await page.goto("/benchmarks/drafting-kissing-tumbling?tab=validation");
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page)).toBe(0);
    });
  });
}

test.describe("phone nav", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("keeps every destination reachable at 360px", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    for (const label of ["Home", "Benchmarks", "Gallery"]) {
      await expect(nav.getByText(label, { exact: true })).toBeVisible();
    }
    // The button collapses to its icon; the accessible name survives.
    await expect(nav.getByRole("button", { name: "Reference data" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "FeatFloWer home" })).toBeVisible();
    expect(await horizontalOverflow(page)).toBe(0);
  });
});
