/* eslint-disable */
const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");

const BASE = process.env.BASE || "http://localhost:3000";
const SHOTS_DIR = join(process.cwd(), "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const SP_GEO = { latitude: -23.5505, longitude: -46.6333 };

async function shoot(page, name) {
  const path = join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log("  saved", path);
}

(async () => {
  const browser = await chromium.launch();

  // ---- 1) Public landing
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let page = await ctx.newPage();
  console.log("→ landing");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shoot(page, "01-landing");

  console.log("→ cadastrar (vazia)");
  await page.goto(`${BASE}/cadastrar`, { waitUntil: "networkidle" });
  await shoot(page, "02-cadastrar");

  console.log("→ entrar (vazia)");
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await shoot(page, "03-entrar");
  await ctx.close();

  // ---- 2) Sign up a fresh buyer via API to keep flow clean, then login in browser
  const buyerEmail = "tester@monetheus.com";
  const buyerPwd = "senhateste1";
  const signup = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: buyerEmail,
      password: buyerPwd,
      fullName: "Carlos Mendes",
      cpf: "123.456.789-09",
      phone: "11988880001",
      city: "São Paulo",
    }),
  });
  if (!signup.ok && signup.status !== 409) {
    const err = await signup.text();
    throw new Error(`signup failed: ${signup.status} ${err}`);
  }

  // Buyer browser context with geolocation enabled
  ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    geolocation: SP_GEO,
    permissions: ["geolocation"],
  });
  page = await ctx.newPage();

  console.log("→ login (buyer)");
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', buyerEmail);
  await page.fill('input[name="password"]', buyerPwd);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/descobrir$/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  console.log("→ descobrir (com cards)");
  // give swipe deck a moment to fetch
  await page.waitForTimeout(800);
  await shoot(page, "04-descobrir");

  // Drag the top card to the right to demo a like
  console.log("→ descobrir (mid-swipe)");
  const card = page.locator(".cursor-grab").first();
  const box = await card.boundingBox();
  if (box) {
    const sx = box.x + box.width / 2;
    const sy = box.y + box.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 130, sy, { steps: 10 });
    await shoot(page, "05-descobrir-swipe");
    await page.mouse.up();
    await page.waitForTimeout(500);
  }

  console.log("→ anunciar (vazia)");
  await page.goto(`${BASE}/anunciar`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shoot(page, "06-anunciar");

  console.log("→ anunciar (acima do cap)");
  await page.fill("#amount", "1200");
  await page.fill("#unitPrice", "5,05");
  await shoot(page, "07-anunciar-acima-do-cap");

  console.log("→ anunciar (preenchido OK + publicar)");
  await page.fill("#amount", "250");
  await page.fill("#unitPrice", "5,05");
  await shoot(page, "08-anunciar-preenchido");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/meus-anuncios$/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  console.log("→ meus-anuncios (buyer com 1 anúncio)");
  await shoot(page, "09-meus-anuncios-buyer");
  await ctx.close();

  // ---- 3) Login as the seller (Marina) to see "interessados"
  ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    geolocation: SP_GEO,
    permissions: ["geolocation"],
  });
  page = await ctx.newPage();
  console.log("→ login (seller marina.demo)");
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "marina.demo@monetheus.com");
  await page.fill('input[name="password"]', "senhademo123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/descobrir$/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  console.log("→ meus-anuncios (seller, 3 ads)");
  await page.goto(`${BASE}/meus-anuncios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "10-meus-anuncios-seller");
  await ctx.close();

  // ---- 4) Admin
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();
  console.log("→ admin login");
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await shoot(page, "11-admin-login");
  await page.fill('input[name="password"]', "teste123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  console.log("→ admin dashboard");
  await shoot(page, "12-admin-dashboard");

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
