"use strict";

// Browser-level release check. All authentication endpoints are mocked;
// this test never creates or changes a production account or database record.
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

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      serviceWorkers: "block"
    });
    const page = await context.newPage();
    let authenticated = false;

    page.on("pageerror", error => errors.push(error.message));
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

    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.equal(response.status(), 200, "homepage must return HTTP 200");
    await page.locator("#loginIdentifier").waitFor({ state: "visible", timeout: 30000 });
    assert.equal(await page.locator("#auth").isVisible(), true, "sign-in panel must be visible");
    assert.equal(await page.locator("main").isVisible(), false, "private app shell must remain hidden before sign-in");

    const identifier = page.locator("#loginIdentifier");
    const hitTest = await identifier.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const describe = node => node ? {
        tag: node.tagName,
        id: node.id || "",
        className: typeof node.className === "string" ? node.className : "",
        pointerEvents: getComputedStyle(node).pointerEvents,
        position: getComputedStyle(node).position,
        zIndex: getComputedStyle(node).zIndex,
        opacity: getComputedStyle(node).opacity,
        animationName: getComputedStyle(node).animationName,
        transform: getComputedStyle(node).transform
      } : null;
      const ancestors = [];
      for (let node = el; node && ancestors.length < 8; node = node.parentElement) ancestors.push(describe(node));
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        center: { x, y },
        hit: describe(document.elementFromPoint(x, y)),
        stack: document.elementsFromPoint(x, y).slice(0, 8).map(describe),
        ancestors,
        animations: el.getAnimations({ subtree: true }).map(animation => ({
          target: describe(animation.effect && animation.effect.target),
          state: animation.playState,
          timing: animation.effect && animation.effect.getComputedTiming()
        }))
      };
    });
    console.log("LOGIN FIELD HIT TEST " + JSON.stringify(hitTest));
    await page.waitForTimeout(400);
    const stateAfterWait = await page.evaluate(() => {
      const auth = document.getElementById("auth");
      const input = document.getElementById("loginIdentifier");
      const rect = input && input.getBoundingClientRect();
      return {
        bodyClass: document.body.className,
        authClass: auth && auth.className,
        authDisplay: auth && getComputedStyle(auth).display,
        authVisibility: auth && getComputedStyle(auth).visibility,
        inputDisplay: input && getComputedStyle(input).display,
        inputVisibility: input && getComputedStyle(input).visibility,
        inputPointerEvents: input && getComputedStyle(input).pointerEvents,
        inputRect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        activeElement: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
        viewport: { width: innerWidth, height: innerHeight },
        scroll: { x: scrollX, y: scrollY },
        documentHeight: document.documentElement.scrollHeight
      };
    });
    console.log("LOGIN FIELD STATE AFTER WAIT " + JSON.stringify(stateAfterWait));
    await page.screenshot({ path: "jr-auth-diagnostic.png", fullPage: false, timeout: 8000 }).catch(error => console.log("Screenshot unavailable: " + error.message));
    await identifier.click({ timeout: 10000 });
    await identifier.fill("browser-test@example.invalid");
    assert.equal(await identifier.evaluate(el => document.activeElement === el), true, "identifier field must receive real browser focus");
    const password = page.locator("#loginPassword");
    await password.click();
    await password.fill("BrowserTestPassword123");
    assert.equal(await password.evaluate(el => document.activeElement === el), true, "password field must receive real browser focus");

    await page.locator("#loginSubmit").click();
    await page.waitForFunction(() => {
      const auth = document.getElementById("auth");
      const app = document.getElementById("app");
      return !!auth && auth.classList.contains("hidden") && !!app && !app.classList.contains("hidden");
    }, null, { timeout: 30000 });

    const destinations = [
      ["home", "home"],
      ["worlds", "worlds"],
      ["jr", "assistant"],
      ["command", "command"]
    ];
    for (const [button, pageId] of destinations) {
      const control = page.locator('#jpMobileDock [data-mobile-destination="' + button + '"]');
      await control.waitFor({ state: "visible", timeout: 15000 });
      await control.click();
      await page.waitForFunction(id => {
        const active = document.getElementById(id);
        return !!active && !active.classList.contains("hidden") && active.hidden !== true;
      }, pageId, { timeout: 15000 });
      console.log("PASS mobile navigation: " + button + " opens #" + pageId);
    }

    assert.deepEqual(errors, [], "browser reported JavaScript runtime errors: " + errors.join(" | "));
    console.log("PASS mobile sign-in field focus, credential entry, mocked login transition, and all four navigation destinations.");
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error("FAIL browser auth smoke: " + error.stack);
  process.exitCode = 1;
});
