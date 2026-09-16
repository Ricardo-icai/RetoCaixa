import { randomUUID } from 'node:crypto';
import type { AssetQuote, AssetSearchResult } from '../market/types.ts';
import type { PortfolioView, TradePreview } from '../market/trading.ts';
import { assetKey } from '../market/catalogue.ts';
import { getAssetQuote, getEuroRate, searchAssets, type FxQuote } from './marketData.ts';
import { HttpError } from './sessions.ts';

type Position = { id: string; asset: AssetSearchResult; units: number; costCents: number; nativeCost: number; quote: AssetQuote; fx: FxQuote };
export type PaperAccount = { cashCents: number; revision: number; positions: Map<string, Position>; previews: Map<string, TradePreview>; executed: Set<string>; busy: boolean; requests: number[] };
const globalAccounts = globalThis as typeof globalThis & { kaiPaperAccounts?: Map<string, PaperAccount> };
const accounts = globalAccounts.kaiPaperAccounts ??= new Map();
const cents = (value: number) => Math.round(value * 100);
type Market = { search: typeof searchAssets; quote: typeof getAssetQuote; fx: typeof getEuroRate };
const market: Market = { search: searchAssets, quote: getAssetQuote, fx: getEuroRate };

export function paperAccount(viewerId: string): PaperAccount {
  const previous = accounts.get(viewerId);
  if (previous) return previous;
  if (accounts.size >= 5000) throw new HttpError(503, 'La simulación está ocupada.');
  const account: PaperAccount = { cashCents: 1000000, revision: 0, positions: new Map(), previews: new Map(), executed: new Set(), busy: false, requests: [] };
  accounts.set(viewerId, account);
  return account;
}

export async function previewTrade(account: PaperAccount, input: Record<string, unknown>, provider: Market = market, now = Date.now()): Promise<TradePreview> {
  if (account.busy) throw new HttpError(409, 'Espera a que termine la consulta anterior.');
  const amount = input.amountEur;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1 || Math.abs(amount * 100 - cents(amount)) > 0.00001) throw new HttpError(400, 'El importe debe tener como máximo dos decimales y ser al menos 1 €.');
  if (cents(amount) > account.cashCents) throw new HttpError(409, 'El importe supera tu efectivo virtual.');
  if (typeof input.symbol !== 'string' || !/^[A-Z0-9./:_-]{1,30}$/.test(input.symbol) || typeof input.exchange !== 'string' || input.exchange.length > 60) throw new HttpError(400, 'Selecciona un activo válido.');
  account.requests = account.requests.filter(time => now - time < 60000);
  if (account.requests.length >= 30) throw new HttpError(429, 'Espera un minuto antes de volver a consultar.');
  account.requests.push(now);
  account.busy = true;
  try {
    const found = await provider.search(input.symbol);
    const asset = found.results.find(item => item.symbol === input.symbol && item.exchange === input.exchange);
    if (!asset) throw new HttpError(404, 'No se ha podido identificar ese activo y mercado.');
    const quote = await provider.quote(asset, true);
    if (quote.symbol !== asset.symbol || quote.exchange !== asset.exchange || quote.currency !== asset.currency || !Number.isFinite(quote.price) || quote.price <= 0) throw new HttpError(502, 'Los datos del activo no son coherentes. Vuelve a consultarlos.');
    const fx = await provider.fx(quote.currency);
    if (!Number.isFinite(fx.perEuro) || fx.perEuro <= 0 || fx.currency !== quote.currency || fx.source !== quote.source) throw new HttpError(502, 'No hay un cambio de divisa compatible con la cotización.');
    const nativeAmount = amount * fx.perEuro;
    const units = nativeAmount / quote.price;
    if (!Number.isFinite(units) || units <= 0) throw new HttpError(502, 'No se puede calcular una cantidad válida.');
    for (const [id, preview] of account.previews) if (Date.parse(preview.expiresAt) <= now) account.previews.delete(id);
    if (account.previews.size >= 5) account.previews.delete(account.previews.keys().next().value!);
    const preview: TradePreview = { id: randomUUID(), asset: quote, amountEur: amount, nativeAmount, units, fx, expiresAt: new Date(Date.now() + 60000).toISOString(), revision: account.revision };
    account.previews.set(preview.id, preview);
    return preview;
  } finally { account.busy = false; }
}

// Execution is synchronous and uses only a server-issued, single-use preview.
export function executeTrade(account: PaperAccount, id: unknown, reviewed: unknown, now = Date.now()) {
  if (typeof id !== 'string' || reviewed !== true) throw new HttpError(400, 'Revisa la información antes de confirmar.');
  if (account.executed.has(id)) return; // Retrying the same request never buys twice.
  const preview = account.previews.get(id);
  if (!preview || Date.parse(preview.expiresAt) <= now || preview.revision !== account.revision) throw new HttpError(409, 'La propuesta ha caducado o el saldo ha cambiado. Actualiza la información.');
  if (cents(preview.amountEur) > account.cashCents) throw new HttpError(409, 'No tienes suficiente efectivo virtual.');
  const key = assetKey(preview.asset);
  const existing = account.positions.get(key);
  if (!existing && account.positions.size >= 20) throw new HttpError(409, 'La demo admite hasta 20 posiciones.');
  account.positions.set(key, {
    id: existing?.id ?? randomUUID(), asset: preview.asset,
    units: (existing?.units ?? 0) + preview.units,
    costCents: (existing?.costCents ?? 0) + cents(preview.amountEur),
    nativeCost: (existing?.nativeCost ?? 0) + preview.nativeAmount,
    quote: preview.asset, fx: preview.fx,
  });
  account.cashCents -= cents(preview.amountEur);
  account.revision += 1;
  account.previews.clear();
  account.executed.add(id);
  if (account.executed.size > 200) account.executed.delete(account.executed.values().next().value!);
}

export async function portfolioSnapshot(account: PaperAccount, refresh = true, provider: Market = market): Promise<PortfolioView> {
  const cash = account.cashCents / 100;
  const revision = account.revision;
  const positions = [];
  // Bounded batches avoid bursts against the market provider's rate limit.
  const records = [...account.positions.values()].map(position => ({ ...position }));
  for (let offset = 0; offset < records.length; offset += 4) {
    const batch = await Promise.all(records.slice(offset, offset + 4).map(async position => {
      let quote = position.quote, fx = position.fx, stale = false;
      if (refresh) {
        try {
          [quote, fx] = await Promise.all([provider.quote(position.asset, false), provider.fx(position.asset.currency)]);
          if (quote.source !== position.quote.source || quote.currency !== position.asset.currency || quote.symbol !== position.asset.symbol || quote.exchange !== position.asset.exchange || !Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(fx.perEuro) || fx.perEuro <= 0 || fx.currency !== position.asset.currency || fx.source !== quote.source) throw new Error('incompatible_mark');
          const current = account.positions.get(assetKey(position.asset));
          if (current) { current.quote = quote; current.fx = fx; }
        } catch { quote = position.quote; fx = position.fx; stale = true; }
      }
      const investedEur = position.costCents / 100;
      const currentValueEur = cents(position.units * quote.price / fx.perEuro) / 100;
      const profitLossEur = cents(currentValueEur - investedEur) / 100;
      return { id: position.id, asset: position.asset, units: position.units, investedEur, averageBuyPrice: position.nativeCost / position.units, currentValueEur, profitLossEur, profitLossPercent: profitLossEur / investedEur * 100, price: quote.price, asOf: quote.asOf, source: quote.source, stale };
    }));
    positions.push(...batch);
  }
  const invested = cents(positions.reduce((sum, position) => sum + position.investedEur, 0)) / 100;
  const currentValue = cents(positions.reduce((sum, position) => sum + position.currentValueEur, 0)) / 100;
  const profitLoss = cents(currentValue - invested) / 100;
  return { currency: 'EUR', initialCash: 10000, cash, invested, currentValue, totalEquity: cents(cash + currentValue) / 100, profitLoss, profitLossPercent: invested > 0 ? profitLoss / invested * 100 : 0, positions, revision, stale: positions.some(position => position.stale) };
}
