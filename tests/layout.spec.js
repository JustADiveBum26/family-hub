import { test, expect } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "test-results/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const PHONE = { width: 390, height: 844 };
const TABLET = { width: 820, height: 1180 };
const LAPTOP = { width: 1366, height: 768 };
const TVS = [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }];

const tag = v => `${v.width}x${v.height}`;

// Uncaught exceptions only: "failed to load" network noise is expected offline.
function trackErrors(page) {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  return errors;
}

// Anything wider than the viewport means a sideways-scrolling page.
async function expectNoSidewaysScroll(page) {
  const r = await page.evaluate(() => {
    const w = window.innerWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > w + 1; })
      .slice(0, 5)
      .map(el => `${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 30)}"`);
    return { scrollWidth: document.documentElement.scrollWidth, w, offenders };
  });
  expect(r.scrollWidth, `page scrolls sideways; wide elements: ${r.offenders.join(" | ")}`).toBeLessThanOrEqual(r.w + 1);
}

// Informational (not a failure): buttons smaller than a comfortable touch target.
async function noteSmallTargets(page, testInfo, label) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 32; })
      .map(b => `${(b.textContent || "").trim().slice(0, 24) || "(icon)"} ${Math.round(b.getBoundingClientRect().height)}px`));
  if (small.length) testInfo.annotations.push({ type: "small-targets", description: `${label}: ${small.length} buttons under 32px tall: ${[...new Set(small)].slice(0, 12).join(", ")}` });
}

const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

for (const [name, vp, touch] of [["phone", PHONE, true], ["tablet", TABLET, true], ["laptop", LAPTOP, false]]) {
  test.describe(`${name} ${tag(vp)}`, () => {
    test.use({ viewport: vp, hasTouch: touch, isMobile: name === "phone" });

    test("public home screen fits", async ({ page }, testInfo) => {
      const errors = trackErrors(page);
      await page.goto("./");
      await expect(page.getByText("SIGN IN AS")).toBeVisible();
      await expectNoSidewaysScroll(page);
      await noteSmallTargets(page, testInfo, "public home");
      await shot(page, `${name}-public-home`);
      expect(errors).toEqual([]);
    });

    test("parent dashboards: every tab renders without crashing or sideways scroll", async ({ page }, testInfo) => {
      test.setTimeout(120000);
      const errors = trackErrors(page);
      for (const who of ["Brad", "Mary Beth"]) {
        await page.goto("./");
        await page.getByRole("button", { name: new RegExp(who) }).first().click();
        // No saved password offline, so this is the "create password" path.
        const pw = page.locator('input[type="password"]');
        await pw.nth(0).fill("layout-test");
        await pw.nth(1).fill("layout-test");
        await page.getByRole("button", { name: /Create Password and Sign In/ }).click();
        const tabs = page.locator("button[data-tab]");
        await expect(tabs.first()).toBeVisible();
        const ids = await tabs.evaluateAll(els => els.map(e => e.getAttribute("data-tab")));
        expect(ids.length).toBeGreaterThan(4);
        for (const id of ids) {
          await page.locator(`button[data-tab="${id}"]`).click();
          await page.waitForTimeout(150);
          await expectNoSidewaysScroll(page);
          await shot(page, `${name}-${who.replace(" ", "").toLowerCase()}-${id}`);
          if (id === "home") await noteSmallTargets(page, testInfo, `${who} home`);
        }
      }
      expect(errors).toEqual([]);
    });
  });
}

for (const vp of TVS) {
  test.describe(`tv ${tag(vp)}`, () => {
    test.use({ viewport: vp });

    test("TV wall display fits the screen with sign-in row visible", async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto("./#tv");
      await expect(page.getByRole("button", { name: /Exit TV Mode/ })).toBeVisible();
      const m = await page.evaluate(() => {
        const exit = [...document.querySelectorAll("button")].find(b => /Exit TV Mode/.test(b.textContent));
        const r = exit.getBoundingClientRect();
        return { bottom: r.bottom, h: window.innerHeight, scrollH: document.documentElement.scrollHeight };
      });
      expect(m.bottom, "sign-in/exit row is pushed below the visible screen").toBeLessThanOrEqual(m.h);
      expect(m.scrollH, "TV page should never scroll").toBeLessThanOrEqual(m.h + 1);
      await expectNoSidewaysScroll(page);
      await shot(page, `tv-${tag(vp)}`);
      expect(errors).toEqual([]);
    });
  });
}
