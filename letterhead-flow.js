'use strict';

/**
 * EchoLens LMS - reusable letterhead PDF flow engine
 * Generalizes the page-management/layout logic already used by
 * ambassador-report-pdf.js so contract-pdf.js and offer-letter-pdf.js can lay
 * out flowing legal text (headings, numbered clauses, bullet lists, tables,
 * signature blocks) on top of the real company letterhead
 * (assets/letterhead.pdf), with automatic pagination: whenever content would
 * run past the bottom margin, a fresh letterhead page is copied in.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');

const LETTERHEAD_PATH = path.join(__dirname, 'assets', 'letterhead.pdf');
const NAVY = rgb(0x16 / 255, 0x23 / 255, 0x3a / 255);
const MUTED = rgb(0x5b / 255, 0x6b / 255, 0x84 / 255);
const LINE = rgb(0xe3 / 255, 0xe9 / 255, 0xf2 / 255);
const GOLD = rgb(0xd9 / 255, 0xa4 / 255, 0x25 / 255);

// Same safe content zone ambassador-report-pdf.js uses: the letterhead's
// header band ends well above y=700 and its footer band starts well below
// y=95 on an 841.89pt-tall page.
const TOP = 700, BOTTOM = 95, LEFT = 60, RIGHT = 535;

let templateBytesCache = null;
function templateBytes() {
  if (!templateBytesCache) templateBytesCache = fs.readFileSync(LETTERHEAD_PATH);
  return templateBytesCache;
}

class LetterheadFlow {
  static async create() {
    const flow = new LetterheadFlow();
    flow.templateDoc = await PDFDocument.load(templateBytes());
    flow.outDoc = await PDFDocument.create();
    flow.font = await flow.outDoc.embedFont(StandardFonts.Helvetica);
    flow.bold = await flow.outDoc.embedFont(StandardFonts.HelveticaBold);
    flow.italic = await flow.outDoc.embedFont(StandardFonts.HelveticaOblique);
    await flow.newPage();
    return flow;
  }
  async newPage() {
    const [templatePage] = await this.outDoc.copyPages(this.templateDoc, [0]);
    this.page = this.outDoc.addPage(templatePage);
    this.y = TOP;
  }
  async ensureSpace(need) {
    if (this.y - need < BOTTOM) await this.newPage();
  }
  // Word-wraps text at `size`/`font` to fit within `width`; returns lines.
  wrap(text, font, size, width) {
    const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > width && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }
  async heading(text, { size = 14, gapBefore = 0, gapAfter = 10, color = NAVY } = {}) {
    await this.ensureSpace(size + gapBefore + gapAfter);
    this.y -= gapBefore;
    this.page.drawText(text, { x: LEFT, y: this.y, size, font: this.bold, color, characterSpacing: 0.5 });
    this.y -= (size + gapAfter);
  }
  async rule({ gapAfter = 10, color = GOLD } = {}) {
    await this.ensureSpace(gapAfter + 4);
    this.page.drawLine({ start: { x: LEFT, y: this.y }, end: { x: RIGHT, y: this.y }, thickness: 1, color });
    this.y -= gapAfter;
  }
  async paragraph(text, { size = 9.5, bold = false, italic = false, indent = 0, lineGap = 4, gapAfter = 8, color = NAVY } = {}) {
    const font = bold ? this.bold : italic ? this.italic : this.font;
    const lines = this.wrap(text, font, size, RIGHT - LEFT - indent);
    for (const line of lines) {
      await this.ensureSpace(size + lineGap);
      this.page.drawText(line, { x: LEFT + indent, y: this.y, size, font, color });
      this.y -= (size + lineGap);
    }
    this.y -= gapAfter;
  }
  // A numbered clause ("8.3") in bold, with the wrapped body hanging-indented
  // beneath the number - the layout every clause in the source contract uses.
  async clause(number, text, { size = 9.5, gapAfter = 6, numWidth = 34 } = {}) {
    await this.ensureSpace(size + 4);
    this.page.drawText(number, { x: LEFT, y: this.y, size, font: this.bold, color: NAVY });
    const lines = this.wrap(text, this.font, size, RIGHT - LEFT - numWidth);
    let first = true;
    for (const line of lines) {
      if (!first) await this.ensureSpace(size + 4);
      this.page.drawText(line, { x: LEFT + numWidth, y: this.y, size, font: this.font, color: NAVY });
      this.y -= (size + 4);
      first = false;
    }
    this.y -= gapAfter;
  }
  async bullets(items, { size = 9.5, gapAfter = 8, indent = 14 } = {}) {
    for (const item of items) {
      const lines = this.wrap(item, this.font, size, RIGHT - LEFT - indent);
      let first = true;
      for (const line of lines) {
        await this.ensureSpace(size + 4);
        if (first) this.page.drawText('•', { x: LEFT, y: this.y, size, font: this.font, color: MUTED });
        this.page.drawText(line, { x: LEFT + indent, y: this.y, size, font: this.font, color: NAVY });
        this.y -= (size + 4);
        first = false;
      }
    }
    this.y -= gapAfter;
  }
  // Fixed-column table: columns = [{label, width}], rows = [[cell, ...]].
  async table(columns, rows, { size = 9, gapAfter = 10 } = {}) {
    await this.ensureSpace(30);
    let x = LEFT;
    for (const c of columns) { this.page.drawText(c.label.toUpperCase(), { x, y: this.y, size: 8, font: this.bold, color: MUTED, characterSpacing: 0.4 }); x += c.width; }
    this.y -= 8;
    this.page.drawLine({ start: { x: LEFT, y: this.y }, end: { x: RIGHT, y: this.y }, thickness: 0.75, color: LINE });
    this.y -= 14;
    for (const row of rows) {
      await this.ensureSpace(size + 8);
      x = LEFT;
      row.forEach((cell, i) => {
        this.page.drawText(String(cell), { x, y: this.y, size, font: i === 0 ? this.bold : this.font, color: NAVY });
        x += columns[i].width;
      });
      this.y -= (size + 8);
    }
    this.y -= gapAfter;
  }
  // A row of compact metric cards (value + label), wrapped into a fixed
  // number of columns - the "dashboard" reading for a page of summary
  // stats, instead of one long two-column list. items = [{value, label}].
  async metricGrid(items, { columns = 3, cardHeight = 56, gapAfter = 16 } = {}) {
    const gutter = 12;
    const colW = (RIGHT - LEFT - gutter * (columns - 1)) / columns;
    const rows = Math.ceil(items.length / columns);
    await this.ensureSpace(rows * (cardHeight + gutter));
    items.forEach((item, i) => {
      const col = i % columns, row = Math.floor(i / columns);
      const x = LEFT + col * (colW + gutter);
      const y = this.y - row * (cardHeight + gutter);
      this.page.drawRectangle({ x, y: y - cardHeight, width: colW, height: cardHeight, borderColor: LINE, borderWidth: 1 });
      this.page.drawRectangle({ x, y: y - 3, width: 22, height: 3, color: GOLD }); // small accent tick, top-left of the card
      const val = String(item.value);
      this.page.drawText(val, { x: x + 12, y: y - 27, size: 19, font: this.bold, color: NAVY });
      this.page.drawText(String(item.label).toUpperCase(), { x: x + 12, y: y - cardHeight + 12, size: 7, font: this.font, color: MUTED, characterSpacing: 0.3 });
    });
    this.y -= rows * (cardHeight + gutter);
    this.y += gutter; // last row's own gutter isn't real trailing space
    this.y -= gapAfter;
  }
  // Simple vertical bar chart - labels/values are parallel arrays. Used for
  // report PDFs (see analytics-report-pdf.js) where the on-screen chart
  // needs a printable equivalent, not for anything data-precise like a
  // financial statement. `x`/`width` let it be drawn narrower than the full
  // page (see miniBarChart below for two side-by-side charts).
  // gapAfter defaults to 46, not just under the chart itself: the rotated
  // (-50°) date labels descend well below their anchor point, so a smaller
  // gap lets the next element's text collide with their tails.
  async barChart(labels, values, { height = 150, color = GOLD, gapAfter = 46, x: chartX = LEFT, width: chartWidth = RIGHT - LEFT } = {}) {
    await this.ensureSpace(height + gapAfter + 16);
    const top = this.y;
    const bottom = top - height;
    const max = Math.max(1, ...values, 0);
    const n = Math.max(labels.length, 1);
    const gap = n > 40 ? 1 : 3;
    const barW = Math.max(1, (chartWidth - gap * (n - 1)) / n);
    let lastLabel = null; // avoid e.g. "1" appearing at both the half and full gridline when max is tiny
    for (const frac of [0, 0.5, 1]) {
      const y = bottom + height * frac;
      this.page.drawLine({ start: { x: chartX, y }, end: { x: chartX + chartWidth, y }, thickness: 0.5, color: LINE });
      const label = String(Math.round(max * frac));
      if (label !== lastLabel) { this.page.drawText(label, { x: chartX - 26, y: y - 3, size: 7, font: this.font, color: MUTED }); lastLabel = label; }
    }
    // Rotated date labels need real horizontal room or they collide - cap
    // how many are shown to what the chart width can actually fit, rather
    // than a fixed count regardless of how narrow the bars are.
    const estLabelFootprint = 30;
    const maxLabels = Math.max(4, Math.floor(chartWidth / estLabelFootprint));
    const showEvery = n > maxLabels ? Math.ceil(n / maxLabels) : 1;
    const showValues = n <= maxLabels;
    let x = chartX;
    labels.forEach((label, i) => {
      const v = Number(values[i]) || 0;
      const h = v > 0 ? Math.max((v / max) * height, 2) : 0;
      if (h > 0) this.page.drawRectangle({ x, y: bottom, width: barW, height: h, color });
      if (showValues && v > 0) {
        const txt = String(v);
        const tw = this.font.widthOfTextAtSize(txt, 7);
        this.page.drawText(txt, { x: x + barW / 2 - tw / 2, y: bottom + h + 3, size: 7, font: this.font, color: NAVY });
      }
      if (i % showEvery === 0 || i === n - 1) {
        this.page.drawText(String(label), { x: x + barW / 2, y: bottom - 10, size: 6.5, font: this.font, color: MUTED, rotate: degrees(-50) });
      }
      x += barW + gap;
    });
    this.y = bottom - gapAfter;
  }
  // A small side-by-side comparison chart (2-3 categories) drawn at an
  // explicit (topY, x, width) rather than tracking `this.y` itself, so the
  // caller can place two of these next to each other in one row - see
  // analytics-report-pdf.js's "At a glance" section. Returns the bottom y
  // used, for the caller to reconcile row height afterward.
  miniBarChart(topY, x, width, title, categories, { height = 90, color = GOLD } = {}) {
    this.page.drawText(title, { x, y: topY, size: 9, font: this.bold, color: NAVY });
    const bottom = topY - 20 - height;
    const max = Math.max(1, ...categories.map((c) => c.value));
    const n = categories.length;
    const gap = 26;
    const barW = Math.max(10, (width - gap * (n - 1)) / n);
    this.page.drawLine({ start: { x, y: bottom }, end: { x: x + width, y: bottom }, thickness: 0.75, color: LINE });
    let cx = x;
    for (const c of categories) {
      const h = c.value > 0 ? Math.max((c.value / max) * height, 2) : 0;
      if (h > 0) this.page.drawRectangle({ x: cx, y: bottom, width: barW, height: h, color });
      const txt = String(c.value);
      const tw = this.bold.widthOfTextAtSize(txt, 12);
      this.page.drawText(txt, { x: cx + barW / 2 - tw / 2, y: bottom + h + 5, size: 12, font: this.bold, color: NAVY });
      const lw = this.font.widthOfTextAtSize(c.label, 7.5);
      this.page.drawText(c.label, { x: cx + barW / 2 - lw / 2, y: bottom - 11, size: 7.5, font: this.font, color: MUTED });
      cx += barW + gap;
    }
    return bottom - 24;
  }
  // Two-column signature block. A column marked { signed: true } renders the
  // EchoLens digital signature (typed name, no image) plus a note; unmarked
  // columns stay blank for the counterparty to sign by hand.
  async signatureBlock(cols, { height = 70 } = {}) {
    await this.ensureSpace(height);
    const lineY = this.y;
    for (const c of cols) {
      if (c.signed && c.name) this.signatureName(c.x, lineY, c.name);
      this.page.drawLine({ start: { x: c.x, y: lineY }, end: { x: c.x + c.w, y: lineY }, thickness: 1, color: NAVY });
      if (c.name) this.page.drawText(c.name, { x: c.x, y: lineY - 13, size: 9.5, font: this.bold, color: NAVY });
      if (c.title) this.page.drawText(c.title, { x: c.x, y: lineY - 25, size: 8.5, font: this.font, color: MUTED });
      if (c.signed && c.name) {
        this.page.drawText('Digitally signed - no wet-ink signature required', {
          x: c.x, y: lineY - 36, size: 7, font: this.italic, color: MUTED,
        });
      }
    }
    this.y -= height;
    return lineY;
  }
  // The EchoLens digital signature: the authorised name itself, set in an
  // italic script-style face just above the signature rule at (x, lineY).
  // There is deliberately no image path - no scanned or hand signature is
  // ever embedded in an EchoLens document.
  signatureName(x, lineY, name, { size = 22 } = {}) {
    this.page.drawText(String(name || ''), { x, y: lineY + 8, size, font: this.italic, color: NAVY });
  }
  // A single-party sign-off with an optional real signature image and a
  // company stamp overlapping it, like a physically signed-and-stamped
  // document - used by internal reports (see analytics-report-pdf.js), NOT
  // by contracts/offer letters, which keep the typed-name-only signature
  // above by deliberate policy (see signatureName's note). Falls back to
  // that same typed style when sigImageBytes/stampImageBytes aren't given,
  // so the block still looks complete before real assets are dropped in.
  async stampedSignOff({ name, title = 'Director', dateLabel, sigImageBytes, stampImageBytes, x = LEFT, w = 230 } = {}) {
    const blockHeight = 96;
    await this.ensureSpace(blockHeight);
    const lineY = this.y - 44;
    let sigImg = null;
    if (sigImageBytes) sigImg = await this.outDoc.embedPng(sigImageBytes).catch(() => null) || await this.outDoc.embedJpg(sigImageBytes).catch(() => null);
    if (sigImg) {
      const maxW = w * 0.85, maxH = 38;
      const scale = Math.min(maxW / sigImg.width, maxH / sigImg.height);
      this.page.drawImage(sigImg, { x, y: lineY + 4, width: sigImg.width * scale, height: sigImg.height * scale });
    } else if (name) {
      this.signatureName(x, lineY, name);
    }
    let stampImg = null;
    if (stampImageBytes) stampImg = await this.outDoc.embedPng(stampImageBytes).catch(() => null) || await this.outDoc.embedJpg(stampImageBytes).catch(() => null);
    if (stampImg) {
      const size = 78;
      const scale = size / Math.max(stampImg.width, stampImg.height);
      const sw = stampImg.width * scale, sh = stampImg.height * scale;
      // Overlaps the tail end of the signature/line/name, like a real stamp
      // struck across a signature rather than sitting politely beside it.
      this.page.drawImage(stampImg, { x: x + w - sw * 0.6, y: lineY - sh * 0.55, width: sw, height: sh, rotate: degrees(-9), opacity: 0.88 });
    }
    this.page.drawLine({ start: { x, y: lineY }, end: { x: x + w, y: lineY }, thickness: 1, color: NAVY });
    if (name) this.page.drawText(name, { x, y: lineY - 14, size: 10, font: this.bold, color: NAVY });
    this.page.drawText(title, { x, y: lineY - 26, size: 8.5, font: this.font, color: MUTED });
    if (dateLabel) this.page.drawText(`Date: ${dateLabel}`, { x, y: lineY - 38, size: 8.5, font: this.font, color: MUTED });
    this.y -= blockHeight;
  }
  async save() { return Buffer.from(await this.outDoc.save()); }
}

module.exports = { LetterheadFlow, NAVY, MUTED, LINE, GOLD, TOP, BOTTOM, LEFT, RIGHT };
