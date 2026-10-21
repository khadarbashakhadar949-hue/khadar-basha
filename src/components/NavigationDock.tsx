import React from 'react';
import { Home, Palette, Gamepad2, Settings, Sparkles, Play, Coins, Volume2, VolumeX } from 'lucide-react';

export type MainMenuTab = 'home' | 'custom' | 'controls' | 'cleaning' | 'settings';

interface NavigationDockProps {
  activeTab: MainMenuTab;
  onSelectTab: (tab: MainMenuTab) => void;
  onPlay: () => void;
  coins: number;
  isMuted: boolean;
  onToggleMute: () => void;
  canPlay: boolean;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  activeTab,
  onSelectTab,
  onPlay,
  coins,
  isMuted,
  onToggleMute,
  canPlay,
}) => {
  return (
    <>
      {/* Persistent Top Status Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none px-4 py-3 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/90 rounded-2xl px-3.5 py-2 backdrop-blur-md pointer-events-auto shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
            VS
          </div>
          <div>
            <div className="text-sm font-black tracking-wide text-white font-teko uppercase leading-none">
              Vehicle Simulator
            </div>
            <div className="text-[10px] font-semibold text-slate-400 leading-tight">
              3D Arcade Realism
            </div>
          </div>
        </div>

        {/* Currency & Quick Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coins Bar */}
          <div className="flex items-center gap-2 bg-slate-900/85 border border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-lg backdrop-blur-md">
            <Coins className="text-amber-400 animate-bounce" size={18} />
            <span className="text-base font-black text-amber-300 font-mono tracking-tight">
              ${coins.toLocaleString()}
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg backdrop-blur-md"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Persistent Unified Bottom Control Dock */}
      <footer className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-4xl pointer-events-auto">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 md:p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-1 md:gap-3">
          {/* Menu Navigation Tabs */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 overflow-x-auto py-0.5">
            {/* 1. HOME */}
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* 2. VEHICLE CUSTOM */}
            <button
              onClick={() => onSelectTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
                activeTab === 'custom'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Palette size={16} />
              <span className="hidden sm:inline">Vehicle Custom</span>
            </button>

            {/* 3. CONTROLS SETUP */}
            <button
              onClick={() => onSelectTab('controls')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
                activeTab === 'controls'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Gamepad2 size={16} />
              <span className="hidden sm:inline">Controls</span>
            </button>

            {/* 4. OTHERS / CLEANING STATION */}
            <button
              onClick={() => onSelectTab('cleaning')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
                activeTab === 'cleaning'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Wash & Clean</span>
            </button>

            {/* 5. SETTINGS */}
            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* 6. PROMINENT "PLAY" CTA BUTTON */}
          <div className="pl-1 md:pl-2">
            <button
              onClick={onPlay}
              disabled={!canPlay}
              className={`flex items-center justify-center gap-2 px-5 md:px-8 py-2.5 md:py-3 rounded-xl font-black text-sm md:text-base tracking-wide uppercase transition shadow-xl ${
                canPlay
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 active:scale-95 shadow-orange-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>Drive Now</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
