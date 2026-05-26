#!/usr/bin/env node
// Parachute: generate the vision from your laptop if Vercel + Gemini fail
// during the workshop. Pulls submissions from the live admin endpoint,
// calls Gemini directly with a local key, prints the result to terminal.
//
// Usage:
//   node --env-file=.env.local scripts/local-generate.mjs
//   (or: GEMINI_API_KEY=xxx node scripts/local-generate.mjs)
//
// Optional: BASE_URL=https://vision-workshop-six.vercel.app (defaults to prod)

import { GoogleGenAI, Type } from '@google/genai';

const BASE_URL = process.env.BASE_URL || 'https://vision-workshop-six.vercel.app';
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY. Run: node --env-file=.env.local scripts/local-generate.mjs');
  process.exit(1);
}

console.log(`Pulling submissions from ${BASE_URL}/api/responses ...`);
const res = await fetch(`${BASE_URL}/api/responses`);
if (!res.ok) {
  console.error(`Failed to fetch responses: ${res.status}`);
  process.exit(1);
}
const { items } = await res.json();
if (!items?.length) {
  console.error('No submissions found.');
  process.exit(1);
}
console.log(`Got ${items.length} submissions. Calling Gemini ...\n`);

const SYSTEM_INSTRUCTION = `אתה מנחה סדנאות בכיר המומחה בסינתזה של חזון קבוצתי בעברית. תפקידך לקרוא את כל התשובות, לזהות מושגים תמטיים חוזרים (לא רק מילים, אלא רעיונות, רגשות וכוונות), ולחבר מהן מסמך חזון משותף.

שני כללים שלא תפר לעולם:
1. נאמנות מוחלטת למקור — להשתמש בניסוחים האותנטיים של המשתתפות כשאפשר; לא להמציא רעיונות שלא הופיעו בתשובות.
2. זיהוי תמטי לעומק — חפש מושגים מארגנים (כמו "כוח משימה", "מרחב תמיכה", "שדה העשרה", "רשת חיבורים"), לא רק מילים חוזרות.

כתוב בעברית עשירה, חמה ופואטית, אך תמיד עניינית ובלי קישוטים מיותרים. הימנע מקלישאות ניהוליות.`;

const submissionsText = items
  .map((s, i) => `[${i + 1}] ${s.name}\n  חזון: ${s.vision}\n  ערכים: ${s.values}\n  פעולה: ${s.action}`)
  .join('\n\n');

const userPrompt = `להלן ${items.length} תשובות שנאספו מקבוצה של ${items.length} משתתפות בסדנת חזון משותף. כל משתתפת ענתה על: (1) איך תיראה הקבוצה בעוד 6 חודשים, (2) הערכים המובילים שלה, (3) פעולה אישית קונקרטית ל-30 הימים הקרובים.

תשובות המשתתפות:
${submissionsText}

המשימה שלך:
1. **זיהוי תמטי** — חפשי רעיונות וכוונות חוזרות.
2. **כתיבת ליבת חזון** — פסקה של 4–6 שורות שמתארת את הקבוצה בעוד 6 חודשים, בלשון "אנחנו" / "הפכנו". השתמשי בניסוחים הקיימים של המשתתפות.
3. **בחירת 4–6 ערכים מובילים** — לא רשימה שטוחה, אלא הזיקוקים המשותפים.
4. **בחירת 3–5 קולות מהשטח** — ציטוטים ישירים, מילה במילה, מתוך תשובות "חזון" של המשתתפות, עם שמותיהן.
5. **ריכוז כל פעולות ה-30 יום** — רשימה מלאה של כל הפעולות האישיות שכל משתתפת הצהירה עליהן, עם שם המשתתפת. אל תסכמי או תקבצי.

החזירי JSON תקין בלבד, לפי הסכימה שסופקה.`;

const ai = new GoogleGenAI({ apiKey });

const start = Date.now();
let response;
try {
  response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visionCore: { type: Type.STRING },
          values: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: '4', maxItems: '6' },
          voices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { quote: { type: Type.STRING }, name: { type: Type.STRING } },
              required: ['quote', 'name'],
            },
            minItems: '3',
            maxItems: '5',
          },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, action: { type: Type.STRING } },
              required: ['name', 'action'],
            },
          },
        },
        required: ['visionCore', 'values', 'voices', 'actions'],
      },
    },
  });
} catch (e) {
  console.error('Gemini call failed:', e.message);
  process.exit(1);
}

const vision = JSON.parse(response.text);

// Backfill missing actions, same as production
const actionNames = new Set(vision.actions.map((a) => a.name));
const missing = items.filter((s) => !actionNames.has(s.name));
if (missing.length > 0) {
  console.warn(`(backfilling ${missing.length} missing actions: ${missing.map((m) => m.name).join(', ')})\n`);
  vision.actions = [...vision.actions, ...missing.map((s) => ({ name: s.name, action: s.action }))];
}

console.log(`Generated in ${Math.round((Date.now() - start) / 1000)}s\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ליבת החזון');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(vision.visionCore);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ערכים מובילים');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
for (const v of vision.values) console.log(' •', v);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  קולות מהשטח');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
for (const q of vision.voices) {
  console.log(`  ״${q.quote}״`);
  console.log(`    — ${q.name}\n`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  פעולות ל-30 יום (${vision.actions.length})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
for (const a of vision.actions) {
  console.log(`  ${a.name} — ${a.action}`);
}
console.log('');
