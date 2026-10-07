import { method, securityHeaders } from './_lib/http.mjs';
export default async function handler(req, res) {
  securityHeaders(res);
  if (!method(req, res, ['GET'])) return;
  res.status(200).json({ ok: true, service: 'professional-studio-api', timestamp: new Date().toISOString() });
}
