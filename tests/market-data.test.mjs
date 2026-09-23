import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAnnualReturn, getAssetQuote, getEuroRate, searchAssets } from '../apps/web/src/server/marketData.ts';

test('illustrative market fallback is explicit and supports multiple asset classes', async () => {
  const stockSearch = await searchAssets('Apple', '');
  const cryptoSearch = await searchAssets('Bitcoin', '');
  assert.equal(stockSearch.configured, false);
  assert.equal(stockSearch.results[0].symbol, 'AAPL');
  assert.equal(cryptoSearch.results[0].symbol, 'BTC/USD');
  const quote = await getAssetQuote(stockSearch.results[0], true, '');
  assert.equal(quote.source, 'illustrative');
  assert.equal(Number.isFinite(quote.price), true);
  assert.equal(quote.currency, 'USD');
});

test('autocomplete accepts dollar-prefixed tickers and sector tags without inventing annual returns', async () => {
  assert.equal((await searchAssets('$NVDA', '')).results[0].symbol, 'NVDA');
  assert.ok((await searchAssets('nube', '')).results.some(asset => asset.symbol === 'MSFT'));
  const result = (await searchAssets('inteligencia artificial', '')).results[0];
  assert.equal(result.symbol, 'NVDA');
  const quote = await getAssetQuote({ ...result, currency: 'EUR', name: 'forged', type: 'ETF' }, true, '');
  assert.equal(quote.currency, 'USD');
  assert.equal(quote.type, 'Common Stock');
  assert.equal(quote.oneYearReturn, undefined);
  assert.equal(await getAnnualReturn(result, ''), undefined);
});

test('one-year price return is calculated from dated history and unavailable for short history', async () => {
  const original = globalThis.fetch;
  const today = new Date(); const lastYear = new Date(today); lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);
  const latest = today.toISOString().slice(0, 10), first = lastYear.toISOString().slice(0, 10);
  globalThis.fetch = async url => new Response(JSON.stringify({ values: String(url).includes('SHORT-HISTORY') ? [{ datetime: latest, close: '100' }] : [{ datetime: latest, close: '100' }, { datetime: first, close: '80' }] }));
  try {
    const annual = await getAnnualReturn({ symbol: 'ANNUAL-TEST', exchange: 'NASDAQ' }, 'test-key');
    assert.equal(annual.percent, 25);
    assert.equal(annual.from, first);
    assert.equal(annual.to, latest);
    assert.equal(await getAnnualReturn({ symbol: 'SHORT-HISTORY', exchange: 'NASDAQ' }, 'test-key'), undefined);
  } finally { globalThis.fetch = original; }
});

test('exchange conversion keeps demo values explicit and rejects missing or unsupported currencies', async () => {
  const demo = await getEuroRate('USD', '');
  assert.equal(demo.perEuro, 1.09);
  assert.equal(demo.source, 'illustrative');
  assert.equal((await getEuroRate('EUR', '')).perEuro, 1);
  await assert.rejects(getEuroRate('GBP', ''));
  await assert.rejects(getEuroRate('USDT', ''));
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ rate: '0.84', timestamp: 1700000000 }));
  try {
    assert.equal((await getEuroRate('GBP', 'test-key')).perEuro, 0.84);
  } finally { globalThis.fetch = original; }
});

test('illustrative fallback never invents an unknown asset quote', async () => {
  await assert.rejects(
    getAssetQuote({ symbol: 'UNKNOWN', name: 'Unknown', exchange: '', currency: 'EUR', type: 'Instrument' }, false, ''),
    /necesita una clave de Twelve Data/,
  );
});

test('configured provider maps search and live quote fields without exposing the key', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url, options) => {
    urls.push({ url: String(url), authorization: options.headers.Authorization });
    if (String(url).includes('symbol_search')) return new Response(JSON.stringify({ status: 'ok', data: [{ symbol: 'TEST', instrument_name: 'Test Corp', exchange: 'NASDAQ', mic_code: 'XNAS', country: 'United States', currency: 'USD', instrument_type: 'Common Stock' }] }));
    return new Response(JSON.stringify({ symbol: 'TEST', name: 'Test Corp', exchange: 'NASDAQ', currency: 'USD', close: '25.50', open: '25', high: '26', low: '24.5', previous_close: '24.75', change: '0.75', percent_change: '3.03', volume: '12000', is_market_open: true, timestamp: 1700000000, fifty_two_week: { low: '18', high: '29' } }));
  };
  try {
    const search = await searchAssets('unique-provider-test', 'secret-test-key');
    const quote = await getAssetQuote(search.results[0], false, 'secret-test-key');
    assert.equal(search.configured, true);
    assert.equal(quote.source, 'twelve-data');
    assert.equal(quote.price, 25.5);
    assert.equal(quote.marketOpen, true);
    assert.ok(urls.every(request => !request.url.includes('secret-test-key')));
    assert.ok(urls.every(request => request.authorization === 'apikey secret-test-key'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('history without credentials stays empty instead of fabricating a chart', async () => {
  const { getAssetHistory } = await import('../apps/web/src/server/marketData.ts');
  const history = await getAssetHistory({ symbol: 'AAPL', exchange: 'NASDAQ', currency: 'USD' }, '1D', '');
  assert.equal(history.configured, false);
  assert.deepEqual(history.points, []);
  await assert.rejects(getAssetHistory({ symbol: 'AAPL' }, 'toString', ''), /Periodo/);
});

test('history orders, deduplicates and filters invalid bars, identifies venue and coalesces refreshes', async () => {
  const { getAssetHistory } = await import('../apps/web/src/server/marketData.ts');
  const original = globalThis.fetch;
  let calls = 0;
  const asset = { symbol: 'HISTORY-TEST', exchange: 'NASDAQ', micCode: 'XNAS', currency: 'USD' };
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url.searchParams.get('timezone'), 'UTC');
    assert.equal(url.searchParams.get('mic_code'), 'XNAS');
    assert.equal(url.searchParams.get('interval'), '5min');
    assert.equal(url.searchParams.has('apikey'), false);
    assert.equal(options.headers.Authorization, 'apikey test-key');
    return new Response(JSON.stringify({ meta: { symbol: asset.symbol, currency: 'USD' }, values: [
      { datetime: '2026-09-23 12:05:00', close: '102' },
      { datetime: '2026-09-23 12:00:00', close: '100' },
      { datetime: '2026-09-23 12:00:00', close: '101' },
      { datetime: '2026-09-20 12:00:00', close: '90' },
      { datetime: 'invalid', close: '80' },
      { datetime: '2026-09-23 12:10:00', close: '-1' },
      { datetime: '2026-09-23 12:15:00', close: 'NaN' },
    ] }));
  };
  try {
    const [history, duplicate] = await Promise.all([getAssetHistory(asset, '1D', 'test-key'), getAssetHistory(asset, '1D', 'test-key')]);
    assert.deepEqual(history.points, [{ at: '2026-09-23T12:00:00Z', price: 101 }, { at: '2026-09-23T12:05:00Z', price: 102 }]);
    assert.deepEqual(history, duplicate);
    await getAssetHistory(asset, '1D', 'test-key');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('history preserves daily exchange dates and rejects unavailable, mismatched or rate-limited data', async () => {
  const { getAssetHistory } = await import('../apps/web/src/server/marketData.ts');
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    const symbol = url.searchParams.get('symbol');
    if (symbol === 'LIMITED-HISTORY') return new Response(JSON.stringify({ status: 'error', message: 'Rate limit' }), { status: 429 });
    if (symbol === 'EMPTY-HISTORY') return new Response(JSON.stringify({ values: [] }));
    if (symbol === 'WRONG-HISTORY') return new Response(JSON.stringify({ meta: { symbol: 'OTHER' }, values: [] }));
    return new Response(JSON.stringify({ meta: { exchange_timezone: 'America/New_York' }, values: [{ datetime: '2026-09-23', close: '50' }] }));
  };
  try {
    const daily = await getAssetHistory({ symbol: 'DAILY-HISTORY', currency: 'USD', exchange: 'NASDAQ' }, '1M', 'test-key');
    assert.equal(daily.points[0].at, '2026-09-23');
    assert.equal(daily.timezone, 'America/New_York');
    for (const symbol of ['LIMITED-HISTORY', 'EMPTY-HISTORY', 'WRONG-HISTORY']) {
      await assert.rejects(getAssetHistory({ symbol, currency: 'USD', exchange: 'NASDAQ' }, '1D', 'test-key'));
    }
  } finally { globalThis.fetch = original; }
});
