import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, SUBMISSIONS_KEY } from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const raw = await redis.lrange<string | object>(SUBMISSIONS_KEY, 0, -1);
    const items = raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r));
    return res.status(200).json({ count: items.length, items });
  } catch (e) {
    console.error('responses error', e);
    return res.status(500).json({ error: 'שגיאת שרת', detail: String(e) });
  }
}
