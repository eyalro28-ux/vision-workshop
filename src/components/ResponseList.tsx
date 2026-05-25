import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, User } from 'lucide-react';
import type { Submission } from '../types';

interface Props {
  items: Submission[];
  alwaysExpanded?: boolean;
}

export default function ResponseList({ items, alwaysExpanded = false }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-slate-500 py-12 italic">
        עוד לא התקבלו תשובות
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <ResponseCard key={item.id} item={item} index={idx} alwaysExpanded={alwaysExpanded} />
      ))}
    </div>
  );
}

function ResponseCard({ item, index, alwaysExpanded }: { item: Submission; index: number; alwaysExpanded: boolean }) {
  const [open, setOpen] = useState(alwaysExpanded);
  const expanded = alwaysExpanded || open;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm print-card"
    >
      <button
        type="button"
        onClick={() => !alwaysExpanded && setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-start gap-3"
        disabled={alwaysExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User size={18} className="text-indigo-700" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 truncate">{item.name}</div>
            <div className="text-xs text-slate-500">
              {new Date(item.ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        {!alwaysExpanded && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown size={20} className="text-slate-400" />
          </motion.div>
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={alwaysExpanded ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
              <Row label="חזון" text={item.vision} />
              <Row label="ערכים" text={item.values} />
              <Row label="פעולה ל-30 הימים הקרובים" text={item.action} />
              {item.growth && (
                <Row label="כלים שמעוניינת לקבל (פרטי)" text={item.growth} highlight />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'bg-amber-50 border border-amber-200 rounded-xl p-3' : ''}>
      <div className={`text-xs font-bold mb-0.5 ${highlight ? 'text-amber-800' : 'text-indigo-700'}`}>
        {label}
      </div>
      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</div>
    </div>
  );
}
