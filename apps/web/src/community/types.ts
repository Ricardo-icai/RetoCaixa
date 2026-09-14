export const communityTopics = ['Primeros pasos', 'Gestionar dinero', 'Riesgo', 'Fondos', 'Mercados'] as const;
export type CommunityTopic = typeof communityTopics[number];
export type PostKind = 'debate' | 'leccion' | 'movimiento' | 'consejo';

export type CreatorChannel = {
  id: string;
  name: string;
  focus: string;
  bio: string;
  demo: true;
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
  csrfToken: string;
};
