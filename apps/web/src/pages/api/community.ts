import type { NextApiRequest, NextApiResponse } from 'next';
import { CommunityError, communitySnapshot, getViewer, mutateCommunity } from '../../server/community';

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  try {
    if (req.method === 'POST') {
      const origin = req.headers.origin;
      if (origin) {
        try { if (new URL(origin).host !== req.headers.host) throw new Error('origin_mismatch'); }
        catch { throw new CommunityError(403, 'Origen no permitido.'); }
      }
      if (!req.headers['content-type']?.startsWith('application/json')) throw new CommunityError(415, 'Se requiere JSON.');
      if (!req.cookies.kai_community) throw new CommunityError(403, 'Actualiza la página antes de continuar.');
    }
    const viewer = getViewer(req.cookies.kai_community);
    if (req.method === 'POST') {
      if (req.headers['x-csrf-token'] !== viewer.csrfToken) throw new CommunityError(403, 'Actualiza la página antes de continuar.');
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new CommunityError(400, 'Solicitud no válida.');
      const allowed = ['operation', 'kind', 'topic', 'title', 'text', 'postId', 'replyId', 'channelId', 'acceptTerms', 'acknowledgePrivacy', 'confirmAdult', 'legalVersions', 'acceptRisk', 'visibility', 'countryCode', 'goals'];
      if (Object.keys(req.body).some(key => !allowed.includes(key))) throw new CommunityError(400, 'La solicitud incluye campos no permitidos.');
    }
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `kai_community=${viewer.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure}`);
    const mutation = req.method === 'POST'
      ? req.body
      : null;
    // The browser's HttpOnly cookie is the only chat identity accepted here.
    return res.status(200).json(mutation ? mutateCommunity(viewer, mutation, req.cookies.kai_session) : communitySnapshot(viewer, req.cookies.kai_session));
  } catch (error) {
    if (error instanceof CommunityError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'No se ha podido cargar la comunidad. Vuelve a intentarlo.' });
  }
}
