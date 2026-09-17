import Head from 'next/head';
import { ProgressiveProfileWizard } from '../components/ProgressiveProfileWizard';
import { currentLegalAcceptance } from '../legal/policy';
import { useEffect, useState } from 'react';
import { type CommunitySnapshot } from '../community/types';
import { KaiHeaderIcon } from '../components/KaiHeaderIcon';

export default function VerifyIdentity() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [step, setStep] = useState<'profile' | 'scan' | 'done'>('profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/community', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido abrir el onboarding.');
      const current = data as CommunitySnapshot;
      setSnapshot(current);
      if (current.onboarding.completed) setStep('done');
      else if (current.onboarding.kycStatus === 'PENDING' && currentLegalAcceptance(current.onboarding.legalAcceptance)) setStep('scan');
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'No se ha podido abrir el onboarding.'));
  }, []);

  async function act(body: Record<string, unknown>) {
    if (!snapshot || busy) return null;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': snapshot.csrfToken }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido completar el paso.');
      setSnapshot(data as CommunitySnapshot);
      return data as CommunitySnapshot;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido completar el paso.');
      return null;
    } finally { setBusy(false); }
  }

  async function simulateVerification() {
    const next = await act({ operation: 'verifyIdentityDemo' });
    if (next) setStep('done');
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <Head><title>Configura tu experiencia · KAI</title></Head>
    <header className="border-b border-white/10 px-5 py-3"><div className="mx-auto max-w-5xl"><KaiHeaderIcon /></div></header>
    <main className="mx-auto max-w-lg px-4 py-4 sm:px-6">
        <section className={step === 'profile' ? '' : 'mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8'}>
          {error && (step !== 'profile' || !snapshot) && <p role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
          {!snapshot && !error && <p className="text-sm text-slate-400">Preparando tu experiencia…</p>}
          {snapshot && step === 'profile' && <ProgressiveProfileWizard initial={snapshot.onboarding} busy={busy} error={error} onComplete={async body => {
            const next = await act(body);
            if (next) setStep('scan');
          }} />}
          {snapshot && step === 'scan' && <div className="text-center"><div aria-hidden="true" className="mx-auto grid h-32 w-32 place-items-center rounded-[2rem] border border-emerald-300/30 bg-emerald-300/10 text-5xl">◇</div><h2 className="mt-6 text-2xl font-semibold">Verifica tu identidad</h2><p className="mx-auto mt-3 max-w-md text-sm text-slate-400">Simulación: no abre la cámara ni almacena documentos.</p><button onClick={() => void simulateVerification()} disabled={busy} className="mt-7 rounded-xl bg-emerald-300 px-6 py-4 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Verificando…' : 'Simular verificación'}</button></div>}
          {snapshot && step === 'done' && <div className="text-center"><div aria-hidden="true" className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-300/15 text-4xl text-emerald-200">✓</div><h2 className="mt-6 text-2xl font-semibold">Tu feed está preparado</h2><p className="mt-3 text-sm text-slate-400">Objetivos: {snapshot.onboarding.goals.join(', ')}.</p><a href="/community" className="mt-7 inline-block rounded-xl bg-emerald-300 px-6 py-4 text-sm font-semibold text-slate-950">Entrar ↗</a></div>}
        </section>
    </main>
  </div>;
}
