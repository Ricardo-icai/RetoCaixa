import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { paperAccount, previewTrade, executeTrade, portfolioSnapshot } from '../apps/web/src/server/trading.ts';

const asset = { symbol: 'ACME', name: 'Acme', exchange: 'NASDAQ', currency: 'USD', type: 'Common Stock' };
function market(price = 100, perEuro = 1.25) {
  return { search: async () => ({ results: [asset] }), quote: async () => ({ ...asset, price, source: 'illustrative', asOf: new Date().toISOString() }), fx: async () => ({ currency: 'USD', perEuro, source: 'illustrative', asOf: new Date().toISOString() }) };
}
const input = amountEur => ({ symbol: asset.symbol, exchange: asset.exchange, amountEur });
test('paper trades convert euros, persist positions, merge lots and calculate weighted cost and P&L', async () => {
  const id = randomUUID(); const account = paperAccount(id);
  let preview = await previewTrade(account, input(100), market());
  assert.equal(preview.units, 1.25);
  assert.equal(preview.nativeAmount, 125);
  executeTrade(account, preview.id, true);
  executeTrade(account, preview.id, true);
  assert.equal(account.cashCents, 990000, 'retrying cannot duplicate a trade');
  assert.equal(paperAccount(id), account);
  preview = await previewTrade(account, input(100), market(200));
  executeTrade(account, preview.id, true);
  const view = await portfolioSnapshot(account, true, market(200));
  assert.equal(view.cash, 9800);
  assert.equal(view.positions.length, 1);
  assert.equal(view.positions[0].units, 1.875);
  assert.ok(Math.abs(view.positions[0].averageBuyPrice - 133.33333333333334) < 1e-8);
  assert.equal(view.invested, 200);
  assert.equal(view.currentValue, 300);
  assert.equal(view.profitLoss, 100);
  assert.equal(view.profitLossPercent, 50);
  assert.equal(view.totalEquity, 10100);
});
test('invalid amounts, expired quotes, ownership and concurrent previews cannot bypass account limits', async () => {
  const account = paperAccount(randomUUID());
  for (const amount of [0, -5, NaN, Infinity, 1.001, 10000.01, '50']) await assert.rejects(previewTrade(account, input(amount), market()));
  const first = await previewTrade(account, input(7000), market());
  const second = await previewTrade(account, input(6000), market());
  assert.throws(() => executeTrade(paperAccount(randomUUID()), first.id, true), error => error.status === 409);
  assert.throws(() => executeTrade(account, first.id, false), error => error.status === 400);
  assert.throws(() => executeTrade(account, first.id, true, Date.parse(first.expiresAt) + 1), error => error.status === 409);
  executeTrade(account, first.id, true);
  assert.throws(() => executeTrade(account, second.id, true), error => error.status === 409);
  assert.equal(account.cashCents, 300000);
  assert.equal(account.positions.size, 1);
});
test('failed or incompatible market data cannot create a purchase and stale valuations are explicit', async () => {
  const account = paperAccount(randomUUID());
  await assert.rejects(previewTrade(account, input(100), { ...market(), quote: async () => ({ ...asset, currency: 'EUR', price: 100 }) }));
  await assert.rejects(previewTrade(account, input(100), { ...market(), fx: async () => ({ currency: 'USD', perEuro: 0, source: 'illustrative' }) }));
  assert.equal(account.cashCents, 1000000);
  const preview = await previewTrade(account, input(100), market());
  executeTrade(account, preview.id, true);
  const view = await portfolioSnapshot(account, true, { ...market(), quote: async () => { throw new Error('unavailable'); } });
  assert.equal(view.stale, true);
  assert.equal(view.currentValue, 100);
  assert.equal(view.profitLoss, 0);
  const empty = await portfolioSnapshot(paperAccount(randomUUID()));
  assert.equal(empty.profitLossPercent, 0);
  assert.equal(empty.totalEquity, 10000);
});
test('simultaneous preview requests release their lock even when the provider fails', async () => {
  const account = paperAccount(randomUUID());
  let reject;
  const first = previewTrade(account, input(100), { ...market(), search: () => new Promise((_, fail) => { reject = fail; }) });
  await assert.rejects(previewTrade(account, input(100), market()), error => error.status === 409);
  reject(new Error('provider down'));
  await assert.rejects(first);
  assert.equal(account.busy, false);
  assert.equal(account.cashCents, 1000000);
});
