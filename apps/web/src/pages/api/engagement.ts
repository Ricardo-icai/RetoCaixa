import type { NextApiRequest, NextApiResponse } from 'next';
import { communityRequest } from '../../server/communityRequest.ts';
import { CommunityError } from '../../server/community.ts';
import { processEngagement } from '../../server/engagement.ts';
import { personalizationStatus } from '../../server/personalization.ts';

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const viewer = communityRequest(req, res, ['operation', 'enabled', 'privacyVersion', 'postId', 'eventId', 'watchTimeMs', 'completionRate']);
    return res.status(200).json(req.method === 'GET' ? personalizationStatus(viewer, req.cookies.kai_session) : await processEngagement(viewer, req.body, req.cookies.kai_session));
  } catch (error) {
    return res.status(error instanceof CommunityError ? error.status : 500).json({ error: error instanceof CommunityError ? error.message : 'No se pudo actualizar la personalización.' });
  }
}
