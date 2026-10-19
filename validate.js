#!/usr/bin/env node
// validate.js — validate boundary files and session handoffs
// Usage: node validate.js

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ strict: false });
addFormats(ajv);

// ── 1. Boundary validation (hounfour schema, required-fields only) ────────────

const boundarySchemaPath = path.join(
  __dirname,
  'node_modules/@0xhoneyjar/loa-hounfour/schemas/permission-boundary.schema.json'
);
const boundariesDir = path.join(__dirname, 'boundaries');

const boundarySchema = JSON.parse(fs.readFileSync(boundarySchemaPath, 'utf8'));
const required = boundarySchema.required || [];

const boundaryFiles = fs.readdirSync(boundariesDir).filter(f => f.endsWith('.boundary.json'));

let allOk = true;

console.log('── Boundaries ──────────────────────────────');
for (const file of boundaryFiles) {
  const filePath = path.join(boundariesDir, file);
  const boundary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missing = required.filter(field => !(field in boundary));
  if (missing.length > 0) {
    console.error(`✗  ${file}: missing required fields: ${missing.join(', ')}`);
    allOk = false;
  } else {
    console.log(`✓  ${file}`);
  }
}
console.log(`\n${boundaryFiles.length} boundary file(s) valid.\n`);

// ── 2. Handoff validation (Ajv, JSON Schema 2020-12) ─────────────────────────

const handoffSchemaPath = path.join(__dirname, 'schemas', 'cc-loa-handoff.schema.json');
const handoffsDir = path.join(__dirname, 'handoffs');

const handoffSchema = JSON.parse(fs.readFileSync(handoffSchemaPath, 'utf8'));
const validateHandoff = ajv.compile(handoffSchema);

const handoffFiles = fs.readdirSync(handoffsDir).filter(f => f.endsWith('.handoff.json'));

console.log('── Handoffs ────────────────────────────────');
if (handoffFiles.length === 0) {
  console.log('(no handoff files found)');
} else {
  for (const file of handoffFiles) {
    const filePath = path.join(handoffsDir, file);
    const handoff = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const valid = validateHandoff(handoff);
    if (!valid) {
      console.error(`✗  ${file}:`);
      for (const err of validateHandoff.errors) {
        console.error(`     ${err.instancePath || '(root)'}: ${err.message}`);
      }
      allOk = false;
    } else {
      console.log(`✓  ${file}`);
    }
  }
  console.log(`\n${handoffFiles.length} handoff file(s) valid.`);
}

if (!allOk) process.exit(1);
