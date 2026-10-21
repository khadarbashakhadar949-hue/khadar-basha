import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameSceneManager, CameraViewMode } from './game/sceneManager';
import { VEHICLE_CATALOG } from './game/vehicles/specs';
import {
  UserSaveData,
  VehicleDefinition,
  VehicleCustomization,
  TerrainType,
  ActiveGameState,
  DriveInputState,
  MissionDefinition,
} from './game/types';
import { loadSaveData, saveGameData } from './game/storage';
import { soundEngine } from './game/audio';

import { ShowroomStats } from './components/ShowroomStats';
import { NavigationDock, MainMenuTab } from './components/NavigationDock';
import { CustomizationModal } from './components/CustomizationModal';
import { ControlsSetupModal } from './components/ControlsSetupModal';
import { CleaningStationModal } from './components/CleaningStationModal';
import { SettingsModal } from './components/SettingsModal';
import { MapSelectModal } from './components/MapSelectModal';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { MissionEndModal } from './components/MissionEndModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<GameSceneManager | null>(null);

  // Persistent User State
  const [saveData, setSaveData] = useState<UserSaveData>(loadSaveData);

  // Active Menu / Modal Tab
  const [activeTab, setActiveTab] = useState<MainMenuTab>('home');
  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);

  // Active Driving State
  const [isDriving, setIsDriving] = useState(false);
  const [activeTerrain, setActiveTerrain] = useState<TerrainType>('mountains');
  const [activeMission, setActiveMission] = useState<MissionDefinition | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [missionEndResult, setMissionEndResult] = useState<{
    ended: boolean;
    success: boolean;
    summary: { distance: number; coins: number; drift: number };
  }>({
    ended: false,
    success: false,
    summary: { distance: 0, coins: 0, drift: 0 },
  });

  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');
  const [hudState, setHudState] = useState<ActiveGameState>({
    distanceTraveledM: 0,
    speedKmh: 0,
    rpm: 800,
    gear: 1,
    fuelPercent: 100,
    cargoCount: 0,
    cargoIntegrityPercent: 100,
    driftPoints: 0,
    isDrifting: false,
    coinsEarned: 0,
    elapsedTimeSec: 0,
    nearMissCount: 0,
    isPaused: false,
    isGameOver: false,
    isMissionSuccess: false,
    dirtAccumulated: 0,
  });

  // Current selected vehicle definition
  const currentVehicle = VEHICLE_CATALOG.find((v) => v.id === saveData.selectedVehicleId) || VEHICLE_CATALOG[0];
  const isVehicleUnlocked = saveData.unlockedVehicles.includes(currentVehicle.id);
  const currentCustomization = saveData.vehicleCustomizations[currentVehicle.id] || currentVehicle.defaultCustomization;
  const currentDirt = saveData.dirtLevels[currentVehicle.id] || 0.0;

  // Initialize Three.js WebGL once inside mount ref
  useEffect(() => {
    if (!canvasMountRef.current || sceneManagerRef.current) return;

    soundEngine.init();
    soundEngine.setVolumes(
      saveData.settings.masterVolume,
      saveData.settings.engineVolume,
      saveData.settings.sfxVolume,
      saveData.settings.isMuted
    );

    const sm = new GameSceneManager({
      container: canvasMountRef.current,
      onStateUpdate: (state) => {
        setHudState(state);
      },
      onMissionEnd: (success, summary) => {
        setMissionEndResult({
          ended: true,
          success,
          summary,
        });
      },
    });

    sm.setVehicle(currentVehicle, currentCustomization, currentDirt);
    sceneManagerRef.current = sm;

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Sync vehicle mesh when current vehicle or customization changes in showroom
  useEffect(() => {
    if (!sceneManagerRef.current || isDriving) return;
    sceneManagerRef.current.setVehicle(currentVehicle, currentCustomization, currentDirt);
  }, [currentVehicle.id, currentCustomization, currentDirt, isDriving]);

  // Save changes to localStorage
  const updateSaveData = useCallback((patch: Partial<UserSaveData>) => {
    setSaveData((prev) => {
      const next = { ...prev, ...patch };
      saveGameData(next);
      return next;
    });
  }, []);

  // Carousel navigation
  const handleNextVehicle = () => {
    soundEngine.ensureContext();
    const curIdx = VEHICLE_CATALOG.findIndex((v) => v.id === currentVehicle.id);
    const nextIdx = (curIdx + 1) % VEHICLE_CATALOG.length;
    const nextVehicle = VEHICLE_CATALOG[nextIdx];
    updateSaveData({ selectedVehicleId: nextVehicle.id });
  };

  const handlePrevVehicle = () => {
    soundEngine.ensureContext();
    const curIdx = VEHICLE_CATALOG.findIndex((v) => v.id === currentVehicle.id);
    const prevIdx = (curIdx - 1 + VEHICLE_CATALOG.length) % VEHICLE_CATALOG.length;
    const prevVehicle = VEHICLE_CATALOG[prevIdx];
    updateSaveData({ selectedVehicleId: prevVehicle.id });
  };

  // Unlock vehicle with coins
  const handleUnlockVehicle = () => {
    soundEngine.ensureContext();
    if (saveData.coins < currentVehicle.price) return;

    soundEngine.playCoin();
    updateSaveData({
      coins: saveData.coins - currentVehicle.price,
      unlockedVehicles: [...saveData.unlockedVehicles, currentVehicle.id],
    });
  };

  // Launch Driving Simulation
  const handleLaunchSimulation = (terrain: TerrainType, mission: MissionDefinition | null) => {
    soundEngine.ensureContext();
    setIsMapSelectOpen(false);
    setActiveTerrain(terrain);
    setActiveMission(mission);
    setIsDriving(true);
    setIsPaused(false);
    setMissionEndResult({ ended: false, success: false, summary: { distance: 0, coins: 0, drift: 0 } });

    sceneManagerRef.current?.startDrivingSession(terrain, mission);
  };

  // Exit Simulation & Return to Garage
  const handleReturnToGarage = () => {
    soundEngine.ensureContext();
    // Award coins earned during drive
    const earned = hudState.coinsEarned + (missionEndResult.success ? (activeMission?.rewardCoins || 300) : 0);
    const updatedCoins = saveData.coins + earned;

    // Record dirt accumulated
    const finalDirt = Math.min(1.0, currentDirt + hudState.dirtAccumulated);
    const updatedDirt = { ...saveData.dirtLevels, [currentVehicle.id]: finalDirt };

    updateSaveData({
      coins: updatedCoins,
      dirtLevels: updatedDirt,
    });

    setIsDriving(false);
    setIsPaused(false);
    setMissionEndResult({ ended: false, success: false, summary: { distance: 0, coins: 0, drift: 0 } });
    setActiveTab('home');

    sceneManagerRef.current?.exitDrivingSession();
  };

  // Restart Simulation
  const handleRestartDrive = () => {
    soundEngine.ensureContext();
    setIsPaused(false);
    setMissionEndResult({ ended: false, success: false, summary: { distance: 0, coins: 0, drift: 0 } });
    sceneManagerRef.current?.startDrivingSession(activeTerrain, activeMission);
  };

  // Camera Cycling
  const handleCycleCamera = () => {
    soundEngine.ensureContext();
    const modes: CameraViewMode[] = ['chase', 'hood', 'cockpit'];
    const curIdx = modes.indexOf(cameraMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    setCameraMode(nextMode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraMode = nextMode;
    }
  };

  // Reset Vehicle orientation & position on road
  const handleResetVehicle = () => {
    soundEngine.ensureContext();
    soundEngine.playBump(0.6);
    sceneManagerRef.current?.startDrivingSession(activeTerrain, activeMission);
  };

  // Car Wash Trigger
  const handlePerformCarWash = (callback: () => void) => {
    soundEngine.ensureContext();
    sceneManagerRef.current?.triggerCarWashSequence(() => {
      const updatedDirt = { ...saveData.dirtLevels, [currentVehicle.id]: 0.0 };
      updateSaveData({ dirtLevels: updatedDirt });
      callback();
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 3D WebGL Canvas isolated mount */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 touch-none" />

      {/* ==================== MAIN MENU / SHOWROOM STATE ==================== */}
      {!isDriving && (
        <>
          {/* Top & Bottom Navigation Dock */}
          <NavigationDock
            activeTab={activeTab}
            onSelectTab={(tab) => {
              soundEngine.ensureContext();
              setActiveTab(tab);
            }}
            onPlay={() => {
              soundEngine.ensureContext();
              setIsMapSelectOpen(true);
            }}
            coins={saveData.coins}
            isMuted={saveData.settings.isMuted}
            onToggleMute={() => {
              const muted = !saveData.settings.isMuted;
              const nextSettings = { ...saveData.settings, isMuted: muted };
              updateSaveData({ settings: nextSettings });
              soundEngine.setVolumes(
                nextSettings.masterVolume,
                nextSettings.engineVolume,
                nextSettings.sfxVolume,
                muted
              );
            }}
            canPlay={isVehicleUnlocked}
          />

          {/* Showroom Specs Inspector (Home Tab) */}
          {activeTab === 'home' && (
            <ShowroomStats
              vehicle={currentVehicle}
              dirtLevel={currentDirt}
              isUnlocked={isVehicleUnlocked}
              userCoins={saveData.coins}
              onPrev={handlePrevVehicle}
              onNext={handleNextVehicle}
              onUnlock={handleUnlockVehicle}
              onOpenCleaning={() => setActiveTab('cleaning')}
            />
          )}

          {/* Vehicle Customization Studio Modal */}
          {activeTab === 'custom' && (
            <CustomizationModal
              customization={currentCustomization}
              onUpdate={(updated) => {
                const updatedCustoms = {
                  ...saveData.vehicleCustomizations,
                  [currentVehicle.id]: updated,
                };
                updateSaveData({ vehicleCustomizations: updatedCustoms });
                sceneManagerRef.current?.updateVehicleCustomization(updated, currentDirt);
              }}
              onClose={() => setActiveTab('home')}
              userCoins={saveData.coins}
            />
          )}

          {/* Controls Setup Modal */}
          {activeTab === 'controls' && (
            <ControlsSetupModal
              settings={saveData.settings}
              onUpdate={(updated) => updateSaveData({ settings: updated })}
              onClose={() => setActiveTab('home')}
            />
          )}

          {/* Cleaning Station Modal */}
          {activeTab === 'cleaning' && (
            <CleaningStationModal
              vehicle={currentVehicle}
              dirtLevel={currentDirt}
              onClean={handlePerformCarWash}
              onClose={() => setActiveTab('home')}
            />
          )}

          {/* Settings Modal */}
          {activeTab === 'settings' && (
            <SettingsModal
              settings={saveData.settings}
              onUpdate={(updated) => updateSaveData({ settings: updated })}
              onClose={() => setActiveTab('home')}
            />
          )}

          {/* Map & Mission Selector */}
          {isMapSelectOpen && (
            <MapSelectModal
              onSelectMapAndMission={handleLaunchSimulation}
              onClose={() => setIsMapSelectOpen(false)}
              cargoCapacity={currentVehicle.stats.cargoCapacity}
            />
          )}
        </>
      )}

      {/* ==================== ACTIVE DRIVING SIMULATION ==================== */}
      {isDriving && (
        <>
          <GameHUD
            state={hudState}
            mission={activeMission}
            controlMode={saveData.settings.controlMode}
            cameraMode={cameraMode}
            onCycleCamera={handleCycleCamera}
            onResetVehicle={handleResetVehicle}
            onPause={() => setIsPaused(true)}
            onDriveInput={(input: Partial<DriveInputState>) => {
              sceneManagerRef.current?.setDriveInput(input);
            }}
          />

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={handleRestartDrive}
              onReturnToGarage={handleReturnToGarage}
              onOpenSettings={() => setActiveTab('settings')}
              isMuted={saveData.settings.isMuted}
              onToggleMute={() => {
                const muted = !saveData.settings.isMuted;
                const nextSettings = { ...saveData.settings, isMuted: muted };
                updateSaveData({ settings: nextSettings });
                soundEngine.setVolumes(
                  nextSettings.masterVolume,
                  nextSettings.engineVolume,
                  nextSettings.sfxVolume,
                  muted
                );
              }}
            />
          )}

          {/* Mission End / Victory / Game Over Modal */}
          {missionEndResult.ended && (
            <MissionEndModal
              success={missionEndResult.success}
              mission={activeMission}
              summary={missionEndResult.summary}
              onRestart={handleRestartDrive}
              onReturnToGarage={handleReturnToGarage}
            />
          )}
        </>
      )}
    </div>
  );
}
