import { createClient } from '@supabase/supabase-js';
import { setSessionCookie, requireSameOrigin } from './_lib/auth.mjs';
import { method, securityHeaders } from './_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);if(!method(req,res,['POST']))return;if(!requireSameOrigin(req,res))return;
 const {email,password}=req.body||{}; if(typeof email!=='string'||typeof password!=='string'||!email.trim()||password.length<8)return res.status(400).json({error:'INVALID_INPUT',message:'Use a valid email and a password of at least 8 characters.'});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;if(!url||!key)return res.status(500).json({error:'AUTH_CONFIG'});
 try{const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password});if(error)return res.status(400).json({error:'SIGNUP_ERROR',message:error.message});
   if(data.session?.access_token)setSessionCookie(res,data.session.access_token);return res.status(201).json({ok:true,requiresEmailVerification:!data.session});
 }catch(e){console.error(e);return res.status(500).json({error:'AUTH_ERROR'});}
}
