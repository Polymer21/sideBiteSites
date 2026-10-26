import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const routes = [
  "/",
  "/pricing/",
  "/demo/event-type/",
  "/demo/event-basics/",
  "/demo/template/",
  "/demo/editor/",
  "/demo/preview/",
  "/demo/account/",
  "/demo/checkout/",
  "/demo/published/",
  "/demo/dashboard/",
  "/e/demo/",
];

function formatViolations(violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => node.target.join(" ")).join("; ");
      return `${violation.id} (${violation.impact}) ${nodes}`;
    })
    .join("\n");
}

test("axe has no violations at 1440 and 390, and targets are at least 44px at 390", async () => {
  const { chromium } = await import("playwright");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const body = await readFile(path.join(dist, pathname));
      const ext = path.extname(pathname);
      res.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("missing");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      for (const route of routes) {
        const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "networkidle" });
        assert.equal(response?.status(), 200, route);
        if (width === 1440 && route === "/") {
          const headerButton = await page.locator(".site-header .site-nav .btn-primary").evaluate((button) => getComputedStyle(button).backgroundColor);
          assert.equal(headerButton, "rgb(66, 104, 73)", `root header button is ${headerButton}`);
        }
        const palettes = width === 1440 ? ["tripletree", "default", "premium"] : [null];
        for (const palette of palettes) {
          if (palette) {
            await page.evaluate((id) => {
              document.documentElement.dataset.palette = id;
            }, palette);
          }
          const results = await new AxeBuilder({ page }).analyze();
          const label = palette ? `${route} at ${width} palette ${palette}` : `${route} at ${width}`;
          assert.deepEqual(results.violations, [], `${label}\n${formatViolations(results.violations)}`);
        }
        if (width === 390) {
          const small = await page.evaluate(() => {
            const selector = 'a, button, input, select, textarea, summary, [role="button"], [role="switch"], [role="tab"]';
            return [...document.querySelectorAll(selector)].flatMap((el) => {
              if (el.closest("[inert], [aria-hidden='true'], [hidden]")) return [];
              const style = getComputedStyle(el);
              if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return [];
              const rect = el.getBoundingClientRect();
              if (rect.width < 1 || rect.height < 1) return [];
              if (rect.width >= 43.9 && rect.height >= 43.9) return [];
              const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || el.tagName)
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 60);
              return [`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`];
            });
          });
          assert.deepEqual(small, [], `${route} tap targets under 44px: ${small.join("; ")}`);
          if (route === "/e/demo/") {
            const steppers = await page.locator(".stepper-field button").evaluateAll((buttons) =>
              buttons.map((button) => {
                const rect = button.getBoundingClientRect();
                return {
                  label: button.getAttribute("aria-label") || "stepper",
                  width: rect.width,
                  height: rect.height,
                };
              }),
            );
            assert.ok(steppers.length >= 2, "guest stepper buttons are present");
            for (const stepper of steppers) {
              assert.ok(stepper.width >= 43.9 && stepper.height >= 43.9, `${stepper.label} is ${stepper.width.toFixed(1)}x${stepper.height.toFixed(1)}`);
            }
          }
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
