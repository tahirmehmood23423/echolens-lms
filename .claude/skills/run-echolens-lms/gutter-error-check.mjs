#!/usr/bin/env node
'use strict';
/**
 * One-off check: the compiler's line-number gutter staying in sync when
 * code changes programmatically (file switch, language switch), and the
 * new "highlight the exact error line" feature (see setCode()/
 * EchoRun.markErrorLine in public/compiler.html + public/js/coderunner.js).
 *
 * Usage: BASE_URL=http://localhost:3100 node gutter-error-check.mjs
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

// How many lines the gutter currently shows, and how many the textarea's
// value actually has - the bug was these going out of sync.
async function gutterVsCode(page) {
  return page.evaluate(() => {
    const gutterLines = document.querySelectorAll('.editor-gutter-line').length;
    const codeLines = document.getElementById('code').value.split('\n').length;
    const errLine = document.querySelector('.editor-gutter-line.err');
    return {
      gutterLines, codeLines, match: gutterLines === codeLines,
      errLineText: errLine ? errLine.textContent.trim() : null,
    };
  });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[${page.url()}] ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`[${page.url()}] pageerror: ${err.message}`));

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="login"]', 'student@echolens.digital');
    await page.fill('input[name="password"]', 'ChangeMe!2026');
    await page.click('#submit');
    await page.waitForURL(/\/(dashboard|open)$/, { timeout: 15000 });
    const waInput = page.locator('input[name="whatsapp"]');
    if (await waInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await waInput.fill('0300-0000000');
      await page.click('#waForm button');
      await page.waitForSelector('input[name="whatsapp"]', { state: 'hidden', timeout: 5000 });
    }

    await page.goto(`${BASE_URL}/compiler`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#code', { timeout: 10000 });
    await page.waitForTimeout(500);

    console.log('--- initial load ---');
    console.log(await gutterVsCode(page));
    await shot(page, 'gutter-1-initial');

    console.log('--- switch language to C ---');
    await page.selectOption('#lang', 'c');
    await page.waitForTimeout(300);
    console.log(await gutterVsCode(page));
    await shot(page, 'gutter-2-lang-c');

    console.log('--- switch language back to Python ---');
    await page.selectOption('#lang', 'python');
    await page.waitForTimeout(300);
    console.log(await gutterVsCode(page));
    await shot(page, 'gutter-3-lang-python');

    console.log('--- new file, then switch between files ---');
    page.once('dialog', (d) => d.accept('helper.py'));
    await page.click('button[onclick="newFile()"]');
    await page.waitForTimeout(300);
    console.log('after newFile():', await gutterVsCode(page));
    await shot(page, 'gutter-4-newfile');

    await page.click('.cmp2-file:has-text("main.py")');
    await page.waitForTimeout(300);
    console.log('after switching back to main.py:', await gutterVsCode(page));
    await shot(page, 'gutter-5-switch-back');

    console.log('--- Python error-line highlight ---');
    const pySnippet = 'print(1)\nprint(2)\nprint(3)\nprint(4)\nprint(5)\nprint(undefined_variable)\n';
    await page.fill('#code', pySnippet);
    await page.dispatchEvent('#code', 'input'); // typing a real value; also refreshes the gutter for this new content
    await page.waitForTimeout(200);
    await page.click('button:has-text("Run")');
    await page.waitForFunction(() => document.getElementById('status').textContent.includes('error'), { timeout: 20000 });
    await page.waitForTimeout(300);
    const pyResult = await gutterVsCode(page);
    console.log('after Python error run:', pyResult);
    const pySelection = await page.evaluate(() => {
      const box = document.getElementById('code');
      return box.value.slice(box.selectionStart, box.selectionEnd);
    });
    console.log('selected text in editor:', JSON.stringify(pySelection));
    await shot(page, 'gutter-6-python-error');

    console.log('--- C compile-error-line highlight ---');
    await page.selectOption('#lang', 'c');
    await page.waitForTimeout(300);
    const cSnippet = '#include <stdio.h>\nint main() {\n    int x = 5\n    printf("%d", x);\n    return 0;\n}\n';
    await page.fill('#code', cSnippet);
    await page.dispatchEvent('#code', 'input');
    await page.waitForTimeout(200);
    await page.click('button:has-text("Run")');
    await page.waitForFunction(() => /error|Compilation/.test(document.getElementById('status').textContent), { timeout: 30000 });
    await page.waitForTimeout(300);
    const cResult = await gutterVsCode(page);
    console.log('after C compile error run:', cResult);
    await shot(page, 'gutter-7-c-error');
  } finally {
    await browser.close();
  }

  const real = errors.filter((e) => !/three\.min\.js|fonts\.googleapis|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(e));
  if (real.length) { console.log('--- console/page errors ---'); real.forEach((e) => console.log(e)); }
  else console.log('no console/page errors (excluding blocked external CDN calls)');
}

run().catch((err) => { console.error('check failed:', err.message); process.exit(1); });
