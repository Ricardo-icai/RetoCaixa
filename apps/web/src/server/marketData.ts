import type { AssetQuote, AssetSearchResponse, AssetSearchResult } from '../market/types.ts';

const baseUrl = 'https://api.twelvedata.com';
const demoAssets: Array<AssetSearchResult & { price: number; change: number; percentChange: number; low: number; high: number; yearLow: number; yearHigh: number; volume?: number }> = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', type: 'Common Stock', price: 190, change: 1.2, percentChange: 0.64, low: 187, high: 192, yearLow: 164, yearHigh: 237, volume: 48000000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', type: 'Common Stock', price: 420, change: -2.1, percentChange: -0.5, low: 417, high: 425, yearLow: 344, yearHigh: 468, volume: 21000000 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE Arca', country: 'US', currency: 'USD', type: 'ETF', price: 550, change: 1.8, percentChange: 0.33, low: 547, high: 552, yearLow: 409, yearHigh: 565, volume: 62000000 },
  { symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', exchange: 'XETRA', country: 'DE', currency: 'EUR', type: 'ETF', price: 120, change: 0.4, percentChange: 0.33, low: 119, high: 121, yearLow: 98, yearHigh: 123, volume: 92000 },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', exchange: 'Coinbase', country: 'US', currency: 'USD', type: 'Digital Currency', price: 65000, change: 850, percentChange: 1.33, low: 63100, high: 66200, yearLow: 38500, yearHigh: 73000 },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', exchange: 'Coinbase', country: 'US', currency: 'USD', type: 'Digital Currency', price: 3200, change: -35, percentChange: -1.08, low: 3150, high: 3290, yearLow: 1520, yearHigh: 4090 },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'Forex', currency: 'USD', type: 'Physical Currency', price: 1.09, change: 0.002, percentChange: 0.18, low: 1.086, high: 1.094, yearLow: 1.045, yearHigh: 1.12 },
  { symbol: 'XAU/USD', name: 'Oro al contado / US Dollar', exchange: 'Commodities', currency: 'USD', type: 'Precious Metal', price: 2350, change: 12, percentChange: 0.51, low: 2328, high: 2361, yearLow: 1810, yearHigh: 2450 },
];

const globalCache = globalThis as typeof globalThis & { kaiMarketCache?: Map<string, { expires: number; value: unknown }> };
const cache = globalCache.kaiMarketCache ??= new Map();

function number(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function twelveData(path: string, parameters: Record<string, string>, apiKey: string) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(parameters)) if (value) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok || data.status === 'error' || data.code) throw new Error(typeof data.message === 'string' ? data.message : 'El proveedor de mercado no ha respondido.');
  return data;
}

async function cached<T>(key: string, ttl: number, loader: () => Promise<T>) {
  const stored = cache.get(key);
  if (stored && stored.expires > Date.now()) return stored.value as T;
  const value = await loader();
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}

export async function searchAssets(query: string, apiKey = process.env.TWELVE_DATA_API_KEY): Promise<AssetSearchResponse> {
  const normalized = query.trim();
  if (normalized.length < 1 || normalized.length > 50) return { results: [], configured: !!apiKey, source: apiKey ? 'twelve-data' : 'illustrative' };
  if (!apiKey) {
    const needle = normalized.toLowerCase();
    return { results: demoAssets.filter(asset => `${asset.symbol} ${asset.name} ${asset.type}`.toLowerCase().includes(needle)).map(({ price: _price, change: _change, percentChange: _percentChange, low: _low, high: _high, yearLow: _yearLow, yearHigh: _yearHigh, volume: _volume, ...asset }) => asset).slice(0, 8), configured: false, source: 'illustrative' };
  }
  return cached(`search:${normalized.toLowerCase()}`, 5 * 60_000, async () => {
    const payload = await twelveData('/symbol_search', { symbol: normalized, outputsize: '8' }, apiKey);
    const rows = Array.isArray(payload.data) ? payload.data as Array<Record<string, unknown>> : [];
    const results = rows.map(row => ({ symbol: String(row.symbol ?? ''), name: String(row.instrument_name ?? row.symbol ?? ''), exchange: String(row.exchange ?? ''), micCode: typeof row.mic_code === 'string' ? row.mic_code : undefined, country: typeof row.country === 'string' ? row.country : undefined, currency: String(row.currency ?? ''), type: String(row.instrument_type ?? 'Instrumento') })).filter(asset => asset.symbol && asset.name);
    return { results, configured: true, source: 'twelve-data' as const };
  });
}

export async function getAssetQuote(asset: AssetSearchResult, includeProfile: boolean, apiKey = process.env.TWELVE_DATA_API_KEY): Promise<AssetQuote> {
  if (!apiKey) {
    const match = demoAssets.find(item => item.symbol === asset.symbol && (!asset.exchange || item.exchange === asset.exchange));
    if (!match) throw new Error('Este activo necesita una clave de Twelve Data para consultar su información.');
    return { ...asset, price: match.price, open: match.price - match.change, high: match.high, low: match.low, previousClose: match.price - match.change, change: match.change, percentChange: match.percentChange, volume: match.volume, fiftyTwoWeekLow: match.yearLow, fiftyTwoWeekHigh: match.yearHigh, marketOpen: false, asOf: new Date().toISOString(), source: 'illustrative' };
  }
  const quote = await cached<Record<string, unknown>>(`quote:${asset.symbol}:${asset.exchange}`, 10_000, () => twelveData('/quote', { symbol: asset.symbol, exchange: asset.exchange, prepost: 'true' }, apiKey));
  const profile = includeProfile ? await cached<Record<string, unknown> | null>(`profile:${asset.symbol}:${asset.exchange}`, 24 * 60 * 60_000, async () => {
    try { return await twelveData('/profile', { symbol: asset.symbol, exchange: asset.exchange }, apiKey); } catch { return null; }
  }) : null;
  const price = number(quote.extended_price) ?? number(quote.close);
  if (price === undefined) throw new Error('La cotización no incluye un precio válido.');
  const range = quote.fifty_two_week && typeof quote.fifty_two_week === 'object' ? quote.fifty_two_week as Record<string, unknown> : {};
  const timestamp = number(quote.extended_timestamp) ?? number(quote.last_quote_at) ?? number(quote.timestamp);
  return {
    ...asset, symbol: String(quote.symbol ?? asset.symbol), name: String(quote.name ?? profile?.name ?? asset.name), exchange: String(quote.exchange ?? asset.exchange), currency: String(quote.currency ?? asset.currency),
    price, open: number(quote.open), high: number(quote.high), low: number(quote.low), previousClose: number(quote.previous_close), change: number(quote.extended_change) ?? number(quote.change), percentChange: number(quote.extended_percent_change) ?? number(quote.percent_change), volume: number(quote.volume), marketOpen: typeof quote.is_market_open === 'boolean' ? quote.is_market_open : undefined, fiftyTwoWeekLow: number(range.low), fiftyTwoWeekHigh: number(range.high), asOf: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(), source: 'twelve-data',
    description: typeof profile?.description === 'string' ? profile.description : undefined, sector: typeof profile?.sector === 'string' ? profile.sector : undefined, industry: typeof profile?.industry === 'string' ? profile.industry : undefined, website: typeof profile?.website === 'string' ? profile.website : undefined,
  };
}
