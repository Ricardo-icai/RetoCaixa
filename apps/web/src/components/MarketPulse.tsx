import React from 'react';

export const MarketPulseWidget: React.FC = () => {
  const newsItems = [
    { id: '1', title: 'Global Markets', status: 'Mixed', summary: 'Interest rates holding steady based on central bank signals.', icon: '🌍' },
    { id: '2', title: 'Tech Sector', status: 'Momentum', summary: 'Elevated volatility across artificial intelligence stocks.', icon: '🤖' },
  ];

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📰</span>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">Market Pulse · Demo</h2>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono">DATOS SIMULADOS</span>
      </div>
      <div className="space-y-3">
        {newsItems.map((item) => (
          <div key={item.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <span>{item.icon}</span>
                <span>{item.title}</span>
              </span>
              <span className="text-cyan-400 font-mono text-[11px]">{item.status}</span>
            </div>
            <p className="text-xs text-slate-400">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
};