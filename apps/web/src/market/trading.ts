import type { AssetQuote, AssetSearchResult } from './types.ts';

export type TradePreview = {
  id: string; asset: AssetQuote; amountEur: number; nativeAmount: number; units: number;
  fx: { currency: string; perEuro: number; asOf: string; source: AssetQuote['source'] };
  expiresAt: string; revision: number;
};
export type PositionView = {
  id: string; asset: AssetSearchResult; units: number; investedEur: number; averageBuyPrice: number;
  currentValueEur: number; profitLossEur: number; profitLossPercent: number;
  price: number; asOf: string; source: AssetQuote['source']; stale: boolean;
};
export type PortfolioView = {
  currency: 'EUR'; initialCash: 10000; cash: number; invested: number; currentValue: number;
  totalEquity: number; profitLoss: number; profitLossPercent: number; revision: number;
  positions: PositionView[]; stale: boolean;
};
export const money = (value: number, currency = 'EUR') => new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
export const decimal = (value: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 6 }).format(value);
export const percent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;
export function riskFor(type: string) {
  const value = type.toLowerCase();
  if (/digital|crypto/.test(value)) return 'Alta volatilidad y riesgos tecnológicos y de custodia.';
  if (/etf|fund/.test(value)) return 'Revisa composición, concentración, divisa, réplica y comisiones. Un ETF de acciones también puede sufrir pérdidas importantes.';
  if (/currency|forex/.test(value)) return 'El precio depende de dos divisas. La simulación no utiliza apalancamiento.';
  if (/bond/.test(value)) return 'Riesgo de tipos de interés y de solvencia del emisor.';
  return 'Riesgo de pérdida y de concentración. El precio puede cambiar antes de una operación real.';
}
