export function method(req, res, allowed) {
  const m = String(req.method || 'GET').toUpperCase();
  if (!allowed.includes(m)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return null;
  }
  return m;
}

export function noStore(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
}

export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}
