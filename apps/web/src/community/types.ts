import type { LegalAcceptance } from '../legal/policy.ts';
import { learningTopics } from '../../../../packages/types/src/conversation.ts';
import type { Reel } from './reels.ts';
export const communityTopics = learningTopics;
export type CommunityTopic = typeof communityTopics[number];
export type PostKind = 'debate' | 'leccion' | 'movimiento' | 'consejo';
export const investorGoals = ['Aprender a invertir', 'Gestionar mi dinero', 'Crear mi colchón', 'Invertir a largo plazo', 'Seguir inversores'] as const;
export type InvestorGoal = typeof investorGoals[number];
export type KycStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type CreatorChannel = {
  id: string;
  name: string;
  focus: string;
  bio: string;
  demo: true;
  identityVerified: false;
  subscribed: boolean;
  subscriberCount: number;
};

export type CommunityReply = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  mine: boolean;
};

export type CommunityPost = {
  id: string;
  kind: PostKind;
  topic: CommunityTopic;
  title: string;
  text: string;
  author: string;
  channelId?: string;
  createdAt: string;
  demo: boolean;
  mine: boolean;
  helpful: boolean;
  helpfulCount: number;
  replies: CommunityReply[];
  recommendation?: { kind: 'personalized' | 'discovery'; reason: string };
};

export type CommunitySnapshot = {
  personalization: { enabled: boolean; consentedAt: number | null; expiresAt: number | null; excludedTags: import('../../../../packages/types/src/social.ts').InterestTag[] };
  reels: Reel[];
  reelFeed: CommunitySnapshot['feed'];
  feed: {
    mode: 'personalized' | 'discovery';
    source: 'chat' | 'saved' | 'onboarding' | 'none';
    priorityTopics: CommunityTopic[];
    targetPersonalizedPercent: 70;
    targetDiscoveryPercent: 30;
    preview: { total: number; personalized: number; discovery: number };
    limited: boolean;
  };
  posts: CommunityPost[];
  channels: CreatorChannel[];
  viewer: string;
  onboarding: {
    completed: boolean;
    kycStatus: KycStatus;
    identityVerified: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
    countryCode?: string;
    nationality?: string;
    goals: InvestorGoal[];
    consentedAt?: string;
    legalAcceptance?: LegalAcceptance;
  };
  csrfToken: string;
};
