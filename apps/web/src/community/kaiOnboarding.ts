import type { Language, Profile } from '../../../../packages/types/src/conversation.ts';

export type KaiOnboardingAnswers = Required<Pick<Profile, 'monthlyIncome' | 'essentialExpenses' | 'highCostDebt' | 'riskTolerance'>>;

export function validateKaiOnboarding(value: unknown): KaiOnboardingAnswers | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const keys = ['monthlyIncome', 'essentialExpenses', 'highCostDebt', 'riskTolerance'];
  if (Object.keys(data).length !== keys.length || Object.keys(data).some(key => !keys.includes(key))) return null;
  for (const field of ['monthlyIncome', 'essentialExpenses']) {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field]) || data[field] < 0 || data[field] > 10000000) return null;
  }
  if (typeof data.highCostDebt !== 'boolean' || typeof data.riskTolerance !== 'string' || !['low', 'medium', 'high'].includes(data.riskTolerance)) return null;
  return { monthlyIncome: data.monthlyIncome as number, essentialExpenses: data.essentialExpenses as number, highCostDebt: data.highCostDebt, riskTolerance: data.riskTolerance as KaiOnboardingAnswers['riskTolerance'] };
}

export function onboardingSummary(answers: KaiOnboardingAnswers, language: Language): string {
  const en = language === 'en';
  const money = (value: number) => new Intl.NumberFormat(en ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  const reaction = en ? { low: 'I would sell', medium: 'I would wait', high: 'I would buy more' } : { low: 'Vendería', medium: 'Esperaría', high: 'Compraría más' };
  return en
    ? `My starting point: monthly income ${money(answers.monthlyIncome)}; essential expenses ${money(answers.essentialExpenses)} (excluding debt payments and other commitments). High-cost debt: ${answers.highCostDebt ? 'yes' : 'no'}. If markets fell 20%: ${reaction[answers.riskTolerance]}.`
    : `Mi punto de partida: ingresos mensuales ${money(answers.monthlyIncome)}; gastos esenciales ${money(answers.essentialExpenses)} (sin cuotas de deuda ni otros compromisos). Deudas con intereses altos: ${answers.highCostDebt ? 'sí' : 'no'}. Ante una caída del 20 %: ${reaction[answers.riskTolerance]}.`;
}
