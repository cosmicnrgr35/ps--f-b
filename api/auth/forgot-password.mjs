import { createClient } from '@supabase/supabase-js';
import { requireSameOrigin } from '../_lib/auth.mjs';
import { method, securityHeaders } from '../_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);if(!method(req,res,['POST']))return;if(!requireSameOrigin(req,res))return;
 const email=String(req.body?.email||'').trim().toLowerCase();
 const generic={ok:true,message:'If an account exists for that email, a password reset link has been sent.'};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(200).json(generic);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;if(!url||!key)return res.status(500).json({error:'AUTH_CONFIG'});
 try{const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const origin=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/reset-password.html`});}catch(e){console.error('forgot password',e);}
 return res.status(200).json(generic);
}
