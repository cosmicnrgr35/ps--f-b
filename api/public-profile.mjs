import { supabaseAdmin } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';
export default async function handler(req,res) {
  securityHeaders(res); noStore(res); if (!method(req,res,['GET'])) return;
  const slug = String(req.query?.slug || '').trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]{3,80}$/.test(slug)) return res.status(400).json({error:'INVALID_SLUG'});
  try {
    const db=supabaseAdmin();
    const {data:profile,error:pe}=await db.from('profiles').select('user_id,data,updated_at').eq('slug',slug).maybeSingle();
    if(pe) throw pe; if(!profile) return res.status(404).json({error:'NOT_FOUND'});
    const {data:state,error:se}=await db.from('studio_state').select('state').eq('user_id',profile.user_id).maybeSingle(); if(se) throw se;
    const s=state?.state||{};
    res.status(200).json({profile:profile.data||{},services:s['professionalStudio.services']||[],equipment:s['professionalStudio.equipment']||[],reviews:s['professionalStudio.reviews']||[],recentWork:s['professionalStudio.portfolioStorage']||{}});
  } catch(e) { console.error(e); res.status(500).json({error:'PUBLIC_PROFILE_ERROR'}); }
}
