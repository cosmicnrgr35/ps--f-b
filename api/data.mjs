import { requireSameOrigin, requireUser, supabaseAdmin, parseBody } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';

const RESOURCES = new Set(['profile','services','equipment','clients','bookings','galleries','recent_work','reviews','notifications','analytics']);
const TABLES = {
  profile: 'profiles', services: 'services', equipment: 'equipment', clients: 'clients',
  bookings: 'bookings', galleries: 'galleries', recent_work: 'recent_work', reviews: 'reviews',
  notifications: 'notifications', analytics: 'analytics'
};

function cleanResource(value) { return String(value || '').trim().toLowerCase(); }
function payloadFor(resource, body) {
  if (resource === 'profile') return body.data || body;
  return body.data ?? body.payload ?? {};
}
function safeLimit(value) { const n = Number(value); return Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 200) : 100; }

export default async function handler(req, res) {
  securityHeaders(res); noStore(res);
  const m = method(req, res, ['GET','POST','PUT','PATCH','DELETE']); if (!m) return;
  const resource = cleanResource(req.query?.resource);
  if (!RESOURCES.has(resource)) return res.status(400).json({ error: 'INVALID_RESOURCE' });
  if (m !== 'GET' && !requireSameOrigin(req, res)) return;
  const user = await requireUser(req, res); if (!user) return;
  const supabase = supabaseAdmin();
  const table = TABLES[resource];

  try {
    if (resource === 'profile' && ['POST','PUT','PATCH'].includes(m)) {
      const data = payloadFor(resource, parseBody(req));
      const row = { user_id: user.id, data, updated_at: new Date().toISOString() };
      const { data: saved, error } = await supabase.from(table).upsert(row, { onConflict: 'user_id' }).select('*').single();
      if (error) throw error;
      return res.status(200).json({ data: saved.data, id: saved.id });
    }

    if (m === 'GET') {
      let q = supabase.from(table).select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(safeLimit(req.query?.limit));
      if (resource === 'profile') q = supabase.from(table).select('*').eq('user_id', user.id).maybeSingle();
      const { data, error } = await q; if (error) throw error;
      return res.status(200).json({ data: resource === 'profile' ? (data?.data || null) : (data || []) });
    }

    if (m === 'POST') {
      const body = parseBody(req); const data = payloadFor(resource, body);
      const { data: row, error } = await supabase.from(table).insert({ user_id: user.id, data }).select('*').single();
      if (error) throw error;
      return res.status(201).json({ data: row.data, id: row.id });
    }

    const id = String(req.query?.id || '').trim();
    if (!id) return res.status(400).json({ error: 'MISSING_ID' });
    if (m === 'DELETE') {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id); if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    const body = parseBody(req); const data = payloadFor(resource, body);
    const { data: row, error } = await supabase.from(table).update({ data, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select('*').single();
    if (error) throw error;
    return res.status(200).json({ data: row.data, id: row.id });
  } catch (error) {
    console.error(`data/${resource}`, error);
    return res.status(500).json({ error: 'DATA_ERROR', message: 'The requested operation could not be completed.' });
  }
}
