import { clearSessionCookie, requireSameOrigin } from '../_lib/auth.mjs';
import { method, securityHeaders } from '../_lib/http.mjs';
export default async function handler(req, res) {
  securityHeaders(res);
  if (!method(req, res, ['POST'])) return;
  if (!requireSameOrigin(req, res)) return;
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
