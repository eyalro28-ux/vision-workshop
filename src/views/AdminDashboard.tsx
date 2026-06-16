import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Trash2, Users, Wand2, ScrollText, FileText } from 'lucide-react';
import type { Route } from '../App';
import type { Submission, ResponsesPayload, Vision } from '../types';
import ResponseList from '../components/ResponseList';
import VisionAuditTrail from '../components/VisionAuditTrail';
import Toast, { ToastKind } from '../components/Toast';
import { ensureAdminToken, adminFetch } from '../lib/adminAuth';

interface Props {
  navigate: (to: Route) => void;
}

export default function AdminDashboard({ navigate }: Props) {
  const [items, setItems] = useState<Submission[]>([]);
  const [vision, setVision] = useState<Vision | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);

  const loadResponses = useCallback(async () => {
    try {
      const res = await adminFetch('/api/responses');
      if (res.status === 401) throw new Error('קוד מנחה שגוי — רענן את הדף כדי להזין מחדש');
      if (!res.ok) throw new Error('שגיאה בטעינה');
      const data: ResponsesPayload = await res.json();
      setItems(data.items);
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'שגיאה בטעינה', kind: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVision = useCallback(async () => {
    try {
      const res = await fetch('/api/vision');
      if (res.status === 404) {
        setVision(null);
        return;
      }
      if (!res.ok) return;
      const data: Vision = await res.json();
      setVision(data);
    } catch {
      // silent — vision is optional
    }
  }, []);

  useEffect(() => {
    ensureAdminToken();
    loadResponses();
    loadVision();
    const interval = setInterval(loadResponses, 5000);
    return () => clearInterval(interval);
  }, [loadResponses, loadVision]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const generate = async () => {
    if (items.length === 0) {
      setToast({ msg: 'עוד אין תשובות לסינתזה', kind: 'error' });
      return;
    }
    setGenerating(true);
    try {
      const res = await adminFetch('/api/generate', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'שגיאת זיקוק' }));
        throw new Error(data.error || 'שגיאת זיקוק');
      }
      const data: Vision = await res.json();
      setVision(data);
      navigate('result');
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'שגיאת זיקוק', kind: 'error' });
      setGenerating(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('אתה בטוח שברצונך למחוק את כל התשובות והחזון? לא ניתן לבטל פעולה זו.')) return;
    try {
      const res = await adminFetch('/api/clear', { method: 'POST' });
      if (!res.ok) throw new Error('שגיאה במחיקה');
      setItems([]);
      setVision(null);
      setToast({ msg: 'כל התשובות נמחקו', kind: 'success' });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'שגיאה במחיקה', kind: 'error' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-6"
    >
      <div className="max-w-4xl mx-auto">
        <header className="bg-white/85 backdrop-blur rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">לוח מנחה</h1>
                <p className="text-sm text-slate-500">חזון משותף · סדנת מנהיגות</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                <Users size={22} className="text-indigo-700" />
                <div>
                  <motion.div
                    key={items.length}
                    initial={{ scale: 1.4, color: '#7c3aed' }}
                    animate={{ scale: 1, color: '#1e293b' }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-black"
                  >
                    {items.length}
                  </motion.div>
                  <div className="text-xs text-slate-600">תשובות</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <button
              onClick={generate}
              disabled={generating || items.length === 0}
              className="bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {generating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  מזקק את החזון...
                </>
              ) : (
                <>
                  <Wand2 size={20} className="rtl:-scale-x-100" />
                  צור חזון משותף
                </>
              )}
            </button>

            <button
              onClick={loadResponses}
              disabled={loading || generating}
              className="bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              רענן
            </button>

            <button
              onClick={clearAll}
              disabled={generating}
              className="bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Trash2 size={18} />
              מחק כל התשובות
            </button>
          </div>
        </header>

        {vision && (
          <section className="bg-white/85 backdrop-blur rounded-3xl shadow-xl p-6 mb-6">
            <header className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ScrollText size={20} className="text-indigo-700" />
                מקורות החזון (לעיני המנחה בלבד)
              </h2>
              <button
                onClick={() => navigate('result')}
                className="text-sm text-indigo-700 hover:text-indigo-900 font-bold underline"
              >
                צפייה בחזון המלא ←
              </button>
            </header>
            <VisionAuditTrail vision={vision} />
          </section>
        )}

        <section className="bg-white/85 backdrop-blur rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>תשובות שהתקבלו</span>
              <span className="text-xs font-normal text-slate-500">מתעדכן אוטומטית כל 5 שניות</span>
            </h2>
            {items.length > 0 && (
              <button
                onClick={() => navigate('submissions')}
                className="text-sm bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-bold py-2 px-3 rounded-xl flex items-center gap-2"
              >
                <FileText size={16} />
                ייצוא ל-PDF
              </button>
            )}
          </div>
          {generating && items.length > 0 && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center text-indigo-800 text-sm">
              ה-AI מזקק את החזון מתוך {items.length} תשובות... זה ייקח כמה שניות.
            </div>
          )}
          {loading && items.length === 0 ? (
            <div className="text-center text-slate-400 py-12">טוען...</div>
          ) : (
            <ResponseList items={items} />
          )}
        </section>

        <Toast message={toast?.msg ?? null} kind={toast?.kind} />
      </div>
    </motion.div>
  );
}
