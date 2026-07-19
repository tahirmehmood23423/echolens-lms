'use strict';

/**
 * EchoLens LMS - challan PDF (v18)
 * Renders a fee challan as an A4 PDF buffer, mirroring the /challan web page:
 * fee split into three heads, itemized discounts, bank details, deadline,
 * finance-inbox payment instructions, and a QR that opens the public
 * verification page. Pure JS (pdfkit + qrcode) - safe on Render.
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const NAVY = '#16233A', TEAL = '#0FBFA8', GOLD = '#D9A425', GOLD_SOFT = '#EAD9A6';
const MUTED = '#5B6B84', LINE = '#E3E9F2', RED = '#A33333', GREEN = '#0A6E5F', CANVAS = '#F4F7FB';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-US');
const fmtDate = (d) => {
  if (!d) return '-';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
};

async function challanPdf(c, verifyUrl) {
  const qrPng = await QRCode.toBuffer(verifyUrl, { width: 240, margin: 1, color: { dark: NAVY } });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const chunks = [];
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width; // 595.28
    const paid = c.status === 'paid';

    // Top accent band + double gold frame, like the web challan.
    doc.rect(0, 0, W, 10).fill(TEAL);
    doc.lineWidth(1.5).roundedRect(24, 26, W - 48, doc.page.height - 52, 10).stroke(GOLD);
    doc.lineWidth(0.75).roundedRect(31, 33, W - 62, doc.page.height - 66, 7).stroke(GOLD_SOFT);

    let y = 62;
    doc.font('Helvetica-Bold').fontSize(23).fillColor(NAVY).text('EchoLens Digital', 0, y, { width: W, align: 'center' });
    y += 30;
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text('Verified issuer  ·  EchoLens', 0, y, { width: W, align: 'center' });
    y += 26;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(GOLD).text('F E E   C H A L L A N', 0, y, { width: W, align: 'center', characterSpacing: 2 });
    y += 24;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(paid ? GREEN : '#8A5A00')
      .text(paid ? 'PAID' : 'PAYMENT PENDING', 0, y, { width: W, align: 'center', characterSpacing: 1 });
    y += 26;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(NAVY).text(String(c.student_name || ''), 0, y, { width: W, align: 'center' });
    y += 30;
    doc.font('Helvetica').fontSize(11.5).fillColor(MUTED)
      .text(`${c.course_title || c.course_code || ''}   ·   Student ID: ${c.student_id || '-'}`, 0, y, { width: W, align: 'center' });
    y += 34;

    // Fee table: three heads, gross total, itemized discounts, net payable.
    const tx = 110, tw = W - 220;
    const row = (label, amount, { bold = false, color = NAVY, size = 11, rule = true } = {}) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(color);
      doc.text(label, tx, y, { width: tw - 110 });
      doc.text(amount, tx, y, { width: tw, align: 'right' });
      y += size + 8;
      if (rule) { doc.moveTo(tx, y - 3).lineTo(tx + tw, y - 3).lineWidth(0.7).stroke(LINE); }
      y += 4;
    };
    for (const p of c.fee_parts || []) row(p.label, money(p.amount));
    row('Course fee (total)', money(c.gross_fee), { bold: true });
    const discounts = c.discounts && c.discounts.length ? c.discounts
      : (c.discount_label ? [{ label: c.discount_label, amount: c.discount_amount }] : []);
    for (const d of discounts) row(`Discount - ${d.label}`, `- ${money(d.amount)}`, { color: RED });
    y += 2;
    row('Amount payable', money(c.net_fee), { bold: true, size: 14, rule: false });
    y += 6;

    // Centered "label: date" pair, placed manually - `continued` re-centers
    // each segment on its own and the two would overlap.
    doc.fontSize(11);
    const dlLabel = 'Payment deadline: ', dlDate = fmtDate(c.deadline);
    const dlLw = doc.font('Helvetica').widthOfString(dlLabel);
    const dlDw = doc.font('Helvetica-Bold').widthOfString(dlDate);
    const dlX = (W - dlLw - dlDw) / 2;
    doc.font('Helvetica').fillColor(NAVY).text(dlLabel, dlX, y, { lineBreak: false });
    doc.font('Helvetica-Bold').fillColor(RED).text(dlDate, dlX + dlLw, y, { lineBreak: false });
    y += 30;

    // Bank details card.
    const bank = c.bank_snapshot || c.bank || {};
    const bankRows = [
      ['Bank', bank.bank_name], ['Account title', bank.account_title], ['Account number', bank.account_number],
      ['IBAN', bank.iban], ['Branch', bank.branch],
    ].filter(([, v]) => v);
    const bh = 34 + bankRows.length * 17;
    doc.roundedRect(tx, y, tw, bh, 8).fillAndStroke(CANVAS, LINE);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED).text('P A Y M E N T   D E T A I L S', tx + 18, y + 12);
    let by = y + 30;
    for (const [k, v] of bankRows) {
      doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(k, tx + 18, by);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY).text(String(v), tx, by, { width: tw - 18, align: 'right' });
      by += 17;
    }
    y += bh + 18;

    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(
      'After paying, email a screenshot of your payment and the payment record (transaction ID, date, amount) to finance@echolens.digital. Our finance team will verify it and confirm your enrollment by email.',
      tx - 20, y, { width: tw + 40, align: 'center' });
    y += 44;

    // QR + serial footer.
    const qs = 88;
    doc.image(qrPng, (W - qs) / 2, y, { width: qs, height: qs });
    y += qs + 6;
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('Scan to verify', 0, y, { width: W, align: 'center' });
    y += 16;
    doc.font('Courier').fontSize(8.5).fillColor(MUTED).text(
      `Serial: ${c.serial}   ·   Issued ${(c.generated_at || '').slice(0, 10)}   ·   Verify at ${verifyUrl}`,
      0, y, { width: W, align: 'center' });

    doc.end();
  });
}

module.exports = { challanPdf };
