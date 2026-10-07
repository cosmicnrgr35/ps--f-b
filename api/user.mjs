import { supabaseAdmin } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);noStore(res);if(!method(req,res,['GET']))return;
 const id=String(req.query?.id||req.query?.slug||'').trim().toLowerCase();if(!id)return res.status(400).json({error:'MISSING_ID'});
 try{const db=supabaseAdmin();let q=db.from('profiles').select('user_id,slug,data').eq('slug',id).maybeSingle();let {data:profile,error}=await q;if(error)throw error;
   if(!profile){try{const email=atob(id);const {data:p,error:e}=await db.from('profiles').select('user_id,slug,data').eq('data->>email',email).maybeSingle();if(e)throw e;profile=p;}catch{}}
   if(!profile)return res.status(404).json({error:'NOT_FOUND'});
   const {data:state,error:se}=await db.from('studio_state').select('state').eq('user_id',profile.user_id).maybeSingle();if(se)throw se;const s=state?.state||{};
   res.status(200).json({profile:profile.data||{},slug:profile.slug,services:s['professionalStudio.services']||[],equipment:s['professionalStudio.equipment']||[],reviews:s['professionalStudio.reviews']||[],portfolioStorage:s['professionalStudio.portfolioStorage']||{}});
 }catch(e){console.error(e);res.status(500).json({error:'PROFILE_READ_ERROR'});}
}
