import type { Extraction, Field, Profile, Session } from './contracts.ts';

export const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const enums = { riskTolerance: ['low', 'medium', 'high'], experience: ['beginner', 'some', 'experienced'], portfolio: ['none', 'diversified', 'concentrated'] };
const numeric: Field[] = ['horizonMonths', 'monthlyIncome', 'essentialExpenses', 'monthlyDebtPayments', 'nearTermCommitments', 'emergencySavings', 'monthlyContribution'];

// Provider output and text parsing share the same runtime validation. Never coerce missing values to zero.
export function validateFacts(input: unknown): Profile {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (numeric.includes(key as Field) && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= (key === 'horizonMonths' ? 1200 : 10000000)) output[key] = Math.round(value * 100) / 100;
    if ((key === 'highCostDebt' || key === 'stableIncome') && typeof value === 'boolean') output[key] = value;
    if (key === 'goal' && typeof value === 'string' && value.trim().length > 1) output[key] = value.trim().slice(0, 180);
    if (key in enums && typeof value === 'string' && enums[key as keyof typeof enums].includes(value)) output[key] = value;
  }
  return output as Profile;
}

export function parseNumber(raw: string): number {
  let value = raw.replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) value = value.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(value)) value = value.replace(/,/g, '');
  else value = value.replace(',', '.');
  return Number(value);
}

export function extractLocally(text: string, session: Session): Extraction {
  const t = normalize(text);
  let intent: Extraction['intent'] = 'profile';
  if (/aconsej|recomiend|que hago|invertir ahora|invest now|should i|advice/.test(t)) intent = 'advice';
  if (/que es|explica|aprender|entiendo|what is|explain|learn/.test(t)) intent = 'education';
  if (/noticias|mercado|tipos de interes|market|news/.test(t) && intent !== 'education') intent = 'market';
  if (/todo.*(?:ia|tecnolog|crypto|cripto)|(?:ia|tecnolog|crypto|cripto).*todo|to the moon|fomo|all.*(?:ai|tech|crypto)/.test(t)) intent = 'fomo';
  if (/panico|miedo|vendo todo|vender todo|panic|sell everything|crash/.test(t)) intent = 'panic';
  if (/humano|persona real|asesor|human|advisor/.test(t)) intent = 'human';
  const facts: Record<string, unknown> = {};
  const n = '(\\d[\\d.,]*(?:\\s?mil|k)?)';
  const number = (raw: string) => parseNumber(raw.replace(/\s?mil|k/g, '')) * (/mil|k/.test(raw) ? 1000 : 1);
  const explicit: [Field, RegExp][] = [
    ['monthlyIncome', new RegExp(`(?:gano|cobro|ingreso|ingresos(?: son)?|earn|income(?: is)?)\\s*(?:unos? |de |son |netos? )?[€$]?\\s*${n}`)],
    ['essentialExpenses', new RegExp(`(?:gasto|gastos(?: son)?|spend|expenses(?: are)?)\\s*(?:unos? |de |son )?[€$]?\\s*${n}`)],
    ['monthlyContribution', new RegExp(`(?:aportar|aporto|invertir|invierto|contribute|invest)\\s*(?:unos? |cada mes )?[€$]?\\s*${n}\\s*(?:euros?|pavos|€)?\\s*(?:al mes|mensual|a month|monthly|per month)`) ],
    ['emergencySavings', new RegExp(`(?:colchon|imprevistos|emergency (?:savings|fund))\\s*(?:de |es |son |is )?[€$]?\\s*${n}`)],
  ];
  for (const [key, pattern] of explicit) { const match = t.match(pattern); if (match) facts[key] = number(match[1]); }
  const horizon = t.match(new RegExp(`${n}\\s*(anos?|meses?|years?|months?)`));
  if (horizon && !/colchon|emergenc/.test(t)) facts.horizonMonths = number(horizon[1]) * (/ano|year/.test(horizon[2]) ? 12 : 1);
  if (/no tengo deudas|sin deudas|no debt/.test(t)) { facts.highCostDebt = false; facts.monthlyDebtPayments = 0; }
  if (/tengo (?:una )?deuda.*(?:alta|revolving)|high.interest debt/.test(t) && !/no tengo|no high/.test(t)) facts.highCostDebt = true;
  if (/ingresos (?:son )?(?:inestables|irregulares)|income is (?:unstable|irregular)/.test(t)) facts.stableIncome = false;
  else if (/ingresos (?:son )?estables|income is stable/.test(t)) facts.stableIncome = true;

  const pending = session.pending;
  const negative = /(?:^|\s)-\s*\d/.test(t) || /menos\s+\d/.test(t);
  if (intent === 'profile' || intent === 'advice') {
    if (pending && numeric.includes(pending) && Object.keys(facts).length === 0 && !negative) {
      const matches = [...t.matchAll(new RegExp(n, 'g'))];
      if (matches.length === 1 && (pending !== 'horizonMonths' || horizon)) facts[pending] = number(matches[0][1]);
      if (/^(?:cero|zero|nada|ninguno|ninguna|none|nothing|no)(?:[.! ]*)$/.test(t) && pending !== 'horizonMonths') facts[pending] = 0;
    }
    if (pending === 'goal' && !/^(hola|hello|hi|buenas)[!. ]*$/.test(t) && text.length > 3) facts.goal = text.slice(0, 180);
    if (pending === 'highCostDebt') {
      if (/^(no|ninguna|nope)\b/.test(t)) facts.highCostDebt = false;
      else if (/^(si|yes)\b/.test(t)) facts.highCostDebt = true;
    }
    if (pending === 'stableIncome') {
      if (/inestable|irregular|cambian|variable|unstable|vary|changes/.test(t)) facts.stableIncome = false;
      else if (/estable|stable|^(si|yes)\b/.test(t)) facts.stableIncome = true;
    }
    if (pending === 'riskTolerance') {
      if (/vender|vendo|sell|baj[oa]/.test(t)) facts.riskTolerance = 'low';
      else if (/seguir|aport|compr|buy|contribut/.test(t)) facts.riskTolerance = 'high';
      else if (/esper|mant|wait|hold|medium/.test(t)) facts.riskTolerance = 'medium';
    }
    if (pending === 'experience') {
      if (/empez|principiante|nada|beginner|starting/.test(t)) facts.experience = 'beginner';
      else if (/algo|poco|some/.test(t)) facts.experience = 'some';
      else if (/bien|experto|experienced/.test(t)) facts.experience = 'experienced';
    }
    if (pending === 'portfolio') {
      if (/^(no|ninguna|none)\b/.test(t)) facts.portfolio = 'none';
      else if (/diversific|diversified/.test(t)) facts.portfolio = 'diversified';
      else if (/concentr|solo|pocas/.test(t)) facts.portfolio = 'concentrated';
    }
  }
  return { facts: negative ? {} : validateFacts(facts), intent, topic: t, uncertain: negative };
}
