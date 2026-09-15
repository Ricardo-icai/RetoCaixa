import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { CommunitySnapshot, PostKind } from '../../community/types';
import { KaiHeaderIcon } from '../../components/KaiHeaderIcon';

const label: Record<PostKind, string> = { debate: 'Debate', leccion: 'Microlección', movimiento: 'Movimiento simulado', consejo: 'Consejo gratis' };
const dateLabel = (value: string) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export default function ChannelPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/community', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido abrir el canal.');
      setSnapshot(data as CommunitySnapshot);
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'No se ha podido abrir el canal.'));
  }, []);

  const channel = snapshot?.channels.find(item => item.id === id);
  const posts = snapshot?.posts.filter(post => post.channelId === id) ?? [];

  async function toggleFollow() {
    if (!snapshot || !channel || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': snapshot.csrfToken }, body: JSON.stringify({ operation: 'subscribe', channelId: channel.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido actualizar la suscripción.');
      setSnapshot(data as CommunitySnapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido actualizar la suscripción.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-[#0a111b] text-slate-100">
    <Head><title>{channel ? `${channel.name} · Canal de ejemplo` : 'Canal · Comunidad KAI'}</title></Head>
    <header className="border-b border-white/10 px-5 py-3"><div className="mx-auto max-w-5xl"><KaiHeaderIcon /></div></header>
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
      {!snapshot && !error && <p className="text-sm text-slate-400">Cargando canal…</p>}
      {snapshot && !channel && <p className="rounded-2xl border border-white/10 p-8 text-sm text-slate-300">Este canal no existe.</p>}
      {channel && <>
        <section className="rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-[#173b3a] via-[#142c36] to-[#132033] p-6 sm:p-9">
          <div className="flex flex-wrap items-start gap-5"><div aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-emerald-300/20 text-4xl font-semibold text-emerald-200">{channel.name.charAt(0)}</div><div className="min-w-0 flex-1"><h1 className="text-3xl font-semibold sm:text-4xl">{channel.name}</h1><p className="mt-2 text-sm text-slate-200">{channel.focus}</p></div><button disabled={busy} onClick={() => void toggleFollow()} aria-pressed={channel.subscribed} className={`rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-40 ${channel.subscribed ? 'border border-emerald-300/40 text-emerald-200' : 'bg-emerald-300 text-slate-950'}`}>{channel.subscribed ? 'Siguiendo' : 'Seguir'}</button></div>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-200">{channel.bio}</p>
        </section>
        <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs text-amber-100">Perfil ficticio. Contenido educativo, no asesoramiento personalizado.</p>
        <section className="mt-8" aria-labelledby="channel-posts"><h2 id="channel-posts" className="text-2xl font-semibold">Publicaciones del canal</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{posts.map(post => <article key={post.id} className="flex flex-col rounded-2xl border border-white/10 bg-[#101d2a] p-5"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">{label[post.kind]}</span><span className="text-xs text-slate-500">{dateLabel(post.createdAt)}</span></div><p className="mt-5 text-xs font-medium text-emerald-200">{post.topic}</p><h3 className="mt-2 text-lg font-semibold">{post.title}</h3><p className="mt-3 flex-1 text-sm leading-7 text-slate-300">{post.text}</p><a href={`/community#post-${post.id}`} className="mt-5 text-sm font-semibold text-emerald-200 hover:underline">Ver conversación · {post.replies.length} respuestas ↗</a></article>)}</div></section>
      </>}
    </main>
  </div>;
}
