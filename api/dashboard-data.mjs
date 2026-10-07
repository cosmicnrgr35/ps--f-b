import { requireUser, supabaseAdmin } from './_lib/auth.mjs';
import { method, noStore, securityHeaders } from './_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);noStore(res);if(!method(req,res,['GET']))return;const user=await requireUser(req,res);if(!user)return;
 try{const db=supabaseAdmin();const [{data:profile},{data:state}]=await Promise.all([db.from('profiles').select('slug,data').eq('user_id',user.id).maybeSingle(),db.from('studio_state').select('state,updated_at').eq('user_id',user.id).maybeSingle()]);
   const s=state?.state||{};const bookings=Array.isArray(s.bookings)?s.bookings:[];const services=Array.isArray(s['professionalStudio.services'])?s['professionalStudio.services']:[];
   const revenue=bookings.filter(b=>String(b.status||'').toLowerCase()==='completed').reduce((n,b)=>n+Number(b.totalAmount||b.packagePrice||b.price||0),0);
   res.status(200).json({user:{id:user.id,email:user.email,name:profile?.data?.full_name||profile?.data?.name||''},profile:profile?.data||{},slug:profile?.slug||'',stats:{bookings:bookings.length,activeServices:services.filter(x=>x?.active!==false).length,revenue}});
 }catch(e){console.error(e);res.status(500).json({error:'DASHBOARD_ERROR'});}
}
