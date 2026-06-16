// Facilitator (admin) token handling for the workshop control surface.
// The token is entered once per browser session and sent as an
// `x-admin-token` header on facilitator-only API calls.

const KEY = 'vision_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(KEY);
}

/** Ensure a token exists, prompting the facilitator once if needed. */
export function ensureAdminToken(): string | null {
  let token = getAdminToken();
  if (!token) {
    const entered = window.prompt('הזן קוד מנחה כדי לגשת ללוח הבקרה')?.trim() ?? '';
    if (entered) {
      setAdminToken(entered);
      token = entered;
    }
  }
  return token || null;
}

/**
 * fetch() wrapper that attaches the admin token. On a 401 it clears the
 * stored token so the next attempt re-prompts.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken() ?? '';
  const res = await fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), 'x-admin-token': token },
  });
  if (res.status === 401) clearAdminToken();
  return res;
}
