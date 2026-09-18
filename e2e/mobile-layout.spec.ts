import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Same route source as the Pages prerender step, so a new benchmark is covered
// here without an edit (src/data/routes.test.ts guards the static list).
import { collectRoutes } from "../scripts/prerender-routes.mjs";

/**
 * Layout is only final once the web fonts have swapped in and MathJax has
 * typeset every equation; a runner slow enough to reach network idle first
 * measures raw TeX and fallback fonts instead. Bounded, so an offline run
 * (no CDN) still measures rather than hangs.
 */
async function settleLayout(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    Promise.race([
      Promise.all([
        document.fonts.ready,
        (window as { MathJax?: { startup?: { promise?: Promise<unknown> } } }).MathJax?.startup?.promise ?? Promise.resolve()
      ]),
      new Promise(resolve => setTimeout(resolve, 5000))
    ])
  );
}

/**
 * A page fits its viewport when the document is no wider than the viewport.
 * Anything else shows up on a phone as a horizontal scrollbar and a nav or
 * hero that runs off the right edge. Returns the overflow in pixels plus the
 * outermost elements that cross the right edge, so a failure names the culprit.
 */
async function horizontalOverflow(page: Page) {
  await settleLayout(page);
  return page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - root.clientWidth;
    const culprits: string[] = [];
    if (overflow > 0) {
      for (const el of document.querySelectorAll("body *")) {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.right <= root.clientWidth + 1) continue;
        // Report the outermost offender only; its descendants say nothing new.
        if (el.parentElement && el.parentElement.getBoundingClientRect().right > root.clientWidth + 1) continue;
        const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : "";
        culprits.push(`<${el.tagName.toLowerCase()}${cls}> right=${Math.round(box.right)} "${(el.textContent ?? "").trim().slice(0, 40)}"`);
      }
    }
    return { overflow, culprits };
  });
}

function expectNoOverflow({ overflow, culprits }: { overflow: number; culprits: string[] }) {
  expect(overflow, `page is ${overflow}px wider than the viewport; crossing the edge:\n  ${culprits.join("\n  ")}`).toBe(0);
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
        expectNoOverflow(await horizontalOverflow(page));
      });
    }

    test("the comparison panel with a live Plotly chart fits", async ({ page }) => {
      await page.goto("/benchmarks/bubble3?tab=results");
      await page.locator(".js-plotly-plot").first().waitFor({ timeout: 30_000 });
      expectNoOverflow(await horizontalOverflow(page));
    });

    test("the benchmark index table view fits", async ({ page }) => {
      await page.goto("/benchmarks");
      await page.getByRole("button", { name: /table|list/i }).first().click();
      await page.locator("table").first().waitFor();
      expectNoOverflow(await horizontalOverflow(page));
    });

    test("the validation ledger fits", async ({ page }) => {
      await page.goto("/benchmarks/drafting-kissing-tumbling?tab=validation");
      expectNoOverflow(await horizontalOverflow(page));
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
    expectNoOverflow(await horizontalOverflow(page));
  });
});
