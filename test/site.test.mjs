import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

async function files(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await files(full, acc);
    else acc.push(full);
  }
  return acc;
}

test("provisional content is the single source for prices and domain", async () => {
  const provisional = await readFile(path.join(root, "src/content/provisional.ts"), "utf8");
  assert.match(provisional, /sidebitesites\.com/);
  for (const price of ["0", "50", "150", "300", "5", "40"]) {
    assert.match(provisional, new RegExp(`:\\s*${price}\\b`));
  }
  assert.match(provisional, /milestone:\s*5/);
  const pages = (await files(path.join(root, "src/pages"))).filter((file) => file.endsWith(".astro"));
  for (const file of pages) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /sidebite\.com/, `${file} hardcodes a domain`);
    assert.doesNotMatch(text, /\$\d/, `${file} hardcodes a price`);
  }
});

test("components do not hardcode colors", async () => {
  const source = (await files(path.join(root, "src"))).filter((file) => /\.(astro|ts)$/.test(file));
  for (const file of source) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b/, `${file} hardcodes a color`);
  }
});

test("default palette tokens and responsive unit are defined", async () => {
  const css = await readFile(path.join(root, "src/styles/global.css"), "utf8");
  assert.match(css, /\[data-palette="default"\]/);
  assert.match(css, /\[data-palette="tripletree"\]/);
  assert.match(css, /\[data-palette="premium"\]/);
  assert.match(css, /--d:\s*calc\(100vw \/ 1440\)/);
  assert.match(css, /100vw \/ 390/);
  assert.match(css, /100svh/);
  assert.match(css, /clamp\(/);
  for (const token of [
    "--color-accent:#426849",
    "--color-bg-page:#fcfbfa",
    "--color-bg-footer:#1a3820",
    "--color-text-primary:#1a3820",
  ]) {
    const [name, value] = token.split(":");
    assert.match(css, new RegExp(`${name}:\\s*${value}`));
  }
});

function channel(hex) {
  const value = parseInt(hex, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(fg, bg) {
  const lum = (hex) => {
    const r = channel(hex.slice(1, 3));
    const g = channel(hex.slice(3, 5));
    const b = channel(hex.slice(5, 7));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const lighter = Math.max(lum(fg), lum(bg));
  const darker = Math.min(lum(fg), lum(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

test("default text pairs meet WCAG AA", () => {
  const pairs = [
    ["#1a3820", "#fcfbfa"],
    ["#656e4f", "#fcfbfa"],
    ["#656e4f", "#f7f6f3"],
    ["#fcfbfa", "#426849"],
    ["#e8e4dd", "#1a3820"],
    ["#fbf8f2", "#6f6658"],
    ["#1a3820", "#f0eee9"],
    ["#426849", "#f0f3f0"],
  ];
  for (const [fg, bg] of pairs) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 4.5, `${fg} on ${bg} is ${ratio.toFixed(2)}`);
  }
});

test("built routes exist", async () => {
  const routes = [
    "index.html",
    "pricing/index.html",
    "demo/event-type/index.html",
    "demo/event-basics/index.html",
    "demo/template/index.html",
    "demo/editor/index.html",
    "demo/preview/index.html",
    "demo/account/index.html",
    "demo/checkout/index.html",
    "demo/published/index.html",
    "demo/dashboard/index.html",
    "e/demo/index.html",
  ];
  for (const route of routes) {
    const html = await readFile(path.join(root, "dist", route), "utf8");
    assert.match(html, /<main[\s>]/, route);
    if (route.startsWith("demo/") || route.startsWith("e/")) {
      assert.match(html, /Demo/, route);
    }
  }
  const withDomain = ["index.html", "demo/preview/index.html", "demo/published/index.html", "demo/dashboard/index.html", "e/demo/index.html"];
  for (const route of withDomain) {
    const html = await readFile(path.join(root, "dist", route), "utf8");
    assert.match(html, /sidebitesites\.com/, route);
  }
  const home = await readFile(path.join(root, "dist/index.html"), "utf8");
  const pricing = await readFile(path.join(root, "dist/pricing/index.html"), "utf8");
  assert.match(home, /Your event page, live in minutes/);
  assert.match(pricing, /PROVISIONAL/);
  assert.match(pricing, /\$0/);
  assert.match(pricing, /\$300/);
  assert.match(pricing, /5 change rounds/);
});

test("built pages do not scroll horizontally", async () => {
  const { chromium } = await import("playwright");
  const dist = path.join(root, "dist");
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
      const file = path.join(dist, pathname);
      const body = await readFile(file);
      const ext = path.extname(file);
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
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1920]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      for (const route of routes) {
        const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "networkidle" });
        assert.equal(response?.status(), 200, route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `${route} at ${width}px overflows by ${overflow}px`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
