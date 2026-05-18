#!/usr/bin/env node
/**
 * Cross-viewport screenshot audit.
 * Usage: node scripts/responsive-audit.mjs [baseUrl]
 *   Default baseUrl: http://localhost:3000
 *
 * Outputs to ./audit-screenshots/<width>x<height>-<route>.png
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3000";
const OUT_DIR = path.resolve("audit-screenshots");

const VIEWPORTS = [
  { w: 320, h: 568, label: "iPhone-SE" },
  { w: 360, h: 800, label: "small-Android" },
  { w: 414, h: 896, label: "iPhone-Pro-Max" },
  { w: 768, h: 1024, label: "iPad-portrait" },
  { w: 1024, h: 768, label: "iPad-landscape" },
  { w: 1280, h: 800, label: "laptop" },
  { w: 1920, h: 1080, label: "desktop" },
  { w: 2560, h: 1440, label: "QHD" },
  { w: 3200, h: 1800, label: "ultra-wide" },
];

const SESSION_ID = "audit-session-" + Date.now();

const ROUTES = [
  { path: "/", name: "landing" },
  { path: "/kiosk", name: "kiosk" },
  { path: "/dashboard", name: "dashboard-login" },
  { path: `/session/${SESSION_ID}`, name: "session-welcome" },
  { path: "/dev/viewport", name: "viewport-inspector" },
];

async function dismissAnimations(page) {
  // Force animations to settle for clean screenshots.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001s !important;
        animation-delay: 0s !important;
        transition-duration: 0.001s !important;
      }
    `,
  });
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const summary = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    for (const route of ROUTES) {
      const page = await context.newPage();
      const url = BASE + route.path;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await dismissAnimations(page);
        await page.waitForTimeout(400);
        const file = path.join(
          OUT_DIR,
          `${String(vp.w).padStart(4, "0")}x${vp.h}-${vp.label}-${route.name}.png`,
        );
        await page.screenshot({ path: file, fullPage: true });
        const has = await page.evaluate(() => ({
          horizontalScroll:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
          docWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          h1: document.querySelector("h1, h2")?.textContent?.slice(0, 60) ?? "",
        }));
        summary.push({
          viewport: `${vp.w}x${vp.h}`,
          label: vp.label,
          route: route.name,
          file: path.basename(file),
          horizontalScroll: has.horizontalScroll,
          overflowBy: has.horizontalScroll
            ? has.docWidth - has.clientWidth
            : 0,
          firstHeading: has.h1,
        });
      } catch (err) {
        summary.push({
          viewport: `${vp.w}x${vp.h}`,
          label: vp.label,
          route: route.name,
          error: err.message,
        });
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  await fs.writeFile(
    path.join(OUT_DIR, "_summary.json"),
    JSON.stringify(summary, null, 2),
  );

  const breaks = summary.filter((r) => r.horizontalScroll);
  console.log(
    `\nDone. ${summary.length} screenshots in ${OUT_DIR}\nHorizontal-scroll breaks: ${breaks.length}`,
  );
  if (breaks.length) {
    for (const b of breaks) {
      console.log(`  ${b.viewport}  ${b.route}  (overflow ${b.overflowBy}px)`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
