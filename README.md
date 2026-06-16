# חזון משותף — אפליקציית סדנת מנהיגות

אפליקציית רשת קטנה בעברית RTL לסדנה חד-פעמית: 28 משתתפות ממלאות טופס במכשיר הנייד, המנחה רואה את התשובות נכנסות בזמן אמת, לוחץ על "צור חזון" וקיבל מ-Gemini זיקוק של חזון משותף ב-4 חלקים, עם ייצוא ל-PDF.

## ארכיטקטורה

- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4
- **Backend**: Vercel Serverless Functions ב-`/api`
- **Storage**: Upstash Redis (חינמי דרך Vercel marketplace)
- **AI**: `@google/genai` קורא ל-`gemini-2.5-flash` בצד שרת בלבד
- **PDF**: native `window.print()` עם `@media print` CSS

## פיתוח מקומי

```bash
npm install
cp .env.example .env.local   # מלא את הערכים
npm run dev                   # רץ על http://localhost:3000
```

או דרך Vercel CLI (מומלץ — מריץ גם את ה-API):

```bash
npm install -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

## משתני סביבה

| משתנה | חובה | מקור |
|---|---|---|
| `GEMINI_API_KEY` | כן | https://aistudio.google.com/apikey |
| `ADMIN_TOKEN` | כן | קוד מנחה שאתה בוחר — מגן על נתיבי הניהול. המנחה מזין אותו פעם אחת ב-`/admin` |
| `KV_REST_API_URL` | כן | מוזרק אוטומטית דרך Upstash integration ב-Vercel |
| `KV_REST_API_TOKEN` | כן | מוזרק אוטומטית דרך Upstash integration ב-Vercel |

## דפים

| נתיב | תפקיד |
|---|---|
| `/` | טופס משתתפת |
| `/admin` | לוח בקרה למנחה |
| `/result` | תצוגת החזון המסונתז + ייצוא PDF |
| `/submissions` | תצוגת תשובות פרטניות להדפסה — **למנחה בלבד** |

## API

| נתיב | מטוד | תפקיד |
|---|---|---|
| `/api/submit` | POST | שמירת תשובת משתתפת (פתוח) |
| `/api/responses` | GET | רשימת כל התשובות (פוללינג מהמנחה) — **דורש קוד מנחה** |
| `/api/generate` | POST | קריאה ל-Gemini ויצירת חזון — **דורש קוד מנחה** |
| `/api/vision` | GET / DELETE | GET פתוח (תצוגת החזון); DELETE **דורש קוד מנחה** |
| `/api/clear` | POST | מחיקת הכל (תשובות + חזון) — **דורש קוד מנחה** |

נתיבי הניהול מוגנים ב-`ADMIN_TOKEN` (header `x-admin-token`). המנחה מזין את הקוד פעם אחת ב-`/admin` או `/submissions` (נשמר ל-session). אם `ADMIN_TOKEN` לא מוגדר בשרת — כל נתיבי הניהול חסומים (fail closed).

## מבנה הקוד

```
src/
  App.tsx                  ← נתבן (router) פנימי בין /, /admin, /result, /submissions
  main.tsx                 ← נקודת כניסה (mount של React)
  types.ts                 ← טיפוסים משותפים (Submission, ResponsesPayload וכו')
  index.css                ← Tailwind + סגנונות גלובליים
  views/
    ParticipantForm.tsx
    AdminDashboard.tsx
    VisionResult.tsx
    SubmissionsView.tsx    ← תצוגת תשובות פרטניות להדפסה (למנחה בלבד)
  components/
    ResponseList.tsx
    VisionDocument.tsx
    VisionAuditTrail.tsx   ← פירוט מקורות/שקיפות מאחורי החזון
    Toast.tsx
  lib/
    adminAuth.ts           ← ניהול קוד המנחה בצד לקוח (ensureAdminToken, adminFetch)
api/
  submit.ts                ← POST /api/submit
  responses.ts             ← GET /api/responses
  generate.ts              ← POST /api/generate (קורא ל-Gemini)
  vision.ts                ← GET / DELETE /api/vision
  clear.ts                 ← POST /api/clear
  _lib/auth.ts             ← requireAdmin — שער הגנת ADMIN_TOKEN בצד שרת
  _lib/redis.ts            ← Upstash Redis client
```

## בדיקות

אין בדיקות אוטומטיות. בדיקה ידנית דרך `/admin` עם `vercel dev`.

## הוראות פריסה לוורסל

1. `git init && git add . && git commit -m "initial"` + push ל-GitHub
2. https://vercel.com/new → Import הריפו
3. הוסף `GEMINI_API_KEY` ו-`ADMIN_TOKEN` ב-Environment Variables
4. Deploy
5. אחרי Deploy ראשון: Storage → Create Database → Upstash → Redis (חינמי) → Connect
6. Redeploy מטאב Deployments

## תזרים יום הסדנה

1. `/admin` → לוודא ש-count = 0 (אם לא, "מחק כל התשובות")
2. שיתוף ה-URL של `/` עם המשתתפות (קוד QR)
3. המנחה צופה במונה עולה
4. "צור חזון" → ממתינים ~10–20 שניות
5. "ייצוא ל-PDF" → "שמירה כ-PDF" בדפדפן
6. אחרי הסדנה: "מחק כל התשובות"
