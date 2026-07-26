'use strict';

/**
 * EchoLens LMS — schema-drift audit (READ-ONLY, writes nothing)
 *
 * The JSON file store was schemaless: records in the same collection were
 * created at different times by different versions of store.js, so older
 * rows can legitimately be missing fields (or hold an explicit `null`)
 * that newer rows always have. schema.prisma was inferred from a single
 * backup snapshot and marks some of those fields required — which is why
 * import-prisma.js can hit "Argument X is missing" / a NOT NULL violation
 * on real rows that are perfectly valid, just old.
 *
 * This script does NOT fix anything and does NOT write anything (no file,
 * no database write — it doesn't even open a Postgres connection). It
 * only reads the JSON file and schema.prisma, computes per-field presence
 * AND type statistics for every collection, and prints:
 *   1. A human-readable report per collection: which fields are present
 *      in every record (safe to keep required) vs. only some (must be
 *      optional in the schema) vs. present in the data but not modeled
 *      in schema.prisma at all (must be added as a new field); PLUS which
 *      fields hold a JS value type that doesn't match their declared
 *      Prisma type (e.g. a String? column that actually holds numbers on
 *      some rows) — presence/nullability and type are independent axes,
 *      a field can be "always present" and still be wrongly typed.
 *   2. The same information as a single machine-readable JSON blob at the
 *      end, wrapped in ===JSON REPORT START/END=== markers, so it can be
 *      pasted back and parsed programmatically rather than re-derived by
 *      hand from prose.
 *
 * Type mismatches come in two flavors, reported separately:
 *   - Single mismatch: every real value is consistently ONE type, and it
 *     doesn't match the schema (e.g. always a number, declared String?) -
 *     safe to correct the schema's declared type.
 *   - Mixed: real values are genuinely a MIX of types across rows (e.g.
 *     some numeric, some string) - this is NOT auto-corrected to anything.
 *     It's flagged as needing a human decision (could mean two logically
 *     different things got stored under one field name over the app's
 *     history), same as schema.prisma's own certificates.source_id
 *     comment already describes.
 *
 * MUST RUN ON RENDER, VIA SHELL: the real data only exists on the web
 * service's persistent Disk (/data/echolens.json), and — like
 * import-prisma.js — this needs actual disk access, which one-off Jobs
 * don't have (see import-prisma.js's header for the confirmed Render
 * docs citation). Use the Render Shell instead.
 *
 * USAGE:
 *   node migrations/audit-schema-drift.js --db-path=/data/echolens.json
 *
 * --db-path defaults to the DB_PATH env var, then ./echolens.json next to
 * this repo (same convention as store.js / import-prisma.js).
 */

const fs = require('fs');
const path = require('path');

const dbPathArg = process.argv.find((a) => a.startsWith('--db-path='));
const DB_PATH = dbPathArg ? dbPathArg.slice('--db-path='.length) : (process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json'));
const SCHEMA_PATH = path.join(__dirname, '..', 'schema.prisma');

if (!fs.existsSync(DB_PATH)) {
  console.error(`[audit] No JSON store found at ${DB_PATH} (pass --db-path=... or set DB_PATH).`);
  process.exit(1);
}
if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`[audit] schema.prisma not found at ${SCHEMA_PATH}.`);
  process.exit(1);
}

// Registries have a fixed key/value shape (Seq: name+value, Setting: key+value,
// IssuedUsername/IssuedRegno: value only) - they aren't "records with varying
// fields" in the sense this audit cares about, so they're excluded rather than
// forced through per-record field-presence logic that doesn't apply to them.
const REGISTRY_KEYS = new Set(['seq', 'settings', 'issued_usernames', 'issued_regnos']);

const SCALAR_TYPES = new Set(['Int', 'String', 'Boolean', 'DateTime', 'Json', 'Float']);

/* ---------------------------------------------------------------------- */
/* Parse schema.prisma into { table: { columns: { col: {field, type,      */
/* optional} }, modelName } } — line-based, matching this file's          */
/* consistent one-field-per-line, lone-brace-to-close style.              */
/* ---------------------------------------------------------------------- */
function parseSchema(text) {
  const models = {}; // modelName -> { fields: [...], table: null }
  let current = null;
  let currentModelName = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const modelOpen = line.match(/^model\s+(\w+)\s*\{/);
    if (modelOpen) {
      currentModelName = modelOpen[1];
      current = { fields: [], table: null };
      continue;
    }
    if (!current) continue;
    if (line === '}') {
      models[currentModelName] = current;
      current = null;
      currentModelName = null;
      continue;
    }
    if (line.startsWith('//')) continue;

    const mapMatch = line.match(/^@@map\("([^"]+)"\)/);
    if (mapMatch) {
      current.table = mapMatch[1];
      continue;
    }
    if (line.startsWith('@@')) continue; // @@index, @@unique, etc - not a column

    const fieldMatch = line.match(/^(\w+)\s+(\w+)(\??)(\[\])?/);
    if (!fieldMatch) continue;
    const [, fieldName, bareType, optionalMark] = fieldMatch;
    if (line.match(/^\w+\s+\w+\??\[\]/)) continue; // list type ("Foo[]") - always a relation, not a real column
    if (!SCALAR_TYPES.has(bareType)) continue; // not Int/String/Boolean/DateTime/Json/Float -> a to-one relation field, not a real column

    const mapAttr = line.match(/@map\("([^"]+)"\)/);
    const column = mapAttr ? mapAttr[1] : fieldName;
    current.fields.push({ field: fieldName, column, type: bareType, optional: optionalMark === '?' });
  }

  // Re-key by table name (what the JSON file's top-level keys correspond to).
  const byTable = {};
  for (const [modelName, def] of Object.entries(models)) {
    if (!def.table) continue; // shouldn't happen - every model here has @@map
    const columns = {};
    for (const f of def.fields) columns[f.column] = { field: f.field, type: f.type, optional: f.optional };
    byTable[def.table] = { modelName, columns };
  }
  return byTable;
}

/** Classifies one non-null JS value into the category used for type-mismatch checking. */
function jsCategory(v) {
  if (Array.isArray(v) || typeof v === 'object') return 'json';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'string') return 'string';
  return typeof v;
}

// Which observed categories are considered a MATCH for a given declared
// Prisma type. Int accepts a float observation too (still numeric - a
// under-inference risk, not a real mismatch); Float accepts int (a whole
// number is still a valid float). Json accepts everything - any JS value
// is legal in a Json column, so it's never flagged as a type mismatch here
// (the presence/optionality check already covers it separately).
const TYPE_MATCH = {
  String: new Set(['string']),
  Int: new Set(['int', 'float']),
  Float: new Set(['int', 'float']),
  Boolean: new Set(['boolean']),
  DateTime: new Set(['string']), // dates arrive as strings in the JSON store; actual parseability is checked separately at import time
  Json: new Set(['json', 'string', 'int', 'float', 'boolean']),
};

function inferType(values) {
  const types = new Set();
  let allIntegers = true;
  for (const v of values) {
    if (v === null) continue;
    if (Array.isArray(v) || (typeof v === 'object')) types.add('Json');
    else if (typeof v === 'number') { types.add('number'); if (!Number.isInteger(v)) allIntegers = false; }
    else if (typeof v === 'boolean') types.add('boolean');
    else if (typeof v === 'string') types.add('string');
    else types.add(typeof v);
  }
  if (types.size === 0) return { prisma: 'String', note: 'all-null, guessed' };
  if (types.size > 1) return { prisma: 'Json', note: `mixed types observed (${[...types].join(', ')}) - review manually` };
  const only = [...types][0];
  if (only === 'Json') return { prisma: 'Json', note: null };
  if (only === 'number') return { prisma: allIntegers ? 'Int' : 'Float', note: null };
  if (only === 'boolean') return { prisma: 'Boolean', note: null };
  return { prisma: 'String', note: null };
}

function pct(n, total) { return total === 0 ? 0 : Math.round((n / total) * 1000) / 10; }

function main() {
  console.log(`[audit] Reading JSON store from ${DB_PATH}`);
  const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log(`[audit] Parsing schema from ${SCHEMA_PATH}`);
  const schemaByTable = parseSchema(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const knownTables = new Set(Object.keys(schemaByTable));

  const arrayKeys = Object.keys(json).filter((k) => Array.isArray(json[k]));
  const unknownCollections = arrayKeys.filter((k) => !REGISTRY_KEYS.has(k) && !knownTables.has(k));

  const jsonReport = { collections: {}, unknownCollections, generatedFrom: DB_PATH };

  console.log('\n' + '='.repeat(78));
  console.log('SCHEMA DRIFT AUDIT');
  console.log('='.repeat(78));

  if (unknownCollections.length) {
    console.log(`\n!! UNKNOWN COLLECTIONS (present in JSON, not modeled in schema.prisma at all):`);
    for (const k of unknownCollections) console.log(`   ${k}  (${json[k].length} records) - needs a whole new model, not just a field`);
  }

  for (const key of arrayKeys) {
    if (REGISTRY_KEYS.has(key) || unknownCollections.includes(key)) continue;
    const records = json[key];
    const total = records.length;
    const schemaDef = schemaByTable[key];
    const schemaColumns = schemaDef ? schemaDef.columns : {};

    const stats = {}; // column -> { present, nonNull, sample: [] (capped, for type inference), typeCounts: {category: n}, typeSamples: {category: [examples]} }
    for (const rec of records) {
      for (const col of Object.keys(rec)) {
        if (!stats[col]) stats[col] = { present: 0, nonNull: 0, sample: [], typeCounts: {}, typeSamples: {} };
        const st = stats[col];
        st.present += 1;
        if (rec[col] !== null) {
          st.nonNull += 1;
          if (st.sample.length < 20) st.sample.push(rec[col]);
          // Full sweep, not sampled - a mismatch on even 1 row out of thousands still breaks that row's import.
          const cat = jsCategory(rec[col]);
          st.typeCounts[cat] = (st.typeCounts[cat] || 0) + 1;
          if (!st.typeSamples[cat]) st.typeSamples[cat] = [];
          if (st.typeSamples[cat].length < 3) st.typeSamples[cat].push(rec[col]);
        }
      }
    }

    const allColumns = new Set([...Object.keys(stats), ...Object.keys(schemaColumns)]);
    const alwaysOk = [];
    const mustBecomeOptional = [];
    const alreadyOptionalOk = [];
    const missingFromSchema = [];
    const neverPresentInData = [];
    const typeMismatches = []; // consistently one wrong type - safe to correct
    const mixedTypeFields = []; // genuinely more than one type across rows - needs a human decision

    const colReport = {};
    for (const col of allColumns) {
      const st = stats[col];
      const inSchema = col in schemaColumns;
      const nonNull = st ? st.nonNull : 0;
      const present = st ? st.present : 0;
      const fullyPresent = total > 0 && nonNull === total;

      const entry = { present, nonNull, total, percent: pct(nonNull, total), inSchema };

      // Type check runs independently of the presence/optionality branch below -
      // a field can be fully present AND wrongly typed at the same time.
      if (st && inSchema) {
        const declaredType = schemaColumns[col].type;
        const acceptable = TYPE_MATCH[declaredType] || new Set();
        const observedCats = Object.keys(st.typeCounts);
        const badCats = observedCats.filter((c) => !acceptable.has(c));
        if (badCats.length) {
          const distribution = observedCats.map((c) => ({ category: c, count: st.typeCounts[c], samples: st.typeSamples[c] }));
          const mixed = observedCats.length > 1;
          entry.typeCheck = { declaredType, distribution, mixed };
          const rec = { col, field: schemaColumns[col].field, declaredType, distribution };
          if (mixed) mixedTypeFields.push(rec);
          else typeMismatches.push({ ...rec, observedCategory: badCats[0] });
        }
      }

      if (!st) {
        // In schema, never appears in any real record.
        entry.action = 'none_unused_in_data';
        neverPresentInData.push(col);
      } else if (!inSchema) {
        const inferred = inferType(st.sample);
        entry.action = 'add_field';
        entry.inferredPrismaType = fullyPresent ? inferred.prisma : `${inferred.prisma}?`;
        entry.inferredNote = inferred.note;
        missingFromSchema.push({ col, ...entry });
      } else if (fullyPresent) {
        entry.currentlyOptional = schemaColumns[col].optional;
        entry.action = 'none';
        alwaysOk.push({ col, field: schemaColumns[col].field, type: schemaColumns[col].type });
      } else if (schemaColumns[col].optional) {
        entry.action = 'none_already_optional';
        alreadyOptionalOk.push({ col, field: schemaColumns[col].field, percent: entry.percent });
      } else {
        entry.action = 'make_optional';
        entry.field = schemaColumns[col].field;
        entry.type = schemaColumns[col].type;
        mustBecomeOptional.push({ col, field: schemaColumns[col].field, type: schemaColumns[col].type, percent: entry.percent, present, total });
      }
      colReport[col] = entry;
    }

    jsonReport.collections[key] = { total, modelName: schemaDef ? schemaDef.modelName : null, columns: colReport };

    // Only print collections that actually need attention, or have no schema match, to keep the report scannable.
    const needsAttention = mustBecomeOptional.length || missingFromSchema.length || typeMismatches.length || mixedTypeFields.length || !schemaDef;
    if (!needsAttention) continue;

    console.log(`\n--- ${key} (${total} records)${schemaDef ? ` -> model ${schemaDef.modelName}` : ' -- NO MATCHING MODEL'} ---`);
    if (typeMismatches.length) {
      console.log(`  TYPE MISMATCH (every value is consistently one type, but it doesn't match the schema - safe to correct):`);
      for (const f of typeMismatches) {
        const d = f.distribution[0];
        console.log(`    ${f.field} (${f.col})  declared ${f.declaredType}  ->  actual values are all ${f.observedCategory} (${d.count})   e.g. ${JSON.stringify(d.samples)}`);
      }
    }
    if (mixedTypeFields.length) {
      console.log(`  !! MIXED TYPES (needs a human decision, NOT auto-converted):`);
      for (const f of mixedTypeFields) {
        console.log(`    ${f.field} (${f.col})  declared ${f.declaredType}:`);
        for (const d of f.distribution) console.log(`        ${d.category}: ${d.count} row(s), e.g. ${JSON.stringify(d.samples)}`);
      }
    }
    if (mustBecomeOptional.length) {
      console.log(`  MUST become optional (required in schema, but missing/null on some real rows):`);
      for (const f of mustBecomeOptional) {
        console.log(`    ${f.field} (${f.col})  ${f.type} -> ${f.type}?   present in ${f.present}/${f.total} (${f.percent}%)`);
      }
    }
    if (missingFromSchema.length) {
      console.log(`  MISSING from schema entirely (add as a new field):`);
      for (const f of missingFromSchema) {
        const noteStr = f.inferredNote ? `  [${f.inferredNote}]` : '';
        console.log(`    ${f.col}  ->  ${f.inferredPrismaType}   present in ${f.nonNull}/${total} (${f.percent}%)${noteStr}`);
      }
    }
    if (alreadyOptionalOk.length) {
      console.log(`  Already optional, no change needed (${alreadyOptionalOk.length}): ${alreadyOptionalOk.map((f) => f.field).join(', ')}`);
    }
    if (neverPresentInData.length) {
      console.log(`  In schema but never present in any real record (informational only): ${neverPresentInData.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(78));
  console.log('SUMMARY');
  console.log('='.repeat(78));
  let totalMakeOptional = 0;
  let totalAddField = 0;
  let totalTypeMismatch = 0;
  let totalMixedType = 0;
  for (const [key, c] of Object.entries(jsonReport.collections)) {
    for (const col of Object.values(c.columns)) {
      if (col.action === 'make_optional') totalMakeOptional += 1;
      if (col.action === 'add_field') totalAddField += 1;
      if (col.typeCheck) { if (col.typeCheck.mixed) totalMixedType += 1; else totalTypeMismatch += 1; }
    }
  }
  console.log(`Fields that must become optional: ${totalMakeOptional}`);
  console.log(`Fields missing from schema entirely: ${totalAddField}`);
  console.log(`Fields with a single wrong type (safe to correct): ${totalTypeMismatch}`);
  console.log(`Fields with genuinely mixed types (needs a decision): ${totalMixedType}`);
  console.log(`Unknown collections (no model at all): ${unknownCollections.length}`);
  if (!totalMakeOptional && !totalAddField && !totalTypeMismatch && !totalMixedType && !unknownCollections.length) {
    console.log('No drift found - schema.prisma already matches the real data.');
  }

  console.log('\n===JSON REPORT START===');
  console.log(JSON.stringify(jsonReport));
  console.log('===JSON REPORT END===');
}

main();
