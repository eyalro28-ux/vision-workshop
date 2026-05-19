import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, VISION_KEY } from './_lib/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const raw = await redis.get<string | object>(VISION_KEY);
      if (!raw) return res.status(404).json({ error: 'אין חזון שמור' });
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      await redis.del(VISION_KEY);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('vision error', e);
    return res.status(500).json({ error: 'שגיאת שרת', detail: String(e) });
  }
}
