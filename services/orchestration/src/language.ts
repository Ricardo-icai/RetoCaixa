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
    if (Object.hasOwn(enums, key) && typeof value === 'string' && enums[key as keyof typeof enums].includes(value)) output[key] = value;
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
  const words: Record<string, string> = { cero: '0', zero: '0', uno: '1', un: '1', una: '1', one: '1', dos: '2', two: '2', tres: '3', three: '3', cuatro: '4', four: '4', cinco: '5', five: '5', seis: '6', six: '6', diez: '10', ten: '10', veinte: '20', twenty: '20', veinticinco: '25', treinta: '30', cincuenta: '50', cien: '100' };
  const t = normalize(text).replace(/\b(cero|zero|uno|one|dos|two|tres|three|cuatro|four|cinco|five|seis|six|diez|ten|veinte|twenty|veinticinco|treinta|cincuenta|cien)\b/g, word => words[word]);
  let intent: Extraction['intent'] = 'profile';
  if (/aconsej|recomiend|que hago|invertir ahora|invest now|should i|advice/.test(t)) intent = 'advice';
  if (/que es|explica|aprender|entiendo|what is|explain|learn/.test(t)) intent = 'education';
  if (/noticias|mercado|tipos de interes|market|news/.test(t) && intent !== 'education') intent = 'market';
  if (/todo.*(?:\bia\b|tecnolog|crypto|cripto)|(?:\bia\b|tecnolog|crypto|cripto).*todo|to the moon|fomo|all.*(?:\bai\b|tech|crypto)/.test(t)) intent = 'fomo';
  if (/panico|miedo|vendo todo|vender todo|panic|sell everything|crash/.test(t)) intent = 'panic';
  if (/humano|persona real|asesor|human|advisor/.test(t)) intent = 'human';
  const facts: Record<string, unknown> = {};
  const n = '(\\d+(?:[.,]\\d+)*(?:\\s?mil\\b|k\\b)?)';
  const number = (raw: string) => parseNumber(raw.replace(/\s?mil|k/g, '')) * (/mil|k/.test(raw) ? 1000 : 1);
  const explicit: [Field, RegExp][] = [
    ['monthlyIncome', new RegExp(`(?:gano|cobro|ingreso|ingresos(?: son)?|earn|income(?: is)?)\\s*(?:unos? |de |son |netos? )?[€$]?\\s*${n}`)],
    ['essentialExpenses', new RegExp(`(?:gasto|gastos(?: son)?|spend|expenses(?: are)?)\\s*(?:unos? |de |son )?[€$]?\\s*${n}`)],
    ['monthlyContribution', new RegExp(`(?:aportar|aporto|invertir|invierto|contribute|invest)\\s*(?:unos? |cada mes )?[€$]?\\s*${n}\\s*(?:euros?|pavos|€)?\\s*(?:al mes|mensual|a month|monthly|per month)`) ],
    ['emergencySavings', new RegExp(`(?:colchon|imprevistos|emergency (?:savings|fund))\\s*(?:de |es |son |is )?[€$]?\\s*${n}`)],
  ];
  let uncertain = false;
  for (const [key, pattern] of explicit) {
    const matches = [...t.matchAll(new RegExp(pattern.source, 'g'))];
    if (matches.length > 1) uncertain = true;
    else if (matches.length === 1) facts[key] = number(matches[0][1]);
  }
  const horizon = t.match(new RegExp(`${n}\\s*(anos?|meses?|years?|months?)`));
  if (horizon && !/colchon|emergenc|edad|tengo \d+ anos|years old/.test(t)) facts.horizonMonths = number(horizon[1]) * (/ano|year/.test(horizon[2]) ? 12 : 1);
  if (/\b(no tengo deudas|sin deudas|no debt)[.! ]*$/.test(t)) { facts.highCostDebt = false; facts.monthlyDebtPayments = 0; }
  if (/tengo (?:una )?deuda.*(?:alta|revolving)|high.interest debt/.test(t) && !/no tengo|no high/.test(t)) facts.highCostDebt = true;
  if (/ingresos (?:son )?(?:inestables|irregulares)|income is (?:unstable|irregular)/.test(t)) facts.stableIncome = false;
  else if (/ingresos (?:son )?estables|income is stable/.test(t)) facts.stableIncome = true;

  const pending = session.pending;
  const negative = /-\s*[€$]?\s*\d/.test(t) || /menos\s+\d/.test(t);
  const hypothetical = /\b(si ganara|si tuviera|supongamos|imagine|if i earned|if i had)\b/.test(t);
  const instruction = /ignora|ignore|system prompt|instrucciones|instructions|actua como|act as/.test(t);
  const negatedNumber = /\bno\s+(?:gano|cobro|ingreso|gasto|tengo|invierto)|\bdon.t\s+(?:earn|have|spend)/.test(t) && /\d/.test(t);
  uncertain ||= negative || hypothetical || instruction || negatedNumber;
  if (intent === 'profile' || intent === 'advice') {
    if (pending && numeric.includes(pending) && Object.keys(facts).length === 0 && !negative) {
      const matches = [...t.matchAll(new RegExp(n, 'g'))];
      if (matches.length === 1 && pending !== 'horizonMonths' && !/\?|tengo \d+ anos|years old|\b(?:ano|anos|meses|years|months)\b/.test(t)) facts[pending] = number(matches[0][1]);
      if (matches.length > 1) uncertain = true;
      if (/^(?:cero|zero|nada|ninguno|ninguna|none|nothing|no)(?:[.! ]*)$/.test(t) && pending !== 'horizonMonths') facts[pending] = 0;
    }
    if (pending === 'goal' && /viaj|casa|vivienda|coche|futuro|ahorrar|jubil|estudi|patrimonio|largo plazo|travel|house|car\b|future|retire|save|wealth/.test(t)) facts.goal = text.slice(0, 180);
    if (pending === 'highCostDebt') {
      if (/^(no|ninguna|nope)\b/.test(t)) facts.highCostDebt = false;
      else if (/^(si|yes)\b/.test(t)) facts.highCostDebt = true;
    }
    if (pending === 'stableIncome') {
      if (/inestable|irregular|cambian|variable|unstable|vary|changes|no (?:son )?estables|not stable/.test(t)) facts.stableIncome = false;
      else if (/estable|stable|^(si|yes)\b/.test(t)) facts.stableIncome = true;
    }
    if (pending === 'riskTolerance') {
      if (/no (?:quiero )?vender|not sell/.test(t)) uncertain = true;
      else if (/vender|vendo|sell|^baj[oa]$/.test(t)) facts.riskTolerance = 'low';
      else if (/seguir|aport|compr|buy|contribut/.test(t)) facts.riskTolerance = 'high';
      else if (/esper|mant|wait|hold|medium/.test(t)) facts.riskTolerance = 'medium';
    }
    if (pending === 'experience') {
      if (/empez|principiante|nada|beginner|starting/.test(t)) facts.experience = 'beginner';
      else if (/algo|poco|some/.test(t)) facts.experience = 'some';
      else if (/bien|experto|experienced/.test(t)) facts.experience = 'experienced';
    }
    if (pending === 'portfolio') {
      if (/^no (?:estan|son) diversific/.test(t)) facts.portfolio = 'concentrated';
      else if (/^(no|ninguna|none)\b/.test(t)) facts.portfolio = 'none';
      else if (/diversific|diversified/.test(t)) facts.portfolio = 'diversified';
      else if (/concentr|solo|pocas/.test(t)) facts.portfolio = 'concentrated';
    }
  }
  const validated = validateFacts(facts);
  uncertain ||= Object.keys(validated).length !== Object.keys(facts).length;
  return { facts: uncertain ? {} : validated, intent, topic: t, uncertain };
}
