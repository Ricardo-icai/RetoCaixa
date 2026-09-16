import type { AssetSearchResult } from './types.ts';

// Editorial discovery catalogue. Tags describe exposure, never suitability or returns.
export const discoveryAssets: AssetSearchResult[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', type: 'Common Stock', tags: ['IA y semiconductores', 'chips', 'tecnología'] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', currency: 'USD', type: 'Common Stock', tags: ['Software y nube', 'tecnología'] },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'Common Stock', tags: ['Energía y movilidad', 'vehículos eléctricos'] },
  { symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', exchange: 'XETRA', currency: 'EUR', type: 'ETF', tags: ['Índices y fondos', 'global'] },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE Arca', currency: 'USD', type: 'ETF', tags: ['Índices y fondos', 'Estados Unidos'] },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', exchange: 'Coinbase', currency: 'USD', type: 'Digital Currency', tags: ['Criptoactivos', 'bitcoin'] },
];
export const assetKey = (asset: AssetSearchResult) => `${asset.symbol}|${asset.exchange}|${asset.currency}`;
export const normalizeSearch = (text: string) => text.replace(/^\$/, '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function sectorMatches(query: string) {
  const needle = normalizeSearch(query);
  if (['ia', 'ai', 'inteligencia artificial', 'artificial intelligence'].includes(needle)) return discoveryAssets.filter(asset => asset.tags?.includes('IA y semiconductores'));
  return discoveryAssets.filter(asset => normalizeSearch(`${asset.symbol} ${asset.name} ${asset.tags?.join(' ')}`).includes(needle));
}
