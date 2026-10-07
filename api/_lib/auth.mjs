import { createClient } from '@supabase/supabase-js';

const COOKIE = 'token';

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function supabasePublic() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase public credentials are not configured.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getToken(req) {
  return req.cookies?.[COOKIE] || null;
}

export async function requireUser(req, res) {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    return null;
  }
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' });
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('auth failure', error);
    res.status(500).json({ error: 'AUTH_CONFIG', message: 'Authentication service is unavailable.' });
    return null;
  }
}

export function setSessionCookie(res, token, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`);
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
}

export function isSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;
  const host = req.headers?.host;
  try { return new URL(origin).host === host; } catch { return false; }
}

export function requireSameOrigin(req, res) {
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'ORIGIN_DENIED', message: 'Cross-origin request denied.' });
    return false;
  }
  return true;
}

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}
