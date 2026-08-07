'use strict';

/**
 * EchoLens LMS - certificate share image (v18)
 * Renders a certificate as a 1200x630 PNG (LinkedIn's preferred og:image
 * ratio) so sharing the /cert link puts the certificate PICTURE in the post,
 * not a bare link. SVG laid out here, rasterized by sharp.
 */

const sharp = require('sharp');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The partner logo (if uploaded - see /api/admin/partner-settings/logo) is
// always normalised to this exact PNG, so it can just be read straight off
// disk and inlined as a data URI - sharp renders this SVG standalone, with
// no network access, so a plain <image href="/img/..."> would not load.
function partnerLogoDataUrl() {
  try {
    const buf = fs.readFileSync(path.join(__dirname, 'public', 'img', 'partner-logo.png'));
    return 'data:image/png;base64,' + buf.toString('base64');
  } catch { return null; }
}

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
    ? `<text x="600" y="368" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[0])}</text>`
    : `<text x="600" y="354" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[0])}</text>
       <text x="600" y="354" dy="${t.size + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="${t.size}" font-weight="bold" fill="#16233A">${esc(t.lines[1])}</text>`;

  // Every downloadable/shareable certificate carries the same QR the web
  // page shows, embedded as a raster image so it survives outside a browser.
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 168, margin: 0, color: { dark: '#16233A', light: '#00000000' } });
  const ceoName = c.ceo_name || 'Tahir Mehmood';

  // v24: fits in the existing gap between the tagline and CERTIFICATE OF...
  // line, so nothing else has to move for it.
  const collabSvg = c.partner ? `
  <text x="600" y="164" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" letter-spacing="2" fill="#8B96A8">IN COLLABORATION WITH ${esc((c.partner.name || '').toUpperCase())}</text>` : '';
  const echolensSigX = c.partner ? 855 : 1030;
  const badgeX = c.partner ? 450 : 420, badgeW = c.partner ? 300 : 360;
  const logo = c.partner ? partnerLogoDataUrl() : null;
  const partnerSigSvg = c.partner ? `
  <!-- Typed partner-CEO signature (far right) - same "typed name only" convention as EchoLens's own. -->
  ${logo ? `<image x="1061" y="466" width="28" height="28" href="${logo}"/>` : ''}
  <text x="1075" y="510" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="24" fill="#16233A">${esc(c.partner.ceo_name)}</text>
  <line x1="1010" y1="524" x2="1145" y2="524" stroke="#16233A" stroke-width="1.5"/>
  <text x="1075" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#16233A">${esc(c.partner.ceo_name)}</text>
  <text x="1075" y="554" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" letter-spacing="1" fill="#5B6B84">CEO, ${esc((c.partner.name || '').toUpperCase())}</text>` : '';

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

  <text x="600" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#16233A">${esc(c.org || 'EchoLens Digital')}</text>
  <text x="600" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="4" fill="#5B6B84">${esc((c.tagline || 'Innovate · Educate · Elevate').toUpperCase())}</text>
  ${collabSvg}
  <text x="600" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="bold" letter-spacing="6" fill="#D9A425">${esc(kindTitle)}</text>

  <text x="600" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#5B6B84">This is to certify that</text>
  <text x="600" y="288" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="#16233A">${esc(c.student_name)}</text>
  <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#5B6B84">has successfully completed</text>
  ${titleSvg}

  <text x="600" y="432" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#16233A">Date of completion: <tspan font-weight="bold">${esc(fmt(c.completion_date))}</tspan></text>

  <!-- QR (left) - the same verification code the web certificate shows. -->
  <image x="120" y="466" width="88" height="88" href="${qrDataUrl}"/>
  <text x="164" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#5B6B84">Scan to verify</text>

  <!-- Verified-issuer badge (centre). -->
  <rect x="${badgeX}" y="486" width="${badgeW}" height="42" rx="21" fill="#16233A"/>
  <text x="600" y="513" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">&#10003; Verified issuer &#183; EchoLens</text>

  <!-- Typed CEO signature - the name itself is the digital signature, no scanned image. -->
  <text x="${echolensSigX}" y="510" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="26" fill="#16233A">${esc(ceoName)}</text>
  <line x1="${echolensSigX - 70}" y1="524" x2="${echolensSigX + 70}" y2="524" stroke="#16233A" stroke-width="1.5"/>
  <text x="${echolensSigX}" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#16233A">${esc(ceoName)}</text>
  <text x="${echolensSigX}" y="554" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" letter-spacing="1" fill="#5B6B84">CEO, ${esc((c.org || 'ECHOLENS').toUpperCase())}</text>
  ${partnerSigSvg}

  <text x="600" y="590" text-anchor="middle" font-family="Courier New, monospace" font-size="13" fill="#5B6B84">Serial ${esc(c.serial)}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { certificatePng };
