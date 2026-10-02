const PDFDocument = require('pdfkit');
function shiplensReportPdf({ event, entries, challans, generatedAt = new Date() }) {
  const doc = new PDFDocument({ size: 'A4', margin: 36 }), chunks = [];
  doc.on('data', c => chunks.push(c));
  const done = new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const byReg = new Map(challans.map(c => [c.registration_id, c]));
  const members = entries.flatMap(e => (e.team_details || [{ name: e.name, email: e.email }]).map((m, i) => { const c = byReg.get(e.registration_ids?.[i] || (i === 0 ? e.registration_id : null)); return { ...m, team: e.team_name || `Team ${e.id}`, challan: c?.serial || '-', payment: c?.status || 'not issued', fee: c?.net_fee ?? '-' }; }));
  const paid = members.filter(m => m.payment === 'paid').length;
  doc.fontSize(18).fillColor('#123').text('ShipLens candidates and finance report').fontSize(11).text(event?.title || 'All ShipLens teams').text(`Generated ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`).moveDown().text(`Candidates: ${members.length}   Paid: ${paid}   Remaining: ${members.length - paid}   Teams: ${entries.length}`).moveDown();
  members.forEach((m, i) => { if (doc.y > 720) doc.addPage(); doc.fontSize(10).fillColor('#123').text(`${i + 1}. ${m.name || '-'} | ${m.email || '-'} | WhatsApp: ${m.whatsapp || '-'}`).fontSize(9).fillColor('#456').text(`Team: ${m.team} | University: ${m.university || '-'} | Year: ${m.year || '-'} | Challan: ${m.challan} | Fee: ${m.fee} PKR | Payment: ${String(m.payment).toUpperCase()}`).moveDown(.45).strokeColor('#ccd').moveTo(36, doc.y).lineTo(559, doc.y).stroke(); });
  doc.end(); return done;
}
module.exports = { shiplensReportPdf };
