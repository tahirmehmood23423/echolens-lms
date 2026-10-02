'use strict';

// Resolve one current challan per member, never all registrations in a series.
function shipLensFinanceEntries(entries, registrations, challans) {
  const email = value => String(value || '').trim().toLowerCase();
  return entries.map(entry => {
    const members = entry.team_details?.length ? entry.team_details : [entry];
    const used = new Set();
    const resolved = members.map((member, index) => {
      const candidates = registrations.filter(r =>
        Number(r.status?.shiplens_event_id) === Number(entry.event_id) &&
        Number(r.status?.shiplens_entry_id) === Number(entry.id) &&
        email(member.email) && email(r.email) === email(member.email));
      const explicitId = entry.registration_ids?.[index] || (index === 0 ? entry.registration_id : null);
      const registration = candidates.find(r => Number(r.id) === Number(explicitId)) ||
        (candidates.length === 1 ? candidates[0] : null);
      if (!registration || used.has(registration.id)) return null;
      used.add(registration.id);
      const owned = challans.filter(c => Number(c.registration_id) === Number(registration.id));
      const challan = registration.challan_serial
        ? owned.find(c => c.serial === registration.challan_serial)
        : owned.sort((a, b) => Number(b.id) - Number(a.id))[0];
      return { registration, challan };
    });
    const member_challans = resolved.map(value => value?.challan ? {
      serial: value.challan.serial, status: value.challan.status, net_fee: value.challan.net_fee,
    } : null);
    return { ...entry, registration_ids: resolved.map(value => value?.registration.id || null),
      member_challans, paid_candidates: member_challans.filter(c => c?.status === 'paid').length };
  });
}

module.exports = { shipLensFinanceEntries };
