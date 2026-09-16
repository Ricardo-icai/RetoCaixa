import { useRouter } from 'next/router';
import { activeMainTab, mainTabs } from '../navigation/mainTabs';

export function BottomNavBar() {
  const router = useRouter();
  if (router.pathname === '/' || router.pathname === '/verify-identity') return null;
  const activeIndex = activeMainTab(router.pathname);

  return <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/70 bg-slate-950/90 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
      {mainTabs.map((tab, index) => {
        const active = activeIndex === index;
        return <button key={tab.id} type="button" onClick={() => void router.push(tab.path)} aria-current={active ? 'page' : undefined} aria-label={tab.label} className="flex h-full w-full flex-col items-center justify-center space-y-1 transition-transform active:scale-95">
          <span aria-hidden="true" className={`text-xl ${active ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'grayscale opacity-70'}`}>{tab.icon}</span>
          <span className={`text-[9px] font-bold tracking-wide ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{tab.label}</span>
        </button>;
      })}
      <button type="button" onClick={() => void router.push('/settings')} aria-current={router.pathname === '/settings' ? 'page' : undefined} className="flex h-full w-full flex-col items-center justify-center space-y-1 text-slate-300"><span aria-hidden="true" className="text-xl">⚙</span><span className="text-[9px] font-bold">Ajustes</span></button>
    </div>
  </nav>;
}
