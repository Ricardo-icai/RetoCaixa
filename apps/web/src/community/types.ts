export const communityTopics = ['Primeros pasos', 'Gestionar dinero', 'Riesgo', 'Fondos', 'Mercados'] as const;
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
};

export type CommunitySnapshot = {
  posts: CommunityPost[];
  channels: CreatorChannel[];
  viewer: string;
  onboarding: {
    completed: boolean;
    kycStatus: KycStatus;
    identityVerified: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
    countryCode?: string;
    goals: InvestorGoal[];
    consentedAt?: string;
  };
  csrfToken: string;
};
