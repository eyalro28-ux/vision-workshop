import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, SUBMISSIONS_KEY, VISION_KEY } from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await redis.del(SUBMISSIONS_KEY, VISION_KEY);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('clear error', e);
    return res.status(500).json({ error: 'שגיאת שרת', detail: String(e) });
  }
}
