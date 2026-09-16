import type { NextApiRequest, NextApiResponse } from 'next';
import { communityRequest } from '../../server/communityRequest';
import { CommunityError } from '../../server/community';
import { HttpError } from '../../server/sessions';
import { executeTrade, paperAccount, portfolioSnapshot, previewTrade } from '../../server/trading';

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const viewer = communityRequest(req, res, ['operation', 'symbol', 'exchange', 'amountEur', 'previewId', 'reviewed']);
    const account = paperAccount(viewer.id);
    if (req.method === 'POST') {
      if (req.body.operation === 'preview') return res.status(200).json({ preview: await previewTrade(account, req.body) });
      if (req.body.operation !== 'buy') throw new HttpError(400, 'Operación no válida.');
      executeTrade(account, req.body.previewId, req.body.reviewed);
    }
    return res.status(200).json({ portfolio: await portfolioSnapshot(account, req.method === 'GET'), csrfToken: viewer.csrfToken });
  } catch (error) {
    if (error instanceof HttpError || error instanceof CommunityError) return res.status(error.status).json({ error: error.message });
    return res.status(502).json({ error: 'No se pueden consultar los datos de mercado ahora. No se ha enviado ninguna orden real.' });
  }
}
