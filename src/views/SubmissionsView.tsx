import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Printer, AlertCircle } from 'lucide-react';
import type { Route } from '../App';
import type { Submission, ResponsesPayload } from '../types';
import ResponseList from '../components/ResponseList';
import { ensureAdminToken, adminFetch } from '../lib/adminAuth';

interface Props {
  navigate: (to: Route) => void;
}

export default function SubmissionsView({ navigate }: Props) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        ensureAdminToken();
        const res = await adminFetch('/api/responses');
        if (res.status === 401) throw new Error('קוד מנחה שגוי — רענן את הדף כדי להזין מחדש');
        if (!res.ok) throw new Error('שגיאה בטעינה');
        const data: ResponsesPayload = await res.json();
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">טוען...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('admin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl"
          >
            חזרה ללוח המנחה
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-6"
    >
      <div className="max-w-4xl mx-auto">
        <header className="no-print bg-white/85 backdrop-blur rounded-3xl shadow-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate('admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-700 font-bold"
          >
            <ArrowRight size={18} className="rtl:rotate-180" />
            חזרה ללוח
          </button>
          <div className="text-center grow">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">תשובות פרטניות</h1>
            <p className="text-xs text-slate-500">לעיני המנחה בלבד · {items.length} משתתפות</p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-5 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <Printer size={18} />
            ייצוא ל-PDF
          </button>
        </header>

        <div className="print-vision-header hidden print:block mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-serif)' }}>
            תשובות פרטניות
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            סדנת חזון משותף · {new Date().toLocaleDateString('he-IL')} · {items.length} משתתפות
          </p>
        </div>

        <section className="bg-white/90 rounded-3xl shadow-lg p-6 sm:p-8">
          <ResponseList items={items} alwaysExpanded />
        </section>

        <p className="no-print text-center text-xs text-slate-500 mt-10">
          בעת ייצוא ל-PDF — בחרי "שמירה כ-PDF" כיעד ההדפסה בדפדפן.
        </p>
      </div>
    </motion.div>
  );
}
