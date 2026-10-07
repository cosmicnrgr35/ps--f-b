import { requireUser, supabaseAdmin } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';

const TABLE = 'studio_state';

export default async function handler(req, res) {
  securityHeaders(res); noStore(res); if (!method(req, res, ['GET'])) return;
  const user = await requireUser(req, res); if (!user) return;
  try {
    const db = supabaseAdmin();
    const [{ data: saved, error: stateError }, { data: bookings, error: bookingsError }] = await Promise.all([
      db.from(TABLE).select('state,updated_at').eq('user_id', user.id).maybeSingle(),
      db.from('bookings').select('id,data,created_at,updated_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500)
    ]);
    if (stateError) throw stateError;
    if (bookingsError) throw bookingsError;
    const state = { ...(saved?.state || {}) };
    const normalizedBookings = (bookings || []).map(row => ({ ...(row.data || {}), serverId: row.id, createdAt: row.data?.createdAt || row.created_at, updatedAt: row.data?.updatedAt || row.updated_at }));
    if (normalizedBookings.length) state.bookings = normalizedBookings;
    res.status(200).json({ state, updatedAt: saved?.updated_at || null });
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'STATE_ERROR' });
  }
}
