'use strict';

/**
 * EchoLens LMS - analytics report PDF
 * A printable, letterhead-branded version of the admin Reports page: the
 * same summary totals shown as cards, plus a bar chart of whichever metric
 * is selected, over the chosen date range. See GET /api/admin/analytics.pdf
 * in server.js - the on-screen "Download report" button on the Reports page
 * offers this alongside the plain CSV export.
 */

const { LetterheadFlow, NAVY, MUTED } = require('./letterhead-flow');

const METRIC_LABEL = { signups: 'New sign-ups', enrollments: 'Course enrollments', event_registrations: 'Event registrations', event_submissions: 'Event submissions', quest_submissions: 'Quest submissions', leads: 'New leads' };
const SEGMENT_LABEL = { all: 'Everyone', portal: 'Portal students', open: 'Open (website) students' };

async function analyticsReportPdf({ totals, series, metric, segment, granularity, from, to }) {
  const flow = await LetterheadFlow.create();

  flow.page.drawText('ANALYTICS REPORT', { x: 60, y: flow.y, size: 18, font: flow.bold, color: NAVY, characterSpacing: 1 });
  flow.y -= 22;
  flow.page.drawText(from && to ? `Report period: ${from} to ${to}` : 'Report period: all time', { x: 60, y: flow.y, size: 11, font: flow.font, color: MUTED });
  flow.y -= 16;
  flow.page.drawText(`Generated ${new Date().toISOString().slice(0, 10)}`, { x: 60, y: flow.y, size: 9, font: flow.italic, color: MUTED });
  flow.y -= 18;
  await flow.rule({ gapAfter: 16 });

  await flow.heading('Summary', { size: 12, gapAfter: 8 });
  await flow.table(
    [{ label: 'Metric', width: 220 }, { label: 'Value', width: 100 }],
    [
      ['Total sign-ups', totals.total_signups],
      ['Portal students', totals.portal_students],
      ['Open (website) users', totals.open_users],
      ['Leads collected', totals.leads],
      ['Course enrollments', totals.enrollments],
      ['Event registrations', totals.event_registrations],
      ['Event submissions', totals.event_submissions],
      ['Certificates issued', totals.certificates_issued],
      ['Running courses', totals.running_courses],
    ],
    { gapAfter: 20 },
  );

  const chartTitle = `${METRIC_LABEL[metric] || metric} (${granularity}${metric === 'signups' ? ', ' + (SEGMENT_LABEL[segment] || 'Everyone') : ''})`;
  await flow.heading(chartTitle, { size: 12, gapAfter: 12 });
  await flow.barChart(series.labels, series.counts);

  return flow.save();
}

module.exports = { analyticsReportPdf };
