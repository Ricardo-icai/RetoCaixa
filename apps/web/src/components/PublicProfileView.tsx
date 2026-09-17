import Link from 'next/link';
import { KaiIcon } from './KaiIcon';
import { useCallback, useEffect, useState } from 'react';
import type { ProfileDetail } from '../community/persona';
import { FollowButton } from './FollowButton';

export function PublicProfileView({ userId }: { userId?: string }) {
  const [data, setData] = useState<ProfileDetail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'portfolio' | 'reels'>('portfolio');
  const [selected, setSelected] = useState<ProfileDetail['reels'][number] | null>(null);
  const [messageInfo, setMessageInfo] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/profile${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, { cache: 'no-store', signal });
      const next = await response.json(); if (!response.ok) throw new Error(next.error);
      setData(next); setError('');
    } catch (cause) { if (!signal?.aborted) { setData(null); setError(cause instanceof Error ? cause.message : 'No se puede abrir el perfil.'); } }
  }, [userId]);
  useEffect(() => { const controller = new AbortController(); setData(null); setSelected(null); void load(controller.signal); return () => controller.abort(); }, [load]);
  return <main className="mx-auto min-h-screen max-w-md bg-slate-950 px-5 pb-24 pt-6 text-slate-100">
    <Link href="/community" className="text-sm text-emerald-200">← Comunidad</Link>
    {error && <p role="alert" className="mt-6 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
    {!data && !error && <p className="mt-8 text-sm text-slate-400">Cargando perfil…</p>}
    {data && <>
      <header className="mt-8 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-emerald-500/50 bg-slate-800 p-1">{data.profile.avatar ? <img src={data.profile.avatar} alt={`Foto de ${data.profile.name}`} className="h-full w-full rounded-full object-cover" /> : <span className="text-4xl text-emerald-200">{data.profile.name.charAt(0)}</span>}</div>
        <h1 className="mt-4 break-words text-2xl font-bold">{data.profile.name}</h1>
        <p className="mt-1 break-all text-sm text-slate-400">@{data.profile.handle}</p>
        <p className="mt-2 text-[11px] text-slate-500">{data.fictional ? 'Perfil ficticio de ejemplo' : data.mine && data.visibility === 'PRIVATE' ? 'Tu perfil privado · solo tú puedes verlo' : 'Perfil de la demo · identidad no acreditada'}</p>
        <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-slate-300">{data.profile.bio || data.profile.focus}</p>
        {data.profile.investmentTag && <span className="mt-3 inline-block rounded-full border border-emerald-500/30 bg-slate-900/60 px-3 py-1 text-xs text-emerald-300 backdrop-blur-md">{data.profile.investmentTag.slice(data.profile.investmentTag.indexOf(' ') + 1)}</span>}
      </header>
      <div className="my-7 grid grid-cols-3 divide-x divide-slate-800 text-center"><div><p className="text-xl font-semibold">{data.profile.followersCount}</p><p className="mt-1 text-xs text-slate-500">Seguidores</p></div><div><p className="text-xl font-semibold">{data.profile.followingCount}</p><p className="mt-1 text-xs text-slate-500">Siguiendo</p></div><div><p className="text-xl font-semibold text-emerald-300">{data.return1Y === null ? '—' : `+${data.return1Y.toLocaleString('es-ES')} %`}</p><p className="mt-1 text-[10px] text-slate-500">{data.fictional ? '1 año · ficticio' : 'Sin rentabilidad pública'}</p></div></div>
      <div className="mb-7 flex items-center justify-center gap-3">{data.mine ? <Link href="/settings/profile" className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-3 text-sm font-bold text-slate-950">Editar perfil</Link> : <><FollowButton userId={data.profile.id} following={data.profile.following} csrfToken={data.csrfToken} onChanged={() => void load()} /><button type="button" aria-label="Mensajes" aria-expanded={messageInfo} onClick={() => setMessageInfo(!messageInfo)} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><KaiIcon name="message" /></button></>}</div>
      {messageInfo && <p role="status" className="mb-5 rounded-xl border border-slate-800 p-4 text-sm text-slate-400">La mensajería entre usuarios todavía no está disponible en esta demo.</p>}
      <div role="tablist" aria-label="Contenido del perfil" className="sticky top-0 z-10 flex rounded-full border border-slate-800 bg-slate-900/95 p-1.5 backdrop-blur-md">{(['portfolio', 'reels'] as const).map(value => <button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => { setTab(value); setSelected(null); }} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'portfolio' : event.key === 'End' ? 'reels' : tab === 'portfolio' ? 'reels' : 'portfolio'; setTab(next); setSelected(null); document.getElementById(`tab-${next}`)?.focus(); } }} className={`flex-1 rounded-full py-3 text-sm ${tab === value ? 'bg-slate-800 text-emerald-300 shadow-md' : 'text-slate-400'}`}>{value === 'portfolio' ? 'Cartera' : 'Reels'}</button>)}</div>
      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === 'portfolio' ? <>{data.fictional && <p className="mb-4 text-xs leading-5 text-amber-100">Cartera y rentabilidad inventadas para mostrar el diseño. No representan inversiones ni resultados reales.</p>}{data.holdings.length ? <ul className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40 px-4">{data.holdings.map(item => <li key={item.symbol} className="flex justify-between gap-3 py-5 text-sm"><span>{item.symbol}</span><span className="text-emerald-200">{item.weight} %</span></li>)}</ul> : <p className="rounded-2xl border border-slate-800 p-6 text-sm leading-6 text-slate-400">No hay una cartera compartida. Tus datos financieros del chat y tus operaciones simuladas permanecen privados.</p>}</> : <>{data.reels.length ? <div className="grid grid-cols-3 gap-2">{data.reels.map(reel => <button key={reel.id} onClick={() => setSelected(reel)} className="flex aspect-[3/4] flex-col justify-between rounded-xl border border-cyan-300/20 bg-gradient-to-br from-emerald-900/60 to-slate-900 p-3 text-left"><span className="text-xl" aria-hidden="true">▶</span><span className="line-clamp-3 text-xs">{reel.title}</span></button>)}</div> : <p className="rounded-2xl border border-slate-800 p-6 text-sm text-slate-400">Todavía no hay reels publicados.</p>}{selected && <div className="mt-5 rounded-2xl border border-slate-800 p-4"><button onClick={() => setSelected(null)} className="mb-3 text-xs text-slate-400">Cerrar vídeo</button><video key={selected.id} controls playsInline preload="none" src={selected.videoUrl} className="w-full rounded-xl" /><h2 className="mt-3 text-sm font-semibold">{selected.title}</h2><p className="mt-2 text-xs leading-5 text-slate-400">Vídeo de muestra de la demo. {selected.text}</p></div>}</>}
      </section>
    </>}
  </main>;
}
