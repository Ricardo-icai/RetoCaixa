import React, { useState } from 'react';
import Head from 'next/head';
import { KaiMascot } from '../components/KaiMascot';
import { MarketPulseWidget } from '../components/MarketPulse';
import { InvestmentDecisionEngine, UserFinancialSnapshot } from '@copilot/decision-engine';

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserFinancialSnapshot>({
    monthlyIncome: 1500,
    essentialExpenses: 900,
    emergencyBufferMonths: 4,
    riskToleranceScore: 50,
    riskCapacityScore: 60,
    goalHorizonMonths: 120,
    availableInvestableCash: 30,
    hasHighCostDebt: false,
  });

  const [copilotResponse, setCopilotResponse] = useState(() => 
    InvestmentDecisionEngine.evaluateUserSnapshot(userProfile)
  );

  const [showWhyDetail, setShowWhyDetail] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState('');
  const [simulatedBalance, setSimulatedBalance] = useState(0);
  const handleAction = () => {
    if (copilotResponse.recommendedAction === 'INVEST') {
      const amount = copilotResponse.primaryCTA.payload?.amount;
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        setSimulationNotice('No se ha podido validar el importe de la simulación.');
        return;
      }
      if (!window.confirm(`¿Confirmas la inversión simulada de €${amount}? Puedes perder parte del capital en una inversión real. Coste anual ilustrativo: 0,20 %. No se moverá dinero real.`)) return;
      setSimulatedBalance(value => value + amount);
      const updated = { ...userProfile, availableInvestableCash: 0 };
      setUserProfile(updated);
      setCopilotResponse(InvestmentDecisionEngine.evaluateUserSnapshot(updated));
      setSimulationNotice('Inversión simulada registrada. No se ha movido dinero real.');
    } else {
      setSimulationNotice(copilotResponse.recommendedAction === 'PROTECT' ? 'Objetivo de esta demo: reforzar el colchón de emergencia antes de invertir.' : 'No se ha realizado ninguna operación.');
    }
  };

  const handleSimulateProtect = () => {
    const updated = { ...userProfile, emergencyBufferMonths: 1, availableInvestableCash: 30 };
    setUserProfile(updated);
    setCopilotResponse(InvestmentDecisionEngine.evaluateUserSnapshot(updated));
    setSimulatedBalance(0);
    setSimulationNotice('');
  };

  const handleSimulateNormal = () => {
    const updated = { ...userProfile, emergencyBufferMonths: 4, availableInvestableCash: 30 };
    setUserProfile(updated);
    setCopilotResponse(InvestmentDecisionEngine.evaluateUserSnapshot(updated));
    setSimulatedBalance(0);
    setSimulationNotice('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <Head>
        <title>Imagin Copilot — CaixaBank</title>
      </Head>

      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">imagin</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">COPILOT</span>
        </div>
        <nav aria-label="Navegación principal" className="flex items-center gap-2">
          <a href="/community" className="text-xs text-emerald-200 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 hover:border-emerald-300">Comunidad</a>
          <a href="/chat" className="text-xs text-emerald-200 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 hover:border-emerald-300">Hablar con KAI</a>
        </nav>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">DEMO · Perfil, productos y mercado simulados. Sin conexión bancaria ni operaciones reales.</div>
        <div className="px-2"><p className="text-sm text-slate-400">Tu inversión simulada en esta sesión</p><p className="text-3xl font-semibold mt-1">€{simulatedBalance.toFixed(2)}</p></div>
        {simulationNotice && <p role="status" className="rounded-xl bg-emerald-950 p-4 text-sm text-emerald-200">{simulationNotice}</p>}
        <section className="bg-gradient-to-b from-slate-900 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
          <KaiMascot isSpeaking={false} state={copilotResponse.kaiState}/>
          <h1 className="text-lg font-semibold text-slate-100 mt-2 px-2">
            "{copilotResponse.directAnswer}"
          </h1>
          <button 
            onClick={() => setShowWhyDetail(!showWhyDetail)}
            className="mt-4 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
            {showWhyDetail ? "Hide Explanation" : "Why am I seeing this?"}
          </button>

          {showWhyDetail && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-left space-y-2">
              <ul className="space-y-1.5 text-xs text-slate-300">
                {copilotResponse.whyReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center space-x-2">
                <span>⚠️</span>
                <span>{copilotResponse.riskStatement}</span>
              </div>
            </div>
          )}
        </section>

        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Monthly Suggestion</p>
            <p className="text-base font-bold text-slate-100 mt-0.5">{copilotResponse.primaryCTA.label}</p>
          </div>
          <button onClick={handleAction} className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg text-sm">
            {copilotResponse.recommendedAction}
          </button>
        </section>

        <p className="text-xs text-slate-400 px-2">{copilotResponse.riskStatement} Coste anual ilustrativo del plan: 0,20 %. La rentabilidad no está garantizada.</p>
        <MarketPulseWidget/>

        <section className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl space-y-2 text-center">
          <p className="text-xs text-slate-500 uppercase font-mono">Demo Simulation Controls</p>
          <div className="flex justify-center space-x-3 text-xs">
            <button onClick={handleSimulateNormal} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">Normal Mode (Invest)</button>
            <button onClick={handleSimulateProtect} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">Low Buffer (Protect Mode)</button>
          </div>
        </section>
      </main>
    </div>
  );
}
