import Head from 'next/head';
import { legalVersions, currentLegalAcceptance } from '../legal/policy';
import { useEffect, useState } from 'react';
import { investorGoals, type CommunitySnapshot, type InvestorGoal } from '../community/types';
import { KaiHeaderIcon } from '../components/KaiHeaderIcon';

export default function VerifyIdentity() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [goals, setGoals] = useState<InvestorGoal[]>([]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [countryCode, setCountryCode] = useState('ES');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [adult, setAdult] = useState(false);
  const [risk, setRisk] = useState(false);
  const [step, setStep] = useState<'profile' | 'scan' | 'done'>('profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/community', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se ha podido abrir el onboarding.');
      const current = data as CommunitySnapshot;
      setSnapshot(current);
      setGoals(current.onboarding.goals);
      setVisibility(current.onboarding.visibility);
      setCountryCode(current.onboarding.countryCode ?? 'ES');
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

  function toggleGoal(goal: InvestorGoal) {
    setGoals(current => current.includes(goal) ? current.filter(item => item !== goal) : [...current, goal]);
  }

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    const next = await act({ operation: 'completeOnboarding', goals, visibility, countryCode, acceptTerms: terms, acknowledgePrivacy: privacy, acceptRisk: risk, confirmAdult: adult, legalVersions });
    if (next) setStep('scan');
  }

  async function simulateVerification() {
    const next = await act({ operation: 'verifyIdentityDemo' });
    if (next) setStep('done');
  }

  return <div className="min-h-screen bg-[#08111b] text-slate-100">
    <Head><title>Configura tu experiencia · KAI</title></Head>
    <header className="border-b border-white/10 px-5 py-3"><div className="mx-auto max-w-5xl"><KaiHeaderIcon /></div></header>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#173b3a] to-[#132033] p-7"><h1 className="text-3xl font-semibold leading-tight">Configura tu experiencia</h1><ol className="mt-8 space-y-4 text-sm"><li className={step === 'profile' ? 'text-emerald-200' : 'text-slate-400'}>01 · Objetivos</li><li className={step === 'scan' ? 'text-emerald-200' : 'text-slate-400'}>02 · Verificación</li><li className={step === 'done' ? 'text-emerald-200' : 'text-slate-400'}>03 · Feed</li></ol></section>
        <section className="rounded-3xl border border-white/10 bg-[#101d2a] p-6 sm:p-8">
          {error && <p role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
          {!snapshot && !error && <p className="text-sm text-slate-400">Preparando tu experiencia…</p>}
          {snapshot && step === 'profile' && <form onSubmit={submitProfile} className="space-y-6"><div><h2 className="text-2xl font-semibold">¿Qué quieres conseguir?</h2><p className="mt-2 text-sm text-slate-400">Elige una o varias opciones.</p></div><div className="grid gap-2 sm:grid-cols-2">{investorGoals.map(goal => <button key={goal} type="button" onClick={() => toggleGoal(goal)} aria-pressed={goals.includes(goal)} className={`rounded-xl border p-4 text-left text-sm ${goals.includes(goal) ? 'border-emerald-300 bg-emerald-300/10 text-emerald-100' : 'border-white/10 text-slate-300 hover:border-white/30'}`}>{goal}</button>)}</div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-300">País<select value={countryCode} onChange={event => setCountryCode(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#08111b] p-3 text-sm"><option value="ES">España</option><option value="MX">México</option><option value="US">Estados Unidos</option><option value="ZZ">Otro</option></select></label><fieldset><legend className="text-xs text-slate-300">Visibilidad del perfil</legend><div className="mt-2 flex gap-2">{(['PRIVATE', 'PUBLIC'] as const).map(item => <button key={item} type="button" onClick={() => setVisibility(item)} aria-pressed={visibility === item} className={`flex-1 rounded-xl border p-3 text-xs ${visibility === item ? 'border-emerald-300 text-emerald-200' : 'border-white/15 text-slate-400'}`}>{item === 'PRIVATE' ? 'Privado' : 'Público'}</button>)}</div></fieldset></div><div className="space-y-3 border-t border-white/10 pt-5"><p className="text-xs leading-6 text-slate-400">Demo para mayores de 18 años. La verificación es simulada; no se capturan documentos ni biometría. <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">Consultar el centro legal (nueva pestaña)</a>.</p>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} /> <span>Acepto los <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">términos y condiciones</a> (v. {legalVersions.terms}).</span></label>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={privacy} onChange={event => setPrivacy(event.target.checked)} /> <span>He leído la <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">información de privacidad</a>. Esto no autoriza publicidad ni biometría.</span></label>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={risk} onChange={event => setRisk(event.target.checked)} /> <span>Comprendo los <a href="/legal/risk" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">riesgos y límites de la simulación</a>.</span></label>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} /> Confirmo que tengo al menos 18 años.</label></div><button disabled={busy || goals.length === 0 || !terms || !privacy || !risk || !adult} className="w-full rounded-xl bg-emerald-300 p-4 text-sm font-semibold text-slate-950 disabled:opacity-40">Continuar ↗</button></form>}
          {snapshot && step === 'scan' && <div className="text-center"><div aria-hidden="true" className="mx-auto grid h-32 w-32 place-items-center rounded-[2rem] border border-emerald-300/30 bg-emerald-300/10 text-5xl">◇</div><h2 className="mt-6 text-2xl font-semibold">Verifica tu identidad</h2><p className="mx-auto mt-3 max-w-md text-sm text-slate-400">Simulación: no abre la cámara ni almacena documentos.</p><button onClick={() => void simulateVerification()} disabled={busy} className="mt-7 rounded-xl bg-emerald-300 px-6 py-4 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? 'Verificando…' : 'Simular verificación'}</button></div>}
          {snapshot && step === 'done' && <div className="text-center"><div aria-hidden="true" className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-300/15 text-4xl text-emerald-200">✓</div><h2 className="mt-6 text-2xl font-semibold">Tu feed está preparado</h2><p className="mt-3 text-sm text-slate-400">Objetivos: {snapshot.onboarding.goals.join(', ')}.</p><a href="/community" className="mt-7 inline-block rounded-xl bg-emerald-300 px-6 py-4 text-sm font-semibold text-slate-950">Entrar ↗</a></div>}
        </section>
      </div>
    </main>
  </div>;
}
