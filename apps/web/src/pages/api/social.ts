import type { NextApiRequest, NextApiResponse } from 'next';
import { CommunityError, getFollowers, setFollowUser, socialSnapshot } from '../../server/community';
import { communityRequest } from '../../server/communityRequest';

export const config = { api: { bodyParser: { sizeLimit: '1kb' } } };
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const viewer = communityRequest(req, res, ['operation', 'userId', 'following']);
    if (req.method === 'POST') {
      if (req.body.operation !== 'toggleFollowUser' || typeof req.body.userId !== 'string' || typeof req.body.following !== 'boolean') throw new CommunityError(400, 'Indica el perfil y si quieres seguirlo.');
      const now = Date.now();
      viewer.actions = viewer.actions.filter(time => now - time < 60000);
      if (viewer.actions.length >= 30) throw new CommunityError(429, 'Espera un momento antes de continuar.');
      viewer.actions.push(now);
      setFollowUser(viewer, req.body.userId, req.body.following);
    } else if (req.query.action === 'getFollowers') {
      if (typeof req.query.userId !== 'string') throw new CommunityError(400, 'Perfil no válido.');
      return res.status(200).json(getFollowers(viewer, req.query.userId, Number(req.query.offset ?? 0)));
    } else if (req.query.action && req.query.action !== 'getSuggestedCreators') throw new CommunityError(400, 'Consulta no válida.');
    return res.status(200).json(socialSnapshot(viewer, req.cookies.kai_session));
  } catch (error) {
    if (error instanceof CommunityError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'No se ha podido actualizar tu red.' });
  }
}
