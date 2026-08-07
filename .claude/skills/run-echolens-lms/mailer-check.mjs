/**
 * mailer-check.mjs - drives the new "Email Leads" admin page:
 *   1. nav button exists on the left column, separate from Analytics
 *   2. add a lead manually -> shows up in the leads table
 *   3. compose + send with a file attachment + registration link checked
 *      -> succeeds, and the server log shows the attachment + link
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const tmpFile = path.join(HERE, 'tmp-attachment.csv');
fs.writeFileSync(tmpFile, 'name,email\nSample,sample@example.com\n');

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="login"]', 'admin@echolens.digital');
await page.fill('input[name="password"]', 'ChangeMe!2026');
await page.click('#submit');
await page.waitForURL(/\/dashboard$/, { timeout: 20000 });
await page.waitForTimeout(1000);

const navCount = await page.locator('.nav-item[data-view="admin-mailer"]').count();
const navVisible = navCount ? await page.locator('.nav-item[data-view="admin-mailer"]').isVisible() : false;
console.log('nav item present:', navCount > 0, '| visible:', navVisible);

await page.click('.nav-item[data-view="admin-mailer"]');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(SHOTS, 'mailer-page.png'), fullPage: true });

// 1. add a lead manually
const uniqueEmail = `lead-${Date.now()}@example.com`;
await page.fill('#mailerAddLeadForm input[name="name"]', 'Manual Lead Test');
await page.fill('#mailerAddLeadForm input[name="email"]', uniqueEmail);
await page.fill('#mailerAddLeadForm input[name="whatsapp"]', '+923001112222');
await page.click('#mailerAddLeadForm button');
await page.waitForTimeout(1000);
const leadsText = await page.locator('#mailerLeadsBox').innerText();
console.log('new lead visible in table:', leadsText.includes(uniqueEmail));
await page.screenshot({ path: path.join(SHOTS, 'mailer-lead-added.png'), fullPage: true });

// 2. compose + send with attachment + registration link
await page.selectOption('#mailerBlastForm select[name="audience"]', 'leads');
await page.fill('#mailerBlastForm input[name="subject"]', 'Test cold email with attachment');
await page.fill('#mailerBlastForm textarea[name="body"]', 'This is a test message body for the cold-mailing check.');
await page.setInputFiles('#mailerBlastForm input[name="files"]', tmpFile);
await page.check('#mailerBlastForm input[name="registration_link"]');
await page.click('#mailerBlastForm button');
await page.waitForFunction(() => !document.querySelector('#mailerBlastForm button').disabled, null, { timeout: 20000 });
await page.waitForTimeout(300);
const toastText = await page.locator('#toast').innerText();
console.log('toast after send:', toastText);
await page.screenshot({ path: path.join(SHOTS, 'mailer-sent.png'), fullPage: true });

await browser.close();
fs.unlinkSync(tmpFile);
const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log(real.length ? '--- console errors ---\n' + real.join('\n') : 'no console errors');
