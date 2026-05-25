#!/usr/bin/env node
// Pulls the current vision + submissions from production and prints a
// participant-by-participant coverage matrix. Use after generating a
// vision to verify every voice is represented.
//
// Usage: BASE_URL=https://vision-workshop-six.vercel.app node scripts/audit-coverage.mjs

const BASE_URL = process.env.BASE_URL || 'https://vision-workshop-six.vercel.app';
const root = BASE_URL.replace(/\/$/, '');

const [respRes, visionRes] = await Promise.all([
  fetch(`${root}/api/responses`),
  fetch(`${root}/api/vision`),
]);
if (!respRes.ok) { console.error('responses fetch failed:', respRes.status); process.exit(1); }
if (!visionRes.ok) { console.error('vision fetch failed:', visionRes.status); process.exit(1); }
const { items: submissions } = await respRes.json();
const vision = await visionRes.json();

console.log(`\n=== Coverage audit ===`);
console.log(`submissions: ${submissions.length} · participantCount in vision: ${vision.participantCount}`);
console.log(`generatedAt: ${new Date(vision.generatedAt).toLocaleString('he-IL')}`);
console.log('');

const voicedNames = new Set((vision.voices || []).map(v => v.name));
const actionNames = new Set((vision.actions || []).map(a => a.name));

// Names cited in visionCoreSources
const phraseSourceNames = new Set();
for (const s of vision.visionCoreSources || []) {
  for (const name of s.sources || []) phraseSourceNames.add(name);
}

// Names cited in valuesProvenance
const valuesContribNames = new Set();
for (const vp of vision.valuesProvenance || []) {
  for (const c of vp.contributors || []) valuesContribNames.add(c.name);
}

const HEADER = ['Participant', 'inActions', 'inVoices', 'inVisionCore', 'inValues', 'totalLanes'];
const rows = [];
const invisible = [];
for (const s of submissions) {
  const inA = actionNames.has(s.name);
  const inV = voicedNames.has(s.name);
  const inVC = phraseSourceNames.has(s.name);
  const inVa = valuesContribNames.has(s.name);
  const total = [inA, inV, inVC, inVa].filter(Boolean).length;
  rows.push([s.name, inA, inV, inVC, inVa, total]);
  if (total === 0) invisible.push(s.name);
}

const col = w => s => String(s).padEnd(w, ' ');
const widths = [22, 10, 10, 14, 10, 12];
console.log(HEADER.map((h, i) => col(widths[i])(h)).join(''));
console.log(widths.map(w => '-'.repeat(w - 1) + ' ').join(''));
for (const r of rows) {
  console.log(r.map((v, i) => col(widths[i])(typeof v === 'boolean' ? (v ? '✓' : '·') : v)).join(''));
}

console.log('\n=== Summary ===');
const total = submissions.length;
const inAny = rows.filter(r => r[5] > 0).length;
const inMultiple = rows.filter(r => r[5] >= 2).length;
console.log(`covered in at least one lane: ${inAny}/${total}`);
console.log(`covered in 2+ lanes:           ${inMultiple}/${total}`);
console.log(`voiced (direct quote):         ${voicedNames.size}/${total}`);
console.log(`actions listed:                ${actionNames.size}/${total}`);
console.log(`visionCore phrase sources:     ${phraseSourceNames.size}/${total}`);
console.log(`values contributors:           ${valuesContribNames.size}/${total}`);

if (invisible.length > 0) {
  console.log('\n⚠️  Invisible participants (no lane):');
  for (const n of invisible) console.log(`  - ${n}`);
} else {
  console.log('\n✓ Every participant appears in at least one lane.');
}

console.log('\n=== visionCoreSources count: ' + (vision.visionCoreSources?.length || 0) + ' ===');
for (const s of vision.visionCoreSources || []) {
  console.log(`  ״${s.phrase}״`);
  console.log(`    ← ${s.sources.join(', ')}`);
}

console.log('\n=== valuesProvenance ===');
for (const vp of vision.valuesProvenance || []) {
  console.log(`  ${vp.value}`);
  for (const c of vp.contributors || []) {
    console.log(`    ${c.name}: "${c.originalValue}"`);
  }
}
