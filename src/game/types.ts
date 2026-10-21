export type VehicleCategory = 'truck' | 'car' | 'motorcycle';

export type DrivingPurpose =
  | 'Heavy Transport'
  | 'Off-Road Conqueror'
  | 'Express Courier'
  | 'High-Speed Racing'
  | 'All-Terrain Expedition'
  | 'Arcade Drift & Stunt'
  | 'Agile Superbike'
  | 'Motocross Trail'
  | 'Highway Cruising';

export interface VehicleStats {
  topSpeedKmh: number;
  accelerationScore: number; // 0-100
  handlingScore: number;     // 0-100
  brakeForce: number;        // 0-100
  weightKg: number;
  heightM: number;
  clearanceM: number;
  drivingPurpose: DrivingPurpose;
  cargoCapacity: number;     // 0 - 4 items
  wheelCount: number;        // 2, 4, 6
}

export type RimStyle = 'sport5' | 'beadlock' | 'turbine' | 'deepdish' | 'golden_mesh';
export type TireType = 'street' | 'all_terrain' | 'ice_spikes';
export type SpoilerStyle = 'none' | 'sport_wing' | 'gt_downforce' | 'ducktail';
export type RoofPartStyle = 'none' | 'roof_rack' | 'light_bar' | 'cargo_box';
export type BumperStyle = 'stock' | 'steel_bullbar' | 'carbon_splitter';
export type UnderglowColor = 'none' | '#00ffff' | '#ff0055' | '#a855f7' | '#22c55e' | '#eab308';

export interface PaintPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  rimColor: string;
  metallic: number;
  roughness: number;
  badge?: string;
  price?: number;
}

export interface VehicleCustomization {
  primaryColor: string;
  secondaryColor: string;
  rimColor: string;
  caliperColor: string;
  paintFinish: 'gloss' | 'metallic' | 'matte' | 'satin';
  presetId?: string;
  rimStyle: RimStyle;
  tireType: TireType;
  spoiler: SpoilerStyle;
  roofPart: RoofPartStyle;
  bumper: BumperStyle;
  underglow: UnderglowColor;
}

export interface VehicleDefinition {
  id: string;
  name: string;
  category: VehicleCategory;
  tagline: string;
  description: string;
  price: number; // 0 = default unlocked
  stats: VehicleStats;
  defaultCustomization: VehicleCustomization;
}

export type TerrainType = 'mountains' | 'sand_road' | 'ice_bergs' | 'city_road';

export interface TerrainConfig {
  id: TerrainType;
  name: string;
  subtitle: string;
  description: string;
  friction: number; // 1.0 = asphalt, 0.5 = ice, 0.85 = sand
  bumpiness: number; // 0.0 to 1.0
  steepness: number;
  hasTraffic: boolean;
  hasPotholes: boolean;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  ambientLight: string;
  keyLight: string;
  groundBaseColor: string;
  roadColor: string;
  hazardDescription: string;
}

export type MissionType = 'cargo_delivery' | 'timed_rush' | 'fuel_survival' | 'free_drive';

export interface MissionDefinition {
  id: MissionType;
  name: string;
  description: string;
  icon: string;
  targetDistance: number; // meters
  timeLimitSec?: number;
  initialFuelSec?: number;
  cargoCount?: number;
  rewardCoins: number;
}

export type ControlInputMode = 'steering_wheel' | 'buttons' | 'phone_gyro';

export interface GameSettings {
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  graphicsQuality: 'high' | 'medium' | 'low';
  shadows: boolean;
  controlMode: ControlInputMode;
  steeringSensitivity: number; // 0.5 to 2.0
  autoCenterSteer: boolean;
  invertSteer: boolean;
  vibrationEnabled: boolean;
}

export interface UserSaveData {
  coins: number;
  selectedVehicleId: string;
  unlockedVehicles: string[];
  vehicleCustomizations: Record<string, VehicleCustomization>;
  dirtLevels: Record<string, number>; // 0.0 (clean) to 1.0 (dirty)
  highScores: {
    totalDistanceM: number;
    completedMissions: number;
    highestDriftPoints: number;
  };
  settings: GameSettings;
}

export interface DriveInputState {
  steer: number;      // -1.0 (full left) to +1.0 (full right)
  throttle: number;   // 0.0 to 1.0
  brake: number;      // 0.0 to 1.0
  handbrake: boolean; // drift trigger
  nitro: boolean;     // boost
  reverse: boolean;
}

export interface ActiveGameState {
  distanceTraveledM: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  fuelPercent: number;
  cargoCount: number;
  cargoIntegrityPercent: number;
  driftPoints: number;
  isDrifting: boolean;
  coinsEarned: number;
  elapsedTimeSec: number;
  nearMissCount: number;
  isPaused: boolean;
  isGameOver: boolean;
  isMissionSuccess: boolean;
  dirtAccumulated: number;
}
