import type { Profile } from '../../types/src/conversation.ts';

export function isPurchaseGoal(goal?: string): boolean {
  const value = (goal ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /compr(?:ar|arme|arme)|comparme|\bbuy\b|movil|telefono|iphone|bicicleta|ordenador|portatil|phone|laptop/.test(value)
    && !/acciones|fondos|etf|bitcoin|cripto|crypto|stocks|shares|bonds/.test(value);
}

export function purchasePlan(profile: Profile) {
  const { goalAmount, goalSavings, horizonMonths, monthlyContribution } = profile;
  if ([goalAmount, goalSavings, horizonMonths, monthlyContribution].some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    || !goalAmount || !horizonMonths) return null;
  const remaining = Math.max(0, Math.round(goalAmount * 100) - Math.round(goalSavings! * 100));
  const perMonth = Math.ceil(remaining / horizonMonths) / 100;
  return { remaining: remaining / 100, perMonth, affordable: Math.round(monthlyContribution! * 100) >= Math.ceil(remaining / horizonMonths), monthsNeeded: monthlyContribution! > 0 ? Math.ceil(remaining / Math.round(monthlyContribution! * 100)) : null };
}
