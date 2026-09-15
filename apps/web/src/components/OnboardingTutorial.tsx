import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const tutorialKey = 'hasSeenStoxiaTutorial';

const tutorialSteps = [
  {
    tab: 'Feed',
    icon: '📱',
    title: 'Tu comunidad de inversión',
    description: 'Descubre debates y contenidos según tus objetivos.',
  },
  {
    tab: 'Invertir',
    icon: '⚡',
    title: 'Practica antes de decidir',
    description: 'Prueba decisiones con dinero virtual, sin riesgo real.',
  },
  {
    tab: 'KAI',
    icon: '✦',
    title: 'Pregunta y aprende con KAI',
    description: 'Pregunta tus dudas y aprende cada concepto paso a paso.',
  },
  {
    tab: 'Canales',
    icon: '💬',
    title: 'Construye tu propia red',
    description: 'Sigue canales y reúne sus publicaciones en tu feed.',
  },
] as const;

export function OnboardingTutorial() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!router.isReady || router.pathname === '/' || router.pathname === '/verify-identity') {
      setVisible(false);
      return;
    }
    setVisible(localStorage.getItem(tutorialKey) !== 'true');
  }, [router.isReady, router.pathname]);

  useEffect(() => {
    if (!visible) return;
    nextButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [visible, currentStep]);

  function finish() {
    localStorage.setItem(tutorialKey, 'true');
    setVisible(false);
    setCurrentStep(0);
  }

  if (!visible) return null;
  const step = tutorialSteps[currentStep];

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="kai-tutorial-title" onKeyDown={event => { if (event.key === 'Escape') finish(); }}>
    <section className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-emerald-950/40">
      <div className="relative h-44 overflow-hidden">
        <img src="/Gemini_Generated_Image_l41t8bl41t8bl41t.jpg" alt="KAI, copiloto de inversión" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/10 to-transparent" />
        <div className="absolute bottom-4 left-5 rounded-full border border-emerald-300/50 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.28)]">KAI</div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-start gap-4">
          <div aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-300/10 text-2xl shadow-[0_0_15px_rgba(52,211,153,0.2)]">{step.icon}</div>
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
  </div>;
}
