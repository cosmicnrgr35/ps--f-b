import { supabaseAdmin, parseBody } from './_lib/auth.mjs';
import { method, securityHeaders } from './_lib/http.mjs';
const buckets = new Map();
function limited(ip) { const now=Date.now(), x=buckets.get(ip)||{start:now,count:0}; if(now-x.start>60000){x.start=now;x.count=0;} x.count++; buckets.set(ip,x); return x.count<=20; }
function validEmail(x){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x||''));}
export default async function handler(req,res){
 securityHeaders(res); if(!method(req,res,['POST'])) return;
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(); if(!limited(ip)) return res.status(429).json({error:'RATE_LIMITED'});
 const body=parseBody(req); if(String(body.website||'').trim()) return res.status(200).json({ok:true});
 const slug=String(body.slug||'').trim().toLowerCase(); const client=body.client||{};
 if(!slug || !client.name || !validEmail(client.email)) return res.status(400).json({error:'INVALID_BOOKING'});
 if(String(client.message||'').length>4000) return res.status(400).json({error:'MESSAGE_TOO_LONG'});
 try{const db=supabaseAdmin(); const {data:p,error:pe}=await db.from('profiles').select('user_id,data').eq('slug',slug).maybeSingle(); if(pe)throw pe; if(!p)return res.status(404).json({error:'STUDIO_NOT_FOUND'});
  const booking={...body,id:undefined,status:'Pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; delete booking.slug; delete booking.website;
  const {data,error}=await db.from('bookings').insert({user_id:p.user_id,data:booking}).select('id,data').single(); if(error)throw error; await db.from('notifications').insert({user_id:p.user_id,data:{type:'booking',title:'New booking request',message:`${client.name} submitted a booking request.`,bookingId:data.id,read:false,createdAt:new Date().toISOString()}}); res.status(201).json({ok:true,bookingId:data.id});
 }catch(e){console.error(e);res.status(500).json({error:'BOOKING_ERROR'});}
}
