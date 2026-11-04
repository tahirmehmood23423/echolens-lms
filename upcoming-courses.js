'use strict';
/**
 * Upcoming paid courses, created by an admin (the ShipLens model applied to
 * live courses).
 *
 * The fixed paid catalogue is no longer advertised. The only paid courses the
 * public site shows are the ones an admin creates here, and each one shows
 * only while it is published and its registration has not closed. The day
 * after registration closes it disappears from the home page, /open and
 * /courses on its own - nobody has to remember to take it down.
 *
 * Records live in settings.upcoming_courses, which persists as one JSON value
 * in both the JSON store and the normalized Postgres store, so no schema
 * migration is needed.
 */

const TZ_OFFSET_MS = 5 * 60 * 60 * 1000; // Pakistan Standard Time, no DST
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MODES = ['Online (live)', 'On-campus', 'Hybrid'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];

/** Today's date in Pakistan, YYYY-MM-DD: registration windows are local dates. */
function todayPk(nowMs = Date.now()) { return new Date(nowMs + TZ_OFFSET_MS).toISOString().slice(0, 10); }

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const date = (v) => (DATE.test(String(v || '').trim()) ? String(v).trim() : null);
/** One item per line (or an array), blanks and bullet marks dropped. */
function lines(v, maxItems = 40, maxLen = 300) {
  const list = Array.isArray(v) ? v : String(v || '').split(/\r?\n/);
  return list.map((x) => String(x || '').replace(/^\s*[-*•]\s*/, '').trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems);
}

/**
 * Syllabus as modules with topics. Accepts the structured array the API
 * returns, or the admin's textarea: a line starts a module, and lines that
 * begin with "-" are that module's topics.
 *
 *   Week 1: Python foundations
 *   - Variables and types
 *   - Control flow
 */
function syllabus(v) {
  if (Array.isArray(v)) {
    return v.filter((m) => m && str(m.title, 200)).slice(0, 40)
      .map((m) => ({ title: str(m.title, 200), topics: lines(m.topics, 30, 300) }));
  }
  const out = [];
  for (const raw of String(v || '').split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (/^\s*[-*•]/.test(raw)) {
      if (!out.length) out.push({ title: 'Module 1', topics: [] });
      const t = raw.replace(/^\s*[-*•]\s*/, '').trim().slice(0, 300);
      if (t && out[out.length - 1].topics.length < 30) out[out.length - 1].topics.push(t);
    } else if (out.length < 40) out.push({ title: raw.trim().slice(0, 200), topics: [] });
  }
  return out;
}

/**
 * Class dates: one session per line, "YYYY-MM-DD" then an optional label
 * ("2026-12-01 Orientation and setup"). Lines without a valid date are
 * dropped, and the list is kept in date order.
 */
function classDates(v) {
  const list = Array.isArray(v) ? v : String(v || '').split(/\r?\n/).map((l) => {
    const m = l.trim().match(/^(\d{4}-\d{2}-\d{2})\s*[-–—:|,]?\s*(.*)$/);
    return m ? { date: m[1], title: m[2] } : null;
  });
  return list.filter((s) => s && date(s.date)).slice(0, 120)
    .map((s) => ({ date: s.date, title: str(s.title, 200) || null }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Clean an admin's form into a stored record. `prev` is the existing record on
 * an update: fields the request leaves out keep their stored values.
 */
function normalize(b, prev = {}) {
  const pick = (k, fn) => (b[k] !== undefined ? fn(b[k]) : prev[k]);
  const rec = {
    ...prev,
    title: pick('title', (v) => str(v, 200)),
    tagline: pick('tagline', (v) => str(v, 300) || null),
    description: pick('description', (v) => str(v, 8000) || null),
    level: pick('level', (v) => (LEVELS.includes(v) ? v : 'All levels')),
    mode: pick('mode', (v) => (MODES.includes(v) ? v : 'Online (live)')),
    duration: pick('duration', (v) => str(v, 80) || null),
    weeks: pick('weeks', (v) => Math.max(0, Math.min(104, Math.round(Number(v) || 0))) || null),
    hours: pick('hours', (v) => Math.max(0, Math.min(2000, Math.round(Number(v) || 0))) || null),
    price_pkr: pick('price_pkr', (v) => Math.max(0, Math.round(Number(v) || 0))),
    seats: pick('seats', (v) => Math.max(0, Math.round(Number(v) || 0)) || null),
    instructor: pick('instructor', (v) => str(v, 200) || null),
    prerequisites: pick('prerequisites', (v) => lines(v)),
    outcomes: pick('outcomes', (v) => lines(v)),
    syllabus: pick('syllabus', syllabus),
    reg_opens: pick('reg_opens', date),
    reg_closes: pick('reg_closes', date),
    classes_start: pick('classes_start', date),
    classes_end: pick('classes_end', date),
    class_days: pick('class_days', (v) => str(v, 120) || null),
    class_time: pick('class_time', (v) => str(v, 120) || null),
    class_dates: pick('class_dates', classDates),
    published: pick('published', (v) => v === true || v === 'true' || v === 'on'),
    // The catalogue course this cohort was scheduled from, if any.
    source_code: pick('source_code', (v) => str(v, 20).toUpperCase() || null),
  };
  return rec;
}

/** What is wrong with a record, or null. Only the essentials are required. */
function validate(rec) {
  if (!rec.title || rec.title.length < 3) return 'Give the course a title.';
  if (!(rec.price_pkr > 0)) return 'Set the course fee in PKR (paid courses only - free courses live under Free Courses).';
  if (!rec.reg_closes) return 'Set the date registration closes - the course leaves the website after that day.';
  if (rec.reg_opens && rec.reg_opens > rec.reg_closes) return 'Registration must open before it closes.';
  if (rec.classes_start && rec.classes_end && rec.classes_start > rec.classes_end) return 'Classes must start before they end.';
  return null;
}

/**
 * Where a course stands today:
 *   draft    - not published; admins only
 *   upcoming - published, registration not open yet (shown, "opens on ...")
 *   open     - published and taking registrations
 *   closed   - registration has closed; no longer shown publicly
 */
function phase(rec, today = todayPk()) {
  if (!rec || !rec.published) return 'draft';
  if (rec.reg_closes && today > rec.reg_closes) return 'closed';
  if (rec.reg_opens && today < rec.reg_opens) return 'upcoming';
  return 'open';
}
const isListed = (rec, today) => ['upcoming', 'open'].includes(phase(rec, today));
const acceptsRegistration = (rec, today) => phase(rec, today) === 'open';

/** The shape the public pages and the /open catalogue use. */
function publicView(rec, today = todayPk()) {
  const p = phase(rec, today);
  return {
    code: rec.code, title: rec.title, tagline: rec.tagline, summary: rec.tagline || String(rec.description || '').slice(0, 220),
    description: rec.description, tier: 'Upcoming Course', level: rec.level, mode: rec.mode,
    duration: rec.duration || (rec.weeks ? `${rec.weeks} weeks` : null), weeks: rec.weeks, hours: rec.hours,
    price_pkr: rec.price_pkr, seats: rec.seats, instructor: rec.instructor,
    prerequisites: rec.prerequisites || [], outcomes: rec.outcomes || [], syllabus: rec.syllabus || [],
    reg_opens: rec.reg_opens, reg_closes: rec.reg_closes, classes_start: rec.classes_start, classes_end: rec.classes_end,
    class_days: rec.class_days, class_time: rec.class_time, class_dates: rec.class_dates || [],
    phase: p, registration_open: p === 'open', upcoming: true, available: p === 'open', coming_soon: p === 'upcoming',
    track_key: null, badges: p === 'open' ? ['new'] : [],
  };
}

/* ------------------- scheduling from the existing catalogue -------------------
 * Admins do not retype course details. Every paid course in the official
 * catalogue already has a published outline (its quest track: description,
 * learning outcomes, and one level or class per module). Scheduling a cohort
 * copies that outline into a new upcoming course and only asks for dates.
 */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Weekday indexes named in "Mon, Wed, Fri" / "Monday and Thursday" / an array. */
function weekdays(v) {
  const text = (Array.isArray(v) ? v.join(' ') : String(v || '')).toLowerCase();
  return WEEKDAYS.map((d, i) => (new RegExp('\\b' + d.toLowerCase()).test(text) ? i : -1)).filter((i) => i >= 0);
}
/** Every class day between start and end (inclusive), as class_dates rows. */
function scheduleDates(start, end, days) {
  const want = weekdays(days);
  if (!date(start) || !date(end) || !want.length || start > end) return [];
  const out = [];
  for (let t = Date.parse(start + 'T00:00:00Z'), stop = Date.parse(end + 'T00:00:00Z'); t <= stop && out.length < 120; t += 86400e3) {
    if (want.includes(new Date(t).getUTCDay())) out.push({ date: new Date(t).toISOString().slice(0, 10), title: null });
  }
  return out;
}
/** "January 2027" from a YYYY-MM-DD date. */
function monthLabel(d) {
  if (!date(d)) return null;
  return new Date(d + 'T00:00:00Z').toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
/**
 * The course details a catalogue entry already has. `def` is its quest track
 * definition (may be null). Nothing is invented: fields the catalogue does not
 * have (such as prerequisites) are left empty for the admin to add if wanted.
 */
function templateFrom(course, def) {
  const unit = course.tier === 'Bootcamp' ? 'Class' : 'Level';
  const levels = (def && def.levels) || [];
  return {
    source_code: course.code,
    title: course.title,
    tagline: course.summary || null,
    description: [def?.description, def?.outcome].filter(Boolean).join(' ') || course.summary || null,
    weeks: course.weeks || null, hours: course.hours || null, duration: course.weeks ? `${course.weeks} weeks` : null,
    price_pkr: Number(course.price_pkr) || 0,
    outcomes: ((def && def.clos) || []).map((c) => String(c).replace(/^CLO\s*\d+:\s*/i, '').trim()).filter(Boolean),
    syllabus: levels.map((l) => ({ title: `${unit} ${l.no}: ${l.title}`, topics: String(l.topic || '').split(/,\s*|;\s*/).map((x) => x.trim()).filter(Boolean) })),
    prerequisites: [],
  };
}

module.exports = { WEEKDAYS, weekdays, scheduleDates, monthLabel, templateFrom, todayPk, normalize, validate, phase, isListed, acceptsRegistration, publicView, syllabus, classDates, lines, MODES, LEVELS };
