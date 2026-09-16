export type SocialProfile = {
  id: string; name: string; focus: string; demo: boolean; following: boolean;
  followersCount: number; followingCount: number; friend: boolean;
};
export type SocialSnapshot = { me: SocialProfile; creators: SocialProfile[]; members: SocialProfile[]; csrfToken: string };
export type FollowersView = { total: number; profiles: SocialProfile[]; nextOffset: number | null };
