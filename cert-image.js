'use strict';

/**
 * EchoLens LMS - certificate share image (v18)
 * Renders a certificate as a 1200x630 PNG (LinkedIn's preferred og:image
 * ratio) so sharing the /cert link puts the certificate PICTURE in the post,
 * not a bare link. SVG laid out here, rasterized by sharp.
 */

const sharp = require('sharp');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Fit long course titles by shrinking the font before wrapping to two lines.
function titleLines(title) {
  const t = String(title || '');
  if (t.length <= 44) return { size: 44, lines: [t] };
  if (t.length <= 58) return { size: 36, lines: [t] };
  const words = t.split(' ');
  let a = '', b = '';
  for (const w of words) { if (a.length + w.length < t.length / 2) a += (a ? ' ' : '') + w; else b += (b ? ' ' : '') + w; }
  return { size: 32, lines: [a, b] };
}

async function certificatePng(c, verifyUrl) {
  const fmt = (x) => { try { return new Date(x + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return x || ''; } };
  const kindTitle = c.kind === 'hackathon' ? 'CERTIFICATE OF PARTICIPATION' : c.kind === 'competition' ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF COMPLETION';
  const t = titleLines(c.title);
  const titleSvg = t.lines.length === 1
    ? `<text x="600" y="382" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[0])}</text>`
    : `<text x="600" y="368" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[0])}</text>
       <text x="600" y="368" dy="${t.size + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[1])}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0FBFA8"/><stop offset=".5" stop-color="#38BDF8"/><stop offset="1" stop-color="#7C6CF5"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#F4F7FB"/>
  <rect width="1200" height="14" fill="url(#band)"/>
  <rect x="28" y="36" width="1144" height="566" rx="18" fill="#FFFFFF"/>
  <rect x="44" y="52" width="1112" height="534" rx="12" fill="none" stroke="#D9A425" stroke-width="3"/>
  <rect x="54" y="62" width="1092" height="514" rx="9" fill="none" stroke="#EAD9A6" stroke-width="1.5"/>

  <text x="600" y="126" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="bold" fill="#16233A">${esc(c.org || 'EchoLens Digital')}</text>
  <text x="600" y="156" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" letter-spacing="4" fill="#5B6B84">${esc((c.tagline || 'Innovate · Educate · Elevate').toUpperCase())}</text>
  <text x="600" y="212" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" font-weight="bold" letter-spacing="7" fill="#D9A425">${esc(kindTitle)}</text>

  <text x="600" y="252" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#5B6B84">This is to certify that</text>
  <text x="600" y="312" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#16233A">${esc(c.student_name)}</text>
  <text x="600" y="344" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#5B6B84">has successfully completed</text>
  ${titleSvg}

  <text x="600" y="452" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#16233A">Date of completion: <tspan font-weight="bold">${esc(fmt(c.completion_date))}</tspan></text>

  <rect x="420" y="486" width="360" height="42" rx="21" fill="#16233A"/>
  <text x="600" y="513" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">&#10003; Verified issuer &#183; EchoLens</text>

  <text x="600" y="560" text-anchor="middle" font-family="Courier New, monospace" font-size="14" fill="#5B6B84">Serial ${esc(c.serial)} &#183; Verify at ${esc(verifyUrl)}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { certificatePng };
