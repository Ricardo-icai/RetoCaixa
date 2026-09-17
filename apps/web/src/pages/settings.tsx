import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CommunitySnapshot } from '../community/types';
import { currentLegalAcceptance } from '../legal/policy';

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
  return <main className="mx-auto max-w-3xl space-y-7 px-5 py-10 text-slate-100">
    <Head><title>Ajustes · KAI</title></Head>
    <Link href="/community" className="text-sm text-emerald-200">← Comunidad</Link>
    <h1 className="text-3xl font-semibold">Ajustes</h1>
    <Link href="/settings/profile" className="block rounded-2xl border border-cyan-300/25 bg-slate-900/60 p-6"><h2 className="text-xl font-semibold">Editar perfil ↗</h2><p className="mt-3 text-sm text-slate-300">Tu foto, nombre, biografía y estilo.</p></Link>
    <Link href="/profile" className="block text-sm text-emerald-200">Ver mi perfil ↗</Link>
    <Link href="/legal" className="block rounded-2xl border border-emerald-300/30 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Legal y regulaciones ↗</h2><p className="mt-3 text-sm leading-7 text-slate-300">Términos y condiciones, privacidad, cookies, riesgos y estado de revisión normativa por territorio.</p></Link>
    <section className="rounded-2xl border border-white/10 p-6"><h2 className="text-lg font-semibold">Tu aceptación</h2>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : !snapshot ? <p className="mt-3 text-sm text-slate-400">Consultando…</p> : receipt ? <div className="mt-3 space-y-3 text-sm text-slate-300"><p>{currentLegalAcceptance(receipt) ? 'Versiones vigentes aceptadas' : 'Hay versiones pendientes de aceptar'}</p><p>Fecha: {new Date(receipt.acceptedAt).toLocaleString('es-ES')}</p><p>Términos: {receipt.versions.terms} · Privacidad: {receipt.versions.privacy} · Riesgos: {receipt.versions.risk}</p><p>País declarado: {receipt.countryCode}. Edad mínima de la demo comprobada a partir de la fecha declarada; no equivale a verificación documental.</p><p className="text-xs text-slate-400">Registro temporal de esta demo. Puede perderse al reiniciar el servidor.</p></div> : <p className="mt-3 text-sm text-slate-300">No hay una aceptación registrada en esta sesión.</p>}
      {snapshot && !currentLegalAcceptance(receipt) && <Link href="/verify-identity" className="mt-4 inline-block text-sm text-emerald-200 underline">Revisar y aceptar las condiciones</Link>}
    </section>
  </main>;
}
