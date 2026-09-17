import type { Extraction, Field, Session } from './contracts.ts';
import { question } from './questions.ts';
import { isPurchaseGoal, purchasePlan } from '../../../packages/decision-engine/src/purchase.ts';

export function contextualQuestion(field: Field, session: Session): string {
  if (isPurchaseGoal(session.profile.goal)) {
    const en = session.language === 'en';
    if (field === 'horizonMonths') return en ? 'When would you like to make that purchase?' : '¿Dentro de cuánto tiempo te gustaría hacer esa compra?';
    if (field === 'monthlyContribution') return en ? 'How much could you set aside each month for this purchase, after your expenses?' : '¿Cuánto podrías apartar al mes para esta compra después de cubrir tus gastos?';
  }
  return question(field, session.language);
}

export function acknowledgement(extraction: Extraction, session: Session, previous: Session): string {
  const facts = extraction.facts;
  const en = session.language === 'en';
  const money = (value: number) => new Intl.NumberFormat(en ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  const parts: string[] = [];
  if (facts.goal) parts.push(en ? `Your goal is: “${facts.goal}”.` : `Tu objetivo es: «${facts.goal}».`);
  if (facts.horizonMonths !== undefined) parts.push(en ? `You have ${facts.horizonMonths} months in mind.` : `Tienes en mente un plazo de ${facts.horizonMonths} meses.`);
  if (facts.goalAmount !== undefined) parts.push(en ? `The purchase costs ${money(facts.goalAmount)}.` : `La compra cuesta ${money(facts.goalAmount)}.`);
  if (facts.goalSavings !== undefined) parts.push(en ? `You already have ${money(facts.goalSavings)} for it.` : `Ya tienes ${money(facts.goalSavings)} reservados para ella.`);
  if (facts.monthlyContribution !== undefined) parts.push(en ? `You could set aside ${money(facts.monthlyContribution)} each month.` : `Podrías apartar ${money(facts.monthlyContribution)} al mes.`);
  if (facts.monthlyIncome !== undefined) parts.push(en ? `Your monthly income is ${money(facts.monthlyIncome)}.` : `Tus ingresos mensuales son ${money(facts.monthlyIncome)}.`);
  if (facts.essentialExpenses !== undefined) parts.push(en ? `Your essential expenses are ${money(facts.essentialExpenses)} a month.` : `Tus gastos esenciales son ${money(facts.essentialExpenses)} al mes.`);
  if (parts.length) return parts.join(' ') + ' ';
  if (Object.keys(facts).length) return en ? 'Thanks, I’ve updated that detail. ' : 'Gracias, he actualizado ese dato. ';
  if (session.pending === previous.pending) return en ? 'I haven’t understood that detail yet. You can give me an approximate answer in your own words. ' : 'Todavía no he entendido ese dato. Puedes darme una respuesta aproximada con tus palabras. ';
  return en ? 'Let’s take it one step at a time. ' : 'Vamos paso a paso. ';
}

export function purchaseReply(session: Session): string {
  const plan = purchasePlan(session.profile)!;
  const en = session.language === 'en';
  const money = (value: number) => new Intl.NumberFormat(en ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  if (plan.remaining === 0) return en ? 'The amount you have set aside already covers the price you gave me. Check that spending it leaves your essential expenses and emergency reserve covered. Would you like to revise the budget?' : 'Lo que ya tienes reservado cubre el precio que me has indicado. Comprueba que gastarlo te deje cubiertos los gastos esenciales y el colchón de imprevistos. ¿Quieres revisar el presupuesto?';
  const intro = en ? `For your goal “${session.profile.goal}”, you still need ${money(plan.remaining)}. Over ${session.profile.horizonMonths} months, that means ${money(plan.perMonth)} a month. ` : `Para tu objetivo «${session.profile.goal}», te faltan ${money(plan.remaining)}. Repartidos en ${session.profile.horizonMonths} meses, son ${money(plan.perMonth)} al mes. `;
  const result = plan.affordable
    ? en ? 'That fits the monthly amount you said you could save. ' : 'Encaja con la cantidad mensual que has dicho que podrías ahorrar. '
    : en ? `That exceeds your stated monthly amount.${plan.monthsNeeded ? ` At your pace, you would need about ${plan.monthsNeeded} months.` : ' With no monthly savings, you would need to revise the budget or timing.'} ` : `Supera la cantidad mensual que has indicado.${plan.monthsNeeded ? ` A tu ritmo, necesitarías unos ${plan.monthsNeeded} meses.` : ' Sin ahorro mensual, habría que revisar el presupuesto o el plazo.'} `;
  return intro + result + (en ? 'This is a savings calculation using your estimates, without assuming investment returns or checking all your expenses. Would you like to adjust the price or the timing?' : 'Es un cálculo de ahorro con tus estimaciones, sin contar con rendimientos de inversión ni dar por revisados todos tus gastos. ¿Quieres ajustar el precio o el plazo?');
}
