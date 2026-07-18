'use strict';
/*
 * coursepages.js - server-rendered, SEO-optimized landing page for every course
 * in the official catalogue, plus a /courses index hub. Each page carries its own
 * <title>, meta description, canonical, Open Graph tags, Course + BreadcrumbList
 * JSON-LD and real, crawlable content so individual courses can rank on their own
 * keywords. The visible catalogue on /open stays client-side; these pages exist so
 * search engines have a static, indexable URL per course.
 */
const store = require('./store');

const BASE = 'https://www.echolens.digital';
const ENROLL_FORM = 'https://docs.google.com/forms/d/1tngMoAaGzyIRktzjmyNHu1vQ_osBMfi-BDAr1Ix8Xs0/viewform';
const WHATSAPP = 'https://wa.me/923141479109';
const EMAIL = 'info@echolens.digital';
const COHORT = { name: 'August 2026', starts: '1 August 2026', startDate: '2026-08-01', deadline: '31 July 2026' };

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[/.]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function courseSlug(c) { return slugify(c.title); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function jsonScript(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}
function isFree(c) { return !c.price_pkr; }
function priceLabel(c) { return isFree(c) ? 'Free' : 'Rs ' + Number(c.price_pkr).toLocaleString('en-US'); }
function levelFor(tier) {
  if (tier === 'Bootcamp') return 'Beginner';
  if (tier === 'Short Course') return 'Beginner to Intermediate';
  if (tier === 'Specialist Track') return 'Intermediate to Advanced';
  return 'All levels';
}
function tierBlurb(tier) {
  if (tier === 'Bootcamp') return 'This is a focused 2-week bootcamp - short, intensive and built to give you one job-ready skill fast.';
  if (tier === 'Short Course') return 'This is a 6-week short course - enough depth to build real projects and a portfolio piece, without a long commitment.';
  if (tier === 'Specialist Track') return 'This is an 8-week specialist track - our most in-depth program, taking you to a professional, hireable standard.';
  return 'A live, instructor-led EchoLens program.';
}

/* -------------------------------- head/nav/footer -------------------------------- */
function pageHead(opts) {
  const { title, description, canonical, keywords, jsonld } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="keywords" content="${esc(keywords)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#7C3AED">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EchoLens">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${BASE}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BASE}/img/og-image.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..650&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css?v1317">
${jsonld.map(jsonScript).join('\n')}
<style>
  body{background:#F7F8FD;color:#0F172A;font-family:'Inter',system-ui,sans-serif}
  .cp-wrap{max-width:1080px;margin:0 auto;padding:20px 5vw 70px}
  .cp-crumb{font-size:13px;color:#6B7280;margin:14px 0 18px}
  .cp-crumb a{color:#6B7280}.cp-crumb a:hover{color:#7C3AED}
  .cp-hero{background:linear-gradient(120deg,#0B1023,#141B36 55%,#1B1147);border-radius:22px;padding:34px 34px 30px;color:#fff;position:relative;overflow:hidden}
  .cp-hero:after{content:"";position:absolute;top:-40%;right:-10%;width:420px;height:420px;background:radial-gradient(circle,rgba(124,58,237,.45),transparent 65%);pointer-events:none}
  .cp-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;position:relative}
  .cp-badge{font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.12);color:#EDE9FE;border:1px solid rgba(255,255,255,.18)}
  .cp-badge.free{background:#10B981;color:#04231a;border-color:transparent}
  .cp-badge.hot{background:#F59E0B;color:#3a2600;border-color:transparent}
  .cp-h1{font-family:'Fraunces',Georgia,serif;font-size:36px;line-height:1.12;font-weight:600;margin:4px 0 12px;position:relative;color:#fff}
  .cp-lead{font-size:17px;line-height:1.6;color:#C7CBE0;max-width:640px;position:relative}
  .cp-meta{display:flex;gap:22px;flex-wrap:wrap;margin-top:20px;position:relative}
  .cp-meta div{font-size:13px;color:#9AA3Bd}.cp-meta b{display:block;font-size:16px;color:#fff;font-weight:700}
  .cp-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;position:relative}
  .cp-grid{display:grid;grid-template-columns:1fr 320px;gap:26px;margin-top:28px}
  @media(max-width:820px){.cp-grid{grid-template-columns:1fr}.cp-h1{font-size:29px}}
  .cp-card{background:#fff;border:1px solid #E6E8F3;border-radius:16px;padding:22px 24px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(79,70,229,.06)}
  .cp-card h2{font-family:'Fraunces',serif;font-size:21px;font-weight:600;margin:0 0 12px}
  .cp-card h2:not(:first-child){margin-top:26px}
  .cp-card p{color:#4B5568;font-size:15px;line-height:1.7;margin:0 0 12px}
  .cp-list{list-style:none;padding:0;margin:8px 0 4px}
  .cp-list li{position:relative;padding:7px 0 7px 30px;font-size:15px;color:#374151;line-height:1.55;border-bottom:1px solid #F1F2F9}
  .cp-list li:last-child{border-bottom:none}
  .cp-list li:before{content:"";position:absolute;left:4px;top:12px;width:9px;height:9px;border-radius:50%;background:linear-gradient(94deg,#7C3AED,#4F46E5)}
  .cp-side{position:sticky;top:18px;align-self:start}
  .cp-price{font-size:30px;font-weight:800;color:#0F172A}
  .cp-price small{font-size:13px;font-weight:600;color:#6B7280;display:block;margin-top:2px}
  .cp-facts{list-style:none;padding:0;margin:16px 0}
  .cp-facts li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #F1F2F9;font-size:14px}
  .cp-facts li span:first-child{color:#6B7280}.cp-facts li span:last-child{font-weight:600;color:#111827;text-align:right}
  .cp-rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-top:14px}
  .cp-rel a{display:block;background:#fff;border:1px solid #E6E8F3;border-radius:14px;padding:16px 18px;transition:.15s}
  .cp-rel a:hover{border-color:#7C3AED;transform:translateY(-2px);box-shadow:0 10px 26px rgba(79,70,229,.12)}
  .cp-rel b{display:block;font-size:15px;color:#0F172A;margin-bottom:4px}
  .cp-rel span{font-size:12.5px;color:#6B7280}
  .cp-foot{max-width:1080px;margin:40px auto 0;padding:24px 5vw;border-top:1px solid #E6E8F3;color:#6B7280;font-size:13.5px;display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between}
  .cp-foot a{color:#6B7280}.cp-foot a:hover{color:#7C3AED}
  .cp-sec-h{font-family:'Fraunces',serif;font-size:24px;font-weight:600;margin:34px 0 4px}
  .btn-grad{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:12px;font-weight:700;font-size:14.5px;border:none;cursor:pointer;background:linear-gradient(94deg,#7C3AED,#4F46E5);color:#fff;box-shadow:0 8px 22px rgba(124,58,237,.35);transition:.15s}
  .btn-grad:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(124,58,237,.45)}
  .btn-light{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:12px;font-weight:700;font-size:14.5px;cursor:pointer;background:#fff;color:#4F46E5;border:1.5px solid #D9DCEE;transition:.15s}
  .btn-light:hover{border-color:#7C3AED;color:#7C3AED}
</style>
</head>
<body>
<nav class="open-nav">
  <a href="/"><img src="/img/logo.png" alt="EchoLens"></a>
  <a class="nlink" href="/courses">Courses</a>
  <a class="nlink" href="/open">Quests &amp; Events</a>
  <a class="nlink" href="/compiler">Compiler</a>
  <span style="flex:1"></span>
  <a class="nlink" href="/login">Sign in</a>
</nav>`;
}
function pageFoot() {
  return `<footer class="cp-foot">
  <span>&copy; ${new Date().getFullYear()} EchoLens Digital - Pakistan's gamified AI &amp; tech academy.</span>
  <span><a href="/courses">All courses</a> &middot; <a href="/open">Free quests</a> &middot; <a href="/compiler">Compiler</a> &middot; <a href="mailto:${EMAIL}">${EMAIL}</a></span>
</footer>
</body>
</html>`;
}

/* -------------------------------- course page -------------------------------- */
// The quest track behind a catalogue course carries the public outline (one
// line per class), the key concepts, and the production end project.
function trackForCourse(c) {
  const row = store.Quests.tracks().find((x) => x.course_code === c.code);
  return row ? { def: store.Quests.trackDef(row.key), mode: row.submission_mode } : null;
}
const CP_MODE_LABEL = {
  code: 'Coding quests solved in the built-in EchoLens compiler.',
  'code-ai': 'Coding quests in the built-in compiler with an AI copilot beside the editor - exactly the Cursor/Copilot workflow the course teaches.',
  file: 'Quests submitted as files (PDF, Word, PNG, JPEG) and graded instantly.',
  doc: 'Quests submitted as Word or PDF reports and graded instantly.',
  prompt: 'Quests solved in the built-in AI Prompt Lab - write and run prompts like a compiler and submit the workbook directly.',
  'excel-ai': 'Quests submitted as Excel workbooks, with an AI copilot linked to your uploaded sheet for in-context analysis and edits.',
  multi: 'Quests submitted as PDF or image exports - multiple files per submission.',
};
function outlineSection(c) {
  const t = trackForCourse(c);
  if (!t || !t.def) return '';
  const d = t.def;
  const isBootcamp = c.tier === 'Bootcamp';
  const unit = isBootcamp ? 'Class' : 'Level';
  const concepts = (d.key_concepts || []).map((k) => `<span style="display:inline-block;font-size:12.5px;font-weight:600;color:#4F46E5;border:1px solid #D9DCEE;border-radius:999px;padding:5px 12px;margin:4px 6px 0 0">${esc(k)}</span>`).join('');
  const rows = d.levels.map((l) => `
    <li style="padding:8px 0;border-bottom:1px solid #F1F2F9;font-size:15px;line-height:1.55;color:#374151">
      <b style="color:#4F46E5">${unit} ${l.no}.</b> <b>${esc(l.title)}</b>${l.topic ? ` <span style="color:#6B7280">- ${esc(l.topic)}</span>` : ''}
    </li>`).join('');
  const ep = d.end_project;
  return `
    ${concepts ? `<h2>What you will learn</h2><div>${concepts}</div>` : ''}
    <h2>Course outline - ${unit.toLowerCase()} by ${unit.toLowerCase()}</h2>
    <p>${d.levels.length} ${unit.toLowerCase()}${d.levels.length === 1 ? '' : 'es'}, each with hands-on quests you clear in the portal${isBootcamp ? ' - the whole first week is open free' : ''}.</p>
    <ul style="list-style:none;padding:0;margin:8px 0 4px">${rows}</ul>
    ${CP_MODE_LABEL[t.mode] ? `<p style="margin-top:10px"><b>How you submit:</b> ${esc(CP_MODE_LABEL[t.mode])}</p>` : ''}
    ${ep ? `
    <h2>Your production end project</h2>
    <div style="border:1.5px solid #7C3AED;border-radius:14px;padding:18px 20px;margin-top:6px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.6px;color:#7C3AED;text-transform:uppercase;margin-bottom:6px">End project - your production build</div>
      <p style="font-size:17px;font-weight:700;color:#0F172A;margin:0 0 4px">${esc(ep.title)}</p>
      <p style="color:#7C3AED;font-weight:600;font-size:14px;margin:0 0 8px">${esc(ep.tagline || '')}</p>
      <p style="margin:0 0 10px">${esc(ep.description || '')}</p>
      ${(ep.includes || []).length ? `<ul style="list-style:none;padding:0;margin:0">${ep.includes.map((i) => `<li style="position:relative;padding:4px 0 4px 24px;font-size:14px;color:#374151;line-height:1.55"><span style="position:absolute;left:2px;color:#10B981;font-weight:700">&#10003;</span>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${ep.shipped_when ? `<p style="margin:10px 0 0;padding:10px 14px;border-left:3px solid #10B981;background:#F7F8FD;border-radius:8px;font-size:14px"><b>Shipped when:</b> ${esc(ep.shipped_when)}</p>` : ''}
    </div>` : ''}`;
}
function renderCourse(c, all) {
  const slug = courseSlug(c);
  const url = `${BASE}/courses/${slug}`;
  const free = isFree(c);
  const level = levelFor(c.tier);
  // Prefer the course's own SEO search keywords (from its quest track) when
  // present, then top up with the generic catalogue keywords.
  const trackKw = trackForCourse(c)?.def?.keywords || [];
  const kw = [...trackKw, c.title, c.tier, 'course', 'online course Pakistan', free ? 'free ' + c.title.toLowerCase() : c.title.toLowerCase() + ' fee', 'EchoLens', 'learn ' + c.title.split(/[:&,]/)[0].trim().toLowerCase() + ' online'].join(', ');
  const metaDesc = `${c.summary} ${free ? 'Free, ' : ''}${c.weeks}-week ${c.tier.toLowerCase()}, ${c.hours} hours of live instructor-led learning with coding quests, a browser compiler and a verified certificate. ${COHORT.name} cohort - enrol at EchoLens.`.slice(0, 300);
  const title = `${c.title} ${free ? '(Free) ' : ''}| ${c.tier} - EchoLens Digital`;

  const badges = [];
  if (free) badges.push('<span class="cp-badge free">Free</span>');
  (c.badges || []).forEach((b) => {
    if (b === 'free') return;
    if (b === 'high_demand') badges.push('<span class="cp-badge hot">High demand</span>');
    else if (b === 'new') badges.push('<span class="cp-badge">New for 2026</span>');
    else if (b === 'flagship') badges.push('<span class="cp-badge hot">Flagship</span>');
  });
  badges.push(`<span class="cp-badge">${esc(c.tier)}</span>`);

  const included = [
    `Live, instructor-led online sessions across ${c.weeks} weeks (${c.hours} hours total).`,
    'Hands-on coding quests you solve inside the EchoLens browser compiler - nothing to install.',
    'Gems, stages and a leaderboard that keep you moving instead of grade anxiety.',
    'A verified certificate with a scannable QR code, ready to share on LinkedIn, when you finish.',
    free ? 'Completely free - no fee, just create an account and start.' : 'The first week is open free so you can try the course before you pay.',
  ];

  const related = all.filter((x) => x.tier === c.tier && x.code !== c.code).slice(0, 4);

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.title,
    description: c.summary,
    url,
    image: `${BASE}/img/og-image.png`,
    inLanguage: 'en',
    educationalLevel: level,
    courseCode: c.code,
    teaches: (trackForCourse(c)?.def?.key_concepts || []).slice(0, 10),
    provider: { '@type': 'EducationalOrganization', name: 'EchoLens Digital', url: BASE + '/', sameAs: BASE + '/' },
    offers: {
      '@type': 'Offer',
      category: free ? 'Free' : 'Paid',
      price: free ? '0' : String(c.price_pkr),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: c.hours ? 'PT' + c.hours + 'H' : undefined,
      startDate: COHORT.startDate,
      location: { '@type': 'VirtualLocation', url },
      instructor: { '@type': 'Organization', name: 'EchoLens Digital' },
    },
  };
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: BASE + '/courses' },
      { '@type': 'ListItem', position: 3, name: c.title, item: url },
    ],
  };

  const ctaPrimary = free
    ? `<a class="btn btn-grad" href="/open#signup">Start this course free</a>`
    : `<a class="btn btn-grad" href="${ENROLL_FORM}" target="_blank" rel="noopener">Enrol in this course</a>`;
  const ctaSecondary = free
    ? `<a class="btn btn-light" href="/open">Browse all free quests</a>`
    : `<a class="btn btn-light" href="/open#signup">Try the first quest free</a>`;

  return pageHead({ title, description: metaDesc, canonical: url, keywords: kw, jsonld: [courseLd, crumbLd] }) + `
<div class="cp-wrap">
  <nav class="cp-crumb"><a href="/">Home</a> / <a href="/courses">Courses</a> / <span>${esc(c.title)}</span></nav>

  <header class="cp-hero">
    <div class="cp-badges">${badges.join('')}</div>
    <h1 class="cp-h1">${esc(c.title)}</h1>
    <p class="cp-lead">${esc(c.summary)}</p>
    <div class="cp-meta">
      <div><b>${esc(priceLabel(c))}</b>${free ? 'No fee' : 'One-time fee'}</div>
      <div><b>${c.weeks} weeks</b>${c.hours} hours</div>
      <div><b>${esc(c.tier)}</b>${esc(level)}</div>
      <div><b>Online</b>Live &amp; instructor-led</div>
    </div>
    <div class="cp-cta">${ctaPrimary}${ctaSecondary}</div>
  </header>

  <div class="cp-grid">
    <main>
      <section class="cp-card">
        <h2>About this course</h2>
        <p>${esc(c.summary)}</p>
        <p>${esc(tierBlurb(c.tier))} It runs online in the ${esc(COHORT.name)} cohort (starting ${esc(COHORT.starts)}) and is taught the EchoLens way: you learn by doing real, gradeable work rather than just watching lectures.</p>
        <h2>What's included</h2>
        <ul class="cp-list">${included.map((i) => '<li>' + esc(i) + '</li>').join('')}</ul>
        ${outlineSection(c)}
        <h2>Who it's for</h2>
        <p>${esc(c.title)} suits learners at a <b>${esc(level.toLowerCase())}</b> level who want a practical, project-based route into ${esc(c.title.split(/[:&,]/)[0].trim())}. You need only a browser and an internet connection - all coding runs inside the EchoLens compiler, so there is nothing to set up.</p>
        <h2>Certificate</h2>
        <p>Finish every stage and EchoLens issues a verified certificate carrying a QR code anyone can scan to confirm it on our site. You can add it to your CV or share it to LinkedIn in one click.</p>
      </section>
    </main>

    <aside class="cp-side">
      <div class="cp-card">
        <div class="cp-price">${esc(priceLabel(c))}<small>${free ? 'Free forever - just sign in' : COHORT.name + ' cohort - fee payable on enrolment'}</small></div>
        <ul class="cp-facts">
          <li><span>Format</span><span>Online, live</span></li>
          <li><span>Tier</span><span>${esc(c.tier)}</span></li>
          <li><span>Duration</span><span>${c.weeks} weeks</span></li>
          <li><span>Total hours</span><span>${c.hours} hours</span></li>
          <li><span>Level</span><span>${esc(level)}</span></li>
          <li><span>Cohort</span><span>${esc(COHORT.name)}</span></li>
          <li><span>Certificate</span><span>Verified</span></li>
        </ul>
        <div style="display:flex;flex-direction:column;gap:8px">${ctaPrimary}${ctaSecondary}</div>
        <p style="font-size:12.5px;color:#6B7280;margin-top:12px;line-height:1.55">Questions about ${esc(c.title)}? Message us on <a href="${WHATSAPP}" target="_blank" rel="noopener" style="color:#7C3AED;font-weight:600">WhatsApp</a> or email <a href="mailto:${EMAIL}" style="color:#7C3AED;font-weight:600">${EMAIL}</a>.</p>
      </div>
    </aside>
  </div>

  ${related.length ? `<h2 class="cp-sec-h">More ${esc(c.tier)}s</h2>
  <div class="cp-rel">${related.map((r) => `<a href="/courses/${courseSlug(r)}"><b>${esc(r.title)}</b><span>${esc(priceLabel(r))} &middot; ${r.weeks} weeks</span></a>`).join('')}</div>` : ''}
</div>
` + pageFoot();
}

/* -------------------------------- index page -------------------------------- */
function renderIndex(all) {
  const url = BASE + '/courses';
  const tiers = ['Bootcamp', 'Short Course', 'Specialist Track'];
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'EchoLens Course Catalogue - ' + COHORT.name,
    numberOfItems: all.length,
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/courses/${courseSlug(c)}`, name: c.title })),
  };
  const crumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: url },
    ],
  };
  const section = (tier) => {
    const items = all.filter((c) => c.tier === tier);
    if (!items.length) return '';
    return `<h2 class="cp-sec-h">${esc(tier)}s <span style="font-size:14px;color:#6B7280;font-weight:500">(${items.length})</span></h2>
    <div class="cp-rel">${items.map((c) => `<a href="/courses/${courseSlug(c)}"><b>${esc(c.title)}</b><span>${esc(priceLabel(c))} &middot; ${c.weeks} weeks &middot; ${c.hours}h</span></a>`).join('')}</div>`;
  };
  return pageHead({
    title: 'All Courses - AI, Coding, Data Science & Design | EchoLens Digital',
    description: `Browse all ${all.length} EchoLens courses for the ${COHORT.name} cohort: AI, Python, data science, web development, machine learning and design. Live instructor-led online programs with coding quests, a free browser compiler and verified certificates. Three courses are completely free.`,
    canonical: url,
    keywords: 'AI courses Pakistan, coding courses online, data science course, Python course, machine learning course, web development course, online bootcamp Pakistan, EchoLens courses',
    jsonld: [listLd, crumbLd],
  }) + `
<div class="cp-wrap">
  <nav class="cp-crumb"><a href="/">Home</a> / <span>Courses</span></nav>
  <header class="cp-hero">
    <div class="cp-badges"><span class="cp-badge">${COHORT.name} cohort</span><span class="cp-badge hot">${all.length} programs</span></div>
    <h1 class="cp-h1">EchoLens Course Catalogue</h1>
    <p class="cp-lead">${all.length} live, instructor-led online programs across AI, data science, web development and design. Learn by solving real coding quests in your browser, earn gems, and collect verified certificates. Three courses are completely free.</p>
    <div class="cp-cta"><a class="btn btn-grad" href="/open#signup">Start free</a><a class="btn btn-light" href="/open">Free quests &amp; events</a></div>
  </header>
  ${tiers.map(section).join('')}
</div>
` + pageFoot();
}

/* -------------------------------- registration -------------------------------- */
function allCourseUrls() {
  return store.officialCatalogue().map((c) => '/courses/' + courseSlug(c));
}
function register(app) {
  app.get('/courses', (req, res) => {
    res.type('html').send(renderIndex(store.officialCatalogue()));
  });
  app.get('/courses/:slug', (req, res) => {
    const all = store.officialCatalogue();
    const c = all.find((x) => courseSlug(x) === req.params.slug);
    if (!c) {
      res.status(404).type('html').send(pageHead({
        title: 'Course not found | EchoLens', description: 'This course could not be found.', canonical: BASE + '/courses',
        keywords: 'EchoLens courses', jsonld: [],
      }) + `<div class="cp-wrap"><h1 class="cp-sec-h">Course not found</h1><p>We couldn't find that course. <a href="/courses" style="color:#7C3AED;font-weight:600">Browse all courses</a>.</p></div>` + pageFoot());
      return;
    }
    res.type('html').send(renderCourse(c, all));
  });
}

module.exports = { register, slugify, courseSlug, allCourseUrls, renderIndex, renderCourse };
