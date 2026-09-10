import React, { useEffect } from 'react';
import { KaiVisualState } from '@copilot/types';

interface KaiMascotProps {
  state: KaiVisualState;
  isSpeaking: boolean;
}

export const KaiMascot: React.FC<KaiMascotProps> = ({ state, isSpeaking }) => {
  useEffect(() => {
    console.log(`[KAI State Machine] Transitioned to: ${state}`);
  }, [state]);

  const getStateStyles = (state: KaiVisualState) => {
    switch (state) {
      case 'PROTECTIVE_SHIELD':
        return 'bg-gradient-to-r from-blue-700 to-indigo-900 border-2 border-blue-400 shadow-blue-500/50';
      case 'CELEBRATION_MILESTONE':
        return 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-400/60 animate-bounce';
      case 'BUFFER_REST_PROTECT':
        return 'bg-gradient-to-r from-slate-500 to-blue-600 shadow-slate-400/30';
      case 'THINKING_AGENT_PROCESSING':
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse';
      default:
        return 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 shadow-cyan-500/40';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ease-in-out ${getStateStyles(state)}`}>
        {state === 'PROTECTIVE_SHIELD' && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-300/60 animate-ping opacity-75" />
        )}
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
          <span className={`text-4xl transition-transform duration-300 ${isSpeaking ? 'scale-110 animate-pulse' : 'scale-100'}`}>
            {state === 'PROTECTIVE_SHIELD' ? '🛡️' : state === 'CELEBRATION_MILESTONE' ? '🌟' : state === 'BUFFER_REST_PROTECT' ? '🧘' : '✨'}
          </span>
        </div>
      </div>
      {isSpeaking && (
        <div className="flex items-center space-x-1 mt-3">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs text-slate-400 font-medium">KAI is speaking...</span>
        </div>
      )}
    </div>
  );
};