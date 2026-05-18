#!/usr/bin/env node
/**
 * Interactive flow audit — clicks through every meaningful state and screenshots it.
 *
 * Mocks /api/chat at the network layer so this runs with no real AI provider.
 * Covers: dashboard auth, full session flow (welcome → intake → chat → summary → booking).
 *
 * Usage: node scripts/interactive-audit.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3000";
const OUT_DIR = path.resolve("audit-screenshots-interactive");

const VIEWPORTS = [
  { w: 360, h: 800, label: "small-phone" },
  { w: 414, h: 896, label: "iPhone-Pro-Max" },
  { w: 768, h: 1024, label: "iPad-portrait" },
  { w: 1280, h: 800, label: "laptop" },
];

const FAKE_CHAT_OPENING =
  "Hi Hassan, thank you for sharing that you've been dealing with acne for the past few months. I'm here to help you understand what's going on and figure out the best next step. Can you tell me a bit more about where on your face or body you're noticing breakouts, and whether anything seems to make them worse?";

const FAKE_CHAT_SUMMARY = `Thanks for sharing all of that, Hassan. Based on our conversation, I'd recommend scheduling a visit with a Henry Ford dermatologist for personalized care.

**Discussion Summary**
- Primary concern: persistent acne on cheeks and jawline
- Duration: 3–4 months
- Key features described: inflammatory papules, occasional cysts, worsens with stress
- Recommended urgency: YELLOW
- Suggested next step: Schedule soon

A dermatologist can examine your skin in person and discuss the right next steps for your specific situation. Would you like me to help you book an appointment now?

[URGENCY:YELLOW]`;

/**
 * Build a fake SSE response stream that mimics our /api/chat wire format.
 */
function fakeSSE(text, model = "mock-model") {
  const words = text.match(/\S+\s*|\s+/g) ?? [text];
  const lines = [
    `data: ${JSON.stringify({ type: "meta", provider: "mock", model })}\n\n`,
  ];
  for (const chunk of words) {
    lines.push(`data: ${JSON.stringify({ type: "delta", text: chunk })}\n\n`);
  }
  lines.push(`data: ${JSON.stringify({ type: "done", stopReason: "stop" })}\n\n`);
  return lines.join("");
}

async function freezeAnimations(page) {
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

async function snap(page, file) {
  await page.waitForTimeout(250);
  await freezeAnimations(page);
  await page.screenshot({ path: file, fullPage: true });
}

async function runViewport(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
  });

  // Mock the chat endpoint for every request in this context.
  let chatCallCount = 0;
  await context.route("**/api/chat", async (route) => {
    chatCallCount += 1;
    const req = route.request();
    let body = {};
    try {
      body = JSON.parse(req.postData() || "{}");
    } catch {}
    const text = body.endRequested ? FAKE_CHAT_SUMMARY : FAKE_CHAT_OPENING;
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: fakeSSE(text),
    });
  });

  const dir = (name) =>
    path.join(
      OUT_DIR,
      `${String(vp.w).padStart(4, "0")}x${vp.h}-${vp.label}-${name}.png`,
    );

  // ===== Session flow =====
  const sessionPage = await context.newPage();
  await sessionPage.goto(`${BASE}/session/audit-${vp.label}`, {
    waitUntil: "networkidle",
  });

  await snap(sessionPage, dir("01-welcome"));

  // Click through to intake
  await sessionPage.getByRole("button", { name: /understand/i }).click();
  await sessionPage.waitForTimeout(400);
  await snap(sessionPage, dir("02-intake-empty"));

  // Fill intake
  await sessionPage.getByLabel(/first name/i).fill("Hassan");
  await sessionPage.getByRole("button", { name: "31–45" }).click();
  await sessionPage.getByLabel(/^Type III/i).click();
  await sessionPage.getByRole("button", { name: "Acne" }).click();
  await sessionPage.getByRole("button", { name: "1–6 months" }).click();
  await snap(sessionPage, dir("03-intake-filled"));

  // Continue to chat
  await sessionPage.getByRole("button", { name: /^Continue/i }).click();
  await sessionPage.waitForTimeout(400);

  // Wait for mocked AI opener to finish streaming
  await sessionPage
    .getByText(/figure out the best next step/i)
    .waitFor({ timeout: 10000 });
  await snap(sessionPage, dir("04-chat-opening"));

  // Type a follow-up and send
  const composer = sessionPage.getByPlaceholder(/describe what you're/i);
  await composer.click();
  await composer.fill(
    "On my cheeks and jawline mostly, gets worse when I'm stressed",
  );
  await snap(sessionPage, dir("05-chat-typing"));

  await sessionPage.getByLabel("Send").click();
  await sessionPage
    .getByText(/figure out the best next step/i)
    .nth(1)
    .waitFor({ timeout: 10000 });
  await snap(sessionPage, dir("06-chat-after-reply"));

  // End consultation
  await sessionPage
    .getByRole("button", { name: /end consultation/i })
    .click();
  await sessionPage.waitForTimeout(200);
  await snap(sessionPage, dir("07-end-confirm-dialog"));
  await sessionPage
    .getByRole("button", { name: /end and see summary/i })
    .click();

  // Wait for summary to land
  await sessionPage
    .getByText(/Schedule a visit soon/i)
    .waitFor({ timeout: 10000 });
  await snap(sessionPage, dir("08-summary"));

  // Booking
  await sessionPage
    .getByRole("button", { name: /book a henry ford/i })
    .click();
  await sessionPage.waitForTimeout(400);
  await snap(sessionPage, dir("09-booking-empty"));

  // Pick a different provider, day, and time
  await sessionPage.getByRole("button", { name: /Dr\. Marcus Chen/i }).click();
  await sessionPage.getByRole("button", { name: /10:00 AM/i }).click();
  await snap(sessionPage, dir("10-booking-filled"));

  // Confirm
  await sessionPage
    .getByRole("button", { name: /request appointment/i })
    .click();
  await sessionPage
    .getByText(/your request has been sent/i)
    .waitFor({ timeout: 5000 });
  await snap(sessionPage, dir("11-booking-confirmed"));

  // Tap a 4-star rating
  await sessionPage.getByRole("button", { name: /4 stars/i }).click();
  await snap(sessionPage, dir("12-rating-given"));

  await sessionPage.close();

  // ===== Dashboard flow =====
  const dashPage = await context.newPage();
  await dashPage.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await snap(dashPage, dir("13-dashboard-login"));

  await dashPage.getByLabel(/password/i).fill("HF2026");
  await dashPage.getByRole("button", { name: /sign in/i }).click();
  await dashPage
    .getByText(/Live · Henry Ford Event Day/i)
    .waitFor({ timeout: 5000 });
  await dashPage.waitForTimeout(800);
  await snap(dashPage, dir("14-dashboard-authed"));

  await dashPage.close();
  await context.close();
  return chatCallCount;
}

async function run() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  for (const vp of VIEWPORTS) {
    process.stdout.write(`  ${vp.label} (${vp.w}×${vp.h})... `);
    try {
      const calls = await runViewport(browser, vp);
      console.log(`ok (${calls} mocked chat calls)`);
      results.push({ viewport: vp.label, ok: true, chatCalls: calls });
    } catch (err) {
      console.log(`FAILED — ${err.message.split("\n")[0]}`);
      results.push({ viewport: vp.label, ok: false, error: err.message });
    }
  }
  await browser.close();
  await fs.writeFile(
    path.join(OUT_DIR, "_summary.json"),
    JSON.stringify(results, null, 2),
  );
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} viewports completed.`);
  console.log(`Screenshots in: ${OUT_DIR}`);
  if (ok < results.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
