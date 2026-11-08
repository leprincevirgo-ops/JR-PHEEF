"use strict";

// Browser-level auth isolation test. All authentication endpoints are mocked;
// no real account or production database record is created or changed.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = (process.env.BASE_URL || "https://jr-pheef-marketplace.onrender.com").replace(/\/$/, "");
const member = {
  id: "browser-smoke-member",
  full_name: "JR PHEEF Browser Test",
  dgbo_id: "DGBO-SMOKE",
  jp_number: "JP-SMOKE",
  verified: false,
  reward_points: 0,
  theme: "ocean",
  measurement_system: "metric"
};

const first = [
  "market-ui.js", "messages-ui.js", "extras-ui.js", "ecosystem-ui.js",
  "family-ui.js", "family-bank-ui.js", "jr-ui.js", "continuity-ui.js",
  "jp-contacts-ui.js", "jp-identity-ui.js", "opportunities-ui.js", "themes.js",
  "explore-ui.js", "discover-ui.js", "browser-ui.js", "apphub-ui.js",
  "preferences-sync.js", "command-center.js", "notifications-ui.js",
  "lab-ui.js", "projects-ui.js"
];
const second = [
  "coordination-studio.js", "workspace-shell.js", "command-centre-social.js",
  "open-ecosystem.js", "universal-interaction.js", "human-environment-ui.js",
  "jr-core.js", "accessibility.js", "universe-home.js", "founder-loader.js",
  "device-bridge.js", "mobile-phone-shell.js", "screen-studio.js",
  "immersive-world-home.js", "conversation-first-access.js",
  "human-environment.js", "pwa-register.js", "install-prompt.js",
  "natural-interaction.js", "personal-command-centre.js"
];

async function testGroup(browser, name, allowedScripts) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  let authenticated = false;
  const errors = [];
  page.setDefaultTimeout(5000);
  page.on("pageerror", error => errors.push({ message: error.message, stack: error.stack }));

  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/login" && request.method() === "POST") {
      authenticated = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, message: "Login successful.", member }) });
    }
    if (url.pathname === "/api/me") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authenticated ? { ok: true, logged_in: true, member } : { ok: true, logged_in: false })
      });
    }
    if (url.pathname === "/api/access") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, allowed: true, reason: "BROWSER_TEST" }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, items: [], data: [] }) });
  });

  await page.route("**/*.js*", async route => {
    const filename = new URL(route.request().url()).pathname.split("/").pop();
    if (allowedScripts.has(filename)) return route.continue();
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  try {
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 15000 });
    assert.equal(response.status(), 200, name + ": homepage must return HTTP 200");
    const identifier = page.locator("#loginIdentifier");
    await identifier.waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await page.locator("#auth").isVisible(), true, name + ": sign-in panel must be visible");
    await identifier.click({ timeout: 5000 });
    await identifier.fill("browser-test@example.invalid");
    assert.equal(await identifier.evaluate(el => document.activeElement === el), true, name + ": identifier must receive focus");

    const password = page.locator("#loginPassword");
    await password.click({ timeout: 5000 });
    await password.fill("BrowserTestPassword123");
    assert.equal(await password.evaluate(el => document.activeElement === el), true, name + ": password must receive focus");

    await page.locator("#loginSubmit").click({ timeout: 5000 });
    await page.waitForFunction(() => {
      const auth = document.getElementById("auth");
      const app = document.getElementById("app");
      return !!auth && auth.classList.contains("hidden") && !!app && !app.classList.contains("hidden");
    }, null, { timeout: 8000 });

    console.log("PASS script group " + name + ": login fields focus and mocked sign-in opens the app. Runtime errors: " + JSON.stringify(errors));
    if (name === "all") {
      const appErrors = errors.filter(error => !error.message.includes("Service worker is disabled because the context is sandboxed"));
      assert.deepEqual(appErrors, [], "full application runtime errors: " + JSON.stringify(appErrors));
      assert.equal(await page.evaluate(() => typeof window.jrOpenScreenStudio), "function", "Screen Studio must initialize without runtime errors");
      await page.evaluate(() => {
        const event = new Event("beforeinstallprompt", { cancelable: true });
        event.prompt = () => Promise.resolve();
        event.userChoice = Promise.resolve({ outcome: "dismissed" });
        window.dispatchEvent(event);
      });
      const installBanner = page.locator("#jrInstallPrompt");
      await installBanner.waitFor({ state: "visible", timeout: 5000 });
      const placement = await page.evaluate(() => {
        const banner = document.getElementById("jrInstallPrompt").getBoundingClientRect();
        const dock = document.getElementById("jpMobileDock").getBoundingClientRect();
        return {
          bannerBottom: banner.bottom,
          dockTop: dock.top,
          bannerZ: Number(getComputedStyle(document.getElementById("jrInstallPrompt")).zIndex),
          dockZ: Number(getComputedStyle(document.getElementById("jpMobileDock")).zIndex)
        };
      });
      assert.ok(placement.bannerBottom <= placement.dockTop, "install banner must sit above the mobile navigation dock: " + JSON.stringify(placement));
      assert.ok(placement.bannerZ < placement.dockZ, "mobile navigation dock must stay above the install banner: " + JSON.stringify(placement));
      console.log("PASS install banner placement: " + JSON.stringify(placement));
      const destinations = [
        ["home", "home"],
        ["worlds", "worlds"],
        ["jr", "assistant"],
        ["command", "command"]
      ];
      for (const [button, pageId] of destinations) {
        const control = page.locator('#jpMobileDock [data-mobile-destination="' + button + '"]');
        await control.waitFor({ state: "visible", timeout: 8000 });
        await control.click({ timeout: 5000 });
        if (button === "home") {
          const studioButton = page.locator(".jp-screen-studio-launch");
          await studioButton.waitFor({ state: "visible", timeout: 8000 });
          await studioButton.click({ timeout: 5000 });
          await page.locator("#jpScreenStudio").waitFor({ state: "visible", timeout: 5000 });
          await page.locator("#jpScreenStudio .jp-studio-close").click({ timeout: 5000 });
          console.log("PASS Screen Studio opens and closes from Home.");
        }
        await page.waitForFunction(id => {
          const active = document.getElementById(id);
          return !!active && !active.classList.contains("hidden") && active.hidden !== true;
        }, pageId, { timeout: 8000 });
        console.log("PASS mobile navigation " + button + " -> #" + pageId);
      }
    }
    await context.close();
    return true;
  } catch (error) {
    console.log("FAIL script group " + name + ": " + error.message + (errors.length ? " | page errors: " + errors.join(" | ") : ""));
    await context.close().catch(() => {});
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const groups = [
      ["none", new Set()],
      ["first-half", new Set(first)],
      ["second-half", new Set(second)],
      ["all", new Set(first.concat(second))]
    ];
    const results = {};
    for (const [name, allowed] of groups) results[name] = await testGroup(browser, name, allowed);
    console.log("SCRIPT ISOLATION RESULTS " + JSON.stringify(results));
    assert.equal(results.none, true, "inline-only login baseline must pass");
    assert.equal(results.all, true, "full external script set must preserve login interaction");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error("FAIL browser auth isolation: " + error.stack);
  process.exitCode = 1;
});
