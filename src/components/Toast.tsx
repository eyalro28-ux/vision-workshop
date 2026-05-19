import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

interface Props {
  message: string | null;
  kind?: ToastKind;
}

const styles: Record<ToastKind, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
  info: 'bg-indigo-600 text-white',
};

const icons: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function Toast({ message, kind = 'info' }: Props) {
  const Icon = icons[kind];
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-sm z-50 ${styles[kind]} rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 no-print`}
        >
          <Icon size={22} className="shrink-0" />
          <span className="text-base font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
