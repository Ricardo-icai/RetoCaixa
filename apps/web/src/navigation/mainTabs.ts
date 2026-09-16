export type MainTab = 'FEED' | 'TRADE' | 'LEARN' | 'NETWORK';

export const mainTabs = [
  { id: 'FEED', path: '/community', icon: '/icons/home.png', label: 'Feed', description: 'Feed de la comunidad' },
  { id: 'TRADE', path: '/simulator', icon: '/icons/trade.png', label: 'Invertir', description: 'Invertir con dinero virtual' },
  { id: 'LEARN', path: '/chat', icon: '/icons/academy.png', label: 'Aprender', description: 'Aprender con KAI' },
  { id: 'NETWORK', path: '/channels', icon: '/icons/profile.png', label: 'Red', description: 'Red y canales' },
] as const satisfies readonly { id: MainTab; path: string; icon: string; label: string; description: string }[];

export function activeMainTab(pathname: string) {
  return mainTabs.findIndex(tab => pathname === tab.path || pathname.startsWith(`${tab.path}/`));
}

export function selectedMainTab(pathname: string): MainTab | null {
  return mainTabs[activeMainTab(pathname)]?.id ?? null;
}
