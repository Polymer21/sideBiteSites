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

const paletteTokens = {
  default: {
    "--color-bg-page": "#ffffff",
    "--color-bg-section": "#f7f7f8",
    "--color-bg-surface": "#ffffff",
    "--color-bg-input": "#ffffff",
    "--color-bg-muted": "#e4e4e7",
    "--color-bg-footer": "#18181b",
    "--color-accent": "#2563eb",
    "--color-accent-subtle": "#dbeafe",
    "--color-text-primary": "#18181b",
    "--color-text-secondary": "#52525b",
    "--color-text-on-accent": "#ffffff",
    "--color-text-accent": "#1d4ed8",
    "--color-border-default": "#71717a",
    "--color-bg-hero-start": "#dbeafe",
    "--color-accent-hover": "#1d4ed8",
    "--color-text-placeholder": "#52525b",
    "--color-text-error": "#dc2626",
    "--color-border-input": "#71717a",
    "--color-border-focus": "#2563eb",
    "--color-border-error": "#dc2626",
    "--color-text-on-footer": "#e4e4e7",
    "--color-text-on-footer-accent": "#dbeafe",
    "--color-accent-pressed": "#1e40af",
    "--color-bg-disabled": "#f4f4f5",
    "--color-text-disabled": "#6b7280",
    "--color-border-disabled": "#e4e4e7",
    "--color-text-secondary-on-surface": "#52525b",
    "--color-text-accent-on-surface": "#1d4ed8",
    "--color-text-on-hero": "#18181b",
    "--color-text-accent-on-hero": "#1d4ed8",
    "--color-text-secondary-on-hero": "#52525b",
    "--color-text-on-dark-surface": "#e4e4e7",
  },
  tripletree: {
    "--color-bg-page": "#fcfbfa",
    "--color-bg-section": "#f7f6f3",
    "--color-bg-surface": "#d8d1c4",
    "--color-bg-input": "#fcfbfa",
    "--color-bg-muted": "#d8d1c4",
    "--color-bg-footer": "#1a3820",
    "--color-accent": "#426849",
    "--color-accent-subtle": "#f0f3f0",
    "--color-text-primary": "#1a3820",
    "--color-text-secondary": "#656e4f",
    "--color-text-on-accent": "#fcfbfa",
    "--color-text-accent": "#426849",
    "--color-border-default": "#656e4f",
    "--color-bg-hero-start": "#f0eee9",
    "--color-accent-hover": "#2e4933",
    "--color-text-placeholder": "#505242",
    "--color-text-error": "#b42318",
    "--color-border-input": "#656e4f",
    "--color-border-focus": "#426849",
    "--color-border-error": "#b42318",
    "--color-text-on-footer": "#e8e4dd",
    "--color-text-on-footer-accent": "#c0c2b1",
    "--color-accent-pressed": "#243928",
    "--color-bg-disabled": "#f0eee9",
    "--color-text-disabled": "#77736c",
    "--color-border-disabled": "#d8d1c4",
    "--color-text-secondary-on-surface": "#383c2b",
    "--color-text-accent-on-surface": "#2e4933",
    "--color-text-on-hero": "#1a3820",
    "--color-text-accent-on-hero": "#426849",
    "--color-text-secondary-on-hero": "#656e4f",
    "--color-text-on-dark-surface": "#e8e4dd",
  },
  premium: {
    "--color-bg-page": "#f4efe6",
    "--color-bg-section": "#ece5d8",
    "--color-bg-surface": "#fbf8f2",
    "--color-bg-input": "#fbf8f2",
    "--color-bg-muted": "#e4dccd",
    "--color-bg-footer": "#e4dccd",
    "--color-accent": "#4f5b43",
    "--color-accent-subtle": "#e4e6da",
    "--color-text-primary": "#26221d",
    "--color-text-secondary": "#5b5246",
    "--color-text-on-accent": "#fbf8f2",
    "--color-text-accent": "#4f5b43",
    "--color-border-default": "#8a7f70",
    "--color-bg-hero-start": "#6f6658",
    "--color-accent-hover": "#3e4834",
    "--color-text-placeholder": "#6e6558",
    "--color-text-error": "#9a3324",
    "--color-border-input": "#7c7163",
    "--color-border-focus": "#4f5b43",
    "--color-border-error": "#9a3324",
    "--color-text-on-footer": "#26221d",
    "--color-text-on-footer-accent": "#4f5b43",
    "--color-accent-pressed": "#333b2b",
    "--color-bg-disabled": "#e4dccd",
    "--color-text-disabled": "#7a7062",
    "--color-border-disabled": "#b8ae9f",
    "--color-text-secondary-on-surface": "#5b5246",
    "--color-text-accent-on-surface": "#4f5b43",
    "--color-text-on-hero": "#fbf8f2",
    "--color-text-accent-on-hero": "#ffffff",
    "--color-text-secondary-on-hero": "#fbf8f2",
    "--color-text-on-dark-surface": "#26221d",
  },
};

function paletteBlock(css, id) {
  const match = css.match(new RegExp(`\\[data-palette="${id}"\\]\\s*\\{([^}]+)\\}`));
  assert.ok(match, `missing palette ${id}`);
  const values = {};
  for (const line of match[1].split("\n")) {
    const token = line.match(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})/);
    if (token) values[token[1]] = token[2].toLowerCase();
  }
  return values;
}

test("default palette tokens and responsive unit are defined", async () => {
  const css = await readFile(path.join(root, "src/styles/global.css"), "utf8");
  assert.match(css, /\[data-palette="default"\]/);
  assert.match(css, /\[data-palette="tripletree"\]/);
  assert.match(css, /\[data-palette="premium"\]/);
  assert.match(css, /--d:\s*calc\(100vw \/ 1440\)/);
  assert.match(css, /100vw \/ 390/);
  assert.match(css, /100svh/);
  assert.match(css, /clamp\(/);
  assert.match(css, /--color-focus-ring:\s*var\(--color-border-focus\)/);
  for (const id of Object.keys(paletteTokens)) {
    const values = paletteBlock(css, id);
    assert.equal(Object.keys(values).length, 32, `${id} should declare 32 color tokens`);
    assert.deepEqual(values, paletteTokens[id]);
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

const textPairs = [
  ["--color-text-primary", "--color-bg-page"],
  ["--color-text-secondary", "--color-bg-page"],
  ["--color-text-primary", "--color-bg-section"],
  ["--color-text-secondary", "--color-bg-section"],
  ["--color-text-primary", "--color-bg-surface"],
  ["--color-text-secondary-on-surface", "--color-bg-surface"],
  ["--color-text-accent-on-surface", "--color-bg-surface"],
  ["--color-text-on-accent", "--color-accent"],
  ["--color-text-on-accent", "--color-accent-hover"],
  ["--color-text-on-accent", "--color-accent-pressed"],
  ["--color-text-on-accent", "--color-text-error"],
  ["--color-text-error", "--color-bg-page"],
  ["--color-text-error", "--color-bg-input"],
  ["--color-text-on-footer", "--color-bg-footer"],
  ["--color-text-on-footer-accent", "--color-bg-footer"],
  ["--color-text-on-hero", "--color-bg-hero-start"],
  ["--color-text-secondary-on-hero", "--color-bg-hero-start"],
  ["--color-text-accent-on-hero", "--color-bg-hero-start"],
  ["--color-text-placeholder", "--color-bg-input"],
  ["--color-text-accent", "--color-accent-subtle"],
  ["--color-text-primary", "--color-bg-muted"],
  ["--color-text-primary", "--color-accent-subtle"],
  ["--color-text-secondary", "--color-accent-subtle"],
];

test("palette text pairs meet WCAG AA", async () => {
  const css = await readFile(path.join(root, "src/styles/global.css"), "utf8");
  for (const id of Object.keys(paletteTokens)) {
    const values = paletteBlock(css, id);
    for (const [foreground, background] of textPairs) {
      const ratio = contrast(values[foreground], values[background]);
      assert.ok(ratio >= 4.5, `${id} ${foreground} on ${background} is ${ratio.toFixed(2)}`);
    }
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

test("built pages do not scroll horizontally, and note text stays half the viewport at 390", async () => {
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
        if (width === 390) {
          const narrow = await page.evaluate(() => {
            const floor = window.innerWidth * 0.5;
            return [...document.querySelectorAll(".note > div")].flatMap((el) => {
              const column = el.getBoundingClientRect().width;
              if (column + 0.5 >= floor) return [];
              const label = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 48);
              return [`${label} (${Math.round(column)}px)`];
            });
          });
          assert.deepEqual(narrow, [], `${route} note text is under half the viewport: ${narrow.join("; ")}`);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
