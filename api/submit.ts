import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, SUBMISSIONS_KEY } from './_lib/redis.js';

interface SubmissionInput {
  name: string;
  vision: string;
  values: string;
  action: string;
  growth: string;
}

const LIMITS = { name: 60, vision: 320, values: 60, action: 180, growth: 240 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as SubmissionInput;
    const errs: string[] = [];
    if (!body?.name?.trim()) errs.push('שם');
    else if (body.name.length > LIMITS.name) errs.push(`שם (מקסימום ${LIMITS.name})`);
    if (!body?.vision?.trim()) errs.push('חזון');
    else if (body.vision.length > LIMITS.vision) errs.push(`חזון (מקסימום ${LIMITS.vision})`);
    if (!body?.values?.trim()) errs.push('ערכים');
    else if (body.values.length > LIMITS.values) errs.push(`ערכים (מקסימום ${LIMITS.values})`);
    if (!body?.action?.trim()) errs.push('פעולה');
    else if (body.action.length > LIMITS.action) errs.push(`פעולה (מקסימום ${LIMITS.action})`);
    if (!body?.growth?.trim()) errs.push('צמיחה');
    else if (body.growth.length > LIMITS.growth) errs.push(`צמיחה (מקסימום ${LIMITS.growth})`);

    if (errs.length) {
      return res.status(400).json({ error: `שדות לא תקינים: ${errs.join(', ')}` });
    }

    const record = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      name: body.name.trim(),
      vision: body.vision.trim(),
      values: body.values.trim(),
      action: body.action.trim(),
      growth: body.growth.trim(),
    };

    await redis.rpush(SUBMISSIONS_KEY, JSON.stringify(record));
    return res.status(200).json({ ok: true, id: record.id });
  } catch (e) {
    console.error('submit error', e);
    return res.status(500).json({ error: 'שגיאת שרת', detail: String(e) });
  }
}
