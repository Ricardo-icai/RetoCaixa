import { KaiIcon } from './KaiIcon';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const tutorialKey = 'hasSeenStoxiaTutorial';

const tutorialSteps = [
  {
    tab: 'Feed',
    icon: 'feed',
    title: 'Tu comunidad de inversión',
    description: 'Descubre debates y contenidos según tus objetivos.',
  },
  {
    tab: 'Invertir',
    icon: 'growth',
    title: 'Practica antes de decidir',
    description: 'Prueba decisiones con dinero virtual, sin riesgo real.',
  },
  {
    tab: 'Aprender',
    icon: 'learn',
    title: 'Pregunta y aprende con KAI',
    description: 'Pregunta tus dudas y aprende cada concepto paso a paso.',
  },
  {
    tab: 'Red',
    icon: 'network',
    title: 'Construye tu propia red',
    description: 'Sigue canales y reúne sus publicaciones en tu feed.',
  },
] as const;

export function OnboardingTutorial() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const replay = () => { setCurrentStep(0); setVisible(true); };
    window.addEventListener('kai:replay-tutorial', replay);
    return () => window.removeEventListener('kai:replay-tutorial', replay);
  }, []);

  useEffect(() => {
    if (!router.isReady || router.pathname === '/' || router.pathname === '/verify-identity' || router.pathname.startsWith('/legal') || router.pathname.startsWith('/settings')) {
      setVisible(false);
      return;
    }
    try { setVisible(localStorage.getItem(tutorialKey) !== 'true'); } catch { setVisible(false); }
  }, [router.isReady, router.pathname]);

  useEffect(() => {
    if (!visible) { dialog.current?.close(); return; }
    if (!dialog.current?.open) dialog.current?.showModal();
    nextButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [visible, currentStep]);

  function finish() {
    try { localStorage.setItem(tutorialKey, 'true'); } catch { /* Replay remains available when browser storage is disabled. */ }
    setVisible(false);
    setCurrentStep(0);
  }

  const step = tutorialSteps[currentStep];

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); finish(); }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-auto rounded-3xl border border-emerald-300/15 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-slate-950/85 backdrop:backdrop-blur-sm" aria-labelledby="kai-tutorial-title">
    <section className="w-full overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <img src="/Gemini_Generated_Image_l41t8bl41t8bl41t.jpg" alt="KAI, copiloto de inversión" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/10 to-transparent" />
        <div className="absolute bottom-4 left-5 rounded-full border border-emerald-300/50 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.28)]">KAI</div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-start gap-4">
          <div aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-300/10 text-2xl shadow-[0_0_15px_rgba(52,211,153,0.2)]"><KaiIcon name={step.icon} className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold text-emerald-300">{step.tab} · {currentStep + 1} de {tutorialSteps.length}</p>
            <h2 id="kai-tutorial-title" className="mt-1 text-xl font-bold text-slate-50">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
          <div className="flex gap-1.5" aria-label={`Paso ${currentStep + 1} de ${tutorialSteps.length}`}>
            {tutorialSteps.map((item, index) => <span key={item.tab} aria-hidden="true" className={`h-1.5 rounded-full transition-all ${index === currentStep ? 'w-7 bg-emerald-400' : 'w-2 bg-slate-700'}`} />)}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={finish} className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-400 hover:text-slate-100">Saltar</button>
            <button ref={nextButton} type="button" onClick={() => currentStep < tutorialSteps.length - 1 ? setCurrentStep(stepIndex => stepIndex + 1) : finish()} className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/40">
              {currentStep === tutorialSteps.length - 1 ? '¡Empezar!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </section>
  </dialog>;
}
