export const interestTags = ['TECH', 'AI', 'NVDA', 'CRYPTO', 'BTC', 'FUNDS', 'ETF', 'BUDGET', 'BASICS', 'RISK', 'MARKETS'] as const;
export type InterestTag = typeof interestTags[number];
export type FeedPreferences = Partial<Record<InterestTag, 'hide' | 'show'>>;
export type PreferenceUpdateEvent = { type: 'USER_PREFERENCE_UPDATE'; preferences: FeedPreferences };
export type EngagementEvent = {
  type: 'USER_ENGAGEMENT_EVENT'; eventId: string; postId: string;
  watchTimeMs: number; completionRate: number;
};
export type BehaviourMemory = {
  enabled: boolean; consentVersion: string; consentedAt: number; expiresAt: number;
  affinities: Partial<Record<InterestTag, number>>;
  seen: string[]; lastEvents: number[]; postCounts: Record<string, number>;
};
export type ContentContext = { id: string; title: string; text: string; tags: InterestTag[]; demo: boolean };
export const tagLabels: Record<InterestTag, string> = {
  TECH: 'Tecnología', AI: 'Inteligencia artificial', NVDA: 'NVIDIA', CRYPTO: 'Criptomonedas', BTC: 'Bitcoin',
  FUNDS: 'Fondos', ETF: 'ETF', BUDGET: 'Gestionar dinero', BASICS: 'Primeros pasos', RISK: 'Riesgo', MARKETS: 'Mercados',
};

export function contentTags(content: { topic?: string; title?: string; text?: string; asset?: { symbol: string } }): InterestTag[] {
  const tags = new Set<InterestTag>();
  const topics: Record<string, InterestTag> = { 'Primeros pasos': 'BASICS', 'Gestionar dinero': 'BUDGET', Riesgo: 'RISK', Fondos: 'FUNDS', Mercados: 'MARKETS' };
  if (content.topic && topics[content.topic]) tags.add(topics[content.topic]);
  const text = `${content.title ?? ''} ${content.text ?? ''} ${content.asset?.symbol ?? ''}`.toLowerCase();
  if (/\b(cripto\w*|crypto\w*|bitcoin|btc|ethereum)\b/.test(text)) tags.add('CRYPTO');
  if (/\b(bitcoin|btc)\b/.test(text)) tags.add('BTC');
  if (/\b(nvda|nvidia)\b/.test(text)) { tags.add('NVDA'); tags.add('TECH'); tags.add('AI'); }
  if (/\b(tecnolog\w*|technology|tech)\b/.test(text)) tags.add('TECH');
  if (/\b(inteligencia artificial|artificial intelligence|ia|ai)\b/.test(text)) tags.add('AI');
  if (/\b(etfs?|vwce)\b/.test(text)) { tags.add('ETF'); tags.add('FUNDS'); }
  return [...tags];
}
