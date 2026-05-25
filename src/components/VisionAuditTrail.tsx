import type { Vision } from '../types';

interface Props {
  vision: Vision;
}

export default function VisionAuditTrail({ vision }: Props) {
  const hasSources = vision.visionCoreSources && vision.visionCoreSources.length > 0;
  const hasProvenance = vision.valuesProvenance && vision.valuesProvenance.length > 0;

  if (!hasSources && !hasProvenance) {
    return (
      <p className="text-sm text-slate-500 italic">
        עקבות מקורות אינם זמינים עבור חזון זה. צרי חזון חדש כדי לראות את עקבות המקורות.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {hasSources && (
        <div>
          <h3 className="font-bold text-slate-800 mb-2">מקורות בליבת החזון</h3>
          <p className="text-xs text-slate-500 mb-3 leading-snug">
            לכל ביטוי מהותי בליבת החזון, המשתתפות שתרמו לו.
          </p>
          <ul className="space-y-2">
            {vision.visionCoreSources!.map((s, i) => (
              <li key={i} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                <div className="text-sm text-slate-800" dir="rtl">
                  <span className="font-bold">״{s.phrase}״</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  מ-{s.sources.join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasProvenance && (
        <div>
          <h3 className="font-bold text-slate-800 mb-2">מקורות הערכים</h3>
          <p className="text-xs text-slate-500 mb-3 leading-snug">
            לכל ערך שנבחר, המשתתפות שתרמו לו והניסוח המקורי שלהן.
          </p>
          <ul className="space-y-3">
            {vision.valuesProvenance!.map((vp, i) => (
              <li key={i} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                <div className="font-bold text-rose-900 text-sm mb-2">{vp.value}</div>
                <ul className="space-y-1">
                  {vp.contributors.map((c, j) => (
                    <li key={j} className="text-xs text-slate-700">
                      <span className="font-bold">{c.name}:</span>{' '}
                      <span className="text-slate-600">״{c.originalValue}״</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
