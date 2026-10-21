import React from 'react';
import { GameSettings } from '../game/types';
import { X, Settings, Volume2, Monitor, Sliders, VolumeX, Sparkles, Check } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (updated: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const update = (patch: Partial<GameSettings>) => {
    const updated = { ...settings, ...patch };
    onUpdate(updated);
    soundEngine.setVolumes(updated.masterVolume, updated.engineVolume, updated.sfxVolume, updated.isMuted);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Game Settings</h2>
              <p className="text-xs text-slate-400">Audio, SFX, Graphics & Performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Audio & Sound Effects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Volume2 size={14} className="text-cyan-400" /> Audio & Sound Effects
              </h3>
              <button
                onClick={() => update({ isMuted: !settings.isMuted })}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                  settings.isMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {settings.isMuted ? 'Muted' : 'Sound On'}
              </button>
            </div>

            {/* Master Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Master Volume</span>
                <span className="font-mono text-cyan-400">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => update({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Engine Sound Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Vehicle Engine Volume</span>
                <span className="font-mono text-cyan-400">{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => update({ engineVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Sound Effects (SFX / Screech / Coins)</span>
                <span className="font-mono text-cyan-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => update({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Monitor size={14} className="text-purple-400" /> Graphics & Performance
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', name: 'High (60 FPS)', desc: 'Full PBR & Shadows' },
                { id: 'medium', name: 'Balanced', desc: 'Smooth Gameplay' },
                { id: 'low', name: 'Performance', desc: 'Low Battery / Power' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => update({ graphicsQuality: q.id as any })}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.graphicsQuality === q.id
                      ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white text-xs">{q.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{q.desc}</div>
                </button>
              ))}
            </div>

            {/* Dynamic Shadows Toggle */}
            <button
              onClick={() => update({ shadows: !settings.shadows })}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition ${
                settings.shadows
                  ? 'bg-slate-800 border-purple-500/60 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-xs">Real-Time PCF Soft Shadows</div>
                <div className="text-[11px] text-slate-500">Realistic vehicle and environment contact shadows</div>
              </div>
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${settings.shadows ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700'}`}>
                {settings.shadows && <Check size={12} />}
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
