import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Printer, Sparkles, AlertCircle } from 'lucide-react';
import type { Route } from '../App';
import type { Vision, Submission, ResponsesPayload } from '../types';
import VisionDocument from '../components/VisionDocument';
import ResponseList from '../components/ResponseList';

interface Props {
  navigate: (to: Route) => void;
}

export default function VisionResult({ navigate }: Props) {
  const [vision, setVision] = useState<Vision | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [visionRes, respRes] = await Promise.all([
          fetch('/api/vision'),
          fetch('/api/responses'),
        ]);
        if (visionRes.status === 404) {
          setError('עוד לא נוצר חזון. חזרי ללוח המנחה וצרי את החזון.');
          setLoading(false);
          return;
        }
        if (!visionRes.ok) throw new Error('שגיאה בטעינת החזון');
        const visionData: Vision = await visionRes.json();
        setVision(visionData);
        if (respRes.ok) {
          const respData: ResponsesPayload = await respRes.json();
          setSubmissions(respData.items);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={48} className="text-indigo-600" />
          </motion.div>
          <p className="text-slate-600 text-lg">טוען את החזון המשותף...</p>
        </div>
      </motion.div>
    );
  }

  if (error || !vision) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">החזון עדיין לא מוכן</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('admin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl"
          >
            חזרה ללוח המנחה
          </button>
        </div>
      </motion.div>
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">החזון המשותף שלנו</h1>
            <p className="text-xs text-slate-500">
              נוצר מתוך {vision.participantCount} תשובות · {new Date(vision.generatedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
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
            החזון המשותף שלנו
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            סדנת חזון משותף · {new Date(vision.generatedAt).toLocaleDateString('he-IL')} · {vision.participantCount} משתתפות
          </p>
        </div>

        <VisionDocument vision={vision} />

        {submissions.length > 0 && (
          <section className="mt-10 page-break bg-white/90 rounded-3xl shadow-lg p-6 sm:p-8">
            <header className="mb-5 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-black text-slate-800">נספח: תשובות המשתתפות</h2>
              <p className="text-sm text-slate-500 mt-1">לתיעוד מלא של החומר המקורי</p>
            </header>
            <ResponseList items={submissions} alwaysExpanded />
          </section>
        )}

        <p className="no-print text-center text-xs text-slate-500 mt-10">
          בעת ייצוא ל-PDF — בחרי "שמירה כ-PDF" כיעד ההדפסה בדפדפן.
        </p>
      </div>
    </motion.div>
  );
}
