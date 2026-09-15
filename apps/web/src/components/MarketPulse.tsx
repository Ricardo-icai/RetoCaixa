import React from 'react';

export const MarketPulseWidget: React.FC = () => {
  const newsItems = [
    { id: '1', title: 'Mercados globales', status: 'Mixtos', summary: 'Tipos de interés estables según las señales de los bancos centrales.', icon: '🌍' },
    { id: '2', title: 'Tecnología', status: 'Volátil', summary: 'Mayor volatilidad en empresas vinculadas a la inteligencia artificial.', icon: '🤖' },
  ];

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📰</span>
          <h2 className="text-sm font-bold text-slate-100">Mercados simulados</h2>
        </div>
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
