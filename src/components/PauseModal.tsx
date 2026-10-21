import React from 'react';
import { Play, RotateCcw, Home, Settings, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnToGarage: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnToGarage,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-3xl font-black text-white font-teko tracking-wider uppercase">
          Simulation Paused
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Take a breath or tweak your controls
        </p>

        <div className="w-full space-y-3">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wide uppercase transition active:scale-95 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            <Play size={18} fill="currentColor" /> Resume Driving
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Restart Map
          </button>

          {/* Return to Garage */}
          <button
            onClick={onReturnToGarage}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
          >
            <Home size={16} /> Return to Garage
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800 w-full justify-center">
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
