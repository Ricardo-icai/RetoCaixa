'use client';

import React, { useState } from 'react';
import { KaiMascot } from './KaiMascot';

// Interfaz simulada para los datos del vídeo
interface ReelData {
  id: string;
  creatorHandle: string;
  isVerified: boolean;
  verifiedReturn: string;
  description: string;
  assetSymbol: string;
  videoUrl: string; // URL de prueba o video real
  isHighRisk: boolean;
}

const mockReels: ReelData[] = [
  {
    id: '1',
    creatorHandle: '@Elena_Tech',
    isVerified: true,
    verifiedReturn: '+34.2% 1A',
    description: 'Por qué estoy aumentando mi posición en IA a largo plazo. 🚀',
    assetSymbol: 'NVDA',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isHighRisk: false,
  },
  {
    id: '2',
    creatorHandle: '@Crypto_Dani',
    isVerified: true,
    verifiedReturn: '+12.5% 1A',
    description: '¡Última hora! Este token acaba de explotar. ¿Entramos? 😱',
    assetSymbol: 'MEME',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isHighRisk: true, // Esto activará la protección de KAI
  }
];

export const ReelVideoFeed: React.FC = () => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    // Lógica básica para detectar qué vídeo está en pantalla (se puede mejorar con IntersectionObserver)
    const index = Math.round(e.currentTarget.scrollTop / window.innerHeight);
    setActiveVideoIndex(index);
  };

  return (
    // Contenedor principal con Scroll Snap para el efecto TikTok
    <div 
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-slate-950 pb-16"
      onScroll={handleScroll}
    >
      {mockReels.map((reel, index) => (
        <div key={reel.id} className="h-full w-full snap-start relative">
          
          {/* Reproductor de Vídeo de Fondo */}
          <video 
            src={reel.videoUrl}
            className="w-full h-full object-cover opacity-80"
            autoPlay={index === activeVideoIndex}
            loop
            muted
            playsInline
          />

          {/* Gradiente oscuro para que el texto sea legible */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/90" />

          {/* Intervención de KAI (Protección Anti-FOMO) */}
          {reel.isHighRisk && (
            <div className="absolute top-16 left-0 right-0 px-4 z-20 flex justify-center animate-in fade-in zoom-in slide-in-from-top-4">
              <div className="bg-blue-950/80 border border-blue-500/50 rounded-2xl p-3 flex items-center space-x-3 backdrop-blur-md shadow-lg shadow-blue-500/20">
                <div className="w-12 h-12 shrink-0">
                  <KaiMascot state="PROTECTIVE_SHIELD" isSpeaking={false} />
                </div>
                <div>
                  <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Aviso de KAI</p>
                  <p className="text-xs text-slate-200 leading-tight">Activo de alta volatilidad. Recuerda tu plan a largo plazo.</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del Creador y Botones Flotantes (Capa Inferior) */}
          <div className="absolute bottom-6 left-4 right-4 z-10 space-y-4">
            
            {/* Info del Creador */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-white">{reel.creatorHandle}</h3>
                {reel.isVerified && (
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold backdrop-blur-sm">
                    ✓ {reel.verifiedReturn}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 line-clamp-2">{reel.description}</p>
            </div>

            {/* Tarjeta de Inversión en 1-Clic */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3 backdrop-blur-md flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono">Activo mencionado</span>
                <span className="text-sm font-bold text-white">${reel.assetSymbol}</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="bg-slate-800 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  🔄 Copiar
                </button>
                <button className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                  ⚡ Invertir
                </button>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};