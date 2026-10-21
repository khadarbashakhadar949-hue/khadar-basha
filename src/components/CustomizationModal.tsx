import React, { useState } from 'react';
import { VehicleCustomization, RimStyle, TireType, SpoilerStyle, RoofPartStyle, BumperStyle, UnderglowColor } from '../game/types';
import { PAINT_PRESETS, SOLID_PALETTE } from '../game/vehicles/specs';
import { X, Palette, Disc, Shield, Sparkles, Check } from 'lucide-react';

interface CustomizationModalProps {
  customization: VehicleCustomization;
  onUpdate: (updated: VehicleCustomization) => void;
  onClose: () => void;
  userCoins: number;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  customization,
  onUpdate,
  onClose,
  userCoins,
}) => {
  const [subTab, setSubTab] = useState<'paint' | 'wheels' | 'body'>('paint');
  const [paintMode, setPaintMode] = useState<'presets' | 'multicolor' | 'finish'>('presets');

  const update = (patch: Partial<VehicleCustomization>) => {
    onUpdate({ ...customization, ...patch });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Vehicle Custom Studio</h2>
              <p className="text-xs text-slate-400">Paints, Custom Rims, Bodywork & Underglow Neons</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800/80 flex items-center gap-2 bg-slate-900/60">
          <button
            onClick={() => setSubTab('paint')}
            className={`flex items-center gap-2 pb-3 font-bold text-sm border-b-2 transition ${
              subTab === 'paint'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={16} /> Paint & Finish
          </button>

          <button
            onClick={() => setSubTab('wheels')}
            className={`flex items-center gap-2 pb-3 font-bold text-sm border-b-2 transition ${
              subTab === 'wheels'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc size={16} /> Wheels & Tires
          </button>

          <button
            onClick={() => setSubTab('body')}
            className={`flex items-center gap-2 pb-3 font-bold text-sm border-b-2 transition ${
              subTab === 'body'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={16} /> Body Parts & Neons
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ==================== PAINT TAB ==================== */}
          {subTab === 'paint' && (
            <div className="space-y-6">
              {/* Paint Sub-Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                <button
                  onClick={() => setPaintMode('presets')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    paintMode === 'presets' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unique Presets
                </button>
                <button
                  onClick={() => setPaintMode('multicolor')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    paintMode === 'multicolor' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Multi-Color Custom
                </button>
                <button
                  onClick={() => setPaintMode('finish')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    paintMode === 'finish' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paint Finish
                </button>
              </div>

              {/* 1. PRESETS */}
              {paintMode === 'presets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAINT_PRESETS.map((p) => {
                    const isSelected = customization.presetId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          update({
                            presetId: p.id,
                            primaryColor: p.primary,
                            secondaryColor: p.secondary,
                            rimColor: p.rimColor,
                          });
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            {p.badge && (
                              <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.primary }} />
                            <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.secondary }} />
                            <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.rimColor }} />
                          </div>
                        </div>
                        {isSelected && <Check size={18} className="text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. MULTI-COLOR SELECTION */}
              {paintMode === 'multicolor' && (
                <div className="space-y-4">
                  {/* Primary Body Color */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Primary Body Color
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {SOLID_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => update({ primaryColor: c.hex, presetId: undefined })}
                          className={`w-9 h-9 rounded-xl border transition active:scale-90 flex items-center justify-center ${
                            customization.primaryColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-white ring-2 ring-cyan-500 shadow-md'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {customization.primaryColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check size={14} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Accent Color (Roof / Stripes / Trim) */}
                  <div className="pt-3 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Secondary Roof & Accent Color
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {SOLID_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => update({ secondaryColor: c.hex, presetId: undefined })}
                          className={`w-9 h-9 rounded-xl border transition active:scale-90 flex items-center justify-center ${
                            customization.secondaryColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-white ring-2 ring-cyan-500 shadow-md'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {customization.secondaryColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check size={14} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rim & Wheel Color */}
                  <div className="pt-3 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Wheel Rim Finish Color
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {SOLID_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => update({ rimColor: c.hex, presetId: undefined })}
                          className={`w-9 h-9 rounded-xl border transition active:scale-90 flex items-center justify-center ${
                            customization.rimColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-white ring-2 ring-cyan-500 shadow-md'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {customization.rimColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check size={14} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PAINT FINISH */}
              {paintMode === 'finish' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'metallic', name: 'Metallic Pearl', desc: 'Deep reflective flake finish' },
                    { id: 'gloss', name: 'Showroom Gloss', desc: 'Classic mirror shine' },
                    { id: 'satin', name: 'Satin Silk', desc: 'Velvety smooth sheen' },
                    { id: 'matte', name: 'Stealth Matte', desc: 'Zero reflection military look' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update({ paintFinish: f.id as any })}
                      className={`p-4 rounded-2xl border text-left transition ${
                        customization.paintFinish === f.id
                          ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white text-sm">{f.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{f.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== WHEELS & TIRES TAB ==================== */}
          {subTab === 'wheels' && (
            <div className="space-y-6">
              {/* Rim Styles */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2.5">
                  Wheel Rim Designs
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'sport5', name: 'Sport 5-Spoke', desc: 'Lightweight track rims' },
                    { id: 'beadlock', name: 'Heavy Beadlock', desc: 'Rugged rock crawling' },
                    { id: 'turbine', name: 'Turbine Aero', desc: 'Modern aerodynamic spokes' },
                    { id: 'deepdish', name: 'Deep-Dish Chrome', desc: 'Aggressive muscle stance' },
                    { id: 'golden_mesh', name: 'BBS Cross Mesh', desc: 'Luxury motorsport mesh' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => update({ rimStyle: r.id as RimStyle })}
                      className={`p-3 rounded-xl border text-left transition ${
                        customization.rimStyle === r.id
                          ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white text-xs">{r.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tire Types */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-2.5">
                  Tire Compound & Tread
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'street', name: 'Street Slicks', desc: 'Maximum asphalt traction & grip' },
                    { id: 'all_terrain', name: 'All-Terrain Mud Biter', desc: 'Deep chevron treads for sand & dirt' },
                    { id: 'ice_spikes', name: 'Glacier Studded Spikes', desc: 'Carbide studs for frozen lakes' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update({ tireType: t.id as TireType })}
                      className={`p-3 rounded-xl border text-left transition ${
                        customization.tireType === t.id
                          ? 'bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white text-xs">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== BODY MODELING & NEONS ==================== */}
          {subTab === 'body' && (
            <div className="space-y-6">
              {/* Spoilers */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Rear Aerodynamic Spoilers
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', name: 'Stock Clean' },
                    { id: 'sport_wing', name: 'Sport Wing' },
                    { id: 'gt_downforce', name: 'GT High Wing' },
                    { id: 'ducktail', name: 'Ducktail Lip' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => update({ spoiler: s.id as SpoilerStyle })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        customization.spoiler === s.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Roof Attachments */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Roof Accessories & Utility
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', name: 'Sleek (None)' },
                    { id: 'light_bar', name: 'LED Light Bar' },
                    { id: 'roof_rack', name: 'Heavy Roof Rack' },
                    { id: 'cargo_box', name: 'Aero Cargo Pod' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => update({ roofPart: r.id as RoofPartStyle })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        customization.roofPart === r.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Front Bumpers */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Front Bumper Armor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'stock', name: 'Standard Factory' },
                    { id: 'steel_bullbar', name: 'Steel Bullbar' },
                    { id: 'carbon_splitter', name: 'Carbon Splitter' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => update({ bumper: b.id as BumperStyle })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        customization.bumper === b.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Underglow Neons */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Chassis Underglow Neon
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'none', name: 'Off', color: 'transparent' },
                    { id: '#00ffff', name: 'Cyan', color: '#00ffff' },
                    { id: '#ff0055', name: 'Neon Red', color: '#ff0055' },
                    { id: '#a855f7', name: 'Purple', color: '#a855f7' },
                    { id: '#22c55e', name: 'Acid Green', color: '#22c55e' },
                    { id: '#eab308', name: 'Gold', color: '#eab308' },
                  ].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => update({ underglow: u.id as UnderglowColor })}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        customization.underglow === u.id
                          ? 'bg-slate-800 border-white ring-2 ring-cyan-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-white/30"
                        style={{ backgroundColor: u.color === 'transparent' ? '#334155' : u.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-300">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Changes apply live on 3D vehicle
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
