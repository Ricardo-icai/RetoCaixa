import { isPurchaseGoal } from '../../../packages/decision-engine/src/purchase.ts';
import type { Field, Language, Profile } from './contracts.ts';

export const fields: Field[] = ['goal', 'horizonMonths', 'monthlyIncome', 'essentialExpenses', 'monthlyDebtPayments', 'nearTermCommitments', 'emergencySavings', 'highCostDebt', 'stableIncome', 'monthlyContribution', 'riskTolerance', 'experience', 'portfolio'];
export const questions: Record<Field, [string, string]> = {
  goalAmount: ['¿Cuánto cuesta aproximadamente lo que quieres comprar?', 'Roughly how much does the purchase cost?'],
  goalSavings: ['¿Cuánto tienes ya ahorrado para esta compra, sin contar tu colchón de imprevistos?', 'How much have you saved for this purchase, excluding your emergency reserve?'],
  goal: ['¿Qué te gustaría conseguir con tu dinero?', 'What would you like your money to help you achieve?'],
  horizonMonths: ['¿Dentro de cuánto tiempo necesitarás ese dinero?', 'How long before you will need that money?'],
  monthlyIncome: ['¿Cuánto ingresas al mes, aproximadamente?', 'Roughly how much do you earn each month?'],
  essentialExpenses: ['¿Cuánto gastas al mes en lo imprescindible, como vivienda, comida y transporte?', 'How much do your essential monthly expenses, such as housing, food and transport, add up to?'],
  monthlyDebtPayments: ['¿Cuánto pagas al mes por préstamos o deudas? Si no tienes, dime cero.', 'How much do you pay towards debts each month? Say zero if you have none.'],
  nearTermCommitments: ['¿Cuánto necesitas reservar al mes para otros compromisos próximos, fuera de tus gastos habituales?', 'How much do you need to set aside each month for upcoming commitments, beyond your regular expenses?'],
  emergencySavings: ['¿Cuánto tienes apartado para imprevistos, sin contar el dinero que quieres invertir?', 'How much have you set aside for emergencies, excluding the money you want to invest?'],
  highCostDebt: ['¿Tienes deudas con intereses altos, como tarjetas revolving?', 'Do you have high-interest debt, such as revolving credit card debt?'],
  stableIncome: ['¿Tus ingresos son estables o cambian bastante de un mes a otro?', 'Is your income stable, or does it change a lot from month to month?'],
  monthlyContribution: ['¿Qué cantidad te gustaría aportar al mes?', 'How much would you like to contribute each month?'],
  riskTolerance: ['Si tu inversión bajara un 15 %, ¿preferirías vender, esperar o seguir aportando?', 'If your investment fell by 15%, would you rather sell, wait or keep contributing?'],
  experience: ['¿Estás empezando, tienes algo de experiencia o ya conoces bien la inversión?', 'Are you a beginner, do you have some experience, or are you an experienced investor?'],
  portfolio: ['¿Ya tienes inversiones? Puedes decirme que no, que están diversificadas o que se concentran en pocas empresas o sectores.', 'Do you already have investments: none, diversified, or concentrated in a few companies or sectors?'],
};
export function question(field: Field, language: Language) { return questions[field][language === 'es' ? 0 : 1]; }
export function missing(profile: Profile) { const relevant: Field[] = isPurchaseGoal(profile.goal) ? ['goal', 'horizonMonths', 'goalAmount', 'goalSavings', 'monthlyContribution'] : fields; return relevant.filter(field => profile[field] === undefined); }
export function greeting(language: Language) {
  return language === 'es'
    ? 'Hola, soy KAI. Vamos a buscar un primer paso que encaje contigo, sin prisas. Puedes escribirme o hablar conmigo. ¿Qué te gustaría conseguir con tu dinero?'
    : "Hi, I’m KAI. Let’s find a first step that fits your life, at your pace. You can type or talk to me. What would you like your money to help you achieve?";
}
