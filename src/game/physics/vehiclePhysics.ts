import * as THREE from 'three';
import { VehicleDefinition, DriveInputState, ActiveGameState, MissionDefinition } from '../types';
import { TerrainManager, RoadSample } from '../terrains/terrainManager';
import { soundEngine } from '../audio';

export class VehiclePhysicsSimulator {
  private def: VehicleDefinition;
  private terrain: TerrainManager;
  private mission: MissionDefinition | null;

  // State
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public speedKmh: number = 0;
  public headingAngle: number = 0; // Yaw
  public pitchAngle: number = 0;   // Suspension pitch
  public rollAngle: number = 0;    // Suspension roll / bike lean
  public steerAngle: number = 0;   // Front wheel angle

  // Drifting state
  public isDrifting: boolean = false;
  public driftAngle: number = 0;
  public driftPoints: number = 0;

  // Suspension vertical velocity & offset
  public suspensionOffset: number = 0;
  private suspensionVelocity: number = 0;

  // Cargo & gameplay state
  public fuelPercent: number = 100;
  public cargoIntegrity: number = 100;
  public cargoRemaining: number = 0;
  public distanceTraveledM: number = 0;
  public coinsEarned: number = 0;
  public nearMissCount: number = 0;
  public rpm: number = 800;
  public gear: number = 1;
  public dirtAccumulated: number = 0;

  // Nitro state
  public nitroReservePercent: number = 100;
  public isNitroActive: boolean = false;

  constructor(def: VehicleDefinition, terrain: TerrainManager, mission: MissionDefinition | null) {
    this.def = def;
    this.terrain = terrain;
    this.mission = mission;
    this.cargoRemaining = mission?.cargoCount ?? def.stats.cargoCapacity;

    // Start on the road
    const startSample = this.terrain.sampleRoad(0);
    this.position.set(startSample.x, startSample.y + def.stats.clearanceM + 0.3, 0);
  }

  public reset(atZ: number = 0) {
    const sample = this.terrain.sampleRoad(atZ);
    this.position.set(sample.x, sample.y + this.def.stats.clearanceM + 0.3, atZ);
    this.velocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.headingAngle = 0;
    this.pitchAngle = 0;
    this.rollAngle = 0;
    this.steerAngle = 0;
    this.isDrifting = false;
    this.driftAngle = 0;
    this.suspensionOffset = 0;
    this.suspensionVelocity = 0;
  }

  public update(input: DriveInputState, rawDt: number): ActiveGameState {
    const dt = Math.min(rawDt, 0.05); // Frame delta time clamp

    const { stats, category } = this.def;
    const maxSpeedMs = (stats.topSpeedKmh / 3.6);
    const accelRate = (stats.accelerationScore / 100) * 14.0;
    const brakeRate = (stats.brakeForce / 100) * 22.0;

    // 1. Nitro Handling
    this.isNitroActive = input.nitro && this.nitroReservePercent > 2;
    let nitroMultiplier = 1.0;
    if (this.isNitroActive) {
      nitroMultiplier = 1.45;
      this.nitroReservePercent = Math.max(0, this.nitroReservePercent - dt * 25);
    } else {
      // Slow nitro regen
      this.nitroReservePercent = Math.min(100, this.nitroReservePercent + dt * 4);
    }

    // 2. Throttle & Acceleration
    let forwardSpeedMs = this.velocity.z;

    if (input.throttle > 0) {
      forwardSpeedMs += input.throttle * accelRate * nitroMultiplier * dt;
    } else if (input.brake > 0 && forwardSpeedMs > 0.5) {
      forwardSpeedMs -= input.brake * brakeRate * dt;
    } else if (input.reverse || (input.brake > 0 && forwardSpeedMs <= 0.5)) {
      // Reverse gear
      forwardSpeedMs -= accelRate * 0.45 * dt;
    } else {
      // Natural rolling friction & drag
      const drag = 1.8 * dt;
      if (forwardSpeedMs > 0) forwardSpeedMs = Math.max(0, forwardSpeedMs - drag);
      else if (forwardSpeedMs < 0) forwardSpeedMs = Math.min(0, forwardSpeedMs + drag);
    }

    // Cap to top speed
    const currentMaxSpeed = maxSpeedMs * nitroMultiplier;
    forwardSpeedMs = Math.max(-12, Math.min(currentMaxSpeed, forwardSpeedMs));

    // 3. Arcade Steering & Drifting
    const speedRatio = Math.abs(forwardSpeedMs) / maxSpeedMs;
    // Speed-dependent steer responsiveness
    const steerResponsiveness = THREE.MathUtils.lerp(1.2, 0.55, speedRatio);
    const targetSteerAngle = input.steer * 0.55 * steerResponsiveness;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteerAngle, 12, dt);

    // Drifting trigger: hard handbrake OR sharp turn at high speed
    const isHandbrakeSlide = input.handbrake && Math.abs(forwardSpeedMs) > 12 && Math.abs(input.steer) > 0.2;
    this.isDrifting = isHandbrakeSlide;

    if (this.isDrifting) {
      // Slide angle
      const targetDrift = input.steer * 0.42;
      this.driftAngle = THREE.MathUtils.damp(this.driftAngle, targetDrift, 8, dt);
      this.driftPoints += Math.floor(Math.abs(forwardSpeedMs) * Math.abs(this.driftAngle) * 5 * dt);
      soundEngine.updateScreech(Math.abs(this.driftAngle) * 1.8);
    } else {
      this.driftAngle = THREE.MathUtils.damp(this.driftAngle, 0, 10, dt);
      soundEngine.updateScreech(Math.abs(this.steerAngle) * speedRatio * 0.4);
    }

    // Yaw heading update
    const turnRate = (this.steerAngle * (stats.handlingScore / 100) * 1.8 + this.driftAngle * 0.8) * Math.sign(forwardSpeedMs || 1);
    this.headingAngle += turnRate * dt;

    // Apply forward and lateral velocities
    const cosYaw = Math.cos(this.headingAngle);
    const sinYaw = Math.sin(this.headingAngle);

    this.velocity.z = forwardSpeedMs * cosYaw;
    this.velocity.x = forwardSpeedMs * sinYaw;

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.z += forwardSpeedMs * dt;
    this.distanceTraveledM = Math.max(this.distanceTraveledM, this.position.z);

    // 4. Terrain Height, Banking & Suspension
    const roadSample = this.terrain.sampleRoad(this.position.z);

    // Target ground height
    const baseGroundY = roadSample.y + stats.clearanceM + 0.25;

    // Bump shock reaction
    if (Math.abs(roadSample.bump) > 0.05 && forwardSpeedMs > 5) {
      this.suspensionVelocity += (Math.random() - 0.5) * roadSample.bump * 14;
      if (Math.random() > 0.7) {
        soundEngine.playBump(Math.abs(roadSample.bump));
      }
      // Potholes shake cargo!
      if (this.cargoRemaining > 0) {
        const shake = Math.abs(roadSample.bump) * (forwardSpeedMs / 10);
        this.cargoIntegrity = Math.max(0, this.cargoIntegrity - shake * 0.15);
        if (Math.random() > 0.85) soundEngine.playCargoRattle();
      }
    }

    // Spring suspension physics
    const springStiffness = 65;
    const springDamping = 12;
    const displacement = this.position.y - baseGroundY;
    const springForce = -springStiffness * displacement - springDamping * this.suspensionVelocity;
    this.suspensionVelocity += springForce * dt;
    this.position.y += this.suspensionVelocity * dt;

    // Clamp from falling through terrain
    if (this.position.y < baseGroundY - 0.15) {
      this.position.y = baseGroundY - 0.15;
      this.suspensionVelocity = 0;
    }

    // 5. Dynamic Suspension Pitch & Roll
    // Pitch: accel squats rear down, brake dives nose forward
    const accelPitch = (input.throttle - input.brake) * (stats.weightKg / 3000) * 0.08;
    const targetPitch = roadSample.slope + accelPitch;
    this.pitchAngle = THREE.MathUtils.damp(this.pitchAngle, targetPitch, 8, dt);

    // Roll / Lean: Motorcycles lean heavily into apex (up to 40 deg), cars/trucks sway with lateral Gs
    let targetRoll = 0;
    if (category === 'motorcycle') {
      targetRoll = -this.steerAngle * 0.9 - this.driftAngle * 0.5; // Deep bike lean
    } else {
      targetRoll = this.steerAngle * 0.18 + roadSample.banking; // Car body sway
    }
    this.rollAngle = THREE.MathUtils.damp(this.rollAngle, targetRoll, 8, dt);

    // 6. Fuel & Dirt accumulation
    this.speedKmh = Math.abs(forwardSpeedMs) * 3.6;
    if (forwardSpeedMs > 2) {
      this.fuelPercent = Math.max(0, this.fuelPercent - dt * 0.45);
      this.dirtAccumulated = Math.min(1.0, this.dirtAccumulated + dt * 0.004);
    }

    // 7. Simulated RPM & Gear
    this.gear = Math.min(6, Math.max(1, Math.floor((this.speedKmh / stats.topSpeedKmh) * 5) + 1));
    const gearSpeedRatio = (this.speedKmh % (stats.topSpeedKmh / 5)) / (stats.topSpeedKmh / 5);
    this.rpm = 800 + Math.floor(gearSpeedRatio * 6200);

    // Engine Audio update
    soundEngine.updateEngine(this.rpm / 7000, input.throttle, speedRatio, category);

    // 8. Collectibles collision detection
    for (const c of this.terrain.collectibles) {
      if (!c.collected && c.position.distanceTo(this.position) < 2.4) {
        c.collected = true;
        c.mesh.visible = false;
        if (c.type === 'coin') {
          this.coinsEarned += c.value;
          soundEngine.playCoin();
        } else if (c.type === 'nitro') {
          this.nitroReservePercent = Math.min(100, this.nitroReservePercent + 50);
          soundEngine.playNitro();
        } else if (c.type === 'fuel') {
          this.fuelPercent = Math.min(100, this.fuelPercent + 40);
          soundEngine.playCoin();
        }
      }
    }

    // 9. AI Traffic Near Miss & Collision Detection
    for (const car of this.terrain.trafficCars) {
      const dist = car.mesh.position.distanceTo(this.position);
      if (dist < 4.2 && dist > 2.0 && Math.abs(this.velocity.z - car.speed) > 5) {
        // Near miss reward!
        this.nearMissCount++;
        this.coinsEarned += 25;
        soundEngine.playNearMiss();
      } else if (dist < 2.0) {
        // Minor nudge collision
        forwardSpeedMs *= 0.7;
        soundEngine.playBump(0.8);
      }
    }

    // Return current state snapshot
    return {
      distanceTraveledM: Math.floor(this.distanceTraveledM),
      speedKmh: Math.floor(this.speedKmh),
      rpm: this.rpm,
      gear: this.gear,
      fuelPercent: Math.max(0, Math.floor(this.fuelPercent)),
      cargoCount: this.cargoRemaining,
      cargoIntegrityPercent: Math.floor(this.cargoIntegrity),
      driftPoints: this.driftPoints,
      isDrifting: this.isDrifting,
      coinsEarned: this.coinsEarned,
      elapsedTimeSec: 0,
      nearMissCount: this.nearMissCount,
      isPaused: false,
      isGameOver: this.fuelPercent <= 0 || (this.mission?.id === 'cargo_delivery' && this.cargoIntegrity <= 0),
      isMissionSuccess: this.mission ? this.distanceTraveledM >= this.mission.targetDistance : false,
      dirtAccumulated: this.dirtAccumulated,
    };
  }
}
