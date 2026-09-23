import Link from 'next/link';
import { mainTabs, type MainTab } from '../navigation/mainTabs';

export function BottomNavBar({ activeTab }: { activeTab: MainTab | null }) {
  return <nav aria-label="Navegación principal" className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-3xl border border-b-0 border-slate-800 bg-slate-900/80 shadow-[0_-8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div className="grid h-20 grid-cols-4 px-2">
      {mainTabs.map(tab => {
        const active = activeTab === tab.id;
        return <Link key={tab.id} href={tab.path} aria-current={active ? 'page' : undefined} aria-label={tab.description} className="group relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-emerald-300">
          <span aria-hidden="true" className={`absolute top-1 h-0.5 w-5 rounded-full bg-emerald-300 transition-opacity duration-300 motion-reduce:transition-none ${active ? 'opacity-100' : 'opacity-0'}`} />
          <img src={tab.icon} alt="" width={20} height={20} draggable={false} className={`h-5 w-5 object-contain transition-all duration-300 ease-in-out motion-reduce:transition-none ${active ? 'scale-110 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-focus-visible:grayscale-0 group-focus-visible:opacity-100'}`} />
          <span className={`text-[10px] font-semibold transition-colors duration-300 motion-reduce:transition-none ${active ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'}`}>{tab.label}</span>
        </Link>;
      })}
    </div>
  </nav>;
}
