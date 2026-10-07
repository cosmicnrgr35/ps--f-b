import { requireUser } from '../_lib/auth.mjs';
import { method, noStore, securityHeaders } from '../_lib/http.mjs';
export default async function handler(req, res) {
  securityHeaders(res); noStore(res);
  if (!method(req, res, ['GET'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  res.status(200).json({ id: user.id, email: user.email, emailConfirmedAt: user.email_confirmed_at || null });
}
