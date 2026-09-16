import type { NextApiRequest, NextApiResponse } from 'next';
import { CommunityError, getViewer } from './community.ts';

export function communityRequest(req: NextApiRequest, res: NextApiResponse, fields: string[]) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); throw new CommunityError(405, 'Método no permitido.'); }
  if (req.method === 'POST') {
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== req.headers.host) throw new Error(); }
      catch { throw new CommunityError(403, 'Origen no permitido.'); }
    }
    if (!req.headers['content-type']?.startsWith('application/json')) throw new CommunityError(415, 'Se requiere JSON.');
    if (!req.cookies.kai_community) throw new CommunityError(403, 'Actualiza la página antes de continuar.');
  }
  const viewer = getViewer(req.cookies.kai_community);
  if (req.method === 'POST') {
    if (req.headers['x-csrf-token'] !== viewer.csrfToken) throw new CommunityError(403, 'Actualiza la página antes de continuar.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).some(key => !fields.includes(key))) throw new CommunityError(400, 'La solicitud incluye campos no válidos.');
  }
  res.setHeader('Set-Cookie', `kai_community=${viewer.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
  return viewer;
}
