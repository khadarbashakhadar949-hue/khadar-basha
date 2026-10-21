import React from 'react';
import { GameSettings, ControlInputMode } from '../game/types';
import { X, Gamepad2, Disc3, MoveHorizontal, Smartphone, Sliders, Keyboard, Check } from 'lucide-react';

interface ControlsSetupModalProps {
  settings: GameSettings;
  onUpdate: (updated: GameSettings) => void;
  onClose: () => void;
}

export const ControlsSetupModal: React.FC<ControlsSetupModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const setMode = (mode: ControlInputMode) => {
    onUpdate({ ...settings, controlMode: mode });
  };

  const setSensitivity = (val: number) => {
    onUpdate({ ...settings, steeringSensitivity: val });
  };

  const toggleAutoCenter = () => {
    onUpdate({ ...settings, autoCenterSteer: !settings.autoCenterSteer });
  };

  const toggleInvert = () => {
    onUpdate({ ...settings, invertSteer: !settings.invertSteer });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Controls Setup</h2>
              <p className="text-xs text-slate-400">Cross-Platform Steering & Sensitivity Configuration</p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 3 Main Control Modes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Select Driving Control Input
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Steering Wheel */}
              <button
                onClick={() => setMode('steering_wheel')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  settings.controlMode === 'steering_wheel'
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
                    <Disc3 size={24} />
                  </div>
                  <div className="font-bold text-white text-sm">Steering Wheel</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Realistic on-screen draggable wheel with rotation feedback
                  </div>
                </div>
                {settings.controlMode === 'steering_wheel' && (
                  <div className="flex items-center gap-1 text-purple-400 text-xs font-bold mt-3">
                    <Check size={14} /> Active
                  </div>
                )}
              </button>

              {/* Option 2: Left / Right Buttons */}
              <button
                onClick={() => setMode('buttons')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  settings.controlMode === 'buttons'
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
                    <MoveHorizontal size={24} />
                  </div>
                  <div className="font-bold text-white text-sm">Touch Buttons</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Classic Left & Right buttons with immediate response
                  </div>
                </div>
                {settings.controlMode === 'buttons' && (
                  <div className="flex items-center gap-1 text-purple-400 text-xs font-bold mt-3">
                    <Check size={14} /> Active
                  </div>
                )}
              </button>

              {/* Option 3: Phone Gyro Tilt */}
              <button
                onClick={() => setMode('phone_gyro')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                  settings.controlMode === 'phone_gyro'
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3">
                    <Smartphone size={24} />
                  </div>
                  <div className="font-bold text-white text-sm">Phone Gyro Tilt</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Tilt your mobile device left & right to steer intuitively
                  </div>
                </div>
                {settings.controlMode === 'phone_gyro' && (
                  <div className="flex items-center gap-1 text-purple-400 text-xs font-bold mt-3">
                    <Check size={14} /> Active
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Sensitivity & Toggles */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Sliders size={14} className="text-purple-400" /> Steering Sensitivity
                </span>
                <span className="text-purple-400 font-mono">{settings.steeringSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.steeringSensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={toggleAutoCenter}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                  settings.autoCenterSteer
                    ? 'bg-slate-800 border-purple-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-xs">Wheel Auto-Center</div>
                  <div className="text-[11px] text-slate-500">Snaps wheel back on release</div>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${settings.autoCenterSteer ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700'}`}>
                  {settings.autoCenterSteer && <Check size={12} />}
                </div>
              </button>

              <button
                onClick={toggleInvert}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                  settings.invertSteer
                    ? 'bg-slate-800 border-purple-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-xs">Invert Steer Axis</div>
                  <div className="text-[11px] text-slate-500">Reverse steering direction</div>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${settings.invertSteer ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700'}`}>
                  {settings.invertSteer && <Check size={12} />}
                </div>
              </button>
            </div>
          </div>

          {/* PC Keyboard & Controller Shortcuts Guide */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Keyboard size={14} className="text-cyan-400" /> PC Keyboard & Gamepad Controls
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">W / ↑</span>
                <span>Accelerate</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">S / ↓</span>
                <span>Brake / Reverse</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">A / D</span>
                <span>Steer Left / Right</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">Space</span>
                <span>Handbrake Drift</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">Shift</span>
                <span>Nitro Boost</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold">C / R</span>
                <span>Camera / Reset</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition active:scale-95 shadow-lg shadow-purple-600/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
