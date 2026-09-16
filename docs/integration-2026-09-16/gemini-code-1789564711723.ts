'use client';

import React, { useState } from 'react';

interface Asset {
  symbol: string;
  name: string;
  category: string;
  ytdReturn: number;
  currentPrice: number;
  riskLevel: 'Bajo' | 'Moderado' | 'Alto';
  kaiReason: string; // Explicación personalizada basada en KAI
}

interface UserPosition {
  symbol: string;
  name: string;
  invested: number;
  currentValue: number;
  profitLossPercent: number;
  ytdReturn: number;
}

export const TradeTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(50);
  const [activeView, setActiveView] = useState<'MARKET' | 'PORTFOLIO'>('MARKET');

  // Catálogo General de Activos (Simulado)
  const allAssets: Asset[] = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'IA & Tech', ytdReturn: 164.2, currentPrice: 135.20, riskLevel: 'Alto', kaiReason: 'Hablaste con KAI sobre el boom de procesadores para IA' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'Índice Global', ytdReturn: 24.8, currentPrice: 480.10, riskLevel: 'Bajo', kaiReason: 'Encaja con tu objetivo de bajo riesgo a largo plazo' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'Software & Cloud', ytdReturn: 31.4, currentPrice: 445.00, riskLevel: 'Moderado', kaiReason: 'Coincide con tu interés en computación en la nube' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Vehículos Eléctricos', ytdReturn: -8.2, currentPrice: 210.50, riskLevel: 'Alto', kaiReason: 'Mencionada en tu debate de energía limpia' },
  ];

  // Inversiones Activas del Usuario (Paper Trading - 10.000 €)
  const [userPortfolio, setUserPortfolio] = useState<UserPosition[]>([
    { symbol: 'NVDA', name: 'NVIDIA Corporation', invested: 200, currentValue: 242.80, profitLossPercent: 21.4, ytdReturn: 164.2 },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', invested: 500, currentValue: 532.50, profitLossPercent: 6.5, ytdReturn: 24.8 },
  ]);

  // Autocomplete / Filtrado de Búsqueda
  const filteredAssets = searchTerm.trim() === '' 
    ? [] 
    : allAssets.filter(asset => 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Activos Recomendados Personalizados por KAI
  const kaiRecommendedAssets = allAssets.filter(a => a.symbol === 'NVDA' || a.symbol === 'VOO');

  // Calcular métricas del Portfolio
  const totalInvested = userPortfolio.reduce((acc, pos) => acc + pos.invested, 0);
  const totalCurrentValue = userPortfolio.reduce((acc, pos) => acc + pos.currentValue, 0);
  const totalProfitPercent = (((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(1);

  const handleExecuteTrade = (asset: Asset) => {
    const existingIndex = userPortfolio.findIndex(p => p.symbol === asset.symbol);
    if (existingIndex >= 0) {
      const updated = [...userPortfolio];
      updated[existingIndex].invested += tradeAmount;
      updated[existingIndex].currentValue += tradeAmount;
      setUserPortfolio(updated);
    } else {
      setUserPortfolio([...userPortfolio, {
        symbol: asset.symbol,
        name: asset.name,
        invested: tradeAmount,
        currentValue: tradeAmount,
        profitLossPercent: 0,
        ytdReturn: asset.ytdReturn
      }]);
    }
    setSelectedAsset(null);
    setActiveView('PORTFOLIO'); // Cambia automáticamente a "Mis Inversiones" tras comprar
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans pb-28 max-w-md mx-auto space-y-5">
      
      {/* Switcher Superior: Descubrir / Mis Inversiones */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveView('MARKET')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeView === 'MARKET' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}>
          🔍 Invertir / Buscar
        </button>
        <button
          onClick={() => setActiveView('PORTFOLIO')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeView === 'PORTFOLIO' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}>
          💼 Mis Inversiones ({userPortfolio.length})
        </button>
      </div>

      {/* VISTA 1: BUSCADOR Y RECOMENDACIONES DE KAI */}
      {activeView === 'MARKET' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Buscador con Sugerencias en Tiempo Real */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por empresa, ticker ($NVDA) o sector (IA)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
              />
              <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
            </div>

            {/* Dropdown Autocomplete de Sugerencias */}
            {filteredAssets.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 divide-y divide-slate-800 overflow-hidden">
                {filteredAssets.map(asset => (
                  <div
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset)}
                    className="p-3 hover:bg-slate-800/60 cursor-pointer flex justify-between items-center transition-colors">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-100">${asset.symbol}</span>
                        <span className="text-[10px] text-slate-400">{asset.name}</span>
                      </div>
                      <span className="text-[9px] text-emerald-400 block mt-0.5">✨ {asset.kaiReason}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">+{asset.ytdReturn}% 1A</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Recomendados por KAI para Ti */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-base">✨</span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Recomendados por KAI según tus preferencias</h2>
            </div>

            <div className="space-y-2.5">
              {kaiRecommendedAssets.map((asset) => (
                <div 
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset)}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all cursor-pointer">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-100">${asset.symbol}</span>
                      <span className="text-[10px] text-slate-400">{asset.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                        Riesgo {asset.riskLevel}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium">
                        💡 {asset.kaiReason}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                      +{asset.ytdReturn}% 1A
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">{asset.currentPrice} €</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: MIS INVERSIONES ACTIVAS (PORTFOLIO DASHBOARD) */}
      {activeView === 'PORTFOLIO' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Tarjeta Resumen de Saldo */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Valor Total de Inversiones</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-extrabold text-slate-100">{totalCurrentValue.toFixed(2)} €</span>
              <span className={`text-xs font-bold font-mono px-2 py-1 rounded-full ${
                Number(totalProfitPercent) >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400'
              }`}>
                {Number(totalProfitPercent) >= 0 ? '+' : ''}{totalProfitPercent}% Rendimiento
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Saldo Virtual de Paper Trading disponible: €{(10000 - totalInvested).toLocaleString()}</p>
          </div>

          {/* Lista de Inversiones */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Posiciones Abiertas</h3>
            
            {userPortfolio.map((pos) => (
              <div key={pos.symbol} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-100">${pos.symbol}</span>
                    <span className="text-[10px] text-slate-400">{pos.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Invertido: <span className="text-slate-200 font-bold">{pos.invested} €</span> → Valor: <span className="text-slate-100 font-bold">{pos.currentValue.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-xs font-mono font-bold text-emerald-400 block">
                    +{pos.profitLossPercent}% (+{(pos.currentValue - pos.invested).toFixed(2)}€)
                  </span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold block">
                    +{pos.ytdReturn}% 1A
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE COMPRA / INVERSIÓN EN 1-CLIC */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">${selectedAsset.symbol}</h3>
                <p className="text-xs text-slate-400">{selectedAsset.name}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-500 hover:text-slate-200 text-sm">✕</button>
            </div>

            {/* Nota Inteligente de KAI */}
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
              <span>✨</span>
              <p><strong>Recomendación KAI:</strong> {selectedAsset.kaiReason}</p>
            </div>

            {/* Selector de Importe Preset */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold block">Selecciona el Importe (Paper Trading):</label>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => setTradeAmount(val)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      tradeAmount === val ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                    €{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón CTA Confirmar */}
            <button
              onClick={() => handleExecuteTrade(selectedAsset)}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-lg">
              ⚡ Confirmar Inversión de €{tradeAmount} en 1-Clic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};