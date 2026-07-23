'use strict';

/**
 * EchoLens LMS - Ambassador / Instructor offer letter generator
 * Renders a short appointment/offer letter on the real company letterhead
 * (assets/letterhead.pdf), modeled on the Ref No/Date -> TO/Subject ->
 * greeting -> body -> signature -> verification-footer structure EchoLens
 * already uses for its internship offer letters, but with the CEO's
 * signature applied digitally (an uploaded signature image, falling back to
 * an italic typed name) rather than requiring a wet-ink signature each time.
 * Auto-generated the moment a signed contract zip is submitted - see
 * issueOfferLetter() in server.js.
 */

const { LetterheadFlow, NAVY, MUTED } = require('./letterhead-flow');

// Same constant as contract-pdf.js (same env var) so the named party can
// never drift between a contract and the letter confirming it.
const LEGAL_ENTITY = process.env.LEGAL_ENTITY_NAME || 'EchoLens (SMC-Private) Limited';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

function refNo(role, user) {
  const tag = role === 'ambassador' ? 'AMB' : 'INS';
  return `EL/${tag}/${new Date().getFullYear()}/${String(user.id).padStart(3, '0')}`;
}

function bodyParagraphs({ role, user, profile, ambassador }) {
  const first = String(user.name || '').trim().split(/\s+/)[0] || 'there';
  if (role === 'ambassador') {
    return {
      subject: 'Campus Ambassador Appointment Letter',
      greeting: `Dear ${first},`,
      paragraphs: [
        'We are pleased to inform you that, following your onboarding and the return of your signed Campus Ambassador Agreement, EchoLens is delighted to confirm your appointment as a Campus Ambassador. On behalf of our entire team, we warmly congratulate you and welcome you to the EchoLens family.',
        `This appointment commences on the Effective Date and continues for an initial term of six (6) months, in accordance with the Campus Ambassador Agreement you have signed, representing EchoLens at ${(ambassador && ambassador.university) || 'your University'}.`,
        `As a Campus Ambassador, you will build awareness of EchoLens's AI, data science and automation programs among your peers, refer prospective students, and earn Commission on every confirmed enrolment referred through your personal Ambassador Code${ambassador && ambassador.code ? ` (${ambassador.code})` : ''}, on the terms set out in your Agreement.`,
        'Kindly keep this letter, along with your signed Agreement, for your records. We are confident your energy and dedication will be a valuable asset, and we look forward to working together.',
      ],
    };
  }
  return {
    subject: 'Instructor Engagement Offer Letter',
    greeting: `Dear ${first},`,
    paragraphs: [
      'We are pleased to inform you that, following your onboarding, verification of your qualifications, and the return of your signed Instructor Engagement Agreement, EchoLens is delighted to confirm your appointment as an Instructor. On behalf of our entire team, we warmly congratulate you and welcome you to the EchoLens family.',
      'This appointment commences on the Effective Date and continues for an initial term of six (6) months, in accordance with the Instructor Engagement Agreement you have signed.',
      'As an Instructor, you will deliver instruction on the course(s) assigned to you by our Admin/Admissions Office team from time to time, and you will be paid a commission of thirty percent (30%) of the fee paid by every student on your assigned course(s) whose enrolment is confirmed, on the terms set out in your Agreement.',
      'Kindly keep this letter, along with your signed Agreement, for your records. We are confident your expertise will be a valuable asset to our learners, and we look forward to working together.',
    ],
  };
}

async function generateOfferLetterPdf({ role, user, profile, ambassador, settings }) {
  const flow = await LetterheadFlow.create();
  flow.y = 690;
  const { subject, greeting, paragraphs } = bodyParagraphs({ role, user, profile, ambassador });

  await flow.paragraph(`Ref No: ${refNo(role, user)}`, { size: 9.5, gapAfter: 0 });
  const refY = flow.y + 13.5;
  flow.page.drawText(`Date: ${fmtDate(new Date())}`, { x: 400, y: refY, size: 9.5, font: flow.font, color: NAVY });
  await flow.rule({ gapAfter: 16, color: MUTED });

  await flow.paragraph('TO,', { bold: true, gapAfter: 2 });
  await flow.paragraph(user.name, { bold: true, size: 11, gapAfter: 2 });
  if (role === 'ambassador' && ambassador && ambassador.university) await flow.paragraph(ambassador.university, { gapAfter: 10 });
  else flow.y -= 6;

  await flow.paragraph('Subject: ' + subject, { bold: true, gapAfter: 12 });
  await flow.paragraph(greeting, { gapAfter: 10 });
  for (const p of paragraphs) await flow.paragraph(p, { gapAfter: 12 });

  await flow.paragraph('Yours sincerely,', { gapAfter: 46 });
  const sigX = 60;
  const lineY = flow.y;
  await flow.signatureImage(sigX, lineY + 4, { imageBytes: settings.ceo_sig_bytes, name: settings.ceo_name || 'Tahir Mehmood', width: 130, height: 36 });
  flow.page.drawLine({ start: { x: sigX, y: lineY }, end: { x: sigX + 200, y: lineY }, thickness: 1, color: NAVY });
  flow.page.drawText(settings.ceo_name || 'Tahir Mehmood', { x: sigX, y: lineY - 13, size: 10, font: flow.bold, color: NAVY });
  flow.page.drawText(`Founder & Chief Executive Officer, ${settings.org || 'EchoLens Digital'}`, { x: sigX, y: lineY - 26, size: 9, font: flow.font, color: MUTED });
  flow.y = lineY - 50;

  await flow.rule({ gapAfter: 10 });
  await flow.paragraph(`This is an officially issued document by EchoLens Digital (SMC-Private) Limited - CUIN ${settings.cuin || '0342802'}, NTN ${settings.ntn || 'J372619'}. For verification, contact ceo@echolens.digital.`, { size: 8, italic: true, color: MUTED, gapAfter: 0 });

  return flow.save();
}

module.exports = { generateOfferLetterPdf };
