import type { BehaviourMemory, ContentContext, EngagementEvent, FeedPreferences, InterestTag } from '../../../packages/types/src/social.ts';

const matches: Array<[InterestTag, RegExp]> = [
  ['CRYPTO', /\b(criptomonedas?|cripto|cryptocurrenc(?:y|ies)|crypto)\b/], ['BTC', /\b(bitcoin|btc)\b/],
  ['NVDA', /\b(nvidia|nvda)\b/], ['TECH', /\b(tecnologia|technology|tech)\b/],
  ['AI', /\b(inteligencia artificial|artificial intelligence|ia|ai)\b/], ['ETF', /\betfs?\b/],
  ['FUNDS', /\b(fondos?|funds?)\b/],
];

export function preferenceUpdates(text: string): FeedPreferences {
  const updates: FeedPreferences = {};
  for (const clause of text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').split(/[.!?;\n]|\bpero\b|\bbut\b/)) {
    const value = clause.trim();
    const hide = /^(?:y |and )?(?:no me interesan?\b|no quiero ver\b|oculta\b|deja de mostrar(?:me)?\b|i(?: am|'m) not interested in\b|hide\b|stop showing\b)/.test(value);
    const show = /^(?:y |and )?(?:vuelve a mostrar(?:me)?\b|quiero volver a ver\b|muestra(?:me)? de nuevo\b|show me\b|show .* again\b)/.test(value);
    if (!hide && !show) continue;
    for (const [tag, pattern] of matches) if (pattern.test(value)) updates[tag] = hide ? 'hide' : 'show';
  }
  return updates;
}

export interface MultimodalContentAgent {
  analyse(content: ContentContext): Promise<{ tags: InterestTag[]; transcriptAvailable: boolean; fomoWarning: boolean; source: 'catalogue' }>;
}
export interface CreatorTrustAgent {
  evaluate(content: ContentContext): Promise<{ status: 'unverified'; trustScore: null; verifiedReturn1Y: null }>;
}
export class CatalogueContentAgent implements MultimodalContentAgent {
  async analyse(content: ContentContext) {
    // The sample video does not narrate the lesson. Only catalogue metadata is analysed.
    return { tags: content.tags, transcriptAvailable: false, source: 'catalogue' as const,
      fomoWarning: /\b(compra ahora|ultima oportunidad|rentabilidad garantizada|buy now|guaranteed returns)\b/i.test(content.text.normalize('NFD').replace(/\p{Diacritic}/gu, '')) };
  }
}
export class UnverifiedCreatorAgent implements CreatorTrustAgent {
  async evaluate(_content: ContentContext) { return { status: 'unverified' as const, trustScore: null, verifiedReturn1Y: null }; }
}
export class BehaviouralPsychologyAgent {
  async observe(memory: BehaviourMemory, event: EngagementEvent, tags: InterestTag[], excluded: InterestTag[]) {
    const affinities = { ...memory.affinities };
    if (tags.some(tag => excluded.includes(tag))) return affinities;
    // Attention is a weak educational-interest signal, never evidence of risk tolerance or FOMO.
    const increment = Math.min(2, event.watchTimeMs / 4000) * (0.5 + event.completionRate / 2);
    for (const tag of tags) affinities[tag] = Math.min(10, (affinities[tag] ?? 0) + increment);
    return affinities;
  }
}
