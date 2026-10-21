import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { VehicleDefinition, VehicleCustomization, TerrainType, DriveInputState, ActiveGameState, MissionDefinition } from './types';
import { buildVehicle3D, VehicleMeshBundle } from './vehicles/models';
import { TerrainManager, TERRAIN_CONFIGS } from './terrains/terrainManager';
import { VehiclePhysicsSimulator } from './physics/vehiclePhysics';
import { soundEngine } from './audio';

// Module-scope reusable math vectors (Zero GC during game loop)
const _camTarget = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _tempVec = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();

export type CameraViewMode = 'chase' | 'hood' | 'cockpit' | 'free';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onStateUpdate: (state: ActiveGameState) => void;
  onMissionEnd: (success: boolean, summary: { distance: number; coins: number; drift: number }) => void;
}

export class GameSceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmrem!: THREE.PMREMGenerator;

  // Environment & Lighting
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private fillLight!: THREE.DirectionalLight;
  private showroomPedestal: THREE.Mesh | null = null;

  // Active Entities
  private currentVehicleDef!: VehicleDefinition;
  private currentCustomization!: VehicleCustomization;
  private vehicleBundle: VehicleMeshBundle | null = null;
  private terrainManager: TerrainManager | null = null;
  private physics: VehiclePhysicsSimulator | null = null;

  // Mode & Camera
  public isDriving: boolean = false;
  public cameraMode: CameraViewMode = 'chase';
  private showroomTurntableAngle: number = 0;
  private isCleaningMode: boolean = false;

  // Particle systems
  private tireSmokeParticles!: THREE.Points;
  private tireSmokeGeo!: THREE.BufferGeometry;
  private smokeCount: number = 60;
  private smokeLifetimes: Float32Array = new Float32Array(60);

  private nitroParticles!: THREE.Points;
  private nitroCount: number = 30;

  private washSprayParticles: THREE.Points | null = null;

  // Loop control
  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private isSoftwareGl: boolean = false;
  private activeMission: MissionDefinition | null = null;
  private currentDirtLevel: number = 0;

  // Callbacks
  private onStateUpdate: (state: ActiveGameState) => void;
  private onMissionEnd: (success: boolean, summary: { distance: number; coins: number; drift: number }) => void;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onStateUpdate = options.onStateUpdate;
    this.onMissionEnd = options.onMissionEnd;

    this.detectSoftwareGl();
    this.initRenderer();
    this.initSceneAndLighting();
    this.initParticles();
    this.initEventListeners();
    this.startLoop();
  }

  private detectSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, this.container.clientWidth / this.container.clientHeight, 0.2, 800);
    this.camera.position.set(0, 3, 7);
  }

  private initSceneAndLighting() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.0035);

    // Studio Environment reflection (RoomEnvironment)
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Balanced 3-point lighting rig
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    this.keyLight.position.set(20, 35, 25);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.camera.left = -25;
    this.keyLight.shadow.camera.right = 25;
    this.keyLight.shadow.camera.top = 25;
    this.keyLight.shadow.camera.bottom = -25;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    this.fillLight.position.set(-20, 15, -20);
    this.scene.add(this.fillLight);

    // Showroom Pedestal
    this.buildShowroomPedestal();
  }

  private buildShowroomPedestal() {
    const geo = new THREE.CylinderGeometry(5.2, 5.6, 0.4, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.showroomPedestal = new THREE.Mesh(geo, mat);
    this.showroomPedestal.position.set(0, -0.2, 0);
    this.showroomPedestal.receiveShadow = true;
    this.scene.add(this.showroomPedestal);

    // Light ring on pedestal
    const ringGeo = new THREE.RingGeometry(4.8, 5.1, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.01, 0);
    this.showroomPedestal.add(ring);
  }

  // ===================== PARTICLES =====================
  private initParticles() {
    // Tire smoke particle system
    this.smokeCount = 60;
    this.tireSmokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(this.smokeCount * 3);
    for (let i = 0; i < this.smokeCount * 3; i++) smokePos[i] = 9999;
    this.tireSmokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xd1d5db,
      size: 1.4,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    this.tireSmokeParticles = new THREE.Points(this.tireSmokeGeo, smokeMat);
    this.scene.add(this.tireSmokeParticles);

    // Nitro exhaust particle system
    this.nitroCount = 30;
    const nitroGeo = new THREE.BufferGeometry();
    const nitroPos = new Float32Array(this.nitroCount * 3);
    for (let i = 0; i < this.nitroCount * 3; i++) nitroPos[i] = 9999;
    nitroGeo.setAttribute('position', new THREE.BufferAttribute(nitroPos, 3));

    const nitroMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.nitroParticles = new THREE.Points(nitroGeo, nitroMat);
    this.scene.add(this.nitroParticles);
  }

  // ===================== VEHICLE MOUNTING =====================
  public setVehicle(def: VehicleDefinition, custom: VehicleCustomization, dirtLevel: number = 0) {
    this.currentVehicleDef = def;
    this.currentCustomization = custom;
    this.currentDirtLevel = dirtLevel;

    if (this.vehicleBundle) {
      this.scene.remove(this.vehicleBundle.root);
      this.vehicleBundle.dispose();
      this.vehicleBundle = null;
    }

    this.vehicleBundle = buildVehicle3D(def, custom);
    this.vehicleBundle.updateCustomization(custom, dirtLevel);
    this.scene.add(this.vehicleBundle.root);

    if (!this.isDriving) {
      // In showroom, sit on pedestal
      this.vehicleBundle.root.position.set(0, 0, 0);
      this.vehicleBundle.root.rotation.set(0, 0, 0);
    }
  }

  public updateVehicleCustomization(custom: VehicleCustomization, dirtLevel: number) {
    this.currentCustomization = custom;
    this.currentDirtLevel = dirtLevel;
    if (this.vehicleBundle && this.currentVehicleDef) {
      this.setVehicle(this.currentVehicleDef, custom, dirtLevel);
    }
  }

  // ===================== DRIVING SESSION START =====================
  public startDrivingSession(terrainType: TerrainType, mission: MissionDefinition | null) {
    this.isDriving = true;
    this.activeMission = mission;

    // Hide showroom pedestal
    if (this.showroomPedestal) this.showroomPedestal.visible = false;

    // Cleanup previous terrain
    if (this.terrainManager) {
      this.terrainManager.dispose();
    }

    // Set atmosphere matching terrain
    const cfg = TERRAIN_CONFIGS[terrainType];
    this.scene.background = new THREE.Color(cfg.skyColor);
    this.scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);
    this.hemiLight.color.set(cfg.ambientLight);
    this.keyLight.color.set(cfg.keyLight);

    // Initialize infinite terrain
    this.terrainManager = new TerrainManager(this.scene, terrainType);

    // Initialize physics
    if (this.vehicleBundle) {
      this.physics = new VehiclePhysicsSimulator(this.currentVehicleDef, this.terrainManager, mission);
    }

    // Start engine audio
    soundEngine.startEngine(this.currentVehicleDef.category);
  }

  public exitDrivingSession() {
    this.isDriving = false;
    soundEngine.stopEngine();

    if (this.terrainManager) {
      this.terrainManager.dispose();
      this.terrainManager = null;
    }
    this.physics = null;

    // Restore showroom lighting & pedestal
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.0035);
    this.hemiLight.color.set(0xe0f2fe);
    this.keyLight.color.set(0xfffbeb);
    if (this.showroomPedestal) this.showroomPedestal.visible = true;

    if (this.vehicleBundle) {
      this.vehicleBundle.root.position.set(0, 0, 0);
      this.vehicleBundle.root.rotation.set(0, 0, 0);
      for (const node of this.vehicleBundle.steerNodes) node.rotation.y = 0;
    }
  }

  // ===================== CLEANING STATION CAR WASH =====================
  public triggerCarWashSequence(onComplete: () => void) {
    this.isCleaningMode = true;
    soundEngine.playCarWashSound(2.2);

    // Create water spray particle mesh
    const sprayGeo = new THREE.BufferGeometry();
    const count = 120;
    const sprayPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      sprayPos[i * 3] = (Math.random() - 0.5) * 3;
      sprayPos[i * 3 + 1] = 0.5 + Math.random() * 2;
      sprayPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.9,
      transparent: true,
      opacity: 0.8,
    });
    this.washSprayParticles = new THREE.Points(sprayGeo, sprayMat);
    this.scene.add(this.washSprayParticles);

    let progress = 0;
    const interval = window.setInterval(() => {
      progress += 0.05;
      if (this.washSprayParticles) {
        const positions = this.washSprayParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
          positions[i * 3 + 1] -= 0.1;
          if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 2.5;
        }
        this.washSprayParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Progressively wash off dirt
      const curDirt = (1 - progress) * this.currentDirtLevel;
      if (this.vehicleBundle) {
        this.vehicleBundle.updateCustomization(this.currentCustomization, curDirt);
      }

      if (progress >= 1.0) {
        window.clearInterval(interval);
        this.currentDirtLevel = 0;
        if (this.washSprayParticles) {
          this.scene.remove(this.washSprayParticles);
          this.washSprayParticles = null;
        }
        this.isCleaningMode = false;
        soundEngine.playShineChime();
        onComplete();
      }
    }, 50);
  }

  // ===================== GAME TICK & ANIMATION LOOP =====================
  private startLoop() {
    const tick = () => {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      if (this.isDriving && this.physics && this.vehicleBundle && this.terrainManager) {
        // Update physics
        const inputState = this.getActiveInputState();
        const stateSnapshot = this.physics.update(inputState, dt);

        // Update 3D vehicle root transform
        this.vehicleBundle.root.position.copy(this.physics.position);
        this.vehicleBundle.root.rotation.set(this.physics.pitchAngle, this.physics.headingAngle, this.physics.rollAngle);

        // Update wheel steer nodes
        for (const node of this.vehicleBundle.steerNodes) {
          node.rotation.y = this.physics.steerAngle;
        }

        // Spin wheels forward/backward
        const spinDelta = (this.physics.speedKmh / 3.6 / 0.4) * dt;
        for (const spin of this.vehicleBundle.spinNodes) {
          spin.rotation.x += spinDelta;
        }

        // Cargo bounce physics
        if (this.physics.cargoRemaining > 0) {
          for (let i = 0; i < this.vehicleBundle.cargoItems.length; i++) {
            const item = this.vehicleBundle.cargoItems[i];
            const shake = (Math.sin(this.clock.getElapsedTime() * 18 + i) * 0.04) * (this.physics.speedKmh / 60);
            item.position.y = (0.35 + Math.floor(i / 2) * 0.6) + shake;
            item.rotation.z = shake * 1.5;
          }
        }

        // Update infinite road segments & AI traffic
        this.terrainManager.update(this.physics.position.z, dt);

        // Update camera position & follow
        this.updateDrivingCamera(dt);

        // Update particles (smoke, nitro)
        this.updateTireSmoke(dt, this.physics.isDrifting, this.physics.position);
        this.updateNitroFlame(dt, this.physics.isNitroActive);

        // Forward state to HUD
        this.onStateUpdate(stateSnapshot);

        // Check mission win/loss
        if (stateSnapshot.isMissionSuccess || stateSnapshot.isGameOver) {
          this.onMissionEnd(stateSnapshot.isMissionSuccess, {
            distance: stateSnapshot.distanceTraveledM,
            coins: stateSnapshot.coinsEarned,
            drift: stateSnapshot.driftPoints,
          });
        }
      } else {
        // Showroom Turntable Mode
        this.showroomTurntableAngle += dt * 0.45;
        if (this.vehicleBundle) {
          this.vehicleBundle.root.rotation.y = this.showroomTurntableAngle;
        }
        // Smooth cinematic showroom camera
        const radius = 6.2;
        this.camera.position.set(Math.sin(this.showroomTurntableAngle * 0.25) * 1.2, 1.8 + Math.cos(this.showroomTurntableAngle * 0.2) * 0.3, radius);
        this.camera.lookAt(0, 0.8, 0);
      }

      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  // ===================== DYNAMIC CAMERA FOLLOW =====================
  private updateDrivingCamera(dt: number) {
    if (!this.physics) return;

    const { position, headingAngle, speedKmh } = this.physics;
    const speedRatio = Math.min(1.0, speedKmh / 220);

    if (this.cameraMode === 'chase') {
      // Dynamic chase camera: pulls back at high speed, dampens with yaw
      const distBehind = 6.0 + speedRatio * 2.2;
      const heightAbove = 2.4 + speedRatio * 0.8;

      const targetX = position.x - Math.sin(headingAngle) * distBehind;
      const targetZ = position.z - Math.cos(headingAngle) * distBehind;
      const targetY = position.y + heightAbove;

      _camDesiredPos.set(targetX, targetY, targetZ);
      this.camera.position.copy(_camDesiredPos);

      // Look slightly ahead of car
      _camTarget.set(position.x + Math.sin(headingAngle) * 8, position.y + 1.2, position.z + Math.cos(headingAngle) * 8);
      this.camera.lookAt(_camTarget);

      // Dynamic FOV stretch at high speed for adrenaline rush
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 55 + speedRatio * 18, 6, dt);
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'hood') {
      // Bumper / Hood Cam
      const hoodOffset = this.currentVehicleDef.category === 'truck' ? 2.4 : 1.6;
      this.camera.position.set(
        position.x + Math.sin(headingAngle) * hoodOffset,
        position.y + 0.9,
        position.z + Math.cos(headingAngle) * hoodOffset
      );
      _camTarget.set(position.x + Math.sin(headingAngle) * 20, position.y + 0.9, position.z + Math.cos(headingAngle) * 20);
      this.camera.lookAt(_camTarget);
      this.camera.fov = 68;
      this.camera.updateProjectionMatrix();

    } else {
      // Cockpit / Driver Cam
      this.camera.position.set(
        position.x,
        position.y + (this.currentVehicleDef.category === 'truck' ? 1.9 : 1.05),
        position.z + (this.currentVehicleDef.category === 'truck' ? 0.6 : 0.2)
      );
      _camTarget.set(position.x + Math.sin(headingAngle) * 25, position.y + 1.2, position.z + Math.cos(headingAngle) * 25);
      this.camera.lookAt(_camTarget);
      this.camera.fov = 72;
      this.camera.updateProjectionMatrix();
    }
  }

  // ===================== PARTICLES TICK =====================
  private updateTireSmoke(dt: number, isDrifting: boolean, carPos: THREE.Vector3) {
    const pos = this.tireSmokeGeo.attributes.position.array as Float32Array;

    for (let i = 0; i < this.smokeCount; i++) {
      if (this.smokeLifetimes[i] > 0) {
        this.smokeLifetimes[i] -= dt * 2.5;
        pos[i * 3 + 1] += dt * 1.5; // Rise up
        pos[i * 3] += (Math.random() - 0.5) * dt * 0.8;
      } else if (isDrifting && Math.random() > 0.4) {
        // Spawn smoke at rear tires
        this.smokeLifetimes[i] = 1.0;
        pos[i * 3] = carPos.x + (Math.random() - 0.5) * 1.6;
        pos[i * 3 + 1] = carPos.y + 0.2;
        pos[i * 3 + 2] = carPos.z - 1.4;
      } else {
        pos[i * 3] = 9999;
      }
    }
    this.tireSmokeGeo.attributes.position.needsUpdate = true;
  }

  private updateNitroFlame(dt: number, isNitro: boolean) {
    if (!this.vehicleBundle || !this.vehicleBundle.exhaustPoints.length) return;
    const pos = this.nitroParticles.geometry.attributes.position.array as Float32Array;

    if (isNitro) {
      for (let i = 0; i < this.nitroCount; i++) {
        const ep = this.vehicleBundle.exhaustPoints[i % this.vehicleBundle.exhaustPoints.length];
        const worldEp = ep.clone().applyMatrix4(this.vehicleBundle.root.matrixWorld);
        pos[i * 3] = worldEp.x + (Math.random() - 0.5) * 0.15;
        pos[i * 3 + 1] = worldEp.y + (Math.random() - 0.5) * 0.15;
        pos[i * 3 + 2] = worldEp.z - Math.random() * 0.8;
      }
    } else {
      for (let i = 0; i < this.nitroCount * 3; i++) pos[i] = 9999;
    }
    this.nitroParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Active user driving inputs
  private driveInput: DriveInputState = {
    steer: 0,
    throttle: 0,
    brake: 0,
    handbrake: false,
    nitro: false,
    reverse: false,
  };

  public setDriveInput(input: Partial<DriveInputState>) {
    this.driveInput = { ...this.driveInput, ...input };
  }

  private getActiveInputState(): DriveInputState {
    return this.driveInput;
  }

  private initEventListeners() {
    const handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    if (this.terrainManager) this.terrainManager.dispose();
    if (this.vehicleBundle) this.vehicleBundle.dispose();
    this.renderer.dispose();
    this.pmrem.dispose();
  }
}
