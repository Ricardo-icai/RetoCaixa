import type { Extraction, LearningContext, LearningFocus, LearningTopic, Profile } from './contracts.ts';
import { normalize } from './language.ts';

const topicPatterns: [LearningTopic, RegExp][] = [
  ['Primeros pasos', /\b(principiante|empezar|empezando|aprender a invertir|primeros pasos|beginner|getting started|learn to invest)\b/],
  ['Gestionar dinero', /\b(ahorr\w*|presupuesto|colchon|deuda\w*|gastos|casa|vivienda|viaje|coche|budget\w*|emergency|debt|sav\w*|house|travel)\b/],
  ['Riesgo', /\b(riesgo\w*|volatilidad|diversific\w*|miedo|perder|risk\w*|volatility|panic)\b/],
  ['Fondos', /\b(fondos?|etfs?|indexad\w*|jubilacion|largo plazo|interes compuesto|funds?|retire\w*|long term|compound interest)\b/],
  ['Mercados', /\b(mercado\w*|noticias|acciones|bolsa|bitcoin|cripto\w*|inflacion|market\w*|news|stocks?|crypto\w*|inflation)\b/],
];

// Only the language agent's accepted interpretation and evaluated profile are used.
// Assistant prompts and raw financial amounts are never exported to the community.
export function updateLearningContext(
  previous: LearningContext | undefined,
  extraction: Extraction,
  profile: Profile,
  capacity: { complete: boolean; protect: boolean },
): LearningContext {
  if (extraction.uncertain) return structuredClone(previous ?? { interests: {}, needs: [] });
  const interests = { ...previous?.interests };
  const text = normalize(extraction.topic ?? '');
  // A simple opt-out does not become a positive interest. More complex language
  // remains subject to the limits of the local interpreter.
  const sentences = text.split(/(?:[.!?;\n]+|\bpero\b|\bbut\b)/).filter(part => !/\b(no me interes\w*|no quiero (?!perder\b)|ya no|not interested|don't want|no longer)\b/.test(part));
  const matched = topicPatterns.filter(([, pattern]) => sentences.some(part => pattern.test(part)));
  const sectors = { ...previous?.sectors };
  const sectorPatterns: [string, RegExp][] = [
    ['IA y semiconductores', /\b(ia|ai|inteligencia artificial|artificial intelligence|semiconduct\w*|chips|nvidia|nvda)\b/],
    ['Software y nube', /\b(software|nube|cloud|microsoft|msft)\b/],
    ['Energía y movilidad', /\b(energia|energy|renovable\w*|tesla|tsla|vehiculos electricos)\b/],
    ['Índices y fondos', /\b(etfs?|fondos?|indexad\w*|indices|index|voo|vwce|spy)\b/],
    ['Criptoactivos', /\b(cripto\w*|crypto\w*|bitcoin|ethereum|btc|eth)\b/],
  ];
  const sectorMatches = sectorPatterns.filter(([, pattern]) => sentences.some(part => pattern.test(part)));
  if (sectorMatches.some(([sector]) => sector !== 'Índices y fondos') && !matched.some(([topic]) => topic === 'Mercados')) matched.push(topicPatterns[4]);
  if (sectorMatches.length) {
    for (const key of Object.keys(sectors)) sectors[key] *= 0.6;
    for (const [sector] of sectorMatches) sectors[sector] = 10;
  }
  if (matched.length) {
    for (const topic of Object.keys(interests) as LearningTopic[]) interests[topic] = (interests[topic] ?? 0) * 0.6;
    for (const [topic] of matched) interests[topic] = 10;
  }

  const needs: LearningFocus[] = [];
  const goal = normalize(profile.goal ?? '');
  for (const [topic, pattern] of topicPatterns) {
    if (pattern.test(goal)) needs.push({ topic, weight: 6, reason: 'goal' });
  }
  if (profile.horizonMonths !== undefined) {
    needs.push({ topic: profile.horizonMonths < 60 ? 'Gestionar dinero' : 'Fondos', weight: 8, reason: 'goal' });
  }
  if (profile.experience === 'beginner') needs.push({ topic: 'Primeros pasos', weight: 11, reason: 'foundation' });
  if (profile.highCostDebt === true || (capacity.complete && capacity.protect)) {
    needs.push({ topic: 'Gestionar dinero', weight: 15, reason: 'protection' });
  }
  if (profile.riskTolerance === 'low' || profile.portfolio === 'concentrated' || ['panic', 'fomo'].includes(extraction.intent)) {
    needs.push({ topic: 'Riesgo', weight: 13, reason: 'risk' });
  }
  return { interests, needs, sectors };
}
