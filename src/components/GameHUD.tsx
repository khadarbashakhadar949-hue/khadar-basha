import React, { useState, useEffect, useRef } from 'react';
import { ActiveGameState, DriveInputState, ControlInputMode, MissionDefinition } from '../game/types';
import { CameraViewMode } from '../game/sceneManager';
import { Camera, RotateCcw, Pause, Zap, Flame, Package, Fuel, Coins, ArrowLeft, ArrowRight, Disc3 } from 'lucide-react';

interface GameHUDProps {
  state: ActiveGameState;
  mission: MissionDefinition | null;
  controlMode: ControlInputMode;
  cameraMode: CameraViewMode;
  onCycleCamera: () => void;
  onResetVehicle: () => void;
  onPause: () => void;
  onDriveInput: (input: Partial<DriveInputState>) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  mission,
  controlMode,
  cameraMode,
  onCycleCamera,
  onResetVehicle,
  onPause,
  onDriveInput,
}) => {
  // Local touch input tracking
  const [touchSteer, setTouchSteer] = useState(0);
  const [isThrottleHeld, setIsThrottleHeld] = useState(false);
  const [isBrakeHeld, setIsBrakeHeld] = useState(false);
  const [isHandbrakeHeld, setIsHandbrakeHeld] = useState(false);
  const [isNitroHeld, setIsNitroHeld] = useState(false);

  // Draggable steering wheel ref & angle
  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelAngleDeg, setWheelAngleDeg] = useState(0);
  const isDraggingWheel = useRef(false);
  const wheelCenter = useRef({ x: 0, y: 0 });

  // Gyro tilt tracking
  const [gyroTiltAngle, setGyroTiltAngle] = useState(0);

  // Synchronize touch inputs with driving physics
  useEffect(() => {
    onDriveInput({
      steer: touchSteer,
      throttle: isThrottleHeld ? 1.0 : 0,
      brake: isBrakeHeld ? 1.0 : 0,
      handbrake: isHandbrakeHeld,
      nitro: isNitroHeld,
    });
  }, [touchSteer, isThrottleHeld, isBrakeHeld, isHandbrakeHeld, isNitroHeld, onDriveInput]);

  // Phone Gyro (DeviceOrientation API)
  useEffect(() => {
    if (controlMode !== 'phone_gyro') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left-to-right tilt in degrees (-90 to +90)
      if (e.gamma !== null) {
        const tilt = Math.max(-30, Math.min(30, e.gamma));
        const normalizedSteer = tilt / 30;
        setGyroTiltAngle(tilt);
        setTouchSteer(normalizedSteer);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [controlMode]);

  // Keyboard controls listener (WASD / Arrows / Space / Shift / C / R / Esc)
  useEffect(() => {
    const heldKeys = new Set<string>();

    const updateFromKeys = () => {
      let steer = 0;
      let throttle = 0;
      let brake = 0;
      let handbrake = false;
      let nitro = false;

      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) steer -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) steer += 1;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) throttle = 1.0;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) brake = 1.0;
      if (heldKeys.has('Space')) handbrake = true;
      if (heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight')) nitro = true;

      onDriveInput({ steer, throttle, brake, handbrake, nitro });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        onCycleCamera();
        return;
      }
      if (e.code === 'KeyR') {
        onResetVehicle();
        return;
      }
      if (e.code === 'Escape') {
        onPause();
        return;
      }

      heldKeys.add(e.code);
      updateFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
      updateFromKeys();
    };

    const handleBlur = () => {
      heldKeys.clear();
      onDriveInput({ steer: 0, throttle: 0, brake: 0, handbrake: false, nitro: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onCycleCamera, onResetVehicle, onPause, onDriveInput]);

  // Steering wheel drag handler
  const handleWheelPointerDown = (e: React.PointerEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    isDraggingWheel.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleWheelPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingWheel.current) return;
    const dx = e.clientX - wheelCenter.current.x;
    const dy = e.clientY - wheelCenter.current.y;
    let rad = Math.atan2(dy, dx);
    let deg = rad * (180 / Math.PI);
    // Offset so top is 0
    deg = (deg + 90) % 360;
    if (deg > 180) deg -= 360;
    const clampedDeg = Math.max(-120, Math.min(120, deg));
    setWheelAngleDeg(clampedDeg);
    setTouchSteer(clampedDeg / 120);
  };

  const handleWheelPointerUp = () => {
    isDraggingWheel.current = false;
    setWheelAngleDeg(0);
    setTouchSteer(0);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* ==================== TOP PERIMETER HUD ==================== */}
      <div className="flex items-start justify-between w-full">
        {/* Distance & Objective Progress */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md flex items-center gap-3">
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Distance</div>
              <div className="text-xl font-black text-white font-mono leading-none">
                {state.distanceTraveledM.toLocaleString()} <span className="text-xs font-normal text-slate-400">m</span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                <Coins size={12} /> Coins
              </div>
              <div className="text-xl font-black text-amber-300 font-mono leading-none">
                +${state.coinsEarned}
              </div>
            </div>
          </div>

          {/* Cargo Status Bar (If cargo mission) */}
          {mission?.id === 'cargo_delivery' && (
            <div className="bg-slate-900/85 border border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-xl backdrop-blur-md flex items-center gap-3">
              <Package size={18} className="text-amber-400 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span>Cargo Integrity</span>
                  <span className={state.cargoIntegrityPercent < 40 ? 'text-red-400' : 'text-amber-400'}>
                    {state.cargoIntegrityPercent}%
                  </span>
                </div>
                <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      state.cargoIntegrityPercent < 40 ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${state.cargoIntegrityPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Drift Notification */}
        {state.isDrifting && (
          <div className="bg-gradient-to-r from-cyan-600/90 to-purple-600/90 border border-cyan-400/50 rounded-2xl px-4 py-1.5 shadow-2xl backdrop-blur-md animate-bounce text-center">
            <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow">
              DRIFT +{state.driftPoints}
            </span>
          </div>
        )}

        {/* Top Right Utilities (Camera, Reset, Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Camera View Switch */}
          <button
            onClick={onCycleCamera}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg backdrop-blur-md"
            title={`Camera: ${cameraMode.toUpperCase()} (Press C)`}
          >
            <Camera size={18} />
          </button>

          {/* Vehicle Reset */}
          <button
            onClick={onResetVehicle}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg backdrop-blur-md"
            title="Reset Vehicle (Press R)"
          >
            <RotateCcw size={18} />
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg backdrop-blur-md"
            title="Pause (Press Esc)"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* ==================== BOTTOM DASHBOARD & CONTROLS ==================== */}
      <div className="flex items-end justify-between w-full">
        {/* Left Control Cluster: Steering */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Mode 1: Draggable Steering Wheel */}
          {controlMode === 'steering_wheel' && (
            <div
              ref={wheelRef}
              onPointerDown={handleWheelPointerDown}
              onPointerMove={handleWheelPointerMove}
              onPointerUp={handleWheelPointerUp}
              onPointerCancel={handleWheelPointerUp}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-900/90 border-4 border-slate-700/80 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing backdrop-blur-md touch-none relative"
              style={{ transform: `rotate(${wheelAngleDeg}deg)` }}
            >
              {/* Wheel Rim & Spokes */}
              <div className="w-24 h-24 rounded-full border-2 border-slate-600/60 flex items-center justify-center">
                <Disc3 size={40} className="text-cyan-400 opacity-60" />
              </div>
              <div className="absolute top-1 w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            </div>
          )}

          {/* Mode 2: Left / Right Buttons */}
          {controlMode === 'buttons' && (
            <div className="flex items-center gap-2">
              <button
                onPointerDown={() => setTouchSteer(-1.0)}
                onPointerUp={() => setTouchSteer(0)}
                onPointerCancel={() => setTouchSteer(0)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition active:scale-95 shadow-2xl backdrop-blur-md touch-none ${
                  touchSteer < -0.2
                    ? 'bg-cyan-500 border-cyan-300 text-slate-950 ring-4 ring-cyan-500/30'
                    : 'bg-slate-900/85 border-slate-700/80 text-white'
                }`}
              >
                <ArrowLeft size={32} />
              </button>

              <button
                onPointerDown={() => setTouchSteer(1.0)}
                onPointerUp={() => setTouchSteer(0)}
                onPointerCancel={() => setTouchSteer(0)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition active:scale-95 shadow-2xl backdrop-blur-md touch-none ${
                  touchSteer > 0.2
                    ? 'bg-cyan-500 border-cyan-300 text-slate-950 ring-4 ring-cyan-500/30'
                    : 'bg-slate-900/85 border-slate-700/80 text-white'
                }`}
              >
                <ArrowRight size={32} />
              </button>
            </div>
          )}

          {/* Mode 3: Gyro Tilt Horizon Meter */}
          {controlMode === 'phone_gyro' && (
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md flex flex-col items-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                Tilt Steer Active
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="w-4 h-full bg-purple-500 rounded-full transition-all"
                  style={{ transform: `translateX(${(touchSteer + 1) * 40}px)` }}
                />
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                {Math.round(gyroTiltAngle)}°
              </div>
            </div>
          )}
        </div>

        {/* Center Speedometer Cluster */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl px-5 py-3 shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
          {/* Digital Speedometer */}
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black text-white font-teko tracking-tight leading-none">
              {state.speedKmh}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">
              KM/H
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          {/* Gear & RPM */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">GEAR</span>
              <span className="text-base font-black text-cyan-400 font-mono">
                {state.gear}
              </span>
            </div>

            {/* RPM Bar */}
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (state.rpm / 7500) * 100)}%` }}
              />
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          {/* Fuel Level */}
          <div className="flex flex-col items-center">
            <Fuel size={14} className={state.fuelPercent < 20 ? 'text-red-400 animate-pulse' : 'text-slate-400'} />
            <span className={`text-[11px] font-mono font-bold mt-0.5 ${state.fuelPercent < 20 ? 'text-red-400' : 'text-slate-300'}`}>
              {state.fuelPercent}%
            </span>
          </div>
        </div>

        {/* Right Control Cluster: Pedals, Handbrake & Nitro */}
        <div className="pointer-events-auto flex items-end gap-2 sm:gap-3">
          {/* Handbrake / Drift Button */}
          <button
            onPointerDown={() => setIsHandbrakeHeld(true)}
            onPointerUp={() => setIsHandbrakeHeld(false)}
            onPointerCancel={() => setIsHandbrakeHeld(false)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xs transition active:scale-90 shadow-xl backdrop-blur-md touch-none ${
              isHandbrakeHeld
                ? 'bg-amber-500 border-amber-300 text-slate-950 ring-4 ring-amber-500/30'
                : 'bg-slate-900/85 border-amber-500/40 text-amber-400'
            }`}
            title="Handbrake Drift (Space)"
          >
            DRIFT
          </button>

          {/* Nitro Boost Button */}
          <button
            onPointerDown={() => setIsNitroHeld(true)}
            onPointerUp={() => setIsNitroHeld(false)}
            onPointerCancel={() => setIsNitroHeld(false)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center transition active:scale-90 shadow-xl backdrop-blur-md touch-none ${
              isNitroHeld
                ? 'bg-cyan-500 border-cyan-300 text-slate-950 ring-4 ring-cyan-500/30'
                : 'bg-slate-900/85 border-cyan-500/40 text-cyan-400'
            }`}
            title="Nitro Boost (Shift)"
          >
            <Flame size={20} />
          </button>

          {/* Brake / Reverse Pedal */}
          <button
            onPointerDown={() => setIsBrakeHeld(true)}
            onPointerUp={() => setIsBrakeHeld(false)}
            onPointerCancel={() => setIsBrakeHeld(false)}
            className={`w-14 h-20 sm:w-16 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-end pb-2 font-bold text-xs transition active:scale-95 shadow-2xl backdrop-blur-md touch-none ${
              isBrakeHeld
                ? 'bg-red-600 border-red-300 text-white ring-4 ring-red-500/30'
                : 'bg-slate-900/85 border-slate-700/80 text-red-400'
            }`}
          >
            BRAKE
          </button>

          {/* Throttle / Gas Pedal */}
          <button
            onPointerDown={() => setIsThrottleHeld(true)}
            onPointerUp={() => setIsThrottleHeld(false)}
            onPointerCancel={() => setIsThrottleHeld(false)}
            className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-end pb-2 font-black text-sm tracking-wide uppercase transition active:scale-95 shadow-2xl backdrop-blur-md touch-none ${
              isThrottleHeld
                ? 'bg-emerald-500 border-emerald-300 text-slate-950 ring-4 ring-emerald-500/30'
                : 'bg-slate-900/85 border-emerald-500/50 text-emerald-400'
            }`}
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
