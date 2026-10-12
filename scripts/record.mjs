import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";

const kind = process.argv[2] || "demo";
const base = process.env.APP_URL || "http://localhost:3094";
const outDir = path.join(process.cwd(), "docs");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

function linger(ms) {
  return page.waitForTimeout(ms);
}

async function playSunday() {
  await page.goto(`${base}/phone?play=1`, { waitUntil: "networkidle" });
  await page.locator("[data-stamp='AGAIN']").waitFor({ timeout: 30000 });
  await linger(2500);
}

if (kind === "pitch") {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await linger(8000);
  await page.evaluate(() => window.scrollTo(0, 640));
  await linger(6000);
  await playSunday();
} else if (kind === "agora") {
  await page.goto(`${base}/phone?play=1`, { waitUntil: "networkidle" });
  await page.locator("[data-stamp='OPEN']").waitFor({ timeout: 20000 });
  await page.locator("[data-stamp='LANDED']").waitFor({ timeout: 20000 });
  await page.locator("[data-stamp='AGAIN']").waitFor({ timeout: 20000 });
  await linger(3000);
} else {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await linger(4000);
  await playSunday();
  await page.goto(`${base}/how`, { waitUntil: "networkidle" });
  await linger(7000);
}

await context.close();
await browser.close();

const webms = readdirSync(outDir).filter((file) => file.endsWith(".webm") && !["demo", "pitch", "agora"].some((name) => file.startsWith(name)));
const webm = webms.sort().at(-1);
if (!webm) throw new Error("no webm recorded");
const dest = path.join(outDir, `${kind}.webm`);
renameSync(path.join(outDir, webm), dest);
console.log("recorded", dest);
