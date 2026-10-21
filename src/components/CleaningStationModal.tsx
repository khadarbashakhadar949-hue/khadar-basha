import React, { useState } from 'react';
import { VehicleDefinition } from '../game/types';
import { X, Sparkles, Droplets, Waves, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CleaningStationModalProps {
  vehicle: VehicleDefinition;
  dirtLevel: number;
  onClean: (callback: () => void) => void;
  onClose: () => void;
}

export const CleaningStationModal: React.FC<CleaningStationModalProps> = ({
  vehicle,
  dirtLevel,
  onClean,
  onClose,
}) => {
  const [isWashing, setIsWashing] = useState(false);
  const [justCleaned, setJustCleaned] = useState(false);

  const handleWashClick = () => {
    if (isWashing) return;
    setIsWashing(true);
    setJustCleaned(false);

    onClean(() => {
      setIsWashing(false);
      setJustCleaned(true);
    });
  };

  const dirtPercent = Math.round(dirtLevel * 100);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Vehicle Cleaning Station</h2>
              <p className="text-xs text-slate-400">High-Pressure Wash & Deep Paint Polish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isWashing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Vehicle Status Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Vehicle</span>
              <h3 className="text-lg font-black text-white">{vehicle.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{vehicle.tagline}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirt Accumulation</span>
              <div className={`text-xl font-black ${dirtPercent > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {dirtPercent}%
              </div>
            </div>
          </div>

          {/* Dirt Meter Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Droplets size={14} className="text-amber-500" /> Surface Grime & Mud Level
              </span>
              <span className="text-slate-400">{dirtPercent > 0 ? 'Requires Washing' : 'Clean & Polished'}</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dirtPercent > 40
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                    : dirtPercent > 10
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${Math.max(4, dirtPercent)}%` }}
              />
            </div>
          </div>

          {/* Cleaning Features Showcase */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
              <Waves size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">High-Pressure Jet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Blasts away stuck sand, mud, and road grime</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Nano-Ceramic Seal</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Restores deep metallic flake & showroom mirror gloss</div>
              </div>
            </div>
          </div>

          {/* Just Cleaned Celebration Notice */}
          {justCleaned && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-300 font-semibold">
                Vehicle is now sparkling clean with 100% showroom mirror shine!
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleWashClick}
            disabled={isWashing}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide uppercase transition shadow-xl flex items-center justify-center gap-2 ${
              isWashing
                ? 'bg-cyan-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 active:scale-[0.98] shadow-emerald-500/20'
            }`}
          >
            {isWashing ? (
              <>
                <Waves size={18} className="animate-spin" />
                <span>Washing & Polishing...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Clean Vehicle (Instant Shine)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
