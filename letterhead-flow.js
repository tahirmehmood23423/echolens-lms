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
  // Simple vertical bar chart - labels/values are parallel arrays. Used for
  // report PDFs (see analytics-report-pdf.js) where the on-screen chart
  // needs a printable equivalent, not for anything data-precise like a
  // financial statement.
  async barChart(labels, values, { height = 150, color = GOLD, gapAfter = 34 } = {}) {
    await this.ensureSpace(height + gapAfter + 16);
    const top = this.y;
    const bottom = top - height;
    const width = RIGHT - LEFT;
    const max = Math.max(1, ...values, 0);
    const n = Math.max(labels.length, 1);
    const gap = n > 40 ? 1 : 3;
    const barW = Math.max(1, (width - gap * (n - 1)) / n);
    let lastLabel = null; // avoid e.g. "1" appearing at both the half and full gridline when max is tiny
    for (const frac of [0, 0.5, 1]) {
      const y = bottom + height * frac;
      this.page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 0.5, color: LINE });
      const label = String(Math.round(max * frac));
      if (label !== lastLabel) { this.page.drawText(label, { x: LEFT - 26, y: y - 3, size: 7, font: this.font, color: MUTED }); lastLabel = label; }
    }
    const showEvery = n > 24 ? Math.ceil(n / 24) : 1;
    const showValues = n <= 24;
    let x = LEFT;
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
  async save() { return Buffer.from(await this.outDoc.save()); }
}

module.exports = { LetterheadFlow, NAVY, MUTED, LINE, GOLD, TOP, BOTTOM, LEFT, RIGHT };
