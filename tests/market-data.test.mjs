import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAssetQuote, searchAssets } from '../apps/web/src/server/marketData.ts';

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
