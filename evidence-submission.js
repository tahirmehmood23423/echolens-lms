'use strict';

function parseEvidenceLinks(raw) {
  if (raw == null || raw === '') return { links: [] };
  let values;
  try { values = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return { error: 'Evidence links must be a valid JSON list.' }; }
  if (!Array.isArray(values)) return { error: 'Evidence links must be a list.' };
  const links = [];
  for (const value of values) {
    const candidate = typeof value === 'string' ? value : value && value.url;
    try {
      const url = new URL(String(candidate || '').trim());
      if (url.protocol !== 'https:') return { error: 'Every evidence link must use HTTPS.' };
      links.push(url.toString());
    } catch { return { error: 'Check every evidence link and enter a complete HTTPS URL.' }; }
  }
  return { links: [...new Set(links)] };
}

function validateEvidenceInput({ rawLinks, notes, files = [], rule = {}, hasCode = false }) {
  const parsed = parseEvidenceLinks(rawLinks);
  if (parsed.error) return parsed;
  const links = parsed.links;
  const minLinks = Number(rule.links?.min || 0), maxLinks = Math.min(8, Number(rule.links?.max || 8));
  if (links.length < minLinks) return { error: `Add at least ${minLinks} required HTTPS evidence link${minLinks === 1 ? '' : 's'}.` };
  if (links.length > maxLinks) return { error: `Add no more than ${maxLinks} evidence links.` };
  const maxNotes = Number(rule.notes?.max_length || 4000);
  const normalizedNotes = String(notes || '').trim().slice(0, maxNotes);
  if (rule.notes?.required && !normalizedNotes) return { error: 'Add the required evidence notes.' };
  const minFiles = Number(rule.files?.min || 0), maxFiles = Math.min(8, Number(rule.files?.max || 8));
  if (files.length < minFiles) return { error: `Attach at least ${minFiles} required evidence file${minFiles === 1 ? '' : 's'}.` };
  if (files.length > maxFiles) return { error: `This assessment takes at most ${maxFiles} evidence file${maxFiles === 1 ? '' : 's'}.` };
  if (rule.require_any && !links.length && !files.length && !normalizedNotes && !hasCode) return { error: 'Add at least one link, note, or evidence file.' };
  return { links, notes: normalizedNotes };
}

module.exports = { parseEvidenceLinks, validateEvidenceInput };

