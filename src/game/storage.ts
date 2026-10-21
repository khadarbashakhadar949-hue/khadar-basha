import { UserSaveData, VehicleCustomization, GameSettings } from './types';
import { VEHICLE_CATALOG } from './vehicles/specs';

const STORAGE_KEY = 'vehicle_simulator_save_v2';

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  engineVolume: 0.8,
  sfxVolume: 0.85,
  isMuted: false,
  graphicsQuality: 'high',
  shadows: true,
  controlMode: 'buttons',
  steeringSensitivity: 1.0,
  autoCenterSteer: true,
  invertSteer: false,
  vibrationEnabled: true,
};

function getDefaultSaveData(): UserSaveData {
  const defaultCustomizations: Record<string, VehicleCustomization> = {};
  const defaultDirt: Record<string, number> = {};

  for (const v of VEHICLE_CATALOG) {
    defaultCustomizations[v.id] = { ...v.defaultCustomization };
    defaultDirt[v.id] = 0.0;
  }

  // Pre-give user 1200 coins starter bonus so they can immediately enjoy testing customization/upgrades
  return {
    coins: 1500,
    selectedVehicleId: 'overland_4x4',
    unlockedVehicles: ['overland_4x4', 'titan_6x6', 'enduro_450'],
    vehicleCustomizations: defaultCustomizations,
    dirtLevels: defaultDirt,
    highScores: {
      totalDistanceM: 0,
      completedMissions: 0,
      highestDriftPoints: 0,
    },
    settings: DEFAULT_SETTINGS,
  };
}

export function loadSaveData(): UserSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSaveData();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultSaveData();

    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      unlockedVehicles: Array.from(new Set([...defaults.unlockedVehicles, ...(parsed.unlockedVehicles || [])])),
      vehicleCustomizations: { ...defaults.vehicleCustomizations, ...(parsed.vehicleCustomizations || {}) },
      dirtLevels: { ...defaults.dirtLevels, ...(parsed.dirtLevels || {}) },
      highScores: { ...defaults.highScores, ...(parsed.highScores || {}) },
    };
  } catch {
    return getDefaultSaveData();
  }
}

export function saveGameData(data: UserSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
