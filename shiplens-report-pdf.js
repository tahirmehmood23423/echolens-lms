const PDFDocument = require('pdfkit');

function shiplensReportPdf({ event, entries, challans, generatedAt = new Date() }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const byReg = new Map(challans.map((c) => [c.registration_id, c]));
  const rows = entries.flatMap((entry) => {
    const team = entry.team_details || [{ name: entry.name, email: entry.email, whatsapp: entry.whatsapp }];
    const teamLabel = team.map((m) => m.name).filter(Boolean).join(' + ') || `Team ${entry.id}`;
    return team.map((member, index) => {
      const registrationId = entry.registration_ids?.[index] || (index === 0 ? entry.registration_id : null);
      const challan = entry.member_challans ? entry.member_challans[index] : byReg.get(registrationId);
      return {
        team: teamLabel, member: member.name || '-', email: member.email || '-', whatsapp: member.whatsapp || '-',
        university: member.university || '-', year: member.year || '-', project: entry.challenge_title || '-',
        serial: challan?.serial || '-', amount: challan ? Number(challan.net_fee).toLocaleString('en-US') : '-',
        payment: challan?.status === 'paid' ? 'PAID' : challan ? 'UNPAID' : 'NOT ISSUED',
      };
    });
  });
  const paid = rows.filter((r) => r.payment === 'PAID').length;
  const columns = [
    ['Team (both partners)', 104, 'team'], ['Candidate', 78, 'member'], ['Email', 112, 'email'],
    ['WhatsApp', 68, 'whatsapp'], ['University', 80, 'university'], ['Year', 34, 'year'],
    ['Project', 76, 'project'], ['Challan', 100, 'serial'], ['PKR', 44, 'amount'], ['Payment', 60, 'payment'],
  ];
  const rowHeight = 34, x0 = 28;
  function drawHeader() {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
    // Keep one fixed baseline for every cell. Using doc.y while drawing each
    // cell makes PDFKit advance the cursor after every label, creating the
    // diagonal/stair-step header seen in the exported report.
    const y = doc.y;
    let x = x0;
    columns.forEach(([label, width]) => {
      doc.rect(x, y, width, 25).fill('#123b52');
      doc.fillColor('#fff').text(label, x + 4, y + 7, { width: width - 8, height: 16, ellipsis: true });
      x += width;
    });
    doc.y = y + 25;
  }
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#123b52').text('ShipLens candidates & finance report');
  doc.font('Helvetica').fontSize(10).fillColor('#345').text(event?.title || 'All ShipLens teams');
  doc.fontSize(8).fillColor('#567').text(`Generated ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(9).fillColor('#123b52')
    .text(`Teams: ${entries.length}   Candidates: ${rows.length}   Paid: ${paid}   Remaining: ${rows.length - paid}`);
  doc.moveDown(0.55);
  drawHeader();
  rows.forEach((row, index) => {
    if (doc.y + rowHeight > doc.page.height - 28) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 28 }); drawHeader(); }
    const y = doc.y, fill = index % 2 ? '#f0f5f7' : '#ffffff';
    let x = x0;
    columns.forEach(([, width, key]) => {
      doc.rect(x, y, width, rowHeight).fill(fill).stroke('#cfdae0');
      doc.font(key === 'payment' ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.2)
        .fillColor(key === 'payment' && row.payment === 'PAID' ? '#167044' : '#263943')
        .text(String(row[key]), x + 4, y + 5, { width: width - 8, height: rowHeight - 9, ellipsis: true, lineBreak: true });
      x += width;
    });
    doc.y = y + rowHeight;
  });
  doc.end();
  return done;
}

module.exports = { shiplensReportPdf };
