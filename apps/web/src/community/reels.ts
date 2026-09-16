import type { CommunityPost } from './types.ts';
import { discoveryAssets } from '../market/catalogue.ts';
import type { AssetSearchResult } from '../market/types.ts';

export type Reel = Pick<CommunityPost, 'id' | 'topic' | 'title' | 'text' | 'author' | 'channelId' | 'createdAt' | 'recommendation'> & {
  videoUrl: string; demoVideo: true; highRisk: boolean; asset?: AssetSearchResult;
};
export function reelFromPost(post: Pick<CommunityPost, 'id' | 'topic' | 'title' | 'text' | 'author' | 'channelId' | 'createdAt' | 'demo'>): Reel | undefined {
  if (!post.demo) return undefined;
  const asset = post.topic === 'Fondos' ? discoveryAssets.find(item => item.symbol === 'VWCE')
    : post.topic === 'Riesgo' ? discoveryAssets.find(item => item.symbol === 'BTC/USD')
    : post.topic === 'Mercados' ? discoveryAssets.find(item => item.symbol === 'NVDA') : undefined;
  return { id: post.id, topic: post.topic, title: post.title, text: post.text, author: post.author, channelId: post.channelId, createdAt: post.createdAt, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', demoVideo: true, highRisk: !!asset && asset.type !== 'ETF', asset };
}
