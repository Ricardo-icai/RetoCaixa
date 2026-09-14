import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { communityTopics, type CommunityPost, type CommunitySnapshot, type CommunityTopic, type PostKind } from '../community/types';

type FeedFilter = 'Todos' | 'Siguiendo' | CommunityTopic;
const dateLabel = (value: string) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const kindLabel: Record<PostKind, string> = { debate: 'Debate', leccion: 'Microlección', movimiento: 'Movimiento simulado', consejo: 'Consejo gratis' };

export default function Community() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('Todos');
  const [kind, setKind] = useState<PostKind>('debate');
  const [composerOpen, setComposerOpen] = useState(false);
  const [topic, setTopic] = useState<CommunityTopic>('Primeros pasos');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const response = await fetch('/api/community', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'No se ha podido abrir la comunidad.');
    setSnapshot(data as CommunitySnapshot);
    setError('');
  }

  useEffect(() => { void load().catch(cause => setError(cause.message)); }, []);
  useEffect(() => {
    if (snapshot && window.location.hash.startsWith('#post-')) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot]);

  async function act(body: Record<string, unknown>, success: string) {
    if (!snapshot || busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': snapshot.csrfToken },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) await load();
        throw new Error(data.error ?? 'No se ha podido completar la acción.');
      }
      setSnapshot(data as CommunitySnapshot);
      setNotice(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido completar la acción.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const posts = useMemo(() => snapshot?.posts.filter(post => filter === 'Todos' || (filter === 'Siguiendo' ? snapshot.channels.some(channel => channel.id === post.channelId && channel.subscribed) : post.topic === filter)) ?? [], [snapshot, filter]);
  const debateCount = snapshot?.posts.filter(post => post.kind === 'debate').length ?? 0;

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (await act({ operation: 'publish', kind, topic, title, text }, 'Publicación compartida con la comunidad.')) {
      setTitle('');
      setText('');
      setFilter('Todos');
      setComposerOpen(false);
    }
  }

  async function sendReply(event: React.FormEvent, post: CommunityPost) {
    event.preventDefault();
    if (await act({ operation: 'reply', postId: post.id, text: reply }, 'Respuesta publicada.')) {
      setReply('');
      setReplyingTo(null);
    }
  }

  return <div className="min-h-screen bg-[#0a111b] text-slate-100">
    <Head><title>Comunidad KAI · Aprender a invertir juntos</title><meta name="description" content="Debates y microlecciones de inversión en la comunidad demo de KAI." /></Head>
    <header className="border-b border-white/10 bg-[#0d1723]/95 px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <a href="/community" className="text-xl font-semibold tracking-tight">imagin <span className="text-emerald-300">/ KAI</span></a>
        <nav aria-label="Navegación principal" className="flex items-center gap-2 text-sm">
          <a href="/simulator" className="rounded-full px-3 py-2 text-slate-300 hover:bg-white/5">Simulador</a>
          <a href="/community" aria-current="page" className="rounded-full bg-emerald-300/15 px-3 py-2 font-semibold text-emerald-200">Comunidad</a>
          <a href="/channels" className="rounded-full px-3 py-2 text-slate-300 hover:bg-white/5">Canales</a>
          <a href="/chat" className="rounded-full px-3 py-2 text-slate-300 hover:bg-white/5">Hablar con KAI</a>
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#173b3a] via-[#142c36] to-[#132033] p-6 sm:p-9">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Comunidad KAI · Demo</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Invertir se aprende <span className="text-emerald-300">conversando.</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">Pregunta, comparte una idea y escucha otras perspectivas. Aquí una buena conversación vale más que una promesa de rentabilidad.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-200"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">{debateCount} debates en el feed</span><span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">{communityTopics.length} temas para explorar</span><span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">Canales gratuitos</span></div>
        </div>
      </section>

      <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-xs leading-6 text-amber-100">Demo compartida y temporal: las publicaciones nuevas son visibles para otros visitantes hasta que se reinicie el servidor. Los canales de inversores son personajes ficticios; sus movimientos no son operaciones reales. No compartas datos personales ni tomes una decisión financiera por una publicación.</p>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#101d2a] p-5 sm:p-6" aria-labelledby="compose-title">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-emerald-200">Tu espacio · {snapshot?.viewer ?? 'Invitado'}</p><h2 id="compose-title" className="mt-1 text-xl font-semibold">¿Qué te gustaría debatir?</h2><p className="mt-1 text-xs text-slate-400">Una pregunta puede abrir muchas perspectivas.</p></div><button type="button" onClick={() => setComposerOpen(value => !value)} aria-expanded={composerOpen} aria-controls="community-composer" className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950">{composerOpen ? 'Cerrar' : 'Abrir debate'} ↗</button></div>
            {composerOpen && <form id="community-composer" onSubmit={publish} className="mt-6 space-y-4 border-t border-white/10 pt-5">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Formato de publicación">
                {(['debate', 'leccion'] as const).map(item => <button key={item} type="button" onClick={() => setKind(item)} aria-pressed={kind === item} className={`rounded-full px-4 py-2 text-xs font-semibold ${kind === item ? 'bg-emerald-300 text-slate-950' : 'border border-white/15 text-slate-300 hover:border-emerald-300/50'}`}>{item === 'debate' ? 'Debate' : 'Microlección'}</button>)}
              </div>
              <label className="block text-xs font-medium text-slate-300">Tema
                <select value={topic} onChange={event => setTopic(event.target.value as CommunityTopic)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0a111b] px-4 py-3 text-sm text-slate-100 focus:border-emerald-300 sm:w-56">{communityTopics.map(item => <option key={item}>{item}</option>)}</select>
              </label>
              <label className="block text-xs font-medium text-slate-300">Título
                <input value={title} onChange={event => setTitle(event.target.value)} minLength={6} maxLength={100} required placeholder="¿Qué te gustaría debatir?" className="mt-2 w-full rounded-xl border border-white/15 bg-[#0a111b] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300" />
              </label>
              <label className="block text-xs font-medium text-slate-300">Tu aportación
                <textarea value={text} onChange={event => setText(event.target.value)} minLength={20} maxLength={800} required rows={4} placeholder="Comparte una pregunta, una experiencia o una explicación. Evita recomendar compras concretas a otras personas." className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-[#0a111b] px-4 py-3 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:border-emerald-300" />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-400">{text.length}/800 caracteres</span><button type="submit" disabled={!snapshot || busy} className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Publicando…' : 'Publicar en la comunidad'} ↗</button></div>
            </form>}
          </section>

          {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-300/20 bg-rose-300/10 text-rose-200' : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'}`}>{error || notice}</p>}

          <section aria-labelledby="feed-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-emerald-200">El feed</p><h2 id="feed-title" className="mt-1 text-2xl font-semibold">Conversaciones abiertas</h2></div><button onClick={() => void load().catch(cause => setError(cause.message))} className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-300 hover:border-emerald-300">Actualizar</button></div>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar publicaciones">{(['Todos', 'Siguiendo', ...communityTopics] as FeedFilter[]).map(item => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={`shrink-0 rounded-full px-4 py-2 text-xs ${filter === item ? 'bg-white text-slate-950' : 'border border-white/15 text-slate-300 hover:border-white/40'}`}>{item}</button>)}</div>
            {!snapshot && !error && <p className="rounded-2xl border border-white/10 p-8 text-sm text-slate-400">Cargando conversaciones…</p>}
            {snapshot && posts.length === 0 && <p className="rounded-2xl border border-white/10 p-8 text-sm text-slate-400">{filter === 'Siguiendo' ? 'Sigue un canal gratuito para reunir aquí sus publicaciones.' : 'Aún no hay publicaciones sobre este tema. Puedes abrir la primera conversación.'}</p>}
            <div className="space-y-4">{posts.map(post => <article id={`post-${post.id}`} key={post.id} className="rounded-3xl border border-white/10 bg-[#101d2a] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><div aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-300/30 to-cyan-300/20 text-sm font-bold text-emerald-100">{post.author.charAt(0)}</div><div><p className="text-sm font-semibold">{post.channelId ? <a href={`/channels/${post.channelId}`} className="hover:text-emerald-200 hover:underline">{post.author}</a> : post.author}</p><p className="text-xs text-slate-400">{dateLabel(post.createdAt)}</p></div></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">{kindLabel[post.kind]}</span>{post.demo && <span className="rounded-full bg-amber-300/10 px-3 py-1 text-[11px] font-semibold text-amber-200">{post.channelId ? 'Canal ficticio' : 'Ejemplo'}</span>}</div></div>
              <p className="mt-5 text-xs font-medium text-emerald-200">{post.topic}</p><h3 className="mt-2 text-xl font-semibold leading-7">{post.title}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{post.text}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"><button disabled={busy} onClick={() => void act({ operation: 'helpful', postId: post.id }, post.helpful ? 'Has quitado tu marca.' : 'Marcado como útil.')} aria-pressed={post.helpful} className={`rounded-full px-4 py-2 text-xs disabled:opacity-40 ${post.helpful ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>✦ Me ayudó · {post.helpfulCount}</button><button onClick={() => { setReplyingTo(replyingTo === post.id ? null : post.id); setReply(''); }} className="rounded-full bg-white/5 px-4 py-2 text-xs text-slate-300 hover:bg-white/10">↗ Responder · {post.replies.length}</button>{post.mine && <button disabled={busy} onClick={() => { if (window.confirm('¿Eliminar esta publicación y todas sus respuestas?')) void act({ operation: 'delete', postId: post.id }, 'Publicación eliminada.'); }} className="ml-auto rounded-full px-3 py-2 text-xs text-rose-200 hover:bg-rose-300/10 disabled:opacity-40">Eliminar</button>}</div>
              {post.replies.length > 0 && <div className="mt-4 space-y-3 border-l border-emerald-300/20 pl-4">{post.replies.map(item => <div key={item.id} className="rounded-xl bg-white/[0.035] p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-emerald-200">{item.author} <span className="ml-2 font-normal text-slate-500">{dateLabel(item.createdAt)}</span></p>{item.mine && <button disabled={busy} onClick={() => { if (window.confirm('¿Eliminar tu respuesta?')) void act({ operation: 'deleteReply', postId: post.id, replyId: item.id }, 'Respuesta eliminada.'); }} className="text-xs text-rose-200 hover:underline disabled:opacity-40">Eliminar</button>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.text}</p></div>)}</div>}
              {replyingTo === post.id && <form onSubmit={event => void sendReply(event, post)} className="mt-4 space-y-3"><label className="block text-xs text-slate-300">Tu respuesta<textarea autoFocus value={reply} onChange={event => setReply(event.target.value)} minLength={2} maxLength={300} required rows={3} placeholder="Aporta una perspectiva o haz una pregunta" className="mt-2 w-full rounded-xl border border-white/15 bg-[#0a111b] p-3 text-sm text-slate-100 placeholder:text-slate-500" /></label><div className="flex justify-end"><button type="submit" disabled={busy} className="rounded-xl bg-emerald-300 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40">Publicar respuesta</button></div></form>}
            </article>)}</div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-3xl border border-emerald-300/20 bg-[#11252c] p-5"><p className="text-xs font-medium text-emerald-200">Canales gratuitos · Demo</p><h2 className="mt-1 text-lg font-semibold">Sigue a quienes te enseñan</h2><p className="mt-2 text-xs leading-5 text-slate-400">Perfiles ficticios de muestra. Seguirlos reúne sus publicaciones en «Siguiendo».</p><div className="mt-5 space-y-4">{snapshot?.channels.map(channel => <div key={channel.id} className="border-t border-white/10 pt-4"><a href={`/channels/${channel.id}`} className="flex items-center gap-3 hover:text-emerald-200"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-300/15 text-sm font-bold text-emerald-200">{channel.name.charAt(0)}</span><span><span className="block text-sm font-semibold">{channel.name}</span><span className="block text-xs text-slate-400">{channel.focus}</span></span></a><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-500">{channel.subscriberCount} siguiendo en esta demo</span><button disabled={busy} onClick={() => void act({ operation: 'subscribe', channelId: channel.id }, channel.subscribed ? 'Has dejado de seguir el canal.' : 'Canal añadido a Siguiendo.')} aria-pressed={channel.subscribed} className={`rounded-full px-3 py-2 text-[11px] font-semibold disabled:opacity-40 ${channel.subscribed ? 'border border-emerald-300/30 text-emerald-200' : 'bg-emerald-300 text-slate-950'}`}>{channel.subscribed ? 'Siguiendo' : 'Seguir gratis'}</button></div></div>)}</div></section>
          <section className="rounded-3xl border border-white/10 bg-[#101d2a] p-5"><p className="text-xs font-medium text-emerald-200">Explora</p><h2 className="mt-1 text-lg font-semibold">Círculos de conversación</h2><div className="mt-4 space-y-2">{communityTopics.map(item => <button key={item} onClick={() => { setFilter(item); document.getElementById('feed-title')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-3 text-left text-sm text-slate-300 hover:border-emerald-300/40"><span>{item}</span><span className="text-slate-500">↗</span></button>)}</div></section>
          <section className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-5"><p className="text-xs font-medium text-emerald-200">Aprende con criterio</p><h2 className="mt-2 text-lg font-semibold">La conversación sigue con KAI</h2><p className="mt-2 text-xs leading-6 text-slate-300">Si una publicación te plantea dudas, explora el concepto en una conversación guiada. KAI no consulta mercados en directo ni ejecuta inversiones.</p><a href="/chat" className="mt-5 inline-block rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950">Hablar con KAI ↗</a></section>
          <section className="rounded-3xl border border-white/10 bg-[#101d2a] p-5"><h2 className="text-sm font-semibold">Para conversar mejor</h2><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-6 text-slate-400"><li>Pregunta y explica tus razones.</li><li>Distingue experiencia personal de hechos verificados.</li><li>Evita promesas de rentabilidad y consejos personalizados.</li><li>No publiques datos bancarios ni información privada.</li></ul></section>
        </aside>
      </div>
    </main>
  </div>;
}
