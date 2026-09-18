'use strict';

const schemaMap = require('./schema-map');
const operationErrors = new WeakMap();

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

/** Called once when a queued flush starts; never retain references to live records. */
function captureSnapshot(data) {
  return freeze(JSON.parse(JSON.stringify(data)));
}

function pendingCounts(snapshot, baseline = {}) {
  const counts = {};
  for (const key of [...schemaMap.COLLECTIONS.map(([key]) => key), 'feedback']) {
    const previous = baseline[key] || new Map();
    const seen = new Set();
    let count = 0;
    for (const record of snapshot[key] || []) {
      seen.add(record.id);
      if (previous.get(record.id) !== JSON.stringify(record)) count++;
    }
    for (const id of previous.keys()) if (!seen.has(id)) count++;
    counts[key] = count;
  }
  counts.seq = Object.entries(snapshot.seq || {}).filter(([key, value]) => baseline.seq?.[key] !== value).length;
  counts.settings = Object.entries(snapshot.settings || {}).filter(([key, value]) => baseline.settings?.[key] !== JSON.stringify(value)).length;
  for (const key of ['issued_usernames', 'issued_regnos']) {
    const previous = new Set(baseline[key] || []);
    counts[key] = (snapshot[key] || []).filter(value => !previous.has(value)).length;
  }
  return counts;
}

/** All scans, serialization, conversions, arguments and accounting precede BEGIN. */
function prepareFlush(snapshot, baseline = {}) {
  const operations = [];
  const nextSnapshot = {};
  const rowsWritten = {};
  const counters = { creates: 0, createBatches: 0, updates: 0, deletes: 0, deleteBatches: 0, seqUpserts: 0, settingUpserts: 0 };
  function add(collection, model, op, args, rows) {
    const operation = { collection, op, rows, model, args };
    // Error tagging only: no success-path accounting or preparation inside BEGIN.
    operation.execute = async tx => {
      try { await tx[model][op](args); }
      catch (error) { operationErrors.set(error, operation); throw error; }
    };
    operations.push(operation);
    rowsWritten[collection] = (rowsWritten[collection] || 0) + rows.length;
  }
  for (const [key, table, model, columns] of schemaMap.COLLECTIONS) {
    const previous = baseline[key] || new Map();
    const next = new Map(), creates = [], createdRecords = [];
    for (const record of snapshot[key] || []) {
      const json = JSON.stringify(record);
      next.set(record.id, json);
      if (previous.get(record.id) === json) continue;
      const row = schemaMap.buildPrismaRow(table, columns, record, `${key}#${record.id}`);
      if (previous.has(record.id)) {
        add(key, model, 'update', { where: { id: record.id }, data: row }, [record]);
        counters.updates++;
      } else { creates.push(row); createdRecords.push(record); }
    }
    if (creates.length) {
      add(key, model, 'createMany', { data: creates }, createdRecords);
      counters.creates += creates.length; counters.createBatches++;
    }
    nextSnapshot[key] = next;
  }
  // Preserve existing parent-before-child writes and child-before-parent deletes.
  for (const [key, , model] of [...schemaMap.COLLECTIONS].reverse()) {
    const ids = [...(baseline[key] || new Map()).keys()].filter(id => !nextSnapshot[key].has(id));
    if (ids.length) {
      add(key, model, 'deleteMany', { where: { id: { in: ids } } }, ids.map(id => ({ id })));
      counters.deletes += ids.length; counters.deleteBatches++;
    }
  }
  const previousFeedback = baseline.feedback || new Map();
  const nextFeedback = new Map(), feedbackCreates = [], feedbackRecords = [];
  for (const record of snapshot.feedback || []) {
    const json = JSON.stringify(record); nextFeedback.set(record.id, json);
    if (previousFeedback.get(record.id) === json) continue;
    const row = { id: BigInt(record.id), data: record };
    if (previousFeedback.has(record.id)) {
      add('feedback', 'feedbackRecord', 'update', { where: { id: row.id }, data: { data: record } }, [record]);
      counters.updates++;
    } else { feedbackCreates.push(row); feedbackRecords.push(record); }
  }
  if (feedbackCreates.length) {
    add('feedback', 'feedbackRecord', 'createMany', { data: feedbackCreates }, feedbackRecords);
    counters.creates += feedbackCreates.length; counters.createBatches++;
  }
  const feedbackDeletes = [...previousFeedback.keys()].filter(id => !nextFeedback.has(id));
  if (feedbackDeletes.length) {
    add('feedback', 'feedbackRecord', 'deleteMany', { where: { id: { in: feedbackDeletes.map(BigInt) } } }, feedbackDeletes.map(id => ({ id })));
    counters.deletes += feedbackDeletes.length; counters.deleteBatches++;
  }
  nextSnapshot.feedback = nextFeedback;
  nextSnapshot.seq = { ...snapshot.seq };
  for (const [name, value] of Object.entries(snapshot.seq || {})) {
    if (baseline.seq?.[name] === value) continue;
    add('seq', 'seq', 'upsert', { where: { name }, create: { name, value }, update: { value } }, [{ name, value }]);
    counters.seqUpserts++;
  }
  for (const [key, model] of [['issued_usernames', 'issuedUsername'], ['issued_regnos', 'issuedRegno']]) {
    const previous = new Set(baseline[key] || []);
    const records = (snapshot[key] || []).filter(value => !previous.has(value)).map(value => ({ value }));
    if (records.length) add(key, model, 'createMany', { data: records, skipDuplicates: true }, records);
    nextSnapshot[key] = (snapshot[key] || []).slice();
  }
  nextSnapshot.settings = {};
  for (const [key, value] of Object.entries(snapshot.settings || {})) {
    const json = JSON.stringify(value); nextSnapshot.settings[key] = json;
    if (baseline.settings?.[key] === json) continue;
    const converted = value === null ? schemaMap.Prisma.JsonNull : value;
    add('settings', 'setting', 'upsert', { where: { key }, create: { key, value: converted }, update: { value: converted } }, [{ key, value }]);
    counters.settingUpserts++;
  }
  return { operations, nextSnapshot, rowsWritten, counters };
}

function failedOperation(error) { return operationErrors.get(error) || null; }

module.exports = { captureSnapshot, prepareFlush, pendingCounts, failedOperation };
