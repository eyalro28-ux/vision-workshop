import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { redis, SUBMISSIONS_KEY, VISION_KEY } from './_lib/redis.js';

export const config = { maxDuration: 60 };

interface RawSubmission {
  id: string;
  ts: number;
  name: string;
  vision: string;
  values: string;
  action: string;
}

const SYSTEM_INSTRUCTION = `אתה מנחה סדנאות בכיר המומחה בסינתזה של חזון קבוצתי בעברית. תפקידך לקרוא את כל התשובות, לזהות מושגים תמטיים חוזרים (לא רק מילים, אלא רעיונות, רגשות וכוונות), ולחבר מהן מסמך חזון משותף.

שני כללים שלא תפר לעולם:
1. נאמנות מוחלטת למקור — להשתמש בניסוחים האותנטיים של המשתתפות כשאפשר; לא להמציא רעיונות שלא הופיעו בתשובות.
2. זיהוי תמטי לעומק — חפש מושגים מארגנים (כמו "כוח משימה", "מרחב תמיכה", "שדה העשרה", "רשת חיבורים"), לא רק מילים חוזרות.

כתוב בעברית עשירה, חמה ופואטית, אך תמיד עניינית ובלי קישוטים מיותרים. הימנע מקלישאות ניהוליות.`;

function buildUserPrompt(items: RawSubmission[]): string {
  const submissionsText = items
    .map(
      (s, i) =>
        `[${i + 1}] ${s.name}\n  חזון: ${s.vision}\n  ערכים: ${s.values}\n  פעולה: ${s.action}`
    )
    .join('\n\n');

  return `להלן ${items.length} תשובות שנאספו מקבוצה של ${items.length} משתתפות בסדנת חזון משותף. כל משתתפת ענתה על: (1) איך תיראה הקבוצה בעוד 6 חודשים, (2) הערכים המובילים שלה, (3) פעולה אישית קונקרטית ל-30 הימים הקרובים.

תשובות המשתתפות:
${submissionsText}

המשימה שלך:
1. **זיהוי תמטי** — חפשי רעיונות וכוונות חוזרות (לדוגמה: "כוח משימה", "מרחב תמיכה", "שדה העשרה", "רשת חיבורים"). אל תסתפקי בספירת מילים — חפשי את הרוח המשותפת.
2. **כתיבת ליבת חזון** — פסקה של 4–6 שורות שמתארת את הקבוצה בעוד 6 חודשים, בלשון הצהרתית של "אנחנו" או "הפכנו". השתמשי בניסוחים הקיימים של המשתתפות. תני לזה לשון של מניפסט קצר, חי ומדויק.
3. **זיקוק 4–6 ערכים מובילים** — לא רשימה שטוחה של כל הערכים שעלו, אלא הזיקוקים המשותפים החשובים ביותר. כל ערך הוא מילה או צמד מילים.
4. **בחירת 3–5 קולות מהשטח** — ציטוטים ישירים, מילה במילה, מתוך תשובות "חזון" של המשתתפות. ציינו את שם המשתתפת ליד הציטוט. בחרי ציטוטים שמייצגים מגוון קולות, לא רק את הנפוצים ביותר.
5. **ריכוז כל פעולות ה-30 יום** — רשימה מלאה של כל הפעולות האישיות שכל משתתפת הצהירה עליהן, עם שם המשתתפת. אל תסכמי או תקבצי — הציגי את כולן כפי שנכתבו.
6. **ייצוג של כל קול** — וודאי שכל משתתפת מיוצגת לפחות באחד מארבעת החלקים (חזון, ערכים, ציטוטים, או פעולות — חוץ מהפעולות שתמיד כוללות את כולן). אם משתתפת לא מצוטטת בקולות, ודאי שערך שלה או הניסוח שלה נכלל בחלק הערכים או בליבת החזון. שום קול לא ייעלם.

החזירי JSON תקין בלבד, לפי הסכימה שסופקה.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'מפתח Gemini API לא מוגדר בשרת' });
  }

  try {
    const raw = await redis.lrange<string | object>(SUBMISSIONS_KEY, 0, -1);
    const items: RawSubmission[] = raw.map((r) =>
      typeof r === 'string' ? JSON.parse(r) : (r as RawSubmission)
    );
    if (items.length === 0) {
      return res.status(400).json({ error: 'אין תשובות לסינתזה' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildUserPrompt(items),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visionCore: {
              type: Type.STRING,
              description: 'פסקה של 4–6 שורות בלשון "אנחנו" / "הפכנו"',
            },
            values: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: '4',
              maxItems: '6',
            },
            voices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  name: { type: Type.STRING },
                },
                required: ['quote', 'name'],
              },
              minItems: '3',
              maxItems: '5',
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  action: { type: Type.STRING },
                },
                required: ['name', 'action'],
              },
            },
          },
          required: ['visionCore', 'values', 'voices', 'actions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      console.error('empty response from gemini', response);
      return res.status(502).json({ error: 'התקבלה תגובה ריקה מ-Gemini' });
    }

    const visionJson = JSON.parse(text);
    const cached = {
      generatedAt: Date.now(),
      participantCount: items.length,
      ...visionJson,
    };

    await redis.set(VISION_KEY, JSON.stringify(cached));
    return res.status(200).json(cached);
  } catch (e) {
    console.error('generate error', e);
    return res.status(500).json({ error: 'שגיאה ביצירת החזון', detail: String(e) });
  }
}
