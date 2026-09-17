import { useEffect, useRef, useState } from 'react';
import type { CommunitySnapshot } from '../community/types';
import type { Reel } from '../community/reels';
import { KaiHeaderIcon } from './KaiHeaderIcon';
import { FollowButton } from './FollowButton';
import { TradeTicket } from './TradeTicket';
import { money } from '../market/trading';
import { useDwellTimeTracker } from '../hooks/useDwellTimeTracker';

function ReelCard({ reel, active, suspended, snapshot, onRefresh, onTrade }: { reel: Reel; active: boolean; suspended: boolean; snapshot: CommunitySnapshot; onRefresh: () => void; onTrade: (copy: boolean) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  useDwellTimeTracker(reel.id, video, snapshot.personalization.enabled && !suspended, snapshot.csrfToken, snapshot.personalization.expiresAt);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true); }, []);
  const [unavailable, setUnavailable] = useState(false);
  const manuallyStarted = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      const media = video.current;
      if (!media) return;
      if (active && !suspended && !paused && !document.hidden && (manuallyStarted.current || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)) void media.play().catch(() => { if (!cancelled) setPaused(true); });
      else media.pause();
    };
    sync(); document.addEventListener('visibilitychange', sync);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', sync); video.current?.pause(); };
  }, [active, suspended, paused]);
  const channel = snapshot.channels.find(item => item.id === reel.channelId);
  return <article data-reel-id={reel.id} aria-label={reel.title} className="relative h-full min-h-full snap-start snap-always overflow-hidden bg-slate-950">
    <video ref={video} src={active ? reel.videoUrl : undefined} poster="/Gemini_Generated_Image_l41t8bl41t8bl41t.jpg" muted={muted} playsInline loop preload="none" onError={() => setUnavailable(true)} className="absolute inset-0 h-full w-full object-cover opacity-40" aria-label="Vídeo de muestra de Big Buck Bunny" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/65 to-slate-950" />
    <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]"><span className="rounded-full bg-slate-950/75 px-3 py-1 text-emerald-200">{reel.topic} · {reel.recommendation?.kind === 'personalized' ? 'Para ti' : 'Descubrimiento'}</span><div className="flex gap-2"><button onClick={() => { const next = !paused; manuallyStarted.current = !next; setPaused(next); if (!next && active && !suspended) void video.current?.play().catch(() => setPaused(true)); }} aria-label={paused ? 'Reproducir vídeo' : 'Pausar vídeo'} className="rounded-lg bg-slate-950/80 px-3 py-2">{paused ? '▶' : 'Ⅱ'}</button><button onClick={() => setMuted(value => !value)} aria-label={muted ? 'Activar sonido' : 'Silenciar vídeo'} aria-pressed={!muted} className="rounded-lg bg-slate-950/80 px-3 py-2">{muted ? 'Sin sonido' : 'Con sonido'}</button></div></div>
      {reel.highRisk && <div className="flex items-center gap-3 rounded-2xl border border-blue-300/40 bg-blue-950/85 p-3"><KaiHeaderIcon /><p className="text-xs leading-5 text-blue-100"><strong className="block">KAI · Antes de actuar</strong>Volatilidad y concentración: comprende el riesgo antes de copiar un movimiento.</p></div>}
      <div className="my-auto py-4"><p className="text-xs font-semibold text-emerald-200">Microlección de ejemplo</p><h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">{reel.title}</h2><p className="mt-4 text-sm leading-7 text-slate-200">{reel.text}</p></div>
      <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{reel.author}</p><p className="mt-1 text-[11px] text-slate-400">{channel ? 'Creador ficticio · Rentabilidad no verificada' : 'Contenido educativo de muestra'}</p></div>{channel && <FollowButton userId={channel.id} following={channel.subscribed} csrfToken={snapshot.csrfToken} onChanged={onRefresh} />}</div>
      {reel.asset && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-900/90 p-3"><div><p className="text-[10px] text-slate-400">Activo de ejemplo</p><strong className="text-sm">{reel.asset.symbol}</strong></div><div className="flex gap-2"><button onClick={() => onTrade(true)} className="rounded-xl border border-white/15 px-3 py-3 text-xs">Copiar</button><button onClick={() => onTrade(false)} className="rounded-xl bg-emerald-300 px-3 py-3 text-xs font-semibold text-slate-950">Simular inversión</button></div></div>}
      <p className="text-[10px] leading-4 text-slate-500">{unavailable ? 'Vídeo no disponible. Puedes leer la microlección. ' : 'Vídeo de prueba; no representa al creador ni la lección. '}Big Buck Bunny © Blender Foundation · CC BY 3.0.</p>
    </div>
  </article>;
}

export function ReelVideoFeed({ snapshot, onRefresh }: { snapshot: CommunitySnapshot; onRefresh: () => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [trade, setTrade] = useState<{ reel: Reel; copying: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const [updates, setUpdates] = useState(false);
  useEffect(() => {
    const updated = () => setUpdates(true);
    window.addEventListener('kai:feed-updated', updated);
    return () => window.removeEventListener('kai:feed-updated', updated);
  }, []);
  const ids = snapshot.reels.map(reel => reel.id).join(',');
  useEffect(() => {
    const root = viewport.current;
    if (!root) return;
    root.scrollTop = 0; setActive(0);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting && entry.intersectionRatio >= 0.6) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { root, threshold: [0.6] });
    root.querySelectorAll('[data-index]').forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [ids]);
  return <section aria-label="Reels personalizados" className="mx-auto max-w-xl">
    <div className="mb-3 flex items-center justify-between gap-3 px-4 text-xs text-slate-400"><p>{snapshot.reelFeed.mode === 'personalized' ? `${snapshot.reelFeed.preview.personalized} para ti · ${snapshot.reelFeed.preview.discovery} para descubrir` : 'Descubre y aprende con KAI'}</p><span>{Math.min(active + 1, snapshot.reels.length)}/{snapshot.reels.length}</span></div>
    {notice && <p role="status" className="mb-3 px-4 text-xs text-emerald-200">{notice}</p>}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 text-xs"><a href="/settings#feed-personalization" className="text-slate-400 underline">Preferencias del feed</a>{updates && <button type="button" onClick={() => { setUpdates(false); onRefresh(); }} className="text-emerald-200">Actualizar reels</button>}</div>
    {!snapshot.reels.length && <p className="px-4 py-6 text-sm text-slate-300">No hay reels disponibles con tus preferencias actuales.</p>}
    <div ref={viewport} tabIndex={0} aria-label="Desliza verticalmente para cambiar de reel" onKeyDown={event => {
      if (event.target !== event.currentTarget || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault(); viewport.current?.scrollBy({ top: (event.key === 'ArrowDown' ? 1 : -1) * viewport.current.clientHeight, behavior: 'smooth' });
    }} className="h-[calc(100dvh-14rem)] min-h-[480px] snap-y snap-mandatory overflow-y-auto rounded-3xl border border-white/10">
      {snapshot.reels.map((reel, index) => <div key={reel.id} data-index={index} className="h-full snap-start snap-always"><ReelCard reel={reel} active={active === index} suspended={!!trade} snapshot={snapshot} onRefresh={onRefresh} onTrade={copying => { setNotice(''); setTrade({ reel, copying }); }} /></div>)}
    </div>
    {trade?.reel.asset && <TradeTicket asset={trade.reel.asset} copying={trade.copying} onClose={() => setTrade(null)} onBought={portfolio => setNotice(`Compra virtual guardada en Mis inversiones. Efectivo: ${money(portfolio.cash)}.`)} />}
  </section>;
}
