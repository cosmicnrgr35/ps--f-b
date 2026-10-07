import { createClient } from '@supabase/supabase-js';
import { setSessionCookie, requireSameOrigin } from './_lib/auth.mjs';
import { method, securityHeaders } from './_lib/http.mjs';

export default async function handler(req,res){
  securityHeaders(res); if(!method(req,res,['POST']))return; if(!requireSameOrigin(req,res))return;
  const {email,password}=req.body||{};
  if(typeof email!=='string'||typeof password!=='string'||!email.trim()||!password)return res.status(400).json({error:'INVALID_INPUT',message:'Email and password are required.'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return res.status(500).json({error:'AUTH_CONFIG'});
  try{const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error||!data.session)return res.status(401).json({error:'INVALID_CREDENTIALS',message:'Invalid email or password.'});
    setSessionCookie(res,data.session.access_token); return res.status(200).json({ok:true});
  }catch(e){console.error(e);return res.status(500).json({error:'AUTH_ERROR'});}
}
