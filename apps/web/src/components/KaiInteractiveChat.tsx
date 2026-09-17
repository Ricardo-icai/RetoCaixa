import { useEffect, useRef, useState } from 'react';
import type { useVoice } from '../hooks/useVoice';
import { KaiIcon } from './KaiIcon';

type Props = {
  value: string; onChange: (text: string) => void; onSubmit: (text: string) => Promise<unknown>;
  busy: boolean; ready: boolean; language: 'es' | 'en'; voice: ReturnType<typeof useVoice>;
  error: string; onRefresh: () => void; latestText: string;
};

export function KaiInteractiveChat({ value, onChange, onSubmit, busy, ready, language, voice, error, onRefresh, latestText }: Props) {
  const en = language === 'en';
  const input = useRef<HTMLTextAreaElement>(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min(input.current.scrollHeight, 128)}px`;
  }, [value]);
  useEffect(() => {
    setSlow(false);
    if (!busy) return;
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [busy]);
  async function submit() {
    if (!value.trim() || busy || !ready || voice.listening || voice.conversation) return;
    voice.stop(); await onSubmit(value);
    input.current?.focus({ preventScroll: true });
  }
  return <div className="w-full border-t border-white/10 p-3 sm:p-4">
    {(error || voice.error) && <div role="alert" className="mb-2 rounded-2xl border border-rose-300/20 bg-slate-950/95 p-3 text-xs text-rose-200">{error || voice.error}{error && <button type="button" disabled={busy} onClick={onRefresh} className="ml-2 underline">{en ? 'Refresh conversation' : 'Actualizar conversación'}</button>}</div>}
    <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-2 shadow-[0_-8px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl focus-within:border-cyan-300/40">
      {busy && <p role="status" className="px-3 pb-2 pt-1 text-xs text-cyan-200">{slow ? (en ? 'This is taking longer than expected. Your message is still being processed…' : 'Está tardando más de lo previsto. Tu mensaje sigue en proceso…') : (en ? 'KAI is reviewing your message…' : 'KAI está revisando tu mensaje…')}</p>}
      <form onSubmit={event => { event.preventDefault(); void submit(); }} className="flex items-end gap-2">
        <button type="button" disabled={!voice.supported || busy || !ready || voice.conversation} onClick={() => voice.listening ? voice.finishDictation() : voice.start()} aria-label={voice.listening ? (en ? 'Stop dictation' : 'Detener dictado') : (en ? 'Dictate message' : 'Dictar mensaje')} aria-pressed={voice.listening} className={`mb-1 grid h-11 w-11 shrink-0 place-items-center rounded-full transition disabled:opacity-30 ${voice.listening ? 'animate-pulse bg-cyan-300/20 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-white/5 text-slate-400 hover:text-cyan-200'}`}><KaiIcon name="mic" /></button>
        <label htmlFor="kai-message" className="sr-only">{en ? 'Message for KAI' : 'Mensaje para KAI'}</label>
        <textarea ref={input} id="kai-message" rows={1} maxLength={2000} value={value} disabled={!ready || busy || voice.conversation} onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} placeholder={voice.listening ? (en ? 'Listening…' : 'Te escucho…') : (en ? 'Ask KAI or tell it what you want to do…' : 'Pregúntale a KAI o dile qué quieres hacer…')} className="max-h-32 min-h-12 min-w-0 flex-1 resize-none bg-transparent py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60" />
        <button type="submit" aria-label={en ? 'Send message' : 'Enviar mensaje'} disabled={!value.trim() || busy || !ready || voice.listening || voice.conversation} className="mb-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(52,211,153,0.15)] transition disabled:bg-none disabled:bg-white/5 disabled:text-slate-600 disabled:shadow-none"><KaiIcon name="send" /></button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-1 pt-2 text-[10px] text-slate-400">
        <span>{voice.supported ? (en ? 'Voice uses your browser’s speech service.' : 'La voz usa el servicio de dictado de tu navegador.') : (en ? 'Voice unavailable. You can type.' : 'Voz no disponible. Puedes escribir.')}</span>
        <button type="button" disabled={!ready || !voice.supported || !voice.canSpeak || (busy && !voice.conversation)} onClick={() => voice.conversation ? voice.stop() : voice.startConversation(latestText)} className="py-1 text-cyan-200 disabled:opacity-35">{voice.conversation ? (en ? 'End voice conversation' : 'Terminar conversación por voz') : (en ? 'Voice conversation' : 'Conversación por voz')}</button>
        {voice.speaking && !voice.conversation && <button type="button" onClick={voice.stop} className="py-1 text-cyan-200">{en ? 'Stop audio' : 'Parar audio'}</button>}
      </div>
    </div>
  </div>;
}
