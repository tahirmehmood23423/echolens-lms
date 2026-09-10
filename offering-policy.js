'use strict';
function resolveOffering(code, catalogue, courses = []) {
  const key = String(code || '').trim().toUpperCase();
  if (key === 'PATH') return { error: 'Bundle enrollment is not available yet. Please choose an individual course; no bundle fee will be issued.' };
  const offer = catalogue.find(c => c.code === key);
  const stored = courses.find(c => c.code === key);
  if (!offer || offer.active === false || stored?.active === false || ['inactive','archived'].includes(stored?.status)) return { error: 'Choose an available course from the catalogue.' };
  if (!Number.isFinite(Number(offer.price_pkr)) || Number(offer.price_pkr) <= 0) return { error: 'This self-paced course is free. Start learning from Free courses; paid registration is not required.' };
  return { offer: { ...offer, code: key, price_pkr: Number(offer.price_pkr) } };
}
module.exports = { resolveOffering };
