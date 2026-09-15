import { useRouter } from 'next/router';

const tabs = [
  { id: 'feed', path: '/community', icon: '📱', label: 'Feed', matches: ['/community'] },
  { id: 'trade', path: '/simulator', icon: '⚡', label: 'Invertir', matches: ['/simulator'] },
  { id: 'academy', path: '/chat', icon: '✦', label: 'KAI', matches: ['/chat'] },
  { id: 'network', path: '/channels', icon: '💬', label: 'Canales', matches: ['/channels'] },
] as const;

export function BottomNavBar() {
  const router = useRouter();
  if (router.pathname === '/verify-identity') return null;

  return <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/70 bg-slate-950/90 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
      {tabs.map(tab => {
        const active = tab.matches.some(path => router.pathname === path || router.pathname.startsWith(`${path}/`));
        return <button key={tab.id} type="button" onClick={() => void router.push(tab.path)} aria-current={active ? 'page' : undefined} aria-label={tab.label} className="flex h-full w-full flex-col items-center justify-center space-y-1 transition-transform active:scale-95">
          <span aria-hidden="true" className={`text-xl ${active ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'grayscale opacity-70'}`}>{tab.icon}</span>
          <span className={`text-[9px] font-bold tracking-wide ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{tab.label}</span>
        </button>;
      })}
    </div>
  </nav>;
}
