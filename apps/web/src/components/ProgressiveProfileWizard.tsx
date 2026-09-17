import { useEffect, useRef, useState } from 'react';
import type { CommunitySnapshot, InvestorGoal } from '../community/types';
import { investorGoals } from '../community/types';
import { birthDateToISO } from '../community/birthDate';
import { birthDateError } from '../legal/age';
import { legalVersions } from '../legal/policy';
import { KaiMascot } from './KaiMascot';
import { BirthDateInput } from './BirthDateInput';
import { NationalityInput } from './NationalityInput';

type Props = {
  initial: CommunitySnapshot['onboarding'];
  busy: boolean;
  error: string;
  onComplete: (body: Record<string, unknown>) => Promise<void>;
};
const goalIcons: Record<InvestorGoal, string> = {
  'Aprender a invertir': '📚', 'Gestionar mi dinero': '🧭', 'Crear mi colchón': '🛡️',
  'Invertir a largo plazo': '🌱', 'Seguir inversores': '🤝',
};
const headings = ['¿Qué quieres conseguir?', 'Visibilidad del perfil', 'Los últimos detalles'];
const dialogue = ['Configuremos tu espacio. ¿Hacia dónde apuntamos?', '¿Prefieres que otras personas puedan ver tu perfil o mantenerlo privado?', 'Casi listos. Completemos tus datos y comprobemos la edad de acceso a esta demo.'];

export function ProgressiveProfileWizard({ initial, busy, error, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [goals, setGoals] = useState<InvestorGoal[]>(initial.goals);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [countryCode, setCountryCode] = useState(initial.countryCode ?? 'ES');
  const [nationality, setNationality] = useState(initial.nationality ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [risk, setRisk] = useState(false);
  const [localError, setLocalError] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const submitting = useRef(false);
  const displayedError = localError || error;
  useEffect(() => { title.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [currentStep]);
  useEffect(() => { if (displayedError) alert.current?.focus(); }, [displayedError]);

  function move(step: 1 | 2 | 3) {
    setDirection(step > currentStep ? 'forward' : 'back');
    setLocalError('');
    setCurrentStep(step);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || submitting.current) return;
    if (!goals.length) { setLocalError('Objetivos: elige al menos una opción.'); return; }
    if (currentStep < 3) { move((currentStep + 1) as 2 | 3); return; }
    const ageError = birthDateError(birthDateToISO(dateOfBirth));
    if (ageError) { setLocalError(ageError); return; }
    if (nationality.trim().length < 2 || nationality.trim().length > 80) { setLocalError('Nacionalidad: escribe entre 2 y 80 caracteres.'); return; }
    if (!terms || !privacy || !risk) { setLocalError('Revisa las casillas de términos, privacidad y riesgos.'); return; }
    setLocalError('');
    submitting.current = true;
    try { await onComplete({ operation: 'completeOnboarding', goals, visibility, countryCode, nationality: nationality.trim(), dateOfBirth: birthDateToISO(dateOfBirth), acceptTerms: terms, acknowledgePrivacy: privacy, acceptRisk: risk, legalVersions }); }
    finally { submitting.current = false; }
  }

  return <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col">
    <div className="sticky top-0 z-10 rounded-t-3xl bg-slate-950/95 pb-3 backdrop-blur-md">
      <KaiMascot state={busy ? 'THINKING_AGENT_PROCESSING' : currentStep === 1 ? 'SPEAKING_SERENE' : currentStep === 2 ? 'SPEAKING_EDUCATIONAL' : 'THINKING_AGENT_PROCESSING'} isSpeaking={false} />
      <ol aria-label="Progreso de configuración" className="flex gap-3 text-xs text-slate-400">{['Objetivos', 'Privacidad', 'Tus datos'].map((label, index) => <li key={label} aria-current={index + 1 === currentStep ? 'step' : undefined} className="flex-1"><span className={`mb-2 block h-1 rounded-full ${index + 1 <= currentStep ? 'bg-gradient-to-r from-cyan-300 to-emerald-300' : 'bg-slate-800'}`} /><span className={index + 1 === currentStep ? 'text-emerald-200' : ''}>{index + 1}. {label}</span></li>)}</ol>
    </div>
    <form onSubmit={event => void submit(event)} className="flex flex-1 flex-col">
      <fieldset disabled={busy} className="min-w-0 flex-1">
        <div key={currentStep} className={`py-6 ${direction === 'forward' ? 'profile-step-forward' : 'profile-step-back'}`}>
          <h1 ref={title} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">{headings[currentStep - 1]}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{dialogue[currentStep - 1]}</p>
          {currentStep === 1 && <><p className="mt-4 text-xs text-emerald-200">Puedes elegir varias opciones.</p><div className="mt-5 grid grid-cols-2 gap-3">{investorGoals.map(goal => <button key={goal} type="button" aria-pressed={goals.includes(goal)} onClick={() => setGoals(selected => selected.includes(goal) ? selected.filter(item => item !== goal) : [...selected, goal])} className={`min-h-32 rounded-2xl border bg-slate-900/40 p-4 text-left backdrop-blur-md transition duration-200 ${goals.includes(goal) ? 'scale-[1.02] border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.15)]' : 'border-slate-800 text-slate-300 hover:border-slate-600'}`}><span aria-hidden="true" className="mb-3 block text-3xl">{goalIcons[goal]}</span><span className="text-sm font-medium leading-5">{goal}</span></button>)}</div></>}
          {currentStep === 2 && <div className="mt-8 space-y-6"><div role="group" aria-label="Visibilidad del perfil" className="mx-auto flex w-full max-w-xs rounded-full border border-slate-800 bg-slate-900 p-1.5">{(['PRIVATE', 'PUBLIC'] as const).map(value => <button key={value} type="button" aria-pressed={visibility === value} onClick={() => setVisibility(value)} className={`flex-1 rounded-full border px-3 py-4 text-sm transition-colors ${visibility === value ? value === 'PRIVATE' ? 'border-slate-700 bg-slate-800 text-slate-100 shadow-md' : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-transparent text-slate-400'}`}>{value === 'PRIVATE' ? '🔒 Privado' : '🌐 Público'}</button>)}</div><p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm leading-6 text-slate-300">{visibility === 'PRIVATE' ? 'Tu perfil empieza privado: otras personas no podrán consultarlo.' : 'Otras personas podrán consultar tu perfil y seguirte cuando completes la verificación simulada.'} Las publicaciones y respuestas que compartas en el feed son públicas en ambos casos.</p></div>}
          {currentStep === 3 && <div className="mt-6 space-y-6">
            <label className="block text-xs text-slate-400" htmlFor="residence-country">País de residencia<select id="residence-country" name="countryCode" autoComplete="country" required value={countryCode} onChange={event => setCountryCode(event.target.value)} className="mt-1 block w-full border-b border-slate-700 bg-transparent py-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"><option className="bg-slate-900" value="ES">España</option><option className="bg-slate-900" value="MX">México</option><option className="bg-slate-900" value="US">Estados Unidos</option><option className="bg-slate-900" value="ZZ">Otro</option></select></label>
            <NationalityInput value={nationality} onChange={setNationality} minimal />
            <BirthDateInput value={dateOfBirth} onChange={setDateOfBirth} minimal />
            <div className="space-y-4 border-t border-slate-800 pt-5">
              <p className="text-xs leading-6 text-slate-400">Demo disponible desde los 18 años; todavía sin cuentas tuteladas. La verificación es simulada; no se capturan documentos ni biometría. <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">Consultar el centro legal (nueva pestaña)</a>.</p>
                          <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} /> <span>Acepto los <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">términos y condiciones</a> (v. {legalVersions.terms}).</span></label>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={privacy} onChange={event => setPrivacy(event.target.checked)} /> <span>He leído la <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">información de privacidad</a>. Esto no autoriza publicidad ni biometría.</span></label>
            <label className="flex gap-3 text-xs leading-6 text-slate-300"><input required type="checkbox" checked={risk} onChange={event => setRisk(event.target.checked)} /> <span>Comprendo los <a href="/legal/risk" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">riesgos y límites de la simulación</a>.</span></label>

            </div>
          </div>}
        </div>
      </fieldset>
      {displayedError && <p ref={alert} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">{displayedError}</p>}
      <div className="sticky bottom-0 z-10 flex justify-between gap-3 border-t border-white/5 bg-slate-950/95 py-4 backdrop-blur-md">
        <button type="button" disabled={busy || currentStep === 1} onClick={() => move((currentStep - 1) as 1 | 2)} className="rounded-full px-5 py-3 text-sm text-slate-300 disabled:invisible">Atrás</button>
        <button type="submit" disabled={busy || (currentStep === 1 && !goals.length)} className="rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.2)] transition disabled:opacity-35 disabled:shadow-none">{busy ? 'Guardando…' : currentStep === 3 ? 'Continuar' : 'Siguiente'} <span aria-hidden="true">→</span></button>
      </div>
    </form>
  </div>;
}
