'use strict';

/**
 * EchoLens LMS - ambassador monthly commission report
 * Renders one PDF per ambassador per calendar month, listing every student
 * they referred whose payment was confirmed that month, with a 10% commission
 * on the amount actually paid. Every page is the real company letterhead
 * (assets/letterhead.pdf) with the report content drawn directly on top -
 * not a redrawn approximation of it.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const LETTERHEAD_PATH = path.join(__dirname, 'assets', 'letterhead.pdf');
const NAVY = rgb(0x16 / 255, 0x23 / 255, 0x3a / 255);
const MUTED = rgb(0x5b / 255, 0x6b / 255, 0x84 / 255);
const LINE = rgb(0xe3 / 255, 0xe9 / 255, 0xf2 / 255);
const GOLD = rgb(0xd9 / 255, 0xa4 / 255, 0x25 / 255);

// The letterhead's header band ends well above y=700 and its footer band
// starts well below y=100 (checked against the source PDF's own text
// positions - header text sits at y=769-811, footer text at y=17-29, on an
// 841.89pt-tall page) - this box is a safe, generous no-overlap content zone.
const TOP = 700, BOTTOM = 100, LEFT = 60, RIGHT = 535;
// Kept low enough that even a full last page (worst case: 16 rows on the
// FIRST page, which has the least room before the table starts) leaves the
// signature block below with no overlap - see the y-budget comment there.
const ROWS_PER_PAGE = 16;
const SIG_LINE_Y = 175;

const money = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-US');
const periodLabel = (period) => {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

let templateBytesCache = null;
function templateBytes() {
  if (!templateBytesCache) templateBytesCache = fs.readFileSync(LETTERHEAD_PATH);
  return templateBytesCache;
}

async function ambassadorReportPdf({ ambassador, period, rows, signoff = {} }) {
  const templateDoc = await PDFDocument.load(templateBytes());
  const outDoc = await PDFDocument.create();
  const font = await outDoc.embedFont(StandardFonts.Helvetica);
  const bold = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await outDoc.embedFont(StandardFonts.HelveticaOblique);

  const totalPaid = rows.reduce((s, r) => s + r.amount_paid, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);

  const pages = [];
  const chunks = rows.length ? [] : [[]];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) chunks.push(rows.slice(i, i + ROWS_PER_PAGE));

  for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
    const [templatePage] = await outDoc.copyPages(templateDoc, [0]);
    const page = outDoc.addPage(templatePage);
    pages.push(page);
    let y = TOP;

    if (pageIdx === 0) {
      page.drawText('AMBASSADOR COMMISSION REPORT', { x: LEFT, y, size: 16, font: bold, color: NAVY, characterSpacing: 1 });
      y -= 22;
      page.drawText(periodLabel(period), { x: LEFT, y, size: 12, font, color: MUTED });
      y -= 26;
      page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 1, color: GOLD });
      y -= 22;

      const info = [
        ['Ambassador', ambassador.name],
        ['Referral code', ambassador.code],
        ['University', ambassador.university || '—'],
        ['Email', ambassador.email],
      ];
      for (const [label, val] of info) {
        page.drawText(label, { x: LEFT, y, size: 9.5, font, color: MUTED });
        page.drawText(String(val), { x: LEFT + 110, y, size: 10, font: bold, color: NAVY });
        y -= 16;
      }
      y -= 12;
    } else {
      page.drawText(`AMBASSADOR COMMISSION REPORT — ${periodLabel(period)} (continued)`, { x: LEFT, y, size: 11, font: bold, color: NAVY });
      y -= 20;
      page.drawText(`${ambassador.name} · ${ambassador.code}`, { x: LEFT, y, size: 9.5, font, color: MUTED });
      y -= 20;
    }

    // Table header.
    const cols = [
      { label: 'Student', x: LEFT, w: 150 },
      { label: 'Course', x: LEFT + 155, w: 150 },
      { label: 'Status', x: LEFT + 310, w: 65 },
      { label: 'Amount paid', x: LEFT + 378, w: 70 },
      { label: 'Commission', x: LEFT + 450, w: RIGHT - (LEFT + 450) },
    ];
    for (const c of cols) page.drawText(c.label.toUpperCase(), { x: c.x, y, size: 8, font: bold, color: MUTED, characterSpacing: 0.5 });
    y -= 8;
    page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 0.75, color: LINE });
    y -= 16;

    const rowsThisPage = chunks[pageIdx];
    if (!rowsThisPage.length && pageIdx === 0) {
      page.drawText('No confirmed payments from your referrals this period.', { x: LEFT, y, size: 10, font, color: MUTED });
      y -= 20;
    }
    for (const r of rowsThisPage) {
      page.drawText(truncate(r.student_name, font, 9.5, 148), { x: cols[0].x, y, size: 9.5, font, color: NAVY });
      page.drawText(truncate(r.course_title || '—', font, 9.5, 148), { x: cols[1].x, y, size: 9.5, font, color: NAVY });
      page.drawText(r.enrolled ? 'Enrolled' : 'Paid', { x: cols[2].x, y, size: 9.5, font, color: r.enrolled ? rgb(0.04, 0.43, 0.37) : MUTED });
      page.drawText(money(r.amount_paid), { x: cols[3].x, y, size: 9.5, font, color: NAVY });
      page.drawText(money(r.commission), { x: cols[4].x, y, size: 9.5, font: bold, color: NAVY });
      y -= 17;
      if (y < BOTTOM + 20) break; // safety - ROWS_PER_PAGE already sized to fit
    }

    if (pageIdx === chunks.length - 1) {
      y -= 6;
      page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 1, color: NAVY });
      y -= 20;
      page.drawText('TOTAL COMMISSION DUE', { x: LEFT, y, size: 11, font: bold, color: NAVY });
      page.drawText(money(totalCommission), { x: cols[4].x, y, size: 12, font: bold, color: NAVY });
      y -= 16;
      page.drawText(`${rows.length} referral${rows.length === 1 ? '' : 's'} paid · ${money(totalPaid)} total collected`, { x: LEFT, y, size: 9, font, color: MUTED });

      // Two sign-offs, department head then CEO - fixed position regardless
      // of table length (ROWS_PER_PAGE is sized so the table above never
      // reaches this far down).
      const sigCols = [
        { x: LEFT, w: 210, name: signoff.department_head_name || 'Department Head', title: signoff.department_head_title || '' },
        { x: RIGHT - 210, w: 210, name: signoff.ceo_name || 'Chief Executive Officer', title: 'Chief Executive Officer, EchoLens Digital' },
      ];
      for (const c of sigCols) {
        page.drawText(c.name, { x: c.x, y: SIG_LINE_Y + 16, size: 14, font: italic, color: NAVY });
        page.drawLine({ start: { x: c.x, y: SIG_LINE_Y }, end: { x: c.x + c.w, y: SIG_LINE_Y }, thickness: 1, color: NAVY });
        page.drawText(c.name, { x: c.x, y: SIG_LINE_Y - 14, size: 9.5, font: bold, color: NAVY });
        if (c.title) page.drawText(c.title, { x: c.x, y: SIG_LINE_Y - 26, size: 8.5, font, color: MUTED });
      }
    }
  }

  return Buffer.from(await outDoc.save());
}

function truncate(str, font, size, maxWidth) {
  const original = String(str || '');
  let out = original;
  while (out.length && font.widthOfTextAtSize(out, size) > maxWidth) out = out.slice(0, -1);
  return out.length < original.length ? out.trimEnd() + '…' : out;
}

module.exports = { ambassadorReportPdf };
