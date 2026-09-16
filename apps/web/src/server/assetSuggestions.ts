import { discoveryAssets } from '../market/catalogue.ts';
import type { InvestorGoal } from '../community/types.ts';
import { findSession } from './sessions.ts';
import { learningPlan } from './feedRecommendations.ts';

export function assetSuggestions(goals: InvestorGoal[], sessionId?: string) {
  const entry = findSession(sessionId);
  const sectors = new Map<string, number>();
  const contexts = [
    { learning: entry?.session.learning, weight: 1 },
    ...(entry?.savedConversations ?? []).map((saved, i) => ({ learning: saved.learning, weight: 0.65 / (1 + i * 0.2) })),
  ];
  for (const { learning, weight } of contexts) for (const [sector, score] of Object.entries(learning?.sectors ?? {})) sectors.set(sector, Math.max(sectors.get(sector) ?? 0, score * weight));
  const plan = learningPlan(goals, sessionId);
  const hasFunds = plan.focus.some(item => item.topic === 'Fondos');
  const score = (tags: string[] = []) => Math.max(0, ...tags.map(tag => sectors.get(tag) ?? (hasFunds && tag === 'Índices y fondos' ? 4 : 0)));
  const assets = [...discoveryAssets].sort((a, b) => score(b.tags) - score(a.tags)).slice(0, 4).map(asset => {
    const sector = [...(asset.tags ?? [])].sort((a, b) => (sectors.get(b) ?? 0) - (sectors.get(a) ?? 0))[0];
    return { ...asset, kaiReason: (sectors.get(sector) ?? 0) >= 4 ? `Para explorar tu interés en ${sector.toLowerCase()}` : hasFunds && asset.type === 'ETF' ? 'Para estudiar fondos y diversificación' : 'Una alternativa para ampliar lo que conoces' };
  });
  return { assets, personalized: assets.some(asset => score(asset.tags) >= 4), learningNote: plan.focus.some(item => item.reason === 'protection') ? 'KAI prioriza aprender sobre presupuesto y colchón. Estos activos son material de exploración, no una propuesta de compra para tu situación.' : 'Ideas para investigar según tus intereses; no acreditan que un activo sea adecuado para ti.' };
}
