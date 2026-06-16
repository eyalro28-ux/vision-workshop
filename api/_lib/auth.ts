import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Gate facilitator-only endpoints behind a shared admin token.
 *
 * Returns true if the request carries a valid `x-admin-token` header.
 * Otherwise writes an error response and returns false. Fails closed:
 * if ADMIN_TOKEN is not configured on the server, every request is rejected.
 */
export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    console.error('ADMIN_TOKEN env var is missing — admin endpoints are disabled');
    res.status(503).json({ error: 'השרת לא הוגדר נכון (חסר קוד מנחה)' });
    return false;
  }
  const provided = req.headers['x-admin-token'];
  const token = Array.isArray(provided) ? provided[0] : provided;
  if (!token || token !== expected) {
    res.status(401).json({ error: 'נדרש קוד מנחה' });
    return false;
  }
  return true;
}
