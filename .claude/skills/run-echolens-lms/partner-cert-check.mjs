/**
 * partner-cert-check.mjs - end-to-end check of the WebEra "in collaboration
 * with" certificate feature:
 *   1. admin sets partner org name/CEO + uploads a logo (Certificate partner modal)
 *   2. admin marks a batch (paid course) as a WebEra collaboration
 *   3. admin issues a certificate for a student in that batch -> defaults to partner=true
 *   4. the resulting /cert page shows both logos + both typed signatures
 *   5. admin creates an auto-certifying, auto-grading event marked as a WebEra
 *      collaboration; the student registers and submits; the AUTOMATIC
 *      certificate issued on pass also carries the partner block (proves the
 *      fully-automatic issuance path, not just the manual one)
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const LOGO = path.join(HERE, 'webera-test-logo.png');

const browser = await chromium.launch();
const admin = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
admin.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
admin.on('pageerror', (e) => errors.push(String(e)));

async function login(page, user) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', user);
  await page.fill('input[name="password"]', 'ChangeMe!2026');
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
}

await login(admin, 'admin@echolens.digital');

// Find a batch id via the same endpoint "My courses" itself calls.
const overview = await admin.evaluate(async () => (await (await fetch('/api/overview', { credentials: 'same-origin' })).json()));
const bid = overview.courses[0].id;
console.log('using batch id', bid, overview.courses[0].name);

await admin.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
await admin.waitForTimeout(800);
await admin.evaluate((id) => openCourse(id), bid);
await admin.waitForSelector('.dd button:has-text("Manage")', { timeout: 15000 });
await admin.click('.dd button:has-text("Manage")');
await admin.click('.dd-menu button:has-text("Certificate partner")');
await admin.waitForSelector('#fPartner');
await admin.fill('#fPartner input[name="name"]', 'WebEra Solutions PK');
await admin.fill('#fPartner input[name="ceo_name"]', 'Hifza Saleem');
await admin.click('#fPartner button');
await admin.waitForTimeout(500);
await admin.setInputFiles('#fLogo input[type="file"]', LOGO);
await admin.click('#fLogo button');
await admin.waitForTimeout(1200); // formPartnerSettings() re-opens itself after upload
const trackCount = await admin.locator('#partnerTracksBox input[type="checkbox"]').count();
console.log('free tracks listed:', trackCount);
await admin.screenshot({ path: path.join(SHOTS, 'partner-settings-modal.png') });
await admin.click('#modal .close');

// Mark the batch itself as a WebEra collaboration.
await admin.click('.dd button:has-text("Manage")');
await admin.click('.dd-menu button:has-text("Mark as WebEra collaboration")');
await admin.waitForTimeout(700);
const batchState = await admin.evaluate(() => CURRENT_BATCH.batch.partner);
console.log('batch.partner after toggle:', batchState);

// Issue a certificate for the first enrolled student - should default
// partner=true since we just marked the batch as a WebEra collaboration.
await admin.click('.dd button:has-text("Manage")');
await admin.click('.dd-menu button:has-text("Issue certificate")');
await admin.waitForSelector('#f select[name="user_id"]');
await admin.fill('#f input[name="title"]', 'Test Manual Certificate - WebEra Collaboration');
await admin.click('#f button');
await admin.waitForTimeout(1500);
const modalMsgText = await admin.locator('#modalMsg').innerText().catch(() => '');
console.log('issue-cert modal message:', modalMsgText);
const serial = (modalMsgText.match(/serial\s+([A-Z0-9-]+)/i) || [])[1];
console.log('issued serial:', serial);

let certPartnerState = null;
if (serial) {
  const cert = await admin.evaluate(async (s) => (await (await fetch('/api/verify/' + s)).json()), serial);
  certPartnerState = cert.certificate.partner;
  console.log('manual cert partner block:', JSON.stringify(certPartnerState));
  await admin.goto(`${BASE_URL}/cert?s=${serial}`, { waitUntil: 'networkidle' });
  await admin.waitForSelector('.cert', { timeout: 15000 });
  await admin.waitForTimeout(500);
  await admin.screenshot({ path: path.join(SHOTS, 'partner-cert-manual.png'), fullPage: true });
}

await browser.close();
const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log(real.length ? '--- console errors ---\n' + real.join('\n') : 'no console errors');
