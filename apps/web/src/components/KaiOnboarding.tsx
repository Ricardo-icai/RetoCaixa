import { useEffect, useRef, useState } from 'react';
import type { Language, Profile } from '../../../../packages/types/src/conversation.ts';
import type { KaiOnboardingAnswers } from '../community/kaiOnboarding';
import { KaiMascot } from './KaiMascot';

type Props = {
  language: Language;
  profile: Profile;
  busy: boolean;
  error: string;
  onComplete: (answers: KaiOnboardingAnswers) => Promise<void>;
  onSkip: () => void;
};

export function KaiOnboarding({ language, profile, busy, error, onComplete, onSkip }: Props) {
  const en = language === 'en';
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(profile.monthlyIncome ?? 1500);
  const [expenses, setExpenses] = useState(profile.essentialExpenses ?? 900);
  const [debt, setDebt] = useState<boolean | undefined>(profile.highCostDebt);
  const [risk, setRisk] = useState<Profile['riskTolerance']>(profile.riskTolerance);
  const [limit, setLimit] = useState(Math.max(10000, profile.monthlyIncome ?? 0, profile.essentialExpenses ?? 0));
  const title = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  useEffect(() => { title.current?.focus(); }, [step]);
  const money = (value: number) => new Intl.NumberFormat(en ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const state = busy ? 'THINKING_AGENT_PROCESSING' : step === 1 ? debt === false ? 'CELEBRATION_MILESTONE' : debt === true ? 'BUFFER_REST_PROTECT' : 'THINKING_AGENT_PROCESSING' : 'SPEAKING_SERENE';
  const questions = en
    ? ['Let’s start with your day-to-day. Roughly, how much comes in and goes out each month?', 'Do you have any quick loans or credit card debt with high interest?', 'If the market fell 20% tomorrow, what would you feel like doing?']
    : ['Empecemos por tu día a día. Más o menos, ¿cuánto entra y cuánto necesitas cada mes?', '¿Tienes algún préstamo rápido o deuda de tarjeta con intereses altos?', 'Si el mercado cayera un 20 % mañana, ¿qué te saldría hacer?'];
  const card = (selected: boolean) => `min-h-20 rounded-2xl border p-5 text-left text-sm transition-colors ${selected ? 'border-emerald-300 bg-emerald-300/10 text-emerald-100' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/60'} disabled:opacity-50`;

  async function next() {
    if (busy || submitting.current) return;
    if (step < 2) { setStep(step + 1); return; }
    if (debt === undefined || !risk) return;
    submitting.current = true;
    try { await onComplete({ monthlyIncome: income, essentialExpenses: expenses, highCostDebt: debt, riskTolerance: risk }); }
    finally { submitting.current = false; }
  }

  return <section aria-label={en ? 'Get to know you with KAI' : 'KAI te conoce'} className="mx-auto max-w-2xl rounded-3xl border border-cyan-300/20 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md sm:p-8">
    <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
      <span>{en ? 'Your starting point' : 'Tu punto de partida'}</span>
      <span>{en ? 'Step' : 'Paso'} {step + 1} {en ? 'of' : 'de'} 3</span>
    </div>
    <div className="mt-3 flex gap-2" aria-hidden="true">{[0, 1, 2].map(index => <span key={index} className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? 'bg-gradient-to-r from-cyan-300 to-emerald-300' : 'bg-white/10'}`} />)}</div>
    <KaiMascot state={state} isSpeaking={false} />
    <form onSubmit={event => { event.preventDefault(); void next(); }}>
      <div key={step} className="kai-onboarding-step">
        <h1 ref={title} tabIndex={-1} className="text-xl font-medium leading-relaxed outline-none sm:text-2xl">{questions[step]}</h1>
        {step === 0 && <div className="mt-7 space-y-7">
          <p className="text-xs leading-5 text-slate-400">{en ? 'Slide to an estimate in euros. Check both amounts before continuing; zero is also valid.' : 'Desliza hasta una cifra aproximada en euros. Revisa ambos importes antes de continuar; cero también es válido.'}</p>
          {[{ id: 'kai-income', label: en ? 'Monthly income' : 'Ingresos al mes', value: income, set: setIncome, color: '#34d399' }, { id: 'kai-expenses', label: en ? 'Essential monthly expenses' : 'Gastos esenciales al mes', value: expenses, set: setExpenses, color: '#67e8f9' }].map(item => <div key={item.id}>
            <div className="flex items-center justify-between gap-3"><label htmlFor={item.id} className="text-sm text-slate-300">{item.label}</label><output htmlFor={item.id} className="text-xl font-semibold text-emerald-200">{money(item.value)}</output></div>
            <input id={item.id} type="range" min={0} max={limit} step={50} value={item.value} disabled={busy} onChange={event => item.set(Number(event.target.value))} aria-valuetext={money(item.value)} aria-describedby={item.id === 'kai-expenses' ? 'kai-expenses-help' : undefined} className="mt-4 h-8 w-full cursor-pointer" style={{ accentColor: item.color }} />
            <div className="flex justify-between text-xs text-slate-500"><span>0 €</span><span>{money(limit)}</span></div>
          </div>)}
          <p id="kai-expenses-help" className="text-xs leading-5 text-slate-400">{en ? 'Include housing, food and bills. We’ll ask about debt payments and other commitments separately.' : 'Incluye vivienda, comida y facturas. Las cuotas de deuda y otros compromisos los veremos por separado.'}</p>
          {limit < 10000000 && <button type="button" onClick={() => setLimit(Math.min(limit * 10, 10000000))} className="text-xs text-cyan-200 underline">{en ? 'I need a higher range' : 'Necesito un rango mayor'}</button>}
        </div>}
        {step === 1 && <div className="mt-7 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">{[true, false].map(value => <button key={String(value)} type="button" aria-pressed={debt === value} onClick={() => setDebt(value)} className={card(debt === value)}>{value ? (en ? 'Yes, I have some' : 'Sí, tengo alguna') : (en ? 'No high-interest debt' : 'No tengo deudas con intereses altos')}</button>)}</div>
          <p role="status" className="min-h-12 text-sm leading-6 text-slate-300">{debt === undefined ? (en ? 'No judgement. This helps us choose where to start.' : 'Sin juicios. Me ayuda a saber por dónde empezar.') : debt ? (en ? 'Thanks for telling me. We’ll put your financial breathing room first.' : 'Gracias por contármelo. Pondremos primero tu tranquilidad y tu margen para el día a día.') : (en ? 'That’s a good starting point. We still need to understand your savings and commitments.' : 'Es un buen punto de partida. Aún nos falta conocer tus ahorros y compromisos.')}</p>
        </div>}
        {step === 2 && <div className="mt-7 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">{(['high', 'medium', 'low'] as const).map(value => <button key={value} type="button" aria-pressed={risk === value} onClick={() => setRisk(value)} className={risk === value ? card(true) : card(false)}>{({ high: en ? 'Buy more' : 'Compraría más', medium: en ? 'Wait' : 'Esperaría', low: en ? 'Sell to feel safer' : 'Vendería para estar tranquilo/a' })[value]}</button>)}</div>
          <p className="text-xs leading-5 text-slate-400">{en ? 'There is no right answer. This is an initial indication of how you feel about risk; your financial capacity is assessed separately.' : 'No hay una respuesta correcta. Es una primera pista sobre cómo te sientes ante el riesgo; tu capacidad económica se evalúa por separado.'}</p>
        </div>}
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" disabled={busy || step === 0} onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-3 text-sm text-slate-300 disabled:opacity-30">{en ? 'Back' : 'Atrás'}</button>
        <button type="submit" disabled={busy || (step === 1 && debt === undefined) || (step === 2 && !risk)} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? (en ? 'Saving…' : 'Guardando…') : step === 2 ? (en ? 'Continue with KAI' : 'Seguir con KAI') : (en ? 'Continue' : 'Continuar')} →</button>
      </div>
      <button type="button" disabled={busy} onClick={onSkip} className="mt-5 w-full py-2 text-xs text-slate-400 underline disabled:opacity-40">{en ? 'I’d rather talk directly' : 'Prefiero hablar directamente'}</button>
      <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">{en ? 'Answers join this chat when you finish. You can review them with KAI or reset the conversation.' : 'Al terminar, las respuestas se añaden a este chat. Puedes revisarlas con KAI o resetear la conversación.'}</p>
    </form>
  </section>;
}
