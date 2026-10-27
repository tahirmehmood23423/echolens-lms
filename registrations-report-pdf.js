const PDFDocument = require('pdfkit');

// Admissions Office: a downloadable list of registrations/challans filtered
// by registration date and course (any catalogue course, or a ShipLens
// series via its `SL-<event id>` course_code) - same table-drawing approach
// as shiplens-report-pdf.js.
const STAGE_LABEL = {
  new: 'New', challan_issued: 'Challan generated', challan_sent: 'Challan sent',
  paid_cleared: 'Ready to enroll', enrolled: 'Enrolled',
};

function registrationsReportPdf({ registrations, from, to, courseLabel, generatedAt = new Date() }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const rows = registrations.map((r) => {
    const latest = (r.challans || [])[0];
    return {
      name: r.name || '-', email: r.email || '-', whatsapp: r.whatsapp || '-',
      course: r.course_title || r.course_code || '-',
      registered: String(r.created_at || '').slice(0, 10) || '-',
      serial: latest ? latest.serial : 'Not issued',
      status: STAGE_LABEL[r.payment_stage] || r.payment_stage || '-',
    };
  });
  const columns = [
    ['Name', 128, 'name'], ['Email', 170, 'email'], ['Contact number', 100, 'whatsapp'],
    ['Course', 190, 'course'], ['Registered', 72, 'registered'], ['Challan', 92, 'serial'], ['Stage', 92, 'status'],
  ];
  const rowHeight = 26, x0 = 28;
  function drawHeader() {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
    const y = doc.y;
    let x = x0;
    columns.forEach(([label, width]) => {
      doc.rect(x, y, width, 22).fill('#123b52');
      doc.fillColor('#fff').text(label, x + 4, y + 6, { width: width - 8, height: 14, ellipsis: true });
      x += width;
    });
    doc.y = y + 22;
  }
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#123b52').text('Admissions - registrations & challans list');
  doc.font('Helvetica').fontSize(10).fillColor('#345').text(courseLabel || 'All courses');
  doc.fontSize(9).fillColor('#345').text(`Form filled between ${from || 'the earliest record'} and ${to || 'today'}`);
  doc.fontSize(8).fillColor('#567').text(`Generated ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(9).fillColor('#123b52').text(`Total: ${rows.length}`);
  doc.moveDown(0.55);
  drawHeader();
  rows.forEach((row, index) => {
    if (doc.y + rowHeight > doc.page.height - 28) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 28 }); drawHeader(); }
    const y = doc.y, fill = index % 2 ? '#f0f5f7' : '#ffffff';
    let x = x0;
    columns.forEach(([, width, key]) => {
      doc.rect(x, y, width, rowHeight).fill(fill).stroke('#cfdae0');
      doc.font('Helvetica').fontSize(7.6).fillColor('#263943')
        .text(String(row[key]), x + 4, y + 6, { width: width - 8, height: rowHeight - 9, ellipsis: true, lineBreak: false });
      x += width;
    });
    doc.y = y + rowHeight;
  });
  if (!rows.length) doc.font('Helvetica').fontSize(10).fillColor('#567').text('No registrations match this filter.');
  doc.end();
  return done;
}

module.exports = { registrationsReportPdf };
