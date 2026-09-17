import Head from 'next/head';
import { KaiIcon } from '../components/KaiIcon';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CommunitySnapshot } from '../community/types';
import { currentLegalAcceptance } from '../legal/policy';
import { FeedPersonalizationSettings } from '../components/FeedPersonalizationSettings';

export default function Settings() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/community', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('No se pudo consultar tu aceptación.');
      const data = await response.json();
      if (active) setSnapshot(data);
    }).catch(() => { if (active) setError('No se pudo consultar tu aceptación. Recarga la página para reintentar.'); });
    return () => { active = false; };
  }, []);
  const receipt = snapshot?.onboarding.legalAcceptance;
  return <main className="mx-auto max-w-lg space-y-7 px-5 py-8 text-slate-100">
    <Head><title>Ajustes · KAI</title></Head>
    <Link href="/community" className="text-sm text-emerald-200">← Comunidad</Link>
    <header className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 to-emerald-300/5 text-cyan-200"><KaiIcon name="settings" className="h-6 w-6" /></span><h1 className="text-3xl font-semibold tracking-tight">Ajustes</h1></header>
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950 shadow-xl shadow-black/10 backdrop-blur-md">
      {[{ href: '/settings/profile', title: 'Editar perfil', icon: 'edit' as const }, { href: '/profile', title: 'Ver mi perfil', icon: 'profile' as const }].map(item => <Link key={item.href} href={item.href} className="group flex items-center gap-4 border-b border-white/5 p-5 transition-colors hover:bg-emerald-300/5"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.025] text-emerald-200"><KaiIcon name={item.icon} /></span><span className="flex-1 text-sm font-medium">{item.title}</span><KaiIcon name="arrow" className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-emerald-200" /></Link>)}
      <button type="button" onClick={() => window.dispatchEvent(new Event('kai:replay-tutorial'))} className="group flex w-full items-center gap-4 border-b border-white/5 p-5 text-left transition-colors hover:bg-cyan-300/5"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/5 text-cyan-200"><KaiIcon name="replay" /></span><span className="flex-1 text-sm font-medium">Volver a ver el tutorial</span><KaiIcon name="arrow" className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-200" /></button>
      <Link href="/legal" className="group flex items-center gap-4 p-5 transition-colors hover:bg-emerald-300/5"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.025] text-emerald-200"><KaiIcon name="shield" /></span><span className="flex-1 text-sm font-medium">Legal y regulaciones</span><KaiIcon name="arrow" className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" /></Link>
    </div>
    {snapshot && <FeedPersonalizationSettings snapshot={snapshot} onChange={personalization => setSnapshot({ ...snapshot, personalization })} />}
    <section className="rounded-2xl border border-white/10 p-6"><h2 className="text-lg font-semibold">Tu aceptación</h2>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : !snapshot ? <p className="mt-3 text-sm text-slate-400">Consultando…</p> : receipt ? <div className="mt-3 space-y-3 text-sm text-slate-300"><p>{currentLegalAcceptance(receipt) ? 'Versiones vigentes aceptadas' : 'Hay versiones pendientes de aceptar'}</p><p>Fecha: {new Date(receipt.acceptedAt).toLocaleString('es-ES')}</p><p>Términos: {receipt.versions.terms} · Privacidad: {receipt.versions.privacy} · Riesgos: {receipt.versions.risk}</p><p>País declarado: {receipt.countryCode}. Edad mínima de la demo comprobada a partir de la fecha declarada; no equivale a verificación documental.</p><p className="text-xs text-slate-400">Registro temporal de esta demo. Puede perderse al reiniciar el servidor.</p></div> : <p className="mt-3 text-sm text-slate-300">No hay una aceptación registrada en esta sesión.</p>}
      {snapshot && !currentLegalAcceptance(receipt) && <Link href="/verify-identity" className="mt-4 inline-block text-sm text-emerald-200 underline">Revisar y aceptar las condiciones</Link>}
    </section>
  </main>;
}
