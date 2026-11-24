"use strict";

// Real mobile-browser interaction test for the current public gateway.
// Authentication is mocked; no production account or database row is created.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = (process.env.BASE_URL || "https://jr-pheef-marketplace.onrender.com").replace(/\/$/, "");
const user = {
  id: "browser-smoke-member",
  email: "browser-test@example.invalid",
  fullName: "JR PHEEF Browser Test",
  jpNumber: "JP-SMOKE",
  referralCode: null,
  role: "person",
  accountType: "individual",
  verified: false,
  emailVerified: true
};

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  const pageErrors = [];
  let authenticated = false;
  page.setDefaultTimeout(10000);
  page.on("pageerror", error => pageErrors.push({ message: error.message, stack: error.stack }));

  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/login" && request.method() === "POST") {
      authenticated = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, user, message: "Login successful." })
      });
    }
    if (url.pathname === "/api/auth/session") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, authenticated, user: authenticated ? user : null })
      });
    }
    if (url.pathname === "/api/auth/logout") {
      authenticated = false;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, items: [], data: [], results: [] })
    });
  });

  try {
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 20000 });
    assert.equal(response.status(), 200, "public JR PHEEF gateway must return HTTP 200");

    const openLogin = page.locator("#openLogin");
    await openLogin.waitFor({ state: "visible" });
    await openLogin.tap();
    const panel = page.locator("#authPanel");
    await panel.waitFor({ state: "visible" });

    const email = page.locator("#email");
    const password = page.locator("#password");
    await email.waitFor({ state: "visible" });
    await password.waitFor({ state: "visible" });
    assert.equal(await email.isEnabled(), true, "email field must be enabled");
    assert.equal(await password.isEnabled(), true, "password field must be enabled");

    await email.tap();
    await email.fill(user.email);
    assert.equal(await email.evaluate(el => document.activeElement === el), true, "email field must receive touch focus");
    await password.tap();
    await password.fill("BrowserTestPassword123");
    assert.equal(await password.evaluate(el => document.activeElement === el), true, "password field must receive touch focus");

    await page.locator("#authSubmit").tap();
    await page.waitForFunction(() => {
      const workspace = document.getElementById("workspace");
      const greeting = document.getElementById("memberGreeting");
      return !!workspace && !workspace.hidden && !!greeting && !greeting.hidden;
    }, null, { timeout: 12000 });

    assert.deepEqual(pageErrors, [], "mobile sign-in must not create browser runtime errors");
    assert.equal(await page.locator("#logoutButton").isVisible(), true, "successful sign-in must expose logout");

    const dock = page.locator("#jpMobileDock");
    if (await dock.count()) {
      const destinations = [["home", "home"], ["worlds", "worlds"], ["jr", "assistant"], ["command", "command"]];
      for (const [destination, targetId] of destinations) {
        const control = dock.locator('[data-mobile-destination="' + destination + '"]');
        if (!(await control.count())) continue;
        await control.tap();
        await page.waitForFunction(id => {
          const target = document.getElementById(id);
          return !!target && !target.hidden && !target.classList.contains("hidden");
        }, targetId, { timeout: 8000 });
      }
    }

    console.log("PASS: Android-sized public entry, Log in tap, email/password touch focus, mocked authentication, signed-in workspace and mobile navigation.");
  } catch (error) {
    try { await page.screenshot({ path: "jr-auth-diagnostic.png", fullPage: true }); } catch {}
    console.error("FAIL mobile browser authentication:", error.stack || error.message);
    if (pageErrors.length) console.error("BROWSER ERRORS:", JSON.stringify(pageErrors));
    throw error;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch(() => { process.exitCode = 1; });
