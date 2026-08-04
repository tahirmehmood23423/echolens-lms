'use strict';

/**
 * EchoLens LMS - analytics report PDF
 * A printable, letterhead-branded version of the admin Reports page: the
 * same summary totals shown as cards, a bar chart of whichever metric is
 * selected over the chosen date range, two small "at a glance" comparison
 * charts, and a director sign-off. See GET /api/admin/analytics.pdf in
 * server.js - the on-screen "Download report" button on the Reports page
 * offers this alongside the plain CSV export.
 */

const fs = require('fs');
const path = require('path');
const { LetterheadFlow, NAVY, MUTED, GOLD, LEFT, RIGHT } = require('./letterhead-flow');

const METRIC_LABEL = { signups: 'New sign-ups', enrollments: 'Course enrollments', event_registrations: 'Event registrations', event_submissions: 'Event submissions', quest_submissions: 'Quest submissions', leads: 'New leads' };
const SEGMENT_LABEL = { all: 'Everyone', portal: 'Portal students', open: 'Open (website) students' };

// Real assets, dropped in once available - see README note in the repo or
// ask the team lead. Until then the sign-off falls back to a typed name
// with no stamp, so the report still looks complete.
const SIGNATURE_PATH = path.join(__dirname, 'assets', 'signature.png');
const STAMP_PATH = path.join(__dirname, 'assets', 'stamp.png');
// Config field for the sign-off name: set DIRECTOR_NAME in the environment
// to override; otherwise falls back to the existing CEO name already used
// on certificates/offer letters (settings.cert.ceo_name).
const DIRECTOR_NAME_OVERRIDE = process.env.DIRECTOR_NAME || null;

// The default lookback always ends "today", but a custom date range (see
// the Reports page's date pickers) can have a `to` date in the future
// relative to when the report is actually generated (e.g. "August's
// report" requested on Aug 4th) - which would otherwise draw a chart with
// a long empty tail of not-yet-happened days. This trims the series to the
// last real bucket and reports how far the request actually reached.
function truncateFutureBuckets(series, granularity) {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = granularity === 'yearly' ? today.slice(0, 4) : granularity === 'monthly' ? today.slice(0, 7) : today;
  let cut = series.labels.length;
  for (let i = 0; i < series.labels.length; i++) {
    if (series.labels[i] > cutoff) { cut = i; break; }
  }
  return {
    labels: series.labels.slice(0, cut),
    counts: series.counts.slice(0, cut),
    truncated: cut < series.labels.length,
    lastLabel: cut > 0 ? series.labels[cut - 1] : null,
  };
}

async function analyticsReportPdf({ totals, series, metric, segment, granularity, from, to, settings = {} }) {
  const flow = await LetterheadFlow.create();

  flow.page.drawText('ANALYTICS REPORT', { x: 60, y: flow.y, size: 18, font: flow.bold, color: NAVY, characterSpacing: 1 });
  flow.y -= 22;
  flow.page.drawText(from && to ? `Report period: ${from} to ${to}` : 'Report period: all time', { x: 60, y: flow.y, size: 11, font: flow.font, color: MUTED });
  flow.y -= 16;
  flow.page.drawText(`Generated ${new Date().toISOString().slice(0, 10)}`, { x: 60, y: flow.y, size: 9, font: flow.italic, color: MUTED });
  flow.y -= 18;
  await flow.rule({ gapAfter: 18 });

  await flow.heading('Summary', { size: 12, gapAfter: 10 });
  await flow.metricGrid([
    { value: totals.total_signups, label: 'Total sign-ups' },
    { value: totals.portal_students, label: 'Portal students' },
    { value: totals.open_users, label: 'Open (website) users' },
    { value: totals.leads, label: 'Leads collected' },
    { value: totals.enrollments, label: 'Course enrollments' },
    { value: totals.event_registrations, label: 'Event registrations' },
    { value: totals.event_submissions, label: 'Event submissions' },
    { value: totals.certificates_issued, label: 'Certificates issued' },
    { value: totals.running_courses, label: 'Running courses' },
  ], { columns: 3, gapAfter: 22 });

  const trimmed = truncateFutureBuckets(series, granularity);
  const chartTitle = `${METRIC_LABEL[metric] || metric} (${granularity}${metric === 'signups' ? ', ' + (SEGMENT_LABEL[segment] || 'Everyone') : ''})`;
  await flow.heading(chartTitle, { size: 12, gapAfter: 12 });
  await flow.barChart(trimmed.labels, trimmed.counts);
  if (trimmed.truncated) {
    await flow.paragraph(`Showing data through ${trimmed.lastLabel || 'today'} - the requested period extends to ${to}, which hasn't happened yet.`, { size: 8, italic: true, color: MUTED, gapAfter: 6 });
  }

  // "At a glance": two quick comparisons the totals already give us for
  // free, so the page isn't a single lonely chart. Space is checked for the
  // heading AND the charts together first, so a page break (if needed)
  // happens before the heading - never leaving it stranded alone at the
  // bottom of a page with its charts starting fresh on the next one.
  await flow.ensureSpace(12 + 4 + 140);
  await flow.heading('At a glance', { size: 12, gapAfter: 4 });
  const halfW = (RIGHT - LEFT - 24) / 2;
  const leftX = LEFT;
  const rightX = leftX + halfW + 24;
  const topY = flow.y;
  const b1 = flow.miniBarChart(topY, leftX, halfW, 'Portal vs open (website) users', [
    { label: 'Portal', value: totals.portal_students },
    { label: 'Open (website)', value: totals.open_users },
  ]);
  const b2 = flow.miniBarChart(topY, rightX, halfW, 'Enrollments vs certificates issued', [
    { label: 'Enrollments', value: totals.enrollments },
    { label: 'Certificates', value: totals.certificates_issued },
  ]);
  flow.y = Math.min(b1, b2) - 18;

  await flow.rule({ gapAfter: 6, color: GOLD });
  const directorName = DIRECTOR_NAME_OVERRIDE || settings.ceo_name || 'Director';
  const sigImageBytes = fs.existsSync(SIGNATURE_PATH) ? fs.readFileSync(SIGNATURE_PATH) : null;
  const stampImageBytes = fs.existsSync(STAMP_PATH) ? fs.readFileSync(STAMP_PATH) : null;
  await flow.stampedSignOff({
    name: directorName, title: 'Director', dateLabel: new Date().toISOString().slice(0, 10),
    sigImageBytes, stampImageBytes,
  });

  return flow.save();
}

module.exports = { analyticsReportPdf };
