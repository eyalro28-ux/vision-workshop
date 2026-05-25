import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, Send } from 'lucide-react';
import Toast, { ToastKind } from '../components/Toast';

const STORAGE_KEY = 'vision-workshop-submitted';

interface Field {
  key: 'name' | 'vision' | 'values' | 'action' | 'growth';
  label: string;
  hint: string;
  example?: string;
  note?: string;
  multiline: boolean;
  maxLength: number;
  rows?: number;
}

const FIELDS: Field[] = [
  {
    key: 'name',
    label: 'שם מלא',
    hint: 'כדי שנוכל לתת לקול שלך מקום ייחודי בחזון',
    multiline: false,
    maxLength: 60,
  },
  {
    key: 'vision',
    label: 'השפעה וחזון',
    hint: 'דמייני את הקבוצה שלנו בעוד 6 חודשים — מה הפכנו להיות? מה אנחנו עושות יחד?',
    example: 'דוגמה: "הפכנו לכוח משימה שקל להפעיל כשלאחת מאיתנו יש רעיון, ויצרנו מרחב תמיכה שבו אפשר לבקש עזרה בלי בושה."',
    multiline: true,
    maxLength: 320,
    rows: 4,
  },
  {
    key: 'values',
    label: 'ערכים מובילים',
    hint: '1–3 ערכים שמובילים אותך, מופרדים בפסיק',
    example: 'דוגמה: סולידריות, סקרנות, אומץ',
    multiline: false,
    maxLength: 60,
  },
  {
    key: 'action',
    label: 'פעולה ל-30 הימים הקרובים',
    hint: 'מה את מתחייבת לעשות באופן אישי, החודש, כדי לקדם את החזון?',
    example: 'דוגמה: "להרים טלפון לחברה חדשה בקבוצה פעם בשבוע."',
    multiline: true,
    maxLength: 180,
    rows: 3,
  },
  {
    key: 'growth',
    label: 'אילו כלים (בתחום מקצועי או אישי) את מעוניינת לקבל במסגרת הפורום?',
    hint: 'תוכן, מיומנויות או כלים נוספים שתרצי בארגז הכלים שלך.',
    example: 'דוגמה: "כלים לניהול קונפליקטים", או: "סדנה לקבלת החלטות במצבי לחץ".',
    note: 'התשובה לשאלה זו היא פרטית ולא תוצג או תפורסם — היא נשארת לעיני המנחה בלבד.',
    multiline: true,
    maxLength: 240,
    rows: 3,
  },
];

type Status = 'idle' | 'submitting' | 'success';

export default function ParticipantForm() {
  const [values, setValues] = useState<Record<string, string>>({
    name: '', vision: '', values: '', action: '', growth: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('again') === '1') return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setAlreadySubmitted(true);
      setStatus('success');
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  const validate = (): string | null => {
    for (const f of FIELDS) {
      const v = values[f.key].trim();
      if (!v) return `נא למלא: ${f.label}`;
      if (v.length > f.maxLength) return `${f.label} ארוך מדי (מקסימום ${f.maxLength} תווים)`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setToast({ msg: err, kind: 'error' });
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          vision: values.vision.trim(),
          values: values.values.trim(),
          action: values.action.trim(),
          growth: values.growth.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'שגיאה בשליחה' }));
        throw new Error(data.error || 'שגיאה בשליחה');
      }
      localStorage.setItem(STORAGE_KEY, 'true');
      setStatus('success');
    } catch (e) {
      setStatus('idle');
      setToast({ msg: e instanceof Error ? e.message : 'שגיאה בשליחה', kind: 'error' });
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center px-4 py-8"
      >
        <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
          >
            <CheckCircle2 size={48} className="text-emerald-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">תודה רבה!</h2>
          <p className="text-slate-600 leading-relaxed">
            {alreadySubmitted
              ? 'כבר שלחת את התשובה שלך. רק רגע ונראה יחד את החזון המשותף.'
              : 'התשובה שלך נשמרה ותהיה חלק מהחזון המשותף שניצור יחד.'}
          </p>
          <Toast message={toast?.msg ?? null} kind={toast?.kind} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-6"
    >
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-2"
          >
            <Sparkles size={40} className="text-indigo-600" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-800">חזון משותף</h1>
          <p className="text-slate-600 mt-2 leading-relaxed">
            הקול שלך הוא חלק מהחזון. ספרי לנו על עצמך, ובוא ניצור יחד תמונה משותפת.
          </p>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="bg-white/85 backdrop-blur rounded-3xl shadow-xl p-6 space-y-6"
        >
          {FIELDS.map((f) => {
            const v = values[f.key];
            const Tag = f.multiline ? 'textarea' : 'input';
            return (
              <div key={f.key}>
                <label className="block text-base font-bold text-slate-800 mb-1">
                  {f.label}
                </label>
                <p className="text-sm text-slate-600 mb-1.5 leading-snug">{f.hint}</p>
                {f.example && (
                  <p className="text-xs text-slate-500 mb-2 italic leading-snug">{f.example}</p>
                )}
                {f.note && (
                  <p className="text-xs text-indigo-700 mb-2 leading-snug font-bold">{f.note}</p>
                )}
                <Tag
                  {...(f.multiline ? { rows: f.rows } : { type: 'text' })}
                  value={v}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(f.key, e.target.value)}
                  maxLength={f.maxLength}
                  dir="rtl"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-slate-900 text-base transition-colors"
                  disabled={status === 'submitting'}
                />
                <div className="text-xs text-slate-400 text-end mt-1">
                  {v.length} / {f.maxLength}
                </div>
              </div>
            );
          })}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg transition-all"
          >
            {status === 'submitting' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                שולחת...
              </>
            ) : (
              <>
                <Send size={20} className="rtl:-scale-x-100" />
                שליחת התשובה
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          התשובות נאספות בצורה מאובטחת ויוצגו בלוח המנחה לאחר השלמת כולן.
        </p>

        <Toast message={toast?.msg ?? null} kind={toast?.kind} />
      </div>
    </motion.div>
  );
}
