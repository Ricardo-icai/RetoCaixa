import { isPurchaseGoal, purchasePlan } from './purchase.ts';
import type { Action, Profile } from '../../types/src/conversation.ts';

export const demoProduct = Object.freeze({ id: 'DEMO-GLOBAL', name: 'Plan global simulado', horizonMonths: 60, minimumRisk: 40, annualCostPercent: 0.2, minimumContribution: 10, simulated: true });
const cents = (value: number) => Math.round(value * 100);
export function financialCapacity(profile: Profile) {
  const keys = ['monthlyIncome', 'essentialExpenses', 'monthlyDebtPayments', 'nearTermCommitments', 'emergencySavings', 'monthlyContribution'] as const;
  if (keys.some(key => typeof profile[key] !== 'number' || !Number.isFinite(profile[key]) || profile[key]! < 0 || profile[key]! > 10000000)) return { complete: false, available: 0, bufferMonths: null, protect: false };
  const monthlyOutgoings = cents(profile.essentialExpenses!) + cents(profile.monthlyDebtPayments!) + cents(profile.nearTermCommitments!);
  const disposableCents = Math.max(0, cents(profile.monthlyIncome!) - monthlyOutgoings);
  // Zero expenses cannot establish a reliable emergency-buffer ratio.
  const bufferMonths = monthlyOutgoings > 0 ? cents(profile.emergencySavings!) / monthlyOutgoings : null;
  const requiredBufferMonths = profile.stableIncome === false ? 6 : 3;
  const protect = profile.highCostDebt === true || bufferMonths === null || bufferMonths < requiredBufferMonths || disposableCents === 0;
  return { complete: true, available: Math.min(disposableCents, cents(profile.monthlyContribution!)) / 100, bufferMonths, requiredBufferMonths, protect };
}
export function riskAssessment(profile: Profile, capacity: ReturnType<typeof financialCapacity>) {
  const tolerance = profile.riskTolerance ? { low: 20, medium: 50, high: 80 }[profile.riskTolerance] : 0;
  const capacityScore = !capacity.complete || capacity.protect ? 0 : capacity.bufferMonths! >= 6 ? 70 : 40;
  return { tolerance, capacity: capacityScore, effective: Math.min(tolerance, capacityScore) };
}
export type DecisionContext = { missing: string[]; stale: boolean; uncertain: boolean; intent: string; compliancePassed: boolean };
export function decide(profile: Profile, context: DecisionContext, capacity = financialCapacity(profile), risk = riskAssessment(profile, capacity)): { action: Action; reason: string; amount?: number } {
  if (context.uncertain || context.stale) return { action: 'ASK_CLARIFICATION', reason: context.stale ? 'stale' : 'uncertain' };
  if (profile.highCostDebt === true || (capacity.complete && capacity.protect)) return { action: 'PROTECT', reason: profile.highCostDebt ? 'debt' : 'buffer' };
  if (context.intent === 'human') return { action: 'WAIT', reason: 'human' };
  if (context.intent === 'fomo') return { action: 'WAIT', reason: 'fomo' };
  if (context.intent === 'panic') return { action: 'WAIT', reason: 'panic' };
  if (context.intent === 'education') return { action: 'LEARN', reason: 'education' };
  if (context.intent === 'market') return { action: 'WAIT', reason: 'market_unavailable' };
  if (isPurchaseGoal(profile.goal) && !context.missing.length && purchasePlan(profile)) return { action: 'LEARN', reason: 'purchase_plan' };
  if (context.missing.length || !capacity.complete) return { action: 'ASK_CLARIFICATION', reason: 'missing' };
  if (!context.compliancePassed) return { action: 'WAIT', reason: 'compliance' };
  if (profile.horizonMonths! < demoProduct.horizonMonths) return { action: 'WAIT', reason: 'horizon' };
  if (risk.effective < demoProduct.minimumRisk) return { action: 'WAIT', reason: 'risk' };
  if (profile.portfolio !== 'none') return { action: 'WAIT', reason: 'portfolio_unverified' };
  if (capacity.available < demoProduct.minimumContribution) return { action: 'WAIT', reason: 'amount' };
  return { action: 'INVEST', reason: 'demo_eligible', amount: capacity.available };
}
