'use strict';

/**
 * EchoLens LMS - Ambassador / Instructor contract generator
 * Renders a personalized PDF of the EchoLens Campus Ambassador Terms &
 * Conditions (verbatim, filled in from the hire's own profile) for role
 * 'ambassador', or the adapted Instructor Engagement Agreement (same clause
 * skeleton, teaching-specific obligations, a flat 30% of Fee Paid commission)
 * for role 'instructor'. Auto-generated at onboarding - see issueContract()
 * in server.js - and emailed as an attachment; the hire signs it by hand and
 * returns it (with supporting documents) as a zip through the portal.
 */

const { LetterheadFlow, NAVY, MUTED, GOLD } = require('./letterhead-flow');

const val = (v) => (v && String(v).trim()) || '_______________________';

// The registered legal entity name. Deliberately NOT derived from
// settings.org: that field is an editable display name for certificates, and
// renaming it must never silently alter the named party on a binding
// contract. Override only via LEGAL_ENTITY_NAME if the registration changes.
const LEGAL_ENTITY = process.env.LEGAL_ENTITY_NAME || 'EchoLens (SMC-Private) Limited';

async function renderCover(flow, { tagline, settings, docTitle, docSubtitle }) {
  flow.page.drawText('E C H O L E N S   D I G I T A L', { x: 60, y: 620, size: 22, font: flow.bold, color: NAVY });
  flow.page.drawText(tagline, { x: 60, y: 598, size: 11, font: flow.italic, color: MUTED });
  flow.page.drawLine({ start: { x: 60, y: 585 }, end: { x: 535, y: 585 }, thickness: 1.5, color: GOLD });
  flow.y = 500;
  await flow.heading(docTitle, { size: 22, gapAfter: 8 });
  await flow.paragraph(docSubtitle, { size: 13, italic: true, gapAfter: 40 });
  await flow.paragraph(LEGAL_ENTITY, { size: 12, bold: true, gapAfter: 2 });
  await flow.paragraph(`SECP Registered  |  CUIN ${settings.cuin || '0342802'}  |  NTN ${settings.ntn || 'J372619'}`, { size: 9.5, color: MUTED, gapAfter: 2 });
  await flow.paragraph('Registered Office: Pakistan  |  echolens.digital', { size: 9.5, color: MUTED, gapAfter: 40 });
  await flow.paragraph('Document Version 2.0  |  Effective from date of signature', { size: 9, italic: true });
  await flow.newPage();
}

async function renderPartiesAndRecitals(flow, { role, user, profile, ambassador, settings, roleLabel }) {
  await flow.heading('PARTIES TO THIS AGREEMENT', { size: 13, gapAfter: 8 });
  await flow.paragraph(`This ${roleLabel} Agreement ("Agreement") is made and entered into by and between:`, { gapAfter: 8 });
  await flow.paragraph(`(A) ${LEGAL_ENTITY.toUpperCase()}, a Single-Member Private Limited Company duly incorporated under the Companies Act, 2017 of the Islamic Republic of Pakistan, bearing Company Registration Number (CUIN) ${settings.cuin || '0342802'} and National Tax Number (NTN) ${settings.ntn || 'J372619'}, having its registered office in Pakistan (hereinafter referred to as "EchoLens", which expression shall, unless repugnant to the context, include its successors-in-interest, permitted assigns, and authorised representatives), of the FIRST PART;`, { gapAfter: 8 });
  await flow.paragraph('AND', { bold: true, gapAfter: 8 });
  const role2 = role === 'ambassador' ? 'Ambassador' : 'Instructor';
  const extra = role === 'ambassador'
    ? `currently enrolled at ${val(ambassador && ambassador.university)} ("University"), holding student registration number ${val(profile.university_reg_no)}, residing at ${val(profile.address)}`
    : `residing at ${val(profile.address)}, holding the highest qualification of ${val(profile.education)}`;
  await flow.paragraph(`(B) MR./MS. ${val(user.name)}, son/daughter of ${val(profile.father_name)}, CNIC No. ${val(profile.cnic)}, ${extra} (hereinafter referred to as the "${role2}") of the SECOND PART.`, { gapAfter: 8 });
  await flow.paragraph(`EchoLens and the ${role2} are hereinafter individually referred to as a "Party" and collectively as the "Parties".`, { gapAfter: 14 });

  await flow.heading('RECITALS', { size: 13, gapAfter: 8 });
  await flow.paragraph('WHEREAS, EchoLens is engaged in the business of providing artificial intelligence, data science, automation, and adjacent technology education to students, professionals, and institutions across Pakistan and internationally;', { gapAfter: 6 });
  if (role === 'ambassador') {
    await flow.paragraph('AND WHEREAS, EchoLens has launched the EchoLens Campus Ambassador Program ("Program") to build authentic peer-to-peer awareness of its educational offerings at leading academic institutions across Pakistan;', { gapAfter: 6 });
    await flow.paragraph('AND WHEREAS, the Ambassador has voluntarily applied to and been selected for the Program on the basis of merit, and wishes to represent EchoLens at his/her University in accordance with the terms set out herein;', { gapAfter: 8 });
  } else {
    await flow.paragraph('AND WHEREAS, EchoLens engages qualified subject-matter experts as Instructors to design and deliver its Bootcamp, Short Course, Specialist Track and Career Track programs to enrolled students;', { gapAfter: 6 });
    await flow.paragraph('AND WHEREAS, the Instructor has been selected on the basis of merit and relevant qualification/experience, and wishes to deliver instruction on behalf of EchoLens on the courses and batches assigned to him/her in accordance with the terms set out herein;', { gapAfter: 8 });
  }
  await flow.paragraph('NOW THEREFORE, in consideration of the mutual covenants, undertakings, and consideration set out below, the Parties agree as follows:', { gapAfter: 10 });
}

// ---------------------------------------------------------------------------
// Ambassador clause content (verbatim, from EchoLens_Ambassador_Terms_and_
// Conditions_v2.pdf), with blanks filled from the ambassador's own profile.
// ---------------------------------------------------------------------------
function ambassadorClauses({ user, profile, ambassador, settings }) {
  const sections = [];
  sections.push({ title: '1. DEFINITIONS AND INTERPRETATION', intro: 'In this Agreement, unless the context otherwise requires:', clauses: [
    ['1.1', '"Ambassador Code" means the unique alphanumeric discount code personally allocated to the Ambassador by EchoLens for the purpose of attributing enrolments referred by the Ambassador.'],
    ['1.2', '"Career Track / Specialist Track / Short Course / Bootcamp" mean the respective tiers of educational programs offered by EchoLens as published in the official EchoLens Course Catalogue in force from time to time.'],
    ['1.3', '"Commission" means the monetary sum payable by EchoLens to the Ambassador in accordance with Clause 8 (Commission Structure) of this Agreement.'],
    ['1.4', '"Confirmed Enrolment" means an enrolment by a Referred Student which has satisfied all of the following: (i) the full course fee has been paid to EchoLens in cleared funds; (ii) the refund window prescribed under EchoLens policy has expired without a refund request; and (iii) the Referred Student has attended at least the first scheduled class of the relevant cohort.'],
    ['1.5', '"Fee Paid" means the actual amount paid by the Referred Student to EchoLens in cleared funds in respect of the relevant program, after application of any discount (including any discount arising from use of the Ambassador Code) and exclusive of any bank charges, payment gateway fees, or government taxes. Commission under this Agreement is calculated on the Fee Paid.'],
    ['1.6', '"Program Coordinator" means the person appointed by EchoLens from time to time to serve as the operational point of contact for the Program. The identity of the Program Coordinator shall be notified to the Ambassador at onboarding and may be changed by EchoLens upon written notice.'],
    ['1.7', '"Referred Student" means any natural person who enrols in an EchoLens program after (i) using the Ambassador Code at checkout, or (ii) being introduced to EchoLens by the Ambassador through a documented touchpoint within the Attribution Window defined in Clause 10.4.'],
    ['1.8', '"Term" has the meaning ascribed to it in Clause 3.'],
    ['1.9', '"Territory" means the campus of the Ambassador\'s University together with the Ambassador\'s personal digital and social networks, in the Islamic Republic of Pakistan.'],
  ] });
  sections.push({ title: '2. APPOINTMENT AND PROGRAM OVERVIEW', clauses: [
    ['2.1', 'EchoLens hereby appoints the Ambassador, and the Ambassador hereby accepts appointment, as an authorised Campus Ambassador of EchoLens for the Territory during the Term, on a non-exclusive, revocable, and independent-contractor basis, subject to the terms and conditions of this Agreement.'],
    ['2.2', 'The primary purpose of the appointment is to enable the Ambassador to build awareness of EchoLens\'s programs among students, faculty, and academic communities in the Territory; to refer prospective students to EchoLens; and to earn Commission and recognition in accordance with this Agreement.'],
    ['2.3', 'The Ambassador acknowledges and agrees that the appointment does not create any employer-employee relationship, agency, partnership, joint venture, or franchise arrangement between the Parties, and the Ambassador shall not represent otherwise to any third party.'],
    ['2.4', 'EchoLens shall issue to the Ambassador, upon successful signature of this Agreement, an official Appointment Letter on EchoLens letterhead confirming the Ambassador\'s status and Term.'],
  ] });
  sections.push({ title: '3. TERM AND RENEWAL', clauses: [
    ['3.1', `This Agreement shall commence on the date last signed by the Parties ("Effective Date") and shall continue for a fixed term of six (6) months ("Initial Term"), unless earlier terminated in accordance with Clause 17.`],
    ['3.2', 'Upon expiry of the Initial Term, EchoLens may, at its sole discretion and based on the Ambassador\'s performance during the Initial Term, offer the Ambassador a renewal for one or more further terms of six (6) months each. Renewal shall be by written offer from EchoLens and written acceptance by the Ambassador; there is no automatic renewal.'],
    ['3.3', 'Any Commission earned but unpaid at the expiry of the Term shall remain payable in accordance with Clause 11 (Payment Terms).'],
  ] });
  sections.push({ title: '4. ELIGIBILITY AND AMBASSADOR REPRESENTATIONS', intro: 'The Ambassador represents, warrants, and undertakes to EchoLens on a continuing basis throughout the Term that:', clauses: [
    ['4.1', 'The Ambassador is at least eighteen (18) years of age; where the Ambassador is a student below eighteen (18) years of age, this Agreement shall be countersigned by a parent or lawful guardian, who shall be jointly bound by its terms.'],
    ['4.2', 'The Ambassador is currently enrolled as a full-time or part-time student at the University stated in the Parties clause and shall promptly notify EchoLens in writing if such enrolment ceases for any reason.'],
    ['4.3', 'The Ambassador is not concurrently engaged as an ambassador, brand representative, sales agent, or referral partner for any organisation offering artificial intelligence, data science, automation, or directly competing educational programs, and shall not enter into any such engagement during the Term without EchoLens\'s prior written consent.'],
    ['4.4', 'The Ambassador shall at all times comply with the University\'s applicable rules and code of conduct in performing his/her obligations under this Agreement, and shall not undertake any activity that violates such rules.'],
    ['4.5', 'The Ambassador has read and understood the EchoLens Code of Conduct (a copy of which forms part of the onboarding pack and is incorporated by reference into this Agreement) and shall abide by it.'],
  ] });
  sections.push({ title: '5. AMBASSADOR RESPONSIBILITIES AND DELIVERABLES', intro: 'During the Term, the Ambassador shall:', clauses: [
    ['5.1', 'Actively promote EchoLens\'s programs on the Ambassador\'s University campus and within his/her personal networks, using only approved marketing materials provided or authorised by EchoLens (as listed in Annexure B).'],
    ['5.2', 'Distribute the Ambassador Code to prospective students in an honest, non-misleading manner, disclosing to any prospective student who asks that the Ambassador is a paid representative of EchoLens under a commission arrangement.'],
    ['5.3', 'Submit a Monthly Activity Report (per Annexure C) to the Program Coordinator not later than the fifth (5th) day of each following calendar month, in the prescribed format.'],
    ['5.4', 'Attend the fortnightly Ambassador group video call scheduled by EchoLens (once every two weeks, duration approximately thirty (30) minutes). In addition, EchoLens may convene an additional meeting at any time on reasonable notice where circumstances require, and the Ambassador shall make reasonable efforts to attend. Failure to attend two consecutive scheduled fortnightly calls without prior written excuse shall constitute a material breach for the purposes of Clause 17.1.'],
    ['5.5', 'Respond to reasonable communications from the Program Coordinator within seventy-two (72) hours during standard working days.'],
    ['5.6', 'Maintain, at minimum, one of the following levels of monthly activity in the Territory: at least two (2) Confirmed Enrolments referred through the Ambassador Code during any two consecutive calendar months; OR at least one (1) on-campus or virtual information session about EchoLens delivered per calendar month; OR at least three (3) qualifying social media posts per calendar month on the Ambassador\'s public profile, tagging EchoLens\'s official handle. Failure to meet at least one of these three thresholds for two consecutive calendar months shall constitute grounds for termination for inactivity in accordance with Clause 17.1.'],
  ] });
  sections.push({ title: '6. PROHIBITED CONDUCT', intro: 'The Ambassador shall NOT, at any time during or after the Term, undertake any of the following:', clauses: [
    ['6.1', 'Make any representation, warranty, guarantee, or promise regarding job placement, salary, employability outcomes, immigration outcomes, or partner-institution admission that has not been expressly and in writing authorised by EchoLens.'],
    ['6.2', 'Modify, distort, or reproduce EchoLens\'s branding, logo, colour scheme, letterhead, or any other intellectual property beyond the scope of the marketing pack expressly provided; produce derivative marketing material without prior written approval from EchoLens.'],
    ['6.3', 'Enrol himself/herself as a student using his/her own Ambassador Code. For the avoidance of doubt, family members, relatives, cousins, and other persons known to the Ambassador are permitted to enrol using the Ambassador Code and such enrolments shall qualify for Commission in the ordinary way; the restriction in this sub-clause applies only to the Ambassador\'s own enrolment.'],
    ['6.4', 'Solicit, exchange, or coordinate cross-referrals with any other EchoLens Ambassador for the purpose of manipulating Commission attribution.'],
    ['6.5', 'Represent to any third party that he/she is an employee, agent, officer, director, or shareholder of EchoLens, or that he/she has authority to bind EchoLens to any contract or obligation.'],
    ['6.6', 'Disparage EchoLens, its founder, employees, instructors, partners, or programs on any public or private platform. Any grievance shall be raised directly with the Program Coordinator or, if unresolved, with the Chief Executive Officer of EchoLens.'],
    ['6.7', 'Engage in any conduct that is fraudulent, unlawful, or intended to game the Commission structure, including but not limited to creating fake student registrations, using multiple identities, or arranging enrolments that are not genuine for the purpose of triggering Commission.'],
    ['6.8', 'Share, publish, or otherwise disclose the details of this Agreement (including Commission percentages) to any competitor of EchoLens, or to any person other than the Ambassador\'s parent/guardian or professional adviser (e.g., accountant) on a need-to-know basis.'],
  ] });
  sections.push({ title: '7. AMBASSADOR CODE AND DISCOUNT TO REFERRED STUDENTS', clauses: [
    ['7.1', 'EchoLens shall issue the Ambassador a unique Ambassador Code within seven (7) working days of the Effective Date. The Code shall be linked exclusively to the Ambassador for the purpose of Commission attribution.'],
    ['7.2', 'The Ambassador Code shall entitle the Referred Student to a discount from the published catalogue price of EchoLens programs, calculated as follows: ten percent (10%) on Bootcamps and Short Courses, and fifteen percent (15%) on Specialist Tracks and Career Tracks.'],
    ['7.3', 'EchoLens reserves the right to modify the discount percentages associated with the Ambassador Code from time to time, upon prior written notice to the Ambassador of not less than fourteen (14) days. Enrolments already in progress at the time of any such change shall be honoured at the prior rate.'],
    ['7.4', 'EchoLens may, in its sole discretion, deactivate an Ambassador Code with immediate effect where it reasonably suspects fraud, abuse, or a breach of Clause 6 (Prohibited Conduct). Where such suspicion is subsequently rebutted, the Code shall be reactivated and any withheld Commission released.'],
  ] });
  sections.push({ title: '8. COMMISSION STRUCTURE', clauses: [
    ['8.1', 'Subject to the terms of this Agreement, EchoLens shall pay the Ambassador Commission on each Confirmed Enrolment attributable to the Ambassador in accordance with the schedule set out in this Clause 8 and reproduced in tabular form in Annexure A.'],
    ['8.2', 'Commission is calculated as a percentage of the Fee Paid. The applicable Commission percentages are: Bootcamp 8%, Short Course 9%, Specialist Track 10%, Career Track 12% - each of the Fee Paid.'],
    ['8.3', 'Commission is calculated on the exact amount actually received by EchoLens from the Referred Student in cleared funds. Where a Referred Student pays in instalments, Commission accrues only once the full course fee has been received and the enrolment has become a Confirmed Enrolment. Bank charges, payment gateway fees, and government taxes (if any) are excluded from the Fee Paid.'],
    ['8.4', 'For illustration only: on a Short Course with a catalogue price of PKR 15,000, where the Referred Student uses the Ambassador Code for a ten percent (10%) discount, the Fee Paid is PKR 13,500 and Commission is 9% of PKR 13,500, being PKR 1,215.'],
    ['8.5', 'No Cap on Earnings. There is no cap, ceiling, or maximum limit on the amount of Commission the Ambassador may earn under this Agreement, nor on the number of Confirmed Enrolments in respect of which Commission may be claimed.'],
  ] });
  sections.push({ title: '9. PERKS AND RECOGNITION', intro: 'In addition to Commission, the Ambassador shall be entitled to the following, subject to continued good standing:', clauses: [
    ['9.1', 'Credentials Package: Official Appointment Letter on EchoLens letterhead (within 7 working days); Completion Certificate at the end of the Term (subject to Clause 5.6 thresholds); LinkedIn recommendation from the CEO upon successful completion; signed reference letter for job/postgraduate applications upon reasonable request.'],
    ['9.2', 'Access: invitation to the fortnightly Ambassador group video call with EchoLens leadership; priority consideration for internships hosted or brokered by EchoLens; early access to newly launched programs and marketing pilots; membership in a private WhatsApp community with EchoLens instructors and other Ambassadors.'],
    ['9.3', 'Recognition: feature on the EchoLens official website in a designated Ambassador section; quarterly leaderboard publication among Ambassadors.'],
  ] });
  sections.push({ title: '10. ATTRIBUTION, VERIFICATION, AND ANTI-FRAUD', clauses: [
    ['10.1', 'Only Confirmed Enrolments (Clause 1.4) qualify for Commission. Registrations, partial payments, and enrolments cancelled within the refund window do not qualify.'],
    ['10.2', 'Where a refund is issued after Commission has been paid, EchoLens may deduct the corresponding amount from the Ambassador\'s next payout, or invoice for repayment if no future payout is anticipated.'],
    ['10.3', 'Attribution is determined primarily by use of the Ambassador Code at checkout. Where the Code was not used but the Ambassador can demonstrate the initial documented referral to the Program Coordinator\'s reasonable satisfaction, attribution may be granted at EchoLens\'s sole discretion.'],
    ['10.4', 'The "Attribution Window" is fifteen (15) calendar days from the Ambassador\'s first documented touchpoint with the prospective student to the date of enrolment. Enrolments outside this window do not attract Commission.'],
    ['10.5', 'Where more than one Ambassador claims attribution for the same enrolment, EchoLens\'s Code-use records and Program Coordinator log are conclusive; in case of tie or ambiguity, the enrolling student\'s own attestation governs.'],
    ['10.6', 'EchoLens reserves the right to audit any Confirmed Enrolment attributed to the Ambassador for six (6) months from the date of enrolment. The Ambassador shall reasonably co-operate with any such audit.'],
    ['10.7', 'Where EchoLens establishes, on the balance of probabilities, that the Ambassador has engaged in fraud, misattribution, or the conduct prohibited by Clause 6.7, EchoLens may (i) withhold all unpaid Commission, (ii) recover Commission already paid for the affected enrolments, (iii) terminate this Agreement summarily under Clause 17.1, and (iv) refer the matter to the Ambassador\'s University where appropriate.'],
  ] });
  sections.push(paymentTermsSection());
  sections.push(brandIpSection('Ambassador'));
  sections.push(confidentialitySection());
  sections.push(dataProtectionSection());
  sections.push(contractorTaxSection('Ambassador'));
  sections.push(liabilitySection('Ambassador'));
  sections.push({ title: '17. TERMINATION', clauses: [
    ['17.1', 'EchoLens may terminate this Agreement with immediate effect by written notice upon: breach of Clause 6 (Prohibited Conduct); any act of fraud, misattribution, or manipulation of the Program; failure to meet the Clause 5.6 activity thresholds for two consecutive calendar months ("Termination for Inactivity"); failure to attend two consecutive scheduled fortnightly calls without prior written excuse; cessation of the Ambassador\'s University enrolment for any reason; death, incapacity, or insolvency of the Ambassador; or breach of any other material term not remedied within seven (7) days of written notice.'],
    ['17.2', 'The Ambassador may terminate this Agreement by giving EchoLens not less than fifteen (15) days\' prior written notice.'],
    ['17.3', 'EchoLens may terminate this Agreement without cause by giving not less than thirty (30) days\' prior written notice.'],
    ['17.4', 'Upon termination for any reason: the Ambassador Code is deactivated immediately; Commission earned but unpaid on Confirmed Enrolments prior to termination is paid at the next scheduled payout (subject to Clause 10.7); the Ambassador shall promptly return or destroy all EchoLens IP and confidential information; and Clauses 6.8, 12, 13, 14, 16 and this Clause 17.4 survive termination.'],
  ] });
  sections.push(miscSection('Ambassador'));
  sections.push(disputeSection());
  return sections;
}

function paymentTermsSection() {
  return { title: '11. PAYMENT TERMS', clauses: [
    ['11.1', 'Commission shall be paid monthly in arrears, by inter-bank funds transfer (IBFT) or such other method as EchoLens may reasonably determine, on or before the fifth (5th) working day of each calendar month, in respect of the preceding calendar month.'],
    ['11.2', 'The recipient shall provide EchoLens with a valid Pakistani bank account (IBAN), account title, and a legible copy of their CNIC within seven (7) working days of the Effective Date. No Commission shall be payable until such details are received in verified form.'],
    ['11.3', 'The minimum payout threshold is Pakistani Rupees One Thousand Five Hundred (PKR 1,500) per month; amounts below this roll over and aggregate until the threshold is met. This is a disbursement threshold for operational convenience only and does not reduce or forfeit any Commission earned.'],
    ['11.4', 'All Commission is quoted and paid gross of applicable taxes and withholdings under the laws of the Islamic Republic of Pakistan. Where EchoLens is required by law to deduct withholding tax at source, it shall do so and provide the appropriate tax certificate for filing purposes.'],
    ['11.5', 'The recipient is solely responsible for declaring Commission received under this Agreement to the Federal Board of Revenue and any other applicable tax authority, and for paying any income tax or other levy owed thereon.'],
    ['11.6', 'Commission payments shall be accompanied by a written or electronic statement identifying the enrolments in respect of which Commission is paid. Disputes must be raised within fourteen (14) days of receipt, failing which the statement is deemed accepted.'],
  ] };
}
function brandIpSection(who) {
  return { title: '12. BRAND AND INTELLECTUAL PROPERTY', clauses: [
    ['12.1', 'All intellectual property in the EchoLens name, logo, brand assets, marketing materials, curriculum content, website, and platform ("EchoLens IP") is and remains the exclusive property of EchoLens. Nothing in this Agreement transfers or licenses any EchoLens IP except to the limited, revocable extent required to perform obligations under this Agreement.'],
    ['12.2', `The ${who} is granted a limited, non-exclusive, non-transferable, revocable licence to use the EchoLens name and logo during the Term solely to perform this Agreement in accordance with EchoLens's brand guidelines.`],
    ['12.3', 'Upon termination, the recipient shall immediately cease all use of EchoLens IP and, within seven (7) days, delete or return all EchoLens materials in their possession.'],
    ['12.4', `The ${who} grants EchoLens a perpetual, royalty-free, worldwide licence to use their name, photograph, and affiliation for EchoLens marketing (website, social media, outreach), unless expressly opted out in writing at onboarding.`],
  ] };
}
function confidentialitySection() {
  return { title: '13. CONFIDENTIALITY', clauses: [
    ['13.1', 'During the Term and for two (2) years thereafter, the recipient shall hold in strict confidence, and not disclose to any third party, any non-public information relating to EchoLens\'s business, including financial information, partner agreements, pricing structures, marketing plans, curriculum content, student data, and this Agreement.'],
    ['13.2', 'This obligation does not apply to information that (i) is or becomes public other than through breach of this Clause; (ii) was already held without restriction before disclosure by EchoLens; or (iii) must be disclosed by law or court order, in which case EchoLens shall be notified promptly.'],
  ] };
}
function dataProtectionSection() {
  return { title: '14. DATA PROTECTION', clauses: [
    ['14.1', 'The recipient shall not collect, store, transmit, or otherwise process the personal data of any prospective or actual EchoLens student except through official EchoLens channels. Prospective students shall be directed to the official EchoLens website or registration form.'],
    ['14.2', 'Where the recipient incidentally comes into possession of a prospective student\'s contact details, such details shall be treated as confidential, not added to any personal database, and transmitted to EchoLens promptly for handling by the Program Coordinator.'],
  ] };
}
function contractorTaxSection(who) {
  return { title: '15. INDEPENDENT CONTRACTOR STATUS AND TAX', clauses: [
    ['15.1', `The ${who} is engaged as an independent contractor and not as an employee of EchoLens. Nothing in this Agreement entitles the ${who} to any employment benefit including salary, provident fund, gratuity, medical insurance, paid leave, or social security contribution.`],
    ['15.2', `The ${who} is solely responsible for their own income tax filings and any other legal or regulatory compliance arising from receipt of Commission under this Agreement.`],
  ] };
}
function liabilitySection(who) {
  return { title: '16. LIMITATION OF LIABILITY AND INDEMNITY', clauses: [
    ['16.1', `EchoLens's aggregate liability to the ${who} under or in connection with this Agreement, whether in contract, tort, or otherwise, shall not exceed the total Commission actually paid or payable to the ${who} during the six (6) months preceding the event giving rise to the liability.`],
    ['16.2', 'Neither Party shall be liable for any indirect, consequential, incidental, special, or exemplary damages arising out of or in connection with this Agreement.'],
    ['16.3', `The ${who} shall indemnify and hold harmless EchoLens against any loss, claim, damage, or expense arising out of (i) any breach of this Agreement by the ${who}; (ii) any unauthorised representation made to a third party; or (iii) any violation of applicable law in performance of this Agreement.`],
  ] };
}
function miscSection(who) {
  return { title: '18. AMENDMENTS, NOTICES, AND MISCELLANEOUS', clauses: [
    ['18.1', 'Amendments. This Agreement may be amended only by a written instrument signed by both Parties, save that EchoLens may amend the Commission percentages upon fourteen (14) days\' prior written notice; such amendment does not affect Commission already accrued.'],
    ['18.2', `Notices. All notices shall be in writing and delivered by email to the ${who} at the address provided at onboarding, and to EchoLens at ceo@echolens.digital (with a copy to the Program Coordinator). Email notice is deemed received on the working day following transmission.`],
    ['18.3', `Assignment. The ${who} may not assign or transfer any rights or obligations under this Agreement without EchoLens's prior written consent. EchoLens may assign this Agreement to any successor entity or affiliate.`],
    ['18.4', 'Waiver. No failure or delay by either Party in exercising any right under this Agreement operates as a waiver of that right.'],
    ['18.5', 'Severability. If any provision is held invalid or unenforceable, the remaining provisions continue in full force and effect.'],
    ['18.6', 'Entire Agreement. This Agreement, with its Annexures and the EchoLens Code of Conduct, constitutes the entire agreement between the Parties and supersedes all prior discussions and understandings.'],
  ] };
}
function disputeSection() {
  return { title: '19. GOVERNING LAW AND DISPUTE RESOLUTION', clauses: [
    ['19.1', 'This Agreement shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan.'],
    ['19.2', 'Any dispute arising out of or in connection with this Agreement shall first be attempted to be resolved by good-faith negotiation between the Parties within thirty (30) days of written notice of the dispute.'],
    ['19.3', 'Any dispute not resolved through negotiation shall be referred to and finally settled by arbitration by a sole arbitrator under the Arbitration Act, 1940 (Pakistan). The seat of arbitration shall be Islamabad, Pakistan, and the language shall be English. The courts of Islamabad shall have exclusive jurisdiction in respect of any matter not falling within the arbitration clause.'],
  ] };
}

// ---------------------------------------------------------------------------
// Instructor clause content - same skeleton, teaching-specific obligations,
// flat 30% of Fee Paid commission (Clause 8 replaces the ambassador's tiered
// referral schedule and Clause 7's discount-code mechanics).
// ---------------------------------------------------------------------------
function instructorClauses({ user, profile, settings }) {
  const sections = [];
  sections.push({ title: '1. DEFINITIONS AND INTERPRETATION', intro: 'In this Agreement, unless the context otherwise requires:', clauses: [
    ['1.1', '"Assigned Course(s)" means the batch(es)/course(s) the Instructor is assigned to teach from time to time, as confirmed via the EchoLens portal by Admin or the Admissions Office (Student Coordinator). An Instructor may be assigned to more than one course at the same time.'],
    ['1.2', '"Career Track / Specialist Track / Short Course / Bootcamp" mean the respective tiers of educational programs offered by EchoLens as published in the official EchoLens Course Catalogue in force from time to time.'],
    ['1.3', '"Commission" means the monetary sum payable by EchoLens to the Instructor in accordance with Clause 8 (Commission Structure) of this Agreement.'],
    ['1.4', '"Confirmed Enrolment" means an enrolment in an Assigned Course which has satisfied all of the following: (i) the full course fee has been paid to EchoLens in cleared funds; (ii) the refund window prescribed under EchoLens policy has expired without a refund request; and (iii) the student has attended at least the first scheduled class of the relevant cohort.'],
    ['1.5', '"Fee Paid" means the actual amount paid by an enrolled student to EchoLens in cleared funds in respect of the relevant Assigned Course, after application of any discount and exclusive of any bank charges, payment gateway fees, or government taxes. Commission under this Agreement is calculated on the Fee Paid.'],
    ['1.6', '"Program Coordinator" means the person appointed by EchoLens from time to time to serve as the operational point of contact for Instructors. The identity of the Program Coordinator shall be notified to the Instructor at onboarding and may be changed by EchoLens upon written notice.'],
    ['1.7', '"Term" has the meaning ascribed to it in Clause 3.'],
    ['1.8', '"Territory" means the Assigned Course(s) delivered through the EchoLens platform, in the Islamic Republic of Pakistan and, where delivered online, internationally.'],
  ] });
  sections.push({ title: '2. APPOINTMENT AND PROGRAM OVERVIEW', clauses: [
    ['2.1', 'EchoLens hereby appoints the Instructor, and the Instructor hereby accepts appointment, as an authorised Instructor of EchoLens for the Assigned Course(s) during the Term, on a non-exclusive, revocable, and independent-contractor basis, subject to the terms and conditions of this Agreement.'],
    ['2.2', 'The primary purpose of the appointment is to enable the Instructor to design and deliver instruction, assess student work, and support EchoLens\'s educational quality on the Assigned Course(s), and to earn Commission and recognition in accordance with this Agreement.'],
    ['2.3', 'The Instructor acknowledges and agrees that the appointment does not create any employer-employee relationship, agency, partnership, joint venture, or franchise arrangement between the Parties, and the Instructor shall not represent otherwise to any third party.'],
    ['2.4', 'EchoLens shall issue to the Instructor, upon successful signature of this Agreement, an official Appointment Letter on EchoLens letterhead confirming the Instructor\'s status and Term.'],
  ] });
  sections.push({ title: '3. TERM AND RENEWAL', clauses: [
    ['3.1', 'This Agreement shall commence on the date last signed by the Parties ("Effective Date") and shall continue for a fixed term of six (6) months ("Initial Term"), unless earlier terminated in accordance with Clause 17.'],
    ['3.2', 'Upon expiry of the Initial Term, EchoLens may, at its sole discretion and based on the Instructor\'s performance during the Initial Term, offer the Instructor a renewal for one or more further terms of six (6) months each. Renewal shall be by written offer from EchoLens and written acceptance by the Instructor; there is no automatic renewal.'],
    ['3.3', 'Any Commission earned but unpaid at the expiry of the Term shall remain payable in accordance with Clause 11 (Payment Terms).'],
  ] });
  sections.push({ title: '4. ELIGIBILITY AND INSTRUCTOR REPRESENTATIONS', intro: 'The Instructor represents, warrants, and undertakes to EchoLens on a continuing basis throughout the Term that:', clauses: [
    ['4.1', 'The Instructor is at least eighteen (18) years of age.'],
    ['4.2', 'The Instructor holds the qualifications, certifications and/or professional experience declared at onboarding, and the supporting degree, transcript and certification documents submitted are genuine and accurate.'],
    ['4.3', 'The Instructor is not concurrently engaged as an instructor, trainer, or curriculum contributor for any organisation offering directly competing artificial intelligence, data science, automation, or adjacent technology education programs, and shall not enter into any such engagement during the Term without EchoLens\'s prior written consent.'],
    ['4.4', 'The Instructor shall at all times comply with EchoLens\'s academic policies and Code of Conduct in delivering the Assigned Course(s), and shall not undertake any activity that violates such policies.'],
    ['4.5', 'The Instructor has read and understood the EchoLens Code of Conduct (a copy of which forms part of the onboarding pack and is incorporated by reference into this Agreement) and shall abide by it.'],
  ] });
  sections.push({ title: '5. INSTRUCTOR RESPONSIBILITIES AND DELIVERABLES', intro: 'During the Term, for each Assigned Course, the Instructor shall:', clauses: [
    ['5.1', 'Deliver every scheduled live session (or, for self-paced content, publish lesson material on schedule) for the Assigned Course(s), using only EchoLens-approved curriculum and course materials (as listed in Annexure B) unless prior written approval is given for supplementary material.'],
    ['5.2', 'Grade student submissions/assignments within the timeframe set by EchoLens for the Assigned Course, and provide constructive, accurate feedback consistent with EchoLens\'s grading rubric.'],
    ['5.3', 'Submit a Monthly Teaching Activity Report (per Annexure C) to the Program Coordinator not later than the fifth (5th) day of each following calendar month, in the prescribed format.'],
    ['5.4', 'Attend the fortnightly Instructor/faculty group video call scheduled by EchoLens (once every two weeks, duration approximately thirty (30) minutes), plus any additional meeting EchoLens convenes on reasonable notice where circumstances require. Failure to attend two consecutive scheduled fortnightly calls without prior written excuse shall constitute a material breach for the purposes of Clause 17.1.'],
    ['5.5', 'Respond to reasonable communications from the Program Coordinator or enrolled students within seventy-two (72) hours during standard working days.'],
    ['5.6', 'Maintain a satisfactory delivery record on every Assigned Course: no more than one missed/unrescheduled scheduled session per calendar month without prior written excuse, and grading turnaround within the timeframe set by EchoLens. Failure to meet this standard for two consecutive calendar months shall constitute grounds for termination for underperformance in accordance with Clause 17.1.'],
  ] });
  sections.push({ title: '6. PROHIBITED CONDUCT', intro: 'The Instructor shall NOT, at any time during or after the Term, undertake any of the following:', clauses: [
    ['6.1', 'Make any representation, warranty, guarantee, or promise regarding job placement, salary, employability outcomes, immigration outcomes, or partner-institution admission that has not been expressly and in writing authorised by EchoLens.'],
    ['6.2', 'Modify, distort, or reproduce EchoLens\'s branding, logo, colour scheme, letterhead, or any other intellectual property beyond the scope of the materials expressly provided; produce derivative marketing material without prior written approval from EchoLens.'],
    ['6.3', 'Solicit or accept any payment from an enrolled or prospective student outside the EchoLens platform for tutoring, grading favours, certification, or any other course-related service.'],
    ['6.4', 'Share assessment answer keys, grading rubrics, or unreleased course content with anyone other than EchoLens staff and enrolled students in the ordinary course of teaching.'],
    ['6.5', 'Represent to any third party that he/she is an employee, agent, officer, director, or shareholder of EchoLens, or that he/she has authority to bind EchoLens to any contract or obligation.'],
    ['6.6', 'Disparage EchoLens, its founder, employees, other instructors, partners, or programs on any public or private platform. Any grievance shall be raised directly with the Program Coordinator or, if unresolved, with the Chief Executive Officer of EchoLens.'],
    ['6.7', 'Engage in any conduct that is fraudulent, unlawful, or intended to inflate the Commission structure, including but not limited to falsifying attendance/grading records or arranging enrolments that are not genuine for the purpose of triggering Commission.'],
    ['6.8', 'Share, publish, or otherwise disclose the details of this Agreement (including Commission percentages) to any competitor of EchoLens, or to any person other than the Instructor\'s professional adviser (e.g., accountant) on a need-to-know basis.'],
  ] });
  sections.push({ title: '7. ASSIGNMENT OF COURSES', clauses: [
    ['7.1', 'The Instructor may be assigned to one or more Assigned Courses at the same time, and to additional Assigned Courses during the Term, by Admin or the Admissions Office (Student Coordinator), confirmed through the EchoLens portal.'],
    ['7.2', 'EchoLens shall notify the Instructor of each new Assigned Course and its schedule with reasonable advance notice before the course\'s start date.'],
    ['7.3', 'EchoLens may, in its sole discretion, remove the Instructor from an Assigned Course with immediate effect where it reasonably suspects fraud, abuse, or a breach of Clause 6 (Prohibited Conduct), or for quality/performance reasons under Clause 5.6.'],
  ] });
  sections.push({ title: '8. COMMISSION STRUCTURE', clauses: [
    ['8.1', 'Subject to the terms of this Agreement, EchoLens shall pay the Instructor Commission on each Confirmed Enrolment in an Assigned Course, in accordance with this Clause 8 and Annexure A.'],
    ['8.2', 'Commission is a flat thirty percent (30%) of the Fee Paid by each student on a Confirmed Enrolment in an Assigned Course - that is, thirty percent (30%) of the exact amount the student actually paid, apart from (in addition to) any other amount separately payable to the Instructor under this Agreement. Where an Assigned Course has more than one Instructor, EchoLens shall apportion the 30% among them in the ratio recorded in the portal at the time of assignment (equally, unless otherwise agreed in writing).'],
    ['8.3', 'Commission is calculated on the exact amount actually received by EchoLens from the student in cleared funds. Where a student pays in instalments, Commission accrues only once the full course fee has been received and the enrolment has become a Confirmed Enrolment. Bank charges, payment gateway fees, and government taxes (if any) are excluded from the Fee Paid.'],
    ['8.4', 'For illustration only: on a Short Course with a catalogue price of PKR 15,000 where the Fee Paid (after any discount) is PKR 13,500, Commission is 30% of PKR 13,500, being PKR 4,050.'],
    ['8.5', 'No Cap on Earnings. There is no cap, ceiling, or maximum limit on the amount of Commission the Instructor may earn under this Agreement, nor on the number of Confirmed Enrolments or Assigned Courses in respect of which Commission may be claimed.'],
  ] });
  sections.push({ title: '9. PERKS AND RECOGNITION', intro: 'In addition to Commission, the Instructor shall be entitled to the following, subject to continued good standing:', clauses: [
    ['9.1', 'Credentials Package: Official Appointment Letter on EchoLens letterhead (within 7 working days); Completion Certificate at the end of the Term (subject to Clause 5.6 delivery standards); LinkedIn recommendation from the CEO upon successful completion; signed reference letter for further professional applications upon reasonable request.'],
    ['9.2', 'Access: invitation to the fortnightly Instructor/faculty group video call with EchoLens leadership; early access to newly launched programs and curriculum pilots; membership in a private WhatsApp community with EchoLens staff and other Instructors.'],
    ['9.3', 'Recognition: feature on the EchoLens official website with a short specialization highlight set by HR (e.g. "AI Automation Instructor", "Web Developer"); quarterly recognition among Instructors for delivery quality.'],
  ] });
  sections.push({ title: '10. ATTENDANCE, GRADING & QUALITY ASSURANCE', clauses: [
    ['10.1', 'Only Confirmed Enrolments (Clause 1.4) in an Assigned Course qualify for Commission. Registrations, partial payments, and enrolments cancelled within the refund window do not qualify.'],
    ['10.2', 'Where a refund is issued after Commission has been paid, EchoLens may deduct the corresponding amount from the Instructor\'s next payout, or invoice for repayment if no future payout is anticipated.'],
    ['10.3', 'EchoLens reserves the right to audit session delivery, grading records, and any Confirmed Enrolment attributed to the Instructor for six (6) months from the date of enrolment. The Instructor shall reasonably co-operate with any such audit.'],
    ['10.4', 'Where EchoLens establishes, on the balance of probabilities, that the Instructor has engaged in fraud or the conduct prohibited by Clause 6.7, EchoLens may (i) withhold all unpaid Commission, (ii) recover Commission already paid for the affected enrolments, and (iii) terminate this Agreement summarily under Clause 17.1.'],
  ] });
  sections.push(paymentTermsSection());
  sections.push(brandIpSection('Instructor'));
  sections.push(confidentialitySection());
  sections.push(dataProtectionSection());
  sections.push(contractorTaxSection('Instructor'));
  sections.push(liabilitySection('Instructor'));
  sections.push({ title: '17. TERMINATION', clauses: [
    ['17.1', 'EchoLens may terminate this Agreement with immediate effect by written notice upon: breach of Clause 6 (Prohibited Conduct); any act of fraud or manipulation under Clause 10.4; failure to meet the Clause 5.6 delivery standard for two consecutive calendar months ("Termination for Underperformance"); failure to attend two consecutive scheduled fortnightly calls without prior written excuse; death, incapacity, or insolvency of the Instructor; or breach of any other material term not remedied within seven (7) days of written notice.'],
    ['17.2', 'The Instructor may terminate this Agreement by giving EchoLens not less than fifteen (15) days\' prior written notice, and shall complete or hand over any in-progress Assigned Course obligations in good faith during that notice period.'],
    ['17.3', 'EchoLens may terminate this Agreement without cause by giving not less than thirty (30) days\' prior written notice.'],
    ['17.4', 'Upon termination for any reason: the Instructor is removed from all Assigned Courses with immediate effect; Commission earned but unpaid on Confirmed Enrolments prior to termination is paid at the next scheduled payout (subject to Clause 10.4); the Instructor shall promptly return or destroy all EchoLens IP and confidential information; and Clauses 6.8, 12, 13, 14, 16 and this Clause 17.4 survive termination.'],
  ] });
  sections.push(miscSection('Instructor'));
  sections.push(disputeSection());
  return sections;
}

async function renderSections(flow, sections) {
  for (const s of sections) {
    await flow.heading(s.title, { size: 12, gapBefore: 4, gapAfter: 8 });
    if (s.intro) await flow.paragraph(s.intro, { gapAfter: 6 });
    for (const [num, text] of s.clauses) await flow.clause(num, text);
  }
}

async function renderAnnexures(flow, { role, settings }) {
  await flow.newPage();
  if (role === 'ambassador') {
    await flow.heading('ANNEXURE A: DETAILED COMMISSION SCHEDULE', { size: 13, gapAfter: 8 });
    await flow.paragraph('Commission is calculated on the Fee Paid, being the exact amount actually paid by the Referred Student to EchoLens in cleared funds after any discount.', { gapAfter: 10 });
    await flow.table(
      [{ label: 'Program Tier', width: 140 }, { label: 'Commission Rate', width: 130 }, { label: 'Code Discount', width: 130 }, { label: 'Calculation Base', width: 95 }],
      [['Bootcamp', '8%', '10%', 'Fee Paid'], ['Short Course', '9%', '10%', 'Fee Paid'], ['Specialist Track', '10%', '15%', 'Fee Paid'], ['Career Track', '12%', '15%', 'Fee Paid']],
      { gapAfter: 14 });
    await flow.paragraph('Illustrative example: Career Track, catalogue price PKR 40,000, 15% Code discount -> Fee Paid PKR 34,000 -> Commission at 12% is PKR 4,080. There is no cap on the number of Confirmed Enrolments or on total Commission earned.', { gapAfter: 16 });
    await flow.heading('ANNEXURE B: APPROVED MARKETING ASSETS', { size: 13, gapAfter: 8 });
    await flow.bullets(['Official EchoLens logo and brand mark (navy and teal variants).', 'EchoLens colour palette and course one-pagers pre-approved for social sharing.', 'Instagram/Facebook post templates, WhatsApp status images, Zoom backgrounds, campus poster templates.', 'Standardised captions and an approved short-form video pitch featuring the Ambassador\'s Code.'], { gapAfter: 14 });
    await flow.paragraph('Any deviation from, or modification of, these assets requires prior written approval from the Program Coordinator.', { gapAfter: 14 });
    await flow.heading('ANNEXURE C: MONTHLY ACTIVITY REPORT TEMPLATE', { size: 13, gapAfter: 8 });
    await flow.paragraph('Submitted by the 5th of each month via the designated online form: Ambassador Name and Code; Reporting Month; Enrolments driven this month; Info sessions delivered (location/attendance); Qualifying social media posts (with links); Market intelligence/feedback; Support needed from EchoLens; Planned activity for next month.', { gapAfter: 14 });
    await flow.newPage();
    await flow.heading('ANNEXURE D: PAYMENT DETAILS FORM', { size: 13, gapAfter: 8 });
    await flow.paragraph('Submitted within 7 working days of the Effective Date: Full Legal Name (as on CNIC); CNIC Number; Bank Name and Branch; Account Title; IBAN; Mobile Number (JazzCash/EasyPaisa fallback); Email for statements; FBR NTN (if filer). Attachments: scanned CNIC (both sides), University enrolment card/student ID, bank cheque or statement showing IBAN.', { gapAfter: 14 });
    await flow.heading('ANNEXURE E: PROHIBITED CLAIMS AND STATEMENTS', { size: 13, gapAfter: 8 });
    await flow.paragraph('Illustrative, not exhaustive - any deviation is a material breach:', { gapAfter: 6 });
    await flow.bullets(['"You are guaranteed a job after completing this program."', '"Our graduates earn a minimum salary of X rupees."', '"Our courses are accredited by [university or regulator]" (unless expressly true and confirmed by EchoLens).', '"You will get a scholarship" (unless a specific documented scholarship applies).', '"EchoLens is affiliated with Google, Microsoft, Meta, or [large company]" (unless a documented partnership is confirmed by EchoLens).', '"Refunds are available anytime" (state the actual, time-bound policy).', '"I know the CEO personally and can get you a discount beyond the code."', 'Any statement misrepresenting the Ambassador\'s role as an employee, officer, or official spokesperson of EchoLens.'], { gapAfter: 10 });
  } else {
    await flow.heading('ANNEXURE A: COMMISSION SCHEDULE', { size: 13, gapAfter: 8 });
    await flow.paragraph('Commission is calculated on the Fee Paid, being the exact amount actually paid by the student to EchoLens in cleared funds after any discount.', { gapAfter: 10 });
    await flow.table(
      [{ label: 'Program Tier', width: 300 }, { label: 'Commission Rate', width: 130 }, { label: 'Calculation Base', width: 95 }],
      [['Bootcamp / Short Course / Specialist Track / Career Track', '30% (flat)', 'Fee Paid']],
      { gapAfter: 14 });
    await flow.paragraph('Illustrative example: Short Course, Fee Paid PKR 13,500 -> Commission at 30% is PKR 4,050. There is no cap on the number of Confirmed Enrolments, Assigned Courses, or total Commission earned.', { gapAfter: 16 });
    await flow.heading('ANNEXURE B: APPROVED COURSE MATERIALS', { size: 13, gapAfter: 8 });
    await flow.bullets(['The official EchoLens curriculum, slide decks, and lab/assignment briefs for each Assigned Course.', 'The EchoLens logo and brand mark for use on session slides and Zoom backgrounds only.', 'Any supplementary material (e.g. the Instructor\'s own slides or exercises) requires prior written approval from the Program Coordinator before use.'], { gapAfter: 14 });
    await flow.heading('ANNEXURE C: MONTHLY TEACHING ACTIVITY REPORT TEMPLATE', { size: 13, gapAfter: 8 });
    await flow.paragraph('Submitted by the 5th of each month via the designated online form: Instructor Name; Reporting Month; Sessions delivered per Assigned Course (with attendance); Assignments graded and average turnaround; Student feedback/market intelligence; Support needed from EchoLens; Planned activity for next month.', { gapAfter: 14 });
    await flow.newPage();
    await flow.heading('ANNEXURE D: PAYMENT DETAILS FORM', { size: 13, gapAfter: 8 });
    await flow.paragraph('Submitted within 7 working days of the Effective Date: Full Legal Name (as on CNIC); CNIC Number; Bank Name and Branch; Account Title; IBAN; Mobile Number (JazzCash/EasyPaisa fallback); Email for statements; FBR NTN (if filer). Attachments: scanned CNIC (both sides), highest qualification degree/transcript, bank cheque or statement showing IBAN.', { gapAfter: 14 });
    await flow.heading('ANNEXURE E: PROHIBITED CLAIMS AND STATEMENTS', { size: 13, gapAfter: 8 });
    await flow.paragraph('Illustrative, not exhaustive - any deviation is a material breach:', { gapAfter: 6 });
    await flow.bullets(['"You are guaranteed a job after completing this program."', '"Our graduates earn a minimum salary of X rupees."', '"This certification is accredited by [university or regulator]" (unless expressly true and confirmed by EchoLens).', '"EchoLens is affiliated with Google, Microsoft, Meta, or [large company]" (unless a documented partnership is confirmed by EchoLens).', '"I can guarantee you a passing grade/certificate regardless of your submitted work."', 'Any statement misrepresenting the Instructor\'s role as an employee, officer, or official spokesperson of EchoLens.'], { gapAfter: 10 });
  }
}

async function renderExecution(flow, { role, user, profile, settings }) {
  const ceoName = (settings && settings.ceo_name) || 'Tahir Mehmood';
  await flow.newPage();
  await flow.heading('EXECUTION', { size: 13, gapAfter: 8 });
  await flow.paragraph('IN WITNESS WHEREOF, the Parties have executed this Agreement on the dates set out below.', { gapAfter: 30 });
  // The EchoLens side is executed digitally (typed authorised name above the
  // rule); the counterparty signs their own column by hand.
  await flow.signatureBlock([
    { x: 60, w: 210, name: ceoName, title: `Founder & Chief Executive Officer, ${LEGAL_ENTITY}`, signed: true },
    { x: 325, w: 210, name: val(user.name), title: role === 'ambassador' ? 'Ambassador' : 'Instructor' },
  ], { height: 84 });
  flow.y -= 30;
  await flow.paragraph(`CNIC: ${val(profile.cnic)}          Date: _______________          Place: _______________`, { size: 9, gapAfter: 30 });
  await flow.heading('Witness (optional):', { size: 10, gapAfter: 20 });
  await flow.signatureBlock([{ x: 60, w: 475, name: '', title: 'Name / CNIC / Signature' }]);
  flow.y -= 30;
  await flow.heading('Parent/Guardian Consent (only if the signatory is under 18):', { size: 9.5, gapAfter: 8 });
  await flow.paragraph('I confirm that I am the parent/lawful guardian of the person named above and consent to their participation in this Program on the terms of this Agreement, and undertake to be jointly bound by its terms.', { size: 8.5, gapAfter: 20 });
  await flow.signatureBlock([{ x: 60, w: 475, name: '', title: 'Name / Signature / Date' }]);
}

async function generateContractPdf({ role, user, profile, ambassador, settings }) {
  const flow = await LetterheadFlow.create();
  const isAmb = role === 'ambassador';
  await renderCover(flow, {
    settings,
    tagline: 'Innovate · Educate · Elevate',
    docTitle: isAmb ? 'STUDENT AMBASSADOR PROGRAM' : 'INSTRUCTOR ENGAGEMENT PROGRAM',
    docSubtitle: isAmb ? 'Terms and Conditions of Appointment' : 'Terms and Conditions of Engagement',
  });
  await renderPartiesAndRecitals(flow, { role, user, profile, ambassador, settings, roleLabel: isAmb ? 'Campus Ambassador' : 'Instructor Engagement' });
  const sections = isAmb ? ambassadorClauses({ user, profile, ambassador, settings }) : instructorClauses({ user, profile, settings });
  await renderSections(flow, sections);
  await renderAnnexures(flow, { role, settings });
  await renderExecution(flow, { role, user, profile, settings });
  return flow.save();
}

module.exports = { generateContractPdf };
