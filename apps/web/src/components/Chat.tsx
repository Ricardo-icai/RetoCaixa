import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Field, Language, Message, PublicSession } from '../../../../../packages/types/src/conversation.ts';
import { KaiMascot } from './KaiMascot';
import { useVoice } from '../hooks/useVoice';

const suggestions: Partial<Record<Field, [string[], string[]]>> = {
  goal: [['Ahorrar para mi futuro', 'Comprar una casa', 'Hacer un viaje'], ['Save for my future', 'Buy a house', 'Travel']],
  horizonMonths: [['8 meses', '5 años', '10 años'], ['8 months', '5 years', '10 years']],
  highCostDebt: [['No', 'Sí'], ['No', 'Yes']],
  stableIncome: [['Estables', 'Irregulares'], ['Stable', 'Irregular']],
  riskTolerance: [['Preferiría vender', 'Esperaría', 'Seguiría aportando'], ['I would sell', 'I would wait', 'I would keep contributing']],
  experience: [['Estoy empezando', 'Tengo algo de experiencia', 'Conozco bien la inversión'], ['I am a beginner', 'I have some experience', 'I am experienced']],
  portfolio: [['No tengo inversiones', 'Están diversificadas', 'Están concentradas'], ['No investments', 'Diversified', 'Concentrated']],
};
const labels: Partial<Record<Field, [string, string]>> = { goal: ['Objetivo', 'Goal'], horizonMonths: ['Plazo en meses', 'Horizon in months'], monthlyIncome: ['Ingresos mensuales', 'Monthly income'], essentialExpenses: ['Gastos esenciales', 'Essential expenses'], monthlyDebtPayments: ['Pagos de deuda', 'Debt payments'], nearTermCommitments: ['Otros compromisos mensuales', 'Other monthly commitments'], emergencySavings: ['Reserva para imprevistos', 'Emergency reserve'], monthlyContribution: ['Aportación deseada', 'Desired contribution'] };
const currency = (value: number, language: Language) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(value);

export default function Chat() {
  const [session, setSession] = useState<PublicSession | null>(null);
  const sessionRef = useRef<PublicSession | null>(null);
  const [language, setLanguage] = useState<Language>('es');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [pendingText, setPendingText] = useState('');
  const [confirmation, setConfirmation] = useState<Message | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(false);
  const en = language === 'en';
  const accept = useCallback((data: PublicSession) => { if (alive.current) { sessionRef.current = data; setSession(data); } }, []);

  const load = useCallback(async () => {
    const response = await fetch('/api/chat', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se ha podido abrir la conversación. Vuelve a intentarlo.');
    const data = await response.json() as PublicSession;
    accept(data); if (alive.current) { setLanguage(data.language); setError(''); }
  }, [accept]);
  useEffect(() => { alive.current = true; load().catch(err => { if (alive.current) setError(err.message); }); return () => { alive.current = false; request.current?.abort(); }; }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' }); }, [session?.messages.length, pendingText]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const mutate = useCallback(async (body: Record<string, unknown>): Promise<PublicSession | undefined> => {
    if (inFlight.current || !sessionRef.current) return;
    inFlight.current = true; setBusy(true); setError('');
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionRef.current.csrfToken }, body: JSON.stringify({ ...body, language, revision: sessionRef.current.revision }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) { if ([403, 409].includes(response.status)) await load(); throw new Error(data.error ?? 'No se ha podido completartar la solicitud.'); }
      accept(data); return data;
    } catch (err) { if (alive.current) setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'La respuesta ha tardado demasiado. Actualiza la conversación antes de volver a intentarlo.'); return undefined; }
    finally { clearTimeout(timeout); inFlight.current = false; if (alive.current) setBusy(false); }
  }, [accept, language, load]);

  const send = useCallback(async (text: string): Promise<string | undefined> => {
    if (!text.trim() || inFlight.current || !sessionRef.current) return;
    setPendingText(text); setDraft('');
    const data = await mutate({ operation: 'message', text });
    if (!alive.current) return;
    setPendingText('');
    if (!data) { setDraft(text); return; }
    const last = data.messages.at(-1);
    return last?.text + (last?.advice ? '\n' + last.advice.risk : '');
  }, [mutate]);
  const voice = useVoice({ language, onTranscript: setDraft, onSend: send });
  const latest = session?.messages.at(-1);
  const latestAdvice = latest?.advice;
  const chips = session?.pending ? suggestions[session.pending]?.[en ? 1 : 0] ?? [] : [];
  const speechText = (message: Message) => message.text + (message.advice ? '\n' + message.advice.risk : '');
  const state = busy ? 'THINKING_AGENT_PROCESSING' : voice.listening ? 'IDLE_LISTENING' : latestAdvice?.action === 'PROTECT' ? 'BUFFER_REST_PROTECT' : latestAdvice?.action === 'LEARN' ? 'SPEAKING_EDUCATIONAL' : 'SPEAKING_SERENE';
  useEffect(() => { if (confirmation) dialog.current?.showModal(); else dialog.current?.close(); }, [confirmation]);

  return <div className="min-h-screen bg-[#0a111b] text-slate-100">
    <Head><title>KAI · Tu copiloto de inversión</title><meta name="description" content="Habla con KAI y explora tus primeros pasos de inversión en una simulación." /></Head>
    <header className="border-b border-white/10 px-5 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <a href="/" className="text-xl font-semibold tracking-tight">imagin <span className="ml-2 text-emerald-300">/ KAI</span></a>
      <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-400 sm:block">{en ? 'Investment copilot' : 'Tu copiloto de inversión'}</span><label className="sr-only" htmlFor="language">Idioma / Language</label><select id="language" value={language} disabled={busy} onChange={event => { voice.stop(); setLanguage(event.target.value as Language); }} className="rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-sm"><option value="es">ES</option><option value="en">EN</option></select></div>
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <p className="mb-5 rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90">{en ? 'GUIDED DEMO · No external AI provider connected. Conversation uses a limited interpreter. No live market data or real transactions.' : 'DEMO GUIADA · Sin proveedor de IA externo conectado. La conversación usa un intérprete limitado. Sin datos de mercado en directo ni operaciones reales.'}</p>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <section className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#101b29]" aria-label={en ? 'Conversation with KAI' : 'Conversación con KAI'}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div><h1 className="font-semibold">{en ? 'Let’s talk about your next step' : 'Hablemos de tu siguiente paso'}</h1><p className="mt-1 text-xs text-slate-400">{voice.listening ? (en ? 'Listening…' : 'Te escucho…') : voice.speaking ? (en ? 'KAI is speaking…' : 'KAI está hablando…') : busy ? (en ? 'Reviewing your situation…' : 'Revisando tu situación…') : (en ? 'At your pace, one question at a time' : 'A tu ritmo, una pregunta cada vez')}</p></div><span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${busy ? 'bg-amber-200' : 'bg-emerald-300'}`} /></div>
          <div className="chat-scroll h-[min(58dvh,600px)] min-h-72 space-y-5 overflow-y-auto px-4 py-6 sm:px-6" role="log" aria-label={en ? 'Messages' : 'Mensajes'} aria-live="polite" aria-relevant="additions text">
            {!session && !error && <p className="text-sm text-slate-400">{en ? 'Opening conversation…' : 'Abriendo conversación…'}</p>}
            {session?.messages.map(message => <article key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[88%]' : 'mr-auto max-w-[95%]'}>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400">{message.role === 'user' ? (en ? 'YOU' : 'TÚ') : 'KAI'}</p>
              <div className={`rounded-2xl p-4 text-sm leading-7 ${message.role === 'user' ? 'bg-emerald-300 text-slate-950' : 'border border-white/10 bg-white/[0.035]'}`}>
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {message.advice && <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                  {message.advice.reasons.length > 0 && <details><summary className="cursor-pointer text-xs font-medium text-emerald-200">{en ? 'Why this answer?' : '¿Por qué esta respuesta?'}</summary><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-6 text-slate-300">{message.advice.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
                  <p className="text-xs leading-5 text-amber-100">{message.advice.risk}</p>
                  {message.advice.annualCostPercent !== undefined && <p className="text-xs text-slate-300">{en ? 'Illustrative annual cost' : 'Coste anual ilustrativo'}: {message.advice.annualCostPercent.toLocaleString(en ? 'en-IE' : 'es-ES')} %.</p>}
                  {message.advice.action === 'INVEST' && latest?.id === message.id && !session.executedRecommendations.includes(message.id) && <button disabled={busy} onClick={() => { voice.stop(); setConfirmation(message); }} className="rounded-xl bg-emerald-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{message.advice.label} · {currency(message.advice.amount!, language)}</button>}
                  {session.executedRecommendations.includes(message.id) && <p className="text-xs text-emerald-200">{en ? 'Simulation recorded' : 'Simulación registrada'}</p>}
                </div>}
              </div>
              {message.role === 'assistant' && voice.canSpeak && <button disabled={busy || voice.listening || voice.conversation} onClick={() => { voice.stop(); voice.read(speechText(message)); }} className="mt-2 min-h-8 px-1 text-xs text-slate-400 hover:text-emerald-200 disabled:opacity-40" aria-label={en ? 'Listen to this response' : 'Escuchar esta respuesta'}>◖ {en ? 'Listen' : 'Escuchar'}</button>}
            </article>)}
            {pendingText && <p className="ml-auto max-w-[88%] rounded-2xl bg-emerald-300/20 p-4 text-sm break-words">{pendingText}</p>}
            {busy && <p className="text-xs text-emerald-200">{en ? 'KAI is reviewing your message…' : 'KAI está revisando tu mensaje…'}</p>}
            <div ref={end} />
          </div>
          <div className="border-t border-white/10 p-4 sm:p-5">
            {(error || voice.error) && <div role="alert" className="mb-3 rounded-lg bg-rose-400/10 p-3 text-xs leading-5 text-rose-200">{error || voice.error}{error && <button disabled={busy} onClick={() => { voice.stop(); load().catch(err => setError(err.message)); }} className="ml-2 underline">{en ? 'Refresh conversation' : 'Actualizar conversación'}</button>}</div>}
            {chips.length > 0 && !busy && <div className="mb-3 flex flex-wrap gap-2">{chips.map(chip => <button key={chip} disabled={voice.conversation || voice.listening} onClick={() => { voice.stop(); void send(chip); }} className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300 hover:border-emerald-300 hover:text-emerald-200 disabled:opacity-40">{chip}</button>)}</div>}
            <form onSubmit={event => { event.preventDefault(); voice.stop(); void send(draft); }} className="rounded-2xl border border-white/15 bg-[#0a111b] p-2 focus-within:border-emerald-300/60">
              <label htmlFor="message" className="sr-only">{en ? 'Message for KAI' : 'Mensaje para KAI'}</label>
              <textarea id="message" rows={2} value={draft} maxLength={2000} disabled={!session || busy || voice.conversation} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !voice.listening) { event.preventDefault(); voice.stop(); void send(draft); } }} placeholder={voice.listening ? (en ? 'Speak now…' : 'Habla ahora…') : (en ? 'Tell me what’s on your mind…' : 'Cuéntame qué tienes en mente…')} className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-500 disabled:opacity-60" />
              <div className="flex items-center justify-between gap-2"><button type="button" disabled={!voice.supported || busy || !session || voice.conversation} onClick={() => { if (voice.listening) voice.stop(); else { voice.stop(); voice.start(); } }} aria-pressed={voice.listening} aria-label={voice.listening ? 'Detener dictado' : 'Dictar mensaje'} className={`rounded-xl px-3 py-2 text-xs disabled:opacity-35 ${voice.listening ? 'bg-rose-300 text-slate-950' : 'bg-white/5 text-slate-300'}`}>🎙 {voice.listening ? (en ? 'Stop' : 'Detener') : (en ? 'Dictate' : 'Dictar')}</button><button type="submit" disabled={!draft.trim() || busy || !session || voice.listening || voice.conversation} className="rounded-xl bg-emerald-300 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-35">{en ? 'Send' : 'Enviar'} ↑</button></div>
            </form>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><button disabled={!session || !voice.supported || !voice.canSpeak || (busy && !voice.conversation)} onClick={() => voice.conversation ? voice.stop() : voice.startConversation(latest?.role === 'assistant' ? speechText(latest) : (en ? 'I’m listening.' : 'Te escucho.'))} className={`min-h-10 rounded-xl px-3 text-xs font-medium disabled:opacity-40 ${voice.conversation ? 'bg-rose-300/15 text-rose-200' : 'bg-emerald-300/10 text-emerald-200'}`}>{voice.conversation ? (en ? 'End voice conversation' : 'Terminar conversación por voz') : (en ? 'Start voice conversation' : 'Iniciar conversación por voz')}</button>{voice.speaking && !voice.conversation && <button onClick={voice.stop} className="text-xs text-slate-300">{en ? 'Stop audio' : 'Parar audio'}</button>}</div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">{voice.supported ? (en ? 'Dictation is editable before sending. Voice conversation sends each spoken turn automatically. Your browser may process audio using its speech service.' : 'El dictado se puede editar antes de enviarlo. La conversación por voz envía cada intervención automáticamente. El navegador puede procesar el audio con su servicio de voz.') : (en ? 'Voice input is not supported here. You can use the complete conversation by typing.' : 'Este navegador no permite dictado. Puedes mantener toda la conversación por escrito.')}</p>
          </div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-3xl border border-white/10 bg-[#101b29] p-5"><KaiMascot state={state} isSpeaking={voice.speaking} /><h2 className="text-center text-lg font-semibold">{en ? 'A little clarity for your money' : 'Un poco de claridad para tu dinero'}</h2><p className="mt-3 text-center text-xs leading-6 text-slate-400">{en ? 'Your goals, your pace. We start with your situation, and explain each step.' : 'Tus objetivos, tu ritmo. Partimos de tu situación y explicamos cada paso.'}</p></section>
          <section className="rounded-2xl border border-white/10 p-5"><h2 className="text-sm font-semibold">{en ? 'What you’ve told me' : 'Lo que me has contado'}</h2><p className="mt-1 text-xs text-slate-400">{en ? 'Declared by you · Not verified with a bank' : 'Declarado por ti · Sin verificar con el banco'}</p><dl className="mt-4 space-y-3">{session && Object.entries(session.profile).filter(([key]) => key in labels).map(([key, value]) => <div key={key}><dt className="text-xs text-slate-400">{labels[key as Field]?.[en ? 1 : 0]}</dt><dd className="mt-1 break-words text-sm">{typeof value === 'number' && key !== 'horizonMonths' ? currency(value, language) : String(value)}</dd></div>)}</dl>{!session?.profile.goal && <p className="mt-3 text-sm text-slate-400">{en ? 'Your plan starts with a conversation.' : 'Tu plan empieza con una conversación.'}</p>}</section>
          <section className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5"><h2 className="text-xs text-emerald-200">{en ? 'Simulated contributions this session' : 'Aportaciones simuladas en esta sesión'}</h2><p className="mt-2 text-3xl font-medium">{currency(session?.simulatedBalance ?? 0, language)}</p><p className="mt-2 text-xs leading-5 text-slate-400">{en ? 'No real money. Session data expires after 24 hours of inactivity or when the server restarts.' : 'Sin dinero real. La sesión caduca tras 24 horas de inactividad o al reiniciar el servidor.'}</p></section>
          <section className="rounded-2xl border border-white/10 p-5"><h2 className="text-sm font-semibold">{en ? 'Explore with KAI' : 'Descubre con KAI'}</h2>{[en ? 'What is diversification?' : '¿Qué es la diversificación?', en ? 'How do fees work?' : 'Explícame las comisiones', en ? 'What is happening in markets?' : '¿Qué pasa en el mercado?'].map(item => <button key={item} disabled={!session || busy || voice.conversation} onClick={() => { voice.stop(); void send(item); }} className="mt-3 block text-left text-xs leading-5 text-slate-300 hover:text-emerald-200 disabled:opacity-40">{item} ↗</button>)}</section>
          <button disabled={!session || busy} className="min-h-10 px-2 text-xs text-slate-400 underline disabled:opacity-40" onClick={async () => { voice.stop(); if (window.confirm(en ? 'Delete this demo conversation, profile and simulated contributions?' : '¿Borrar esta conversación, su perfil y las aportaciones simuladas?')) { const data = await mutate({ operation: 'reset' }); if (data) { setDraft(''); setConfirmation(null); } } }}>{en ? 'Start a new conversation' : 'Empezar una conversación nueva'}</button>
        </aside>
      </div>
    </main>
    <dialog ref={dialog} onCancel={() => setConfirmation(null)} className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 text-slate-100 backdrop:bg-black/70" aria-labelledby="confirm-title">
      <h2 id="confirm-title" className="text-lg font-semibold">{en ? 'Review your simulation' : 'Revisa tu simulación'}</h2><p className="my-5 text-3xl">{currency(confirmation?.advice?.amount ?? 0, language)}</p><p className="text-sm leading-6 text-slate-300">{en ? 'Demo global plan · Minimum horizon: 5 years · Illustrative annual cost: 0.20%.' : 'Plan global de ejemplo · Plazo mínimo: 5 años · Coste anual ilustrativo: 0,20 %.'}</p><p className="mt-4 text-sm leading-6 text-amber-100">{confirmation?.advice?.risk}</p><p className="mt-3 text-xs text-slate-400">{en ? 'Only the simulation balance changes. No money is sent to a bank or broker.' : 'Solo cambia el saldo de la simulación. No se envía dinero a un banco o bróker.'}</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setConfirmation(null)} className="rounded-xl px-3 py-3 text-sm">{en ? 'Cancel' : 'Cancelar'}</button><button disabled={busy} onClick={async () => { await mutate({ operation: 'simulate', recommendationId: confirmation?.id, confirmed: true }); setConfirmation(null); }} className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{en ? 'Confirm simulation' : 'Confirmar simulación'}</button></div>
    </dialog>
  </div>;
}
