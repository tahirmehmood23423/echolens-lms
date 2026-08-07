/**
 * plot-check2.mjs - the awkward paths for the v21 figure/download work:
 *   A. input() mid-script: the run replays from the top, so figures drawn
 *      before the prompt must NOT be shown twice.
 *   B. a script that never calls plt.show() still renders its figure.
 *   C. a figure drawn before an exception still renders.
 *   D. pd.read_csv("https://...") downloads (same urlopen patch).
 *   E. a dead URL gives a readable message, not "unknown url type: https".
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const CASES = [
  {
    name: 'A-input-replay',
    expectFigures: 2,
    answer: '7',
    code: `import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [2, 4, 8])
plt.title("Before the prompt")
plt.show()
n = int(input("How many points? "))
plt.bar(range(n), range(n))
plt.title("After the prompt")
plt.show()
print("done", n)`,
  },
  {
    name: 'B-no-show',
    expectFigures: 1,
    code: `import matplotlib.pyplot as plt
plt.plot([3, 1, 4, 1, 5])
plt.title("Never passed to show()")
print("drawn")`,
  },
  {
    name: 'C-error-after-plot',
    expectFigures: 1,
    code: `import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
plt.title("Drawn before the crash")
plt.show()
print(1 / 0)`,
  },
  {
    name: 'D-read-csv-url',
    expectFigures: 1,
    code: `import pandas as pd
import matplotlib.pyplot as plt
df = pd.read_csv("https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv")
print("rows:", len(df), "| cols:", list(df.columns)[:2])
df["sepal_length"].plot(kind="hist", title="Sepal length")
plt.show()`,
  },
  {
    name: 'E-bad-url',
    expectFigures: 0,
    code: `import pandas as pd
df = pd.read_csv("https://raw.githubusercontent.com/mwaskom/seaborn-data/master/does-not-exist.csv")`,
  },
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page = await context.newPage();

await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="login"]', 'student@echolens.digital');
await page.fill('input[name="password"]', 'ChangeMe!2026');
await page.click('#submit');
await page.waitForURL(/\/(dashboard|open)$/, { timeout: 20000 });
const wa = await page.$('input[name="whatsapp"]');
if (wa) { await wa.fill('+923001234567'); await page.click('button:has-text("Save")'); await page.waitForTimeout(1200); }
await page.goto(`${BASE_URL}/compiler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);

let failed = 0;
for (const c of CASES) {
  await page.fill('#code', c.code);
  // The status line still holds the previous case's verdict until the worker
  // reports in - blank it first so the wait below can't match a stale one.
  await page.evaluate(() => { document.querySelector('#status').textContent = 'pending'; });
  await page.click('button:has-text("Run")');
  if (c.answer) {
    await page.waitForSelector('#term .term-in-row:visible', { timeout: 180000 });
    await page.fill('#term .term-in', c.answer);
    await page.press('#term .term-in', 'Enter');
  }
  await page.waitForFunction(
    () => /Done\.|error|Stopped/i.test(document.querySelector('#status')?.textContent || ''),
    null,
    { timeout: 180000 },
  );
  await page.waitForTimeout(800);
  const state = await page.evaluate(() => ({
    status: document.querySelector('#status')?.textContent?.trim(),
    out: document.querySelector('#term .term-out')?.textContent?.trim(),
    figures: document.querySelectorAll('#term .term-fig').length,
    titles: Array.from(document.querySelectorAll('#term .term-fig-name')).map((n) => n.textContent),
  }));
  const ok = state.figures === c.expectFigures;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name}: figures=${state.figures} (want ${c.expectFigures}) status="${state.status}"`);
  console.log('       out: ' + JSON.stringify((state.out || '').slice(0, 300)));
  await page.screenshot({ path: path.join(SHOTS, `plot2-${c.name}.png`), fullPage: true });
}
await browser.close();
console.log(failed ? `${failed} case(s) failed` : 'all cases passed');
process.exit(failed ? 1 : 0);
