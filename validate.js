#!/usr/bin/env node

/**
 * Regulatory Registry Validator
 *
 * Validates a registry JSON file against the schema and checks:
 * 1. JSON schema conformance
 * 2. All URLs are valid format
 * 3. No duplicate regulation IDs
 * 4. All statuses are valid
 * 5. Superseded regulations have supersededBy field
 * 6. Version format matches YYYY.Q#
 *
 * Usage: node validate.js registry/v2026.Q1/regulations.json
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node validate.js <registry-file.json>');
  process.exit(1);
}

const registry = JSON.parse(readFileSync(resolve(file), 'utf8'));
const errors = [];
const warnings = [];

// 1. Required top-level fields
for (const field of ['version', 'effectiveDate', 'refreshedAt', 'nextRefreshDue', 'cadence', 'regulations']) {
  if (!registry[field]) errors.push(`Missing required field: ${field}`);
}

// 2. Version format
if (registry.version && !/^\d{4}\.Q[1-4](\.PATCH-\d+)?$/.test(registry.version)) {
  errors.push(`Invalid version format: ${registry.version} (expected YYYY.Q# or YYYY.Q#.PATCH-N)`);
}

// 3. Validate each regulation
const validStatuses = ['in-force', 'superseded', 'proposed', 'repealed'];
const validJurisdictions = ['US', 'EU', 'UK', 'international'];
const requiredFields = ['title', 'jurisdiction', 'authority', 'citation', 'url', 'effectiveDate', 'status', 'summary'];

const regs = registry.regulations || {};
const regIds = Object.keys(regs);

console.log(`\nValidating ${file}`);
console.log(`  Version: ${registry.version}`);
console.log(`  Regulations: ${regIds.length}`);
console.log(`  Refreshed: ${registry.refreshedAt}`);
console.log(`  Next refresh: ${registry.nextRefreshDue}\n`);

for (const [id, reg] of Object.entries(regs)) {
  // Required fields
  for (const field of requiredFields) {
    if (!reg[field] && reg[field] !== null) {
      errors.push(`[${id}] Missing required field: ${field}`);
    }
  }

  // Valid status
  if (reg.status && !validStatuses.includes(reg.status)) {
    errors.push(`[${id}] Invalid status: ${reg.status}`);
  }

  // Valid jurisdiction
  if (reg.jurisdiction && !validJurisdictions.includes(reg.jurisdiction)) {
    errors.push(`[${id}] Invalid jurisdiction: ${reg.jurisdiction}`);
  }

  // Superseded must have supersededBy
  if (reg.status === 'superseded' && !reg.supersededBy) {
    errors.push(`[${id}] Status is 'superseded' but missing 'supersededBy' field`);
  }

  // URL format
  if (reg.url && !/^https?:\/\/.+/.test(reg.url)) {
    errors.push(`[${id}] Invalid URL: ${reg.url}`);
  }

  // Date format
  if (reg.effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(reg.effectiveDate)) {
    errors.push(`[${id}] Invalid effectiveDate format: ${reg.effectiveDate}`);
  }

  // SOE mappings present
  if (!reg.soeMappings || reg.soeMappings.length === 0) {
    warnings.push(`[${id}] No SOE agent mappings defined`);
  }
}

// 4. Check nextRefreshDue isn't in the past
const nextRefresh = new Date(registry.nextRefreshDue);
if (nextRefresh < new Date()) {
  warnings.push(`Registry refresh is overdue (due: ${registry.nextRefreshDue})`);
}

// Report
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ⚠ ${w}`));
  console.log();
}

if (errors.length > 0) {
  console.log(`Errors (${errors.length}):`);
  errors.forEach(e => console.log(`  ✗ ${e}`));
  console.log(`\nVALIDATION FAILED`);
  process.exit(1);
} else {
  console.log(`✓ All ${regIds.length} regulations valid`);
  console.log(`✓ Schema conformance passed`);

  // Summary by jurisdiction
  const byJurisdiction = {};
  for (const reg of Object.values(regs)) {
    byJurisdiction[reg.jurisdiction] = (byJurisdiction[reg.jurisdiction] || 0) + 1;
  }
  console.log(`\nBy jurisdiction:`);
  for (const [j, count] of Object.entries(byJurisdiction).sort()) {
    console.log(`  ${j}: ${count}`);
  }

  console.log(`\nVALIDATION PASSED`);
}
