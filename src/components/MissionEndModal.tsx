import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Coins, Flame, MapPin, XCircle, CheckCircle } from 'lucide-react';
import { MissionDefinition } from '../game/types';

interface MissionEndModalProps {
  success: boolean;
  mission: MissionDefinition | null;
  summary: {
    distance: number;
    coins: number;
    drift: number;
  };
  onRestart: () => void;
  onReturnToGarage: () => void;
}

export const MissionEndModal: React.FC<MissionEndModalProps> = ({
  success,
  mission,
  summary,
  onRestart,
  onReturnToGarage,
}) => {
  useEffect(() => {
    if (success) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#f59e0b', '#10b981', '#ec4899'],
        });
      } catch {}
    }
  }, [success]);

  const totalEarnings = summary.coins + (success ? (mission?.rewardCoins || 300) : 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Result Icon */}
        <div className={`p-4 rounded-3xl mb-4 ${success ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
          {success ? <Trophy size={48} className="animate-bounce" /> : <XCircle size={48} />}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-white font-teko tracking-wider uppercase">
          {success ? 'Mission Accomplished!' : 'Challenge Ended'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-6">
          {success
            ? 'Payload delivered intact & checkpoints reached!'
            : 'Out of fuel or cargo damaged beyond recovery.'}
        </p>

        {/* Earnings & Stats Breakdown Card */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin size={14} className="text-cyan-400" /> Distance Traveled
            </span>
            <span className="font-mono font-bold text-white">{summary.distance.toLocaleString()} m</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Flame size={14} className="text-purple-400" /> Drift Skill Points
            </span>
            <span className="font-mono font-bold text-purple-300">+{summary.drift.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-400" /> Coins Harvested
            </span>
            <span className="font-mono font-bold text-amber-400">+${summary.coins}</span>
          </div>

          {success && mission && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle size={14} /> Mission Bonus
              </span>
              <span className="font-mono font-bold text-emerald-400">+${mission.rewardCoins}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-black">
            <span className="text-white">Total Cash Payout</span>
            <span className="font-mono text-amber-400 text-lg">+${totalEarnings.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onReturnToGarage}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-sm tracking-wide uppercase transition active:scale-95 shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2"
          >
            <Home size={18} /> Claim Rewards & Return to Garage
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Retry Terrain
          </button>
        </div>
      </div>
    </div>
  );
};
