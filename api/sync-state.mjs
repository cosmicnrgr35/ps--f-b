import { requireSameOrigin, requireUser, supabaseAdmin, parseBody } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';
const MAX_BYTES = 900000;
const BLOCKED = new Set(['professionalStudio.paymentAccount','professionalStudio.paymentUPI','professionalStudio.subscription','professionalStudio.subscriptionPlan','professionalStudio.subscriptionRenewal','professionalStudio.subscriptionStatus','professionalStudio.billingHistory']);
function sanitize(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const [key,value] of Object.entries(input)) {
    if (BLOCKED.has(key) || key.includes('token') || key.includes('password')) continue;
    if (typeof key !== 'string' || key.length > 180) continue;
    out[key] = value;
  }
  return out;
}
export default async function handler(req,res) {
  securityHeaders(res); noStore(res); if (!method(req,res,['POST'])) return;
  if (!requireSameOrigin(req,res)) return;
  const user = await requireUser(req,res); if (!user) return;
  const body = parseBody(req); const state = sanitize(body.state || {});
  if (JSON.stringify(state).length > MAX_BYTES) return res.status(413).json({error:'STATE_TOO_LARGE'});
  try {
    const { error } = await supabaseAdmin().from('studio_state').upsert({user_id:user.id,state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if (error) throw error; res.status(200).json({ok:true});
  } catch(e) { console.error(e); res.status(500).json({error:'STATE_SAVE_ERROR'}); }
}
