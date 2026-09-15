import Head from 'next/head';
import { useEffect, useState } from 'react';
import type { CommunitySnapshot } from '../../community/types';

export default function Channels() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/community', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se han podido cargar los canales.');
      setSnapshot(data as CommunitySnapshot);
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'No se han podido cargar los canales.'));
  }, []);

  async function toggle(channelId: string) {
    if (!snapshot || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': snapshot.csrfToken }, body: JSON.stringify({ operation: 'subscribe', channelId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido actualizar la suscripción.');
      setSnapshot(data as CommunitySnapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido actualizar la suscripción.');
    } finally {
      setBusy(false);
    }
  }

  function replayTutorial() {
    localStorage.removeItem('hasSeenStoxiaTutorial');
    window.location.reload();
  }

  return <div className="min-h-screen bg-[#0a111b] text-slate-100">
    <Head><title>Canales · Comunidad KAI</title><meta name="description" content="Explora canales gratuitos de inversión y gestión del dinero en la demo de KAI." /></Head>
    <header className="border-b border-white/10 px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><span className="text-xl font-semibold">imagin <span className="text-emerald-300">/ KAI</span></span><button type="button" onClick={replayTutorial} className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300 hover:border-emerald-300 hover:text-emerald-200" aria-label="Volver a ver el tutorial de KAI">⚙ Tutorial</button></div></header>
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-9 sm:px-6">
      <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">Canales</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">Sigue los que te interesan para verlos en tu feed.</p>
      <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs text-amber-100">Demo: todos los perfiles y movimientos son ficticios.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
      {!snapshot && !error && <p className="mt-8 text-sm text-slate-400">Cargando canales…</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{snapshot?.channels.map(channel => <article key={channel.id} className="flex flex-col rounded-3xl border border-white/10 bg-[#101d2a] p-6"><div aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-300/15 text-2xl font-semibold text-emerald-200">{channel.name.charAt(0)}</div><h2 className="mt-5 text-2xl font-semibold">{channel.name}</h2><p className="mt-1 text-sm text-cyan-200">{channel.focus}</p><p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{channel.bio}</p><div className="mt-5 flex flex-wrap gap-2"><a href={`/channels/${channel.id}`} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-emerald-300">Ver canal</a><button disabled={busy} onClick={() => void toggle(channel.id)} aria-pressed={channel.subscribed} className={`rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40 ${channel.subscribed ? 'border border-emerald-300/40 text-emerald-200' : 'bg-emerald-300 text-slate-950'}`}>{channel.subscribed ? 'Siguiendo' : 'Seguir'}</button></div></article>)}</div>
    </main>
  </div>;
}
