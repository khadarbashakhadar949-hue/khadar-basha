import React from 'react';
import { VehicleDefinition } from '../game/types';
import { Gauge, Weight, ArrowUpDown, Compass, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface ShowroomStatsProps {
  vehicle: VehicleDefinition;
  dirtLevel: number;
  isUnlocked: boolean;
  userCoins: number;
  onPrev: () => void;
  onNext: () => void;
  onUnlock: () => void;
  onOpenCleaning: () => void;
}

export const ShowroomStats: React.FC<ShowroomStatsProps> = ({
  vehicle,
  dirtLevel,
  isUnlocked,
  userCoins,
  onPrev,
  onNext,
  onUnlock,
  onOpenCleaning,
}) => {
  const { stats } = vehicle;
  const isDirty = dirtLevel > 0.05;

  return (
    <div className="absolute top-20 left-4 right-4 md:left-8 md:right-auto md:w-96 pointer-events-none z-10 flex flex-col gap-3">
      {/* Vehicle Category & Carousel Selector */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {vehicle.category.toUpperCase()}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Previous Vehicle"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Next Vehicle"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-between">
          <span>{vehicle.name}</span>
          {!isUnlocked && (
            <span className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              <Lock size={14} /> Locked
            </span>
          )}
        </h1>

        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {vehicle.description}
        </p>

        {/* Clean / Dirty Status Badge */}
        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-400'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isDirty ? `Vehicle Dirty (${Math.round(dirtLevel * 100)}%)` : 'Showroom Clean (100%)'}
            </span>
          </div>

          {isDirty && (
            <button
              onClick={onOpenCleaning}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-700/50 px-2 py-1 rounded-md transition active:scale-95"
            >
              <Sparkles size={13} /> Clean Now
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Specs Grid */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md pointer-events-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Compass size={14} className="text-cyan-400" /> Vehicle Characteristics
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Speed Range */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Gauge size={12} className="text-amber-400" /> Speed Range
            </span>
            <span className="text-base font-black text-white mt-1">
              0 - {stats.topSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (stats.topSpeedKmh / 320) * 100)}%` }}
              />
            </div>
          </div>

          {/* Weight */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Weight size={12} className="text-cyan-400" /> Weight
            </span>
            <span className="text-base font-black text-white mt-1">
              {stats.weightKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (stats.weightKg / 8500) * 100)}%` }}
              />
            </div>
          </div>

          {/* Height & Clearance */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={12} className="text-emerald-400" /> Height / Clearance
            </span>
            <span className="text-base font-black text-white mt-1">
              {stats.heightM}m <span className="text-xs font-normal text-slate-400">/ {Math.round(stats.clearanceM * 100)}cm</span>
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Ground clearance</span>
          </div>

          {/* Driving Purpose */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldAlert size={12} className="text-purple-400" /> Driving Purpose
            </span>
            <span className="text-xs font-bold text-purple-300 mt-1 leading-snug">
              {stats.drivingPurpose}
            </span>
            <span className="text-[10px] text-slate-500">
              Payload: {stats.cargoCapacity > 0 ? `${stats.cargoCapacity} Cargo Slots` : 'Passenger / Speed'}
            </span>
          </div>
        </div>

        {/* Unlock Button if locked */}
        {!isUnlocked && (
          <div className="mt-3.5 pt-3 border-t border-slate-800">
            <button
              onClick={onUnlock}
              disabled={userCoins < vehicle.price}
              className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition shadow-lg ${
                userCoins >= vehicle.price
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Lock size={16} /> Unlock for ${vehicle.price.toLocaleString()}
            </button>
            {userCoins < vehicle.price && (
              <p className="text-[11px] text-center text-amber-500/80 mt-1.5">
                Need ${(vehicle.price - userCoins).toLocaleString()} more coins
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
