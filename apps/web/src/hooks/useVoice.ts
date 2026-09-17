import { useCallback, useEffect, useRef, useState } from 'react';

type ResultEvent = { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } };
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((e: ResultEvent) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null; start(): void; stop(): void; abort(): void };
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useVoice(options: { language: 'es' | 'en'; onTranscript: (text: string) => void; onSend: (text: string) => Promise<string | undefined> }) {
  const [supported, setSupported] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [conversation, setConversation] = useState(false);
  const [error, setError] = useState('');
  const currentOptions = useRef(options); currentOptions.current = options;
  const recognition = useRef<Recognition | null>(null);
  const continuous = useRef(false);
  const mounted = useRef(false);
  const epoch = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<() => void>(() => {});

  const stop = useCallback(() => {
    epoch.current++; continuous.current = false;
    if (timer.current) clearTimeout(timer.current);
    const instance = recognition.current; recognition.current = null;
    if (instance) { instance.onend = null; instance.onresult = null; instance.onerror = null; instance.abort(); }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (mounted.current) { setListening(false); setSpeaking(false); setConversation(false); }
  }, []);

  const read = useCallback((text: string, resume = false) => {
    if (!mounted.current) return;
    if (!('speechSynthesis' in window)) { stop(); setError('Este navegador no puede leer la respuesta en voz alta.'); return; }
    const generation = ++epoch.current;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentOptions.current.language === 'es' ? 'es-ES' : 'en-GB';
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.startsWith(currentOptions.current.language));
    if (voice) utterance.voice = voice;
    setSpeaking(true);
    utterance.onend = () => {
      if (!mounted.current || generation !== epoch.current) return;
      setSpeaking(false);
      if (resume && continuous.current) timer.current = setTimeout(() => startRef.current(), 350);
    };
    utterance.onerror = () => {
      if (!mounted.current || generation !== epoch.current) return;
      stop(); setError(currentOptions.current.language === 'es' ? 'No se ha podido leer la respuesta. Puedes seguir escribiendo.' : 'The response could not be read aloud. You can keep typing.');
    };
    window.speechSynthesis.speak(utterance);
  }, [stop]);

  const start = useCallback(() => {
    if (!mounted.current || recognition.current) return;
    const Constructor = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) { setError('El dictado no está disponible. Puedes escribir tu mensaje.'); return; }
    const generation = ++epoch.current;
    window.speechSynthesis?.cancel(); setSpeaking(false); setError('');
    const instance = new Constructor(); recognition.current = instance;
    instance.lang = currentOptions.current.language === 'es' ? 'es-ES' : 'en-GB';
    instance.interimResults = true; instance.continuous = false;
    let finalText = '';
    instance.onresult = event => {
      if (!mounted.current || generation !== epoch.current) return;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      currentOptions.current.onTranscript((finalText + interim).trim().slice(0, 2000));
    };
    instance.onerror = event => {
      if (!mounted.current || generation !== epoch.current) return;
      const messages: Record<string, string> = { 'not-allowed': 'No se ha permitido el micrófono. Actívalo en el navegador o escribe tu mensaje.', 'service-not-allowed': 'El servicio de dictado no está disponible.', 'audio-capture': 'No se ha encontrado un micrófono disponible.', network: 'El servicio de voz no tiene conexión. Puedes escribir tu mensaje.', 'no-speech': 'No he oído una frase. Pulsa el micrófono para intentarlo otra vez.' };
      stop(); setError(currentOptions.current.language === 'es' ? (messages[event.error] ?? 'No se ha podido usar la voz. Puedes escribir.') : 'Voice input is unavailable. Check microphone permission and connection, or continue typing.');
    };
    instance.onend = async () => {
      if (!mounted.current || generation !== epoch.current) return;
      recognition.current = null; setListening(false);
      if (timer.current) clearTimeout(timer.current);
      if (continuous.current && finalText.trim()) {
        const reply = await currentOptions.current.onSend(finalText.trim().slice(0, 2000));
        if (!mounted.current || generation !== epoch.current || !continuous.current) return;
        if (reply) read(reply, true); else stop();
      } else if (continuous.current) { stop(); setError(currentOptions.current.language === 'es' ? 'No he oído una frase. Puedes volver a activar la voz.' : 'No speech detected. You can start voice mode again.'); }
    };
    try { instance.start(); setListening(true); timer.current = setTimeout(() => instance.stop(), 25000); }
    catch { stop(); setError('No se ha podido iniciar el micrófono. Vuelve a intentarlo.'); }
  }, [read, stop]);
  startRef.current = start;

  const startConversation = useCallback((greeting: string) => {
    stop(); setError(''); continuous.current = true; setConversation(true); read(greeting, true);
  }, [read, stop]);
  useEffect(() => {
    mounted.current = true;
    setSupported(Boolean((window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition));
    setCanSpeak('speechSynthesis' in window);
    return () => { mounted.current = false; stop(); };
  }, [stop]);
  useEffect(() => { stop(); }, [options.language, stop]);
  const finishDictation = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    recognition.current?.stop();
  }, []);
  return { finishDictation, supported, canSpeak, listening, speaking, conversation, error, start, stop, read, startConversation };
}
