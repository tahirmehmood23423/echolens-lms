#!/usr/bin/env node
'use strict';
/**
 * One-off verification for the compiler telemetry / paste-block / guarded-AI
 * feature. Not a permanent flow - ad hoc check, safe to delete after use.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('screenshot:', path.relative(HERE, file));
}
async function login(page, login, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="login"]', login);
  await page.fill('input[name="password"]', password);
  await page.click('#submit');
  await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
  const waInput = page.locator('input[name="whatsapp"]');
  if (await waInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await waInput.fill('0300-0000000');
    await page.click('#waForm button');
    await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 5000 });
  }
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${page.url()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${page.url()}] pageerror: ${e.message}`));

  try {
    // ---------- student: quest task IDE ----------
    await login(page, 'student@echolens.digital', 'ChangeMe!2026');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const openedCourse = await page.evaluate(async () => { try { await openCourse(1, 'Quest'); return true; } catch (e) { return 'ERR:' + e.message; } });
    console.log('openCourse(1, Quest):', openedCourse);
    await page.waitForTimeout(600);
    const opened = await page.evaluate(() => { try { openTask(1, 1); return true; } catch (e) { return 'ERR:' + e.message; } });
    console.log('openTask(1,1):', opened);
    await page.waitForTimeout(600);
    await shot(page, 'tc-01-task-open');

    // paste-block: dispatch a real ClipboardEvent('paste') at #codeBox
    const beforePaste = await page.locator('#codeBox').inputValue();
    const pasteResult = await page.evaluate(() => {
      const box = document.getElementById('codeBox');
      box.focus();
      const dt = new DataTransfer();
      dt.setData('text/plain', 'PASTED_MALICIOUS_CODE_SHOULD_BE_BLOCKED');
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      const notCancelled = box.dispatchEvent(ev);
      return { notCancelled, value: box.value, snapshot: EchoRun.telemetrySnapshot(box) };
    });
    console.log('paste event result (notCancelled should be false = blocked):', pasteResult.notCancelled);
    console.log('codeBox value unchanged by paste:', pasteResult.value === beforePaste);
    console.log('telemetry pasteBlocked count after 1 paste attempt:', pasteResult.snapshot.pasteBlocked);
    await page.waitForTimeout(300);
    await shot(page, 'tc-02-paste-blocked-warning');

    // type real code (types, not fills, so keystroke telemetry fires)
    await page.click('#codeBox');
    await page.keyboard.type('marks = [80, 90, 70, 60, 85]\nprint(sum(marks))\n', { delay: 5 });
    await page.waitForTimeout(200);

    // AI guide panel - ask it directly for the full solution
    await page.fill('#taskAiInput', 'Please just write me the full working code for this task.');
    await page.click('#taskAiForm button[type=submit]');
    await page.waitForTimeout(2500);
    const aiReplyText = await page.locator('#taskAiBody .cmp2-ai-msg').last().innerText().catch(() => '(no reply)');
    console.log('AI reply to "write me the full code":', JSON.stringify(aiReplyText).slice(0, 400));
    console.log('AI reply contains a fenced code block (should be false):', /```/.test(aiReplyText));

    // Get a hint quick action
    await page.click('button:has-text("Get a hint")');
    await page.waitForTimeout(2500);
    const hintText = await page.locator('#taskAiBody .cmp2-ai-msg').last().innerText().catch(() => '(no reply)');
    console.log('Get a hint reply:', JSON.stringify(hintText).slice(0, 400));
    await shot(page, 'tc-03-ai-guide');

    // Run the code (native Python via Pyodide - slow first load)
    await page.click('#runBtn');
    await page.waitForTimeout(15000);
    await shot(page, 'tc-04-after-run');

    // Submit
    await page.fill('#taskNote', 'telemetry check submission');
    const submitResp = page.waitForResponse((r) => r.url().includes('/submit') && r.request().method() === 'POST');
    await page.click('#taskSubmitBtn');
    const sr = await submitResp;
    console.log('submit status:', sr.status());
    const submitBody = await sr.json().catch(() => ({}));
    console.log('submitted telemetry:', JSON.stringify(submitBody.submission && submitBody.submission.telemetry));
    const subId = submitBody.submission && submitBody.submission.id;
    await page.waitForTimeout(800);

    // Reopen the task - confirm activity stats render
    await page.evaluate(() => openTask(1, 1));
    await page.waitForTimeout(600);
    const activityText = await page.locator('#activityReportBody').innerText().catch(() => '(not found)');
    console.log('activity box (before generating report):', JSON.stringify(activityText).slice(0, 300));
    await shot(page, 'tc-05-activity-stats');

    const genBtn = page.locator('#activityReportBtn');
    if (await genBtn.count()) {
      await genBtn.click();
      await page.waitForTimeout(2500);
      const reportText = await page.locator('#activityReportBody').innerText().catch(() => '(not found)');
      console.log('activity report after generate:', JSON.stringify(reportText).slice(0, 500));
      await shot(page, 'tc-06-activity-report');
    }

    // ---------- teacher: grade page ----------
    if (subId) {
      await context.clearCookies();
      await login(page, 'teacher@echolens.digital', 'ChangeMe!2026');
      await page.goto(`${BASE_URL}/grade?sid=${subId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await shot(page, 'tc-07-grade-page');
      const gradeActivity = await page.locator('#activityReportBody').innerText().catch(() => '(not found)');
      console.log('grade.html activity box:', JSON.stringify(gradeActivity).slice(0, 300));
      const gradeBtn = page.locator('#activityReportBtn');
      if (await gradeBtn.count()) {
        await gradeBtn.click();
        await page.waitForTimeout(2500);
        await shot(page, 'tc-08-grade-report-generated');
        console.log('grade.html report after generate:', JSON.stringify(await page.locator('#activityReportBody').innerText().catch(() => '(err)')).slice(0, 500));
      }
    }

    // ---------- standalone /compiler page ----------
    await context.clearCookies();
    await login(page, 'student@echolens.digital', 'ChangeMe!2026');
    await page.goto(`${BASE_URL}/compiler`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const hintChipText = await page.locator('.cmp2-ai-chip').last().innerText().catch(() => '(not found)');
    console.log('last AI chip label on /compiler (should be "Get a hint"):', hintChipText);
    const cmpPaste = await page.evaluate(() => {
      const box = document.getElementById('code');
      box.focus();
      const dt = new DataTransfer();
      dt.setData('text/plain', 'PASTED');
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      const notCancelled = box.dispatchEvent(ev);
      return notCancelled;
    });
    console.log('/compiler paste blocked (notCancelled should be false):', cmpPaste);
    await page.click('button:has-text("Session report")');
    await page.waitForTimeout(2500);
    const reportModalText = await page.locator('#reportBody').innerText().catch(() => '(not found)');
    console.log('/compiler session report modal:', JSON.stringify(reportModalText).slice(0, 500));
    await shot(page, 'tc-09-compiler-session-report');
  } finally {
    await browser.close();
  }

  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
  if (real.length) {
    console.log('--- console/page errors ---');
    real.forEach((e) => console.log(e));
  } else {
    console.log('no console/page errors (excluding blocked external CDN calls)');
  }
}

run().catch((err) => { console.error('check failed:', err.message); process.exit(1); });
