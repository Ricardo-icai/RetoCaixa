import type { NextApiRequest, NextApiResponse } from 'next';
import { communityRequest } from '../../server/communityRequest.ts';
import { CommunityError, profileDetail, updatePersona } from '../../server/community.ts';
import { sanitizeAvatar } from '../../server/avatar.ts';

export const config = { api: { bodyParser: { sizeLimit: '400kb' } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const viewer = communityRequest(req, res, ['name', 'handle', 'bio', 'investmentTag', 'avatar', 'revision']);
    if (req.method === 'POST') {
      const now = Date.now();
      viewer.actions = viewer.actions.filter(time => now - time < 60000);
      if (viewer.actions.length >= 20) throw new CommunityError(429, 'Espera un momento antes de volver a guardar.');
      viewer.actions.push(now);
      const avatar = await sanitizeAvatar(req.body.avatar);
      return res.status(200).json(updatePersona(viewer, req.body, avatar));
    }
    if (req.query.userId !== undefined && typeof req.query.userId !== 'string') throw new CommunityError(400, 'Perfil no válido.');
    return res.status(200).json(profileDetail(viewer, req.query.userId));
  } catch (error) {
    if (error instanceof CommunityError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'No se ha podido cargar o guardar el perfil. Inténtalo de nuevo.' });
  }
}
