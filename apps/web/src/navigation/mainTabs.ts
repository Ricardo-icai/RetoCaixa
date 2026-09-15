export const mainTabs = [
  { id: 'feed', path: '/community', icon: '📱', label: 'Feed' },
  { id: 'trade', path: '/simulator', icon: '⚡', label: 'Invertir' },
  { id: 'academy', path: '/chat', icon: '✦', label: 'KAI' },
  { id: 'network', path: '/channels', icon: '💬', label: 'Canales' },
] as const;

export function activeMainTab(pathname: string) {
  return mainTabs.findIndex(tab => pathname === tab.path || pathname.startsWith(`${tab.path}/`));
}
