import type { SocialProfile } from './socialTypes';
export const investmentTags = ['🚀 Growth', '🛡️ Conservador', '🌍 Fondos indexados', '🤖 Tecnología', '💎 Cripto'] as const;
export type InvestmentTag = typeof investmentTags[number];
export type Persona = { handle: string; bio: string; avatar: string | null; investmentTag: InvestmentTag | null };
export type ProfileDetail = {
  profile: SocialProfile & Persona;
  mine: boolean; visibility: 'PUBLIC' | 'PRIVATE'; revision: number; csrfToken: string;
  fictional: boolean;
  holdings: { symbol: string; weight: number }[];
  return1Y: number | null;
  reels: { id: string; title: string; text: string; videoUrl: string }[];
};
