import Head from 'next/head';
import { SocialNetwork } from '../../components/SocialNetwork';
import { KaiHeaderIcon } from '../../components/KaiHeaderIcon';

export default function Channels() {
  function replayTutorial() {
    localStorage.removeItem('hasSeenStoxiaTutorial');
    window.location.reload();
  }

  return <div className="min-h-screen bg-[#0a111b] text-slate-100">
    <Head><title>Canales · Comunidad KAI</title><meta name="description" content="Explora canales gratuitos de inversión y gestión del dinero en la demo de KAI." /></Head>
    <header className="border-b border-white/10 px-5 py-3"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><KaiHeaderIcon /><button type="button" onClick={replayTutorial} className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300 hover:border-emerald-300 hover:text-emerald-200" aria-label="Volver a ver el tutorial de KAI">⚙ Tutorial</button></div></header>
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-9 sm:px-6">
      <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">Canales</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">Sigue los que te interesan para verlos en tu feed.</p>
      <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs text-amber-100">Demo: los creadores de ejemplo y sus movimientos son ficticios.</p>
      <SocialNetwork />
    </main>
  </div>;
}
