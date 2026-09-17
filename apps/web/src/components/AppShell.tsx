import Link from 'next/link';
import { KaiIcon } from './KaiIcon';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { selectedMainTab } from '../navigation/mainTabs';
import { BottomNavBar } from './BottomNavBar';
import { SwipeNavigation } from './SwipeNavigation';

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();
  // Route-derived state keeps direct links, refresh and browser history in sync.
  const activeTab = selectedMainTab(pathname);
  const showNavigation = pathname !== '/' && pathname !== '/verify-identity' && pathname !== '/settings/profile';
  return <div className="relative mx-auto min-h-dvh w-full max-w-md bg-slate-950 text-slate-100 md:max-w-7xl">
    {showNavigation && <div className="flex items-center justify-between border-b border-white/5 px-5 py-2 text-xs">
      <span className="tracking-wide text-slate-400">STOXIA SOCIAL <span className="ml-2 text-emerald-300">Demo</span></span>
      <Link href="/settings" aria-current={pathname === '/settings' ? 'page' : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-slate-300 hover:bg-white/5 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"><KaiIcon name="settings" className="h-4 w-4" />Ajustes</Link>
    </div>}
    <SwipeNavigation><div className={showNavigation ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : undefined}>{children}</div></SwipeNavigation>
    {showNavigation && <BottomNavBar activeTab={activeTab} />}
  </div>;
}
