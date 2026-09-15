import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, publicSession, mutate, HttpError } from '../../server/sessions';

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Método no permitido.' }); }
  try {
    if (req.method === 'POST') {
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, 'Origen no permitido.');
      if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Se requiere JSON.');
    }
    const entry = getSession(req.cookies.kai_session, req.query.language === 'en' ? 'en' : 'es');
    if (req.method === 'POST') {
      if (req.headers['x-csrf-token'] !== entry.csrfToken) throw new HttpError(403, 'Actualiza la página antes de continuar.');
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new HttpError(400, 'Solicitud no válida.');
      const allowed = ['operation', 'text', 'title', 'savedConversationId', 'revision', 'language', 'recommendationId', 'confirmed'];
      if (Object.keys(req.body).some(key => !allowed.includes(key))) throw new HttpError(400, 'La solicitud incluye campos no permitidos.');
      await mutate(entry, req.body);
    }
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `kai_session=${entry.session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure}`);
    return res.status(200).json(publicSession(entry));
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'No he podido completar la respuesta. Tu última conversación sigue disponible; vuelve a intentarlo.' });
  }
}
