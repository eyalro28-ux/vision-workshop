import { motion } from 'motion/react';
import { Quote, Target, Heart, Compass } from 'lucide-react';
import type { Vision } from '../types';

interface Props {
  vision: Vision;
}

export default function VisionDocument({ vision }: Props) {
  return (
    <div className="space-y-8 vision-print">
      <Section
        icon={<Compass size={26} className="text-indigo-700" />}
        title="ליבת החזון"
        subtitle="הקבוצה שלנו בעוד 6 חודשים"
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl leading-loose text-center text-slate-800 px-2 py-4"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {vision.visionCore}
        </motion.p>
      </Section>

      <Section
        icon={<Heart size={26} className="text-rose-600" />}
        title="ערכים מובילים"
        subtitle="הציר שמחזיק אותנו יחד"
      >
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {vision.values.map((v, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="px-5 py-2.5 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200 text-rose-900 font-bold text-base shadow-sm"
            >
              {v}
            </motion.span>
          ))}
        </div>
      </Section>

      <Section
        icon={<Quote size={26} className="text-purple-700" />}
        title="קולות מהשטח"
        subtitle="ציטוטים מתוך התשובות שלכן"
      >
        <div className="space-y-4 mt-2">
          {vision.voices.map((v, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 border-r-4 border-purple-400 rounded-2xl p-5 print-quote"
            >
              <blockquote
                className="text-lg leading-relaxed text-slate-800"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                ״{v.quote}״
              </blockquote>
              <figcaption className="text-sm text-purple-700 font-bold mt-2">
                — {v.name}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Section>

      <Section
        icon={<Target size={26} className="text-emerald-700" />}
        title="פעולות ל-30 הימים הקרובים"
        subtitle="ההתחייבות האישית של כל אחת מאיתנו"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {vision.actions.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.02 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 print-card"
            >
              <div className="font-bold text-emerald-900 text-sm mb-1">{a.name}</div>
              <div className="text-slate-700 text-sm leading-relaxed">{a.action}</div>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon, title, subtitle, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6 sm:p-8 print-section">
      <header className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
