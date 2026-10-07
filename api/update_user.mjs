import { requireSameOrigin, requireUser, supabaseAdmin, parseBody } from './_lib/auth.mjs';
import { method, securityHeaders } from './_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);if(!method(req,res,['POST','PUT','PATCH']))return;if(!requireSameOrigin(req,res))return;const user=await requireUser(req,res);if(!user)return;
 const body=parseBody(req);const data=body.profile||body.data||body;if(!data||typeof data!=='object')return res.status(400).json({error:'INVALID_PROFILE'});
 try{const db=supabaseAdmin();const slug=String(body.slug||data.slug||'').trim().toLowerCase();const row={user_id:user.id,data:{...data,email:user.email},updated_at:new Date().toISOString()};if(slug)row.slug=slug;
   const {data:saved,error}=await db.from('profiles').upsert(row,{onConflict:'user_id'}).select('data,slug').single();if(error)throw error;
   res.status(200).json({ok:true,profile:saved.data,slug:saved.slug});
 }catch(e){console.error(e);res.status(500).json({error:'PROFILE_SAVE_ERROR'});}
}
