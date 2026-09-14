'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { launch, context, login } = require('./browser-lib.cjs');

function rgb(value) { return (String(value).match(/\d+/g) || []).slice(0, 3).map(Number); }
function luminance(colour) {
  const channels = rgb(colour).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

(async () => {
  const browser = await launch();
  try {
    const ctx = await context(browser, { width: 1440, height: 1000 });
    await login(ctx, 'free');
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4318/compiler');
    await page.locator('#code').waitFor();
    await page.locator('#darkBtn').click();
    const styles = await page.evaluate(() => {
      const read = (element) => { const value = getComputedStyle(element); return { color: value.color, background: value.backgroundColor }; };
      return {
        heading: read(document.querySelector('#appWrap h1')),
        editor: read(document.querySelector('.editor-code-pane')),
        code: read(document.querySelector('#code')),
        packages: read(document.querySelector('#pkgs')),
      };
    });
    const editorContrast = contrast(styles.code.color, styles.editor.background);
    assert.ok(editorContrast >= 4.5, `Editor contrast was ${editorContrast.toFixed(2)}:1`);
    assert.equal(styles.heading.color, 'rgb(234, 242, 255)');
    assert.notEqual(styles.editor.background, 'rgba(0, 0, 0, 0)');
    await page.screenshot({ path: path.join(__dirname, 'evidence', 'compiler-dark-contrast.png'), fullPage: true, animations: 'disabled' });
    await ctx.close();
    console.log(JSON.stringify({ editor_contrast: Number(editorContrast.toFixed(2)), heading_visible: true, dark_editor_background: true }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
