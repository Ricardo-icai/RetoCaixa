import type { NextApiRequest, NextApiResponse } from 'next';
import type { AssetSearchResult } from '../../market/types';
import { getAnnualReturn, getAssetHistory, getAssetQuote, searchAssets } from '../../server/marketData';
import { assetSuggestions } from '../../server/assetSuggestions';
import { communityRequest } from '../../server/communityRequest';

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Método no permitido.' }); }
  try {
    if (req.query.action === 'suggestions') {
      const viewer = communityRequest(req, res, []);
      return res.status(200).json(assetSuggestions(viewer.goals, req.cookies.kai_session));
    }
    if (req.query.action === 'search') return res.status(200).json(await searchAssets(clean(req.query.q, 50)));
    if (req.query.action === 'quote' || req.query.action === 'performance' || req.query.action === 'history') {
      const asset: AssetSearchResult = { symbol: clean(req.query.symbol, 30).toUpperCase(), name: clean(req.query.name, 120), exchange: clean(req.query.exchange, 60), currency: clean(req.query.currency, 10).toUpperCase(), type: clean(req.query.type, 60), country: clean(req.query.country, 60) || undefined, micCode: clean(req.query.micCode, 10) || undefined };
      if (!/^[A-Z0-9./:_-]{1,30}$/.test(asset.symbol)) return res.status(400).json({ error: 'Símbolo no válido.' });
      if (req.query.action === 'history') {
        const period = req.query.period ?? '1D';
        if (period !== '1D' && period !== '1W' && period !== '1M' && period !== '1Y') return res.status(400).json({ error: 'Periodo no válido.' });
        return res.status(200).json(await getAssetHistory(asset, period));
      }
      if (req.query.action === 'performance') return res.status(200).json({ performance: await getAnnualReturn(asset) ?? null });
      return res.status(200).json(await getAssetQuote(asset, req.query.details === 'true'));
    }
    return res.status(400).json({ error: 'Acción no válida.' });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'No se han podido cargar los datos del activo.' });
  }
}
