import React, { useState } from 'react';
import { TerrainType, MissionType, MissionDefinition } from '../game/types';
import { TERRAIN_CONFIGS } from '../game/terrains/terrainManager';
import { X, Mountain, Sun, Snowflake, Building2, Package, Timer, Fuel, Compass, Play, Trophy } from 'lucide-react';

interface MapSelectModalProps {
  onSelectMapAndMission: (terrain: TerrainType, mission: MissionDefinition | null) => void;
  onClose: () => void;
  cargoCapacity: number;
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: 'cargo_delivery',
    name: 'Cargo Fragile Delivery',
    description: 'Safely deliver heavy payload across treacherous bumps without spilling or destroying cargo!',
    icon: 'package',
    targetDistance: 1200,
    cargoCount: 3,
    rewardCoins: 1200,
  },
  {
    id: 'timed_rush',
    name: 'Timed Speed Sprint',
    description: 'Race through checkpoints at maximum velocity before the stopwatch runs out.',
    icon: 'timer',
    targetDistance: 1500,
    timeLimitSec: 75,
    rewardCoins: 850,
  },
  {
    id: 'fuel_survival',
    name: 'Fuel Endurance Marathon',
    description: 'Survive extreme distance by collecting roadside canisters and conserving throttle momentum.',
    icon: 'fuel',
    targetDistance: 2000,
    initialFuelSec: 100,
    rewardCoins: 1500,
  },
  {
    id: 'free_drive',
    name: 'Infinite Highway Free Roam',
    description: 'Unconstrained infinite exploration. Drift corners, overtake AI traffic, and farm coins.',
    icon: 'compass',
    targetDistance: 99999,
    rewardCoins: 500,
  },
];

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  onSelectMapAndMission,
  onClose,
  cargoCapacity,
}) => {
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('mountains');
  const [selectedMission, setSelectedMission] = useState<MissionType>('cargo_delivery');

  const terrainKeys: TerrainType[] = ['mountains', 'sand_road', 'ice_bergs', 'city_road'];

  const getTerrainIcon = (t: TerrainType) => {
    switch (t) {
      case 'mountains': return <Mountain size={28} className="text-amber-400" />;
      case 'sand_road': return <Sun size={28} className="text-orange-400" />;
      case 'ice_bergs': return <Snowflake size={28} className="text-cyan-400" />;
      case 'city_road': return <Building2 size={28} className="text-blue-400" />;
    }
  };

  const getMissionIcon = (icon: string) => {
    switch (icon) {
      case 'package': return <Package size={18} className="text-amber-400" />;
      case 'timer': return <Timer size={18} className="text-red-400" />;
      case 'fuel': return <Fuel size={18} className="text-emerald-400" />;
      default: return <Compass size={18} className="text-purple-400" />;
    }
  };

  const handleStart = () => {
    const missionObj = MISSIONS.find((m) => m.id === selectedMission) || null;
    onSelectMapAndMission(selectedTerrain, missionObj);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Select Infinite Terrain & Mission
            </h2>
            <p className="text-xs text-slate-400">Choose your environment and driving objective</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. TERRAIN SELECTION */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              1. Choose Infinite Road Environment
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {terrainKeys.map((key) => {
                const config = TERRAIN_CONFIGS[key];
                const isSelected = selectedTerrain === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTerrain(key)}
                    className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getTerrainIcon(key)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-base leading-tight">{config.name}</div>
                      <div className="text-xs text-amber-400 font-semibold mt-0.5">{config.subtitle}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {config.description}
                      </div>

                      {/* Terrain Badges */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Friction: {Math.round(config.friction * 100)}%
                        </span>
                        {config.hasTraffic && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            AI Traffic
                          </span>
                        )}
                        {config.hasPotholes && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Potholes
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MISSION MODE SELECTION */}
          <div className="pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              2. Select Driving Mission Challenge
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MISSIONS.map((m) => {
                const isSelected = selectedMission === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMission(m.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getMissionIcon(m.icon)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{m.name}</span>
                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                          <Trophy size={13} /> +${m.rewardCoins}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {m.description}
                      </p>
                      <div className="text-[10px] text-slate-500 mt-1.5 font-semibold">
                        Goal: {m.targetDistance < 5000 ? `${m.targetDistance}m Distance` : 'Infinite Distance'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer with Start Drive CTA */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Infinite road procedurally generated ahead
          </div>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-sm tracking-wide uppercase transition active:scale-95 shadow-xl shadow-orange-500/25"
          >
            <Play size={18} fill="currentColor" />
            <span>Launch Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
