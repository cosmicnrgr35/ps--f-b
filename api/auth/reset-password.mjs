import { supabaseAdmin, requireSameOrigin } from '../_lib/auth.mjs';
import { method, securityHeaders } from '../_lib/http.mjs';
export default async function handler(req,res){
 securityHeaders(res);if(!method(req,res,['POST']))return;if(!requireSameOrigin(req,res))return;
 const token=String(req.body?.token||'').trim(),password=String(req.body?.password||'');
 if(!token||password.length<8)return res.status(400).json({error:'INVALID_INPUT',message:'A valid reset token and a password of at least 8 characters are required.'});
 try{const db=supabaseAdmin();const {data,error}=await db.auth.getUser(token);if(error||!data?.user)return res.status(401).json({error:'INVALID_TOKEN',message:'This reset link is invalid or expired.'});
   const {error:updateError}=await db.auth.admin.updateUserById(data.user.id,{password});if(updateError)throw updateError;res.status(200).json({ok:true,message:'Password updated successfully. You can now sign in.'});
 }catch(e){console.error('reset password',e);res.status(500).json({error:'RESET_ERROR',message:'Unable to reset the password.'});}
}
