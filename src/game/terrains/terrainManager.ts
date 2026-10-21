import * as THREE from 'three';
import { TerrainType, TerrainConfig } from '../types';

export const TERRAIN_CONFIGS: Record<TerrainType, TerrainConfig> = {
  mountains: {
    id: 'mountains',
    name: 'Alpine Mountain Pass',
    subtitle: 'Steep Inclines & Hairpin Corners',
    description: 'Challenging winding hill roads with steep climbs, deep valleys, and dramatic alpine scenery.',
    friction: 0.95,
    bumpiness: 0.35,
    steepness: 1.0,
    hasTraffic: false,
    hasPotholes: true,
    skyColor: '#0f172a',
    fogColor: '#1e293b',
    fogDensity: 0.0035,
    ambientLight: '#94a3b8',
    keyLight: '#fde047',
    groundBaseColor: '#1e293b',
    roadColor: '#334155',
    hazardDescription: 'Steep inclines, rock falls, sharp curves',
  },
  sand_road: {
    id: 'sand_road',
    name: 'Sahara Sand Dunes',
    subtitle: 'Bumpy Off-Road & Potholes',
    description: 'Rough corrugated dirt and desert sands featuring frequent potholes, dunes, and sand bumps.',
    friction: 0.82,
    bumpiness: 0.75,
    steepness: 0.65,
    hasTraffic: false,
    hasPotholes: true,
    skyColor: '#451a03',
    fogColor: '#78350f',
    fogDensity: 0.004,
    ambientLight: '#fdba74',
    keyLight: '#fbbf24',
    groundBaseColor: '#b45309',
    roadColor: '#92400e',
    hazardDescription: 'Corrugated bumps, sand traps, potholes',
  },
  ice_bergs: {
    id: 'ice_bergs',
    name: 'Glacier Ice Bergs',
    subtitle: 'Slippery Ice Hills & Drifting',
    description: 'Frozen glacial tundra with sheer ice roads, reduced friction, snowy hills, and massive icebergs.',
    friction: 0.45, // Slippery arcade drift physics!
    bumpiness: 0.3,
    steepness: 0.8,
    hasTraffic: false,
    hasPotholes: false,
    skyColor: '#082f49',
    fogColor: '#0c4a6e',
    fogDensity: 0.0038,
    ambientLight: '#bae6fd',
    keyLight: '#e0f2fe',
    groundBaseColor: '#38bdf8',
    roadColor: '#0284c7',
    hazardDescription: 'Low friction ice, icy slides, blizzard snow',
  },
  city_road: {
    id: 'city_road',
    name: 'Metro Highway 101',
    subtitle: 'Smooth Asphalt & AI Traffic',
    description: 'High-speed 4-lane city arterial highway with streetlights, towering skyline, and dynamic AI traffic.',
    friction: 1.0,
    bumpiness: 0.05,
    steepness: 0.15,
    hasTraffic: true,
    hasPotholes: false,
    skyColor: '#090d16',
    fogColor: '#0f172a',
    fogDensity: 0.003,
    ambientLight: '#60a5fa',
    keyLight: '#f8fafc',
    groundBaseColor: '#020617',
    roadColor: '#1e293b',
    hazardDescription: 'Dense AI traffic vehicles, multi-lane weaving',
  },
};

export interface RoadSample {
  x: number;
  y: number;
  slope: number;
  banking: number;
  bump: number;
}

export interface CollectibleItem {
  type: 'coin' | 'nitro' | 'fuel';
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  collected: boolean;
  value: number;
}

export interface TrafficCar {
  mesh: THREE.Group;
  lane: number;
  z: number;
  speed: number;
  active: boolean;
  color: string;
}

export class TerrainManager {
  private terrainType: TerrainType;
  private config: TerrainConfig;
  private scene: THREE.Scene;

  // Road chunks
  private roadChunks: THREE.Group[] = [];
  private chunkLength: number = 50;
  private visibleChunksAhead: number = 7;
  private currentBaseChunkIndex: number = 0;

  // Road materials
  private roadMaterial!: THREE.MeshStandardMaterial;
  private groundMaterial!: THREE.MeshStandardMaterial;
  private curbMaterial!: THREE.MeshStandardMaterial;

  // Props & Collectibles
  public collectibles: CollectibleItem[] = [];
  public trafficCars: TrafficCar[] = [];
  private propMeshes: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, terrainType: TerrainType) {
    this.scene = scene;
    this.terrainType = terrainType;
    this.config = TERRAIN_CONFIGS[terrainType];
    this.initMaterials();
    this.buildInitialWorld();
  }

  private initMaterials() {
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.roadColor),
      roughness: this.terrainType === 'ice_bergs' ? 0.15 : 0.75,
      metalness: this.terrainType === 'ice_bergs' ? 0.35 : 0.05,
    });

    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.groundBaseColor),
      roughness: this.terrainType === 'ice_bergs' ? 0.25 : 0.9,
      metalness: this.terrainType === 'ice_bergs' ? 0.4 : 0.05,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.6,
      metalness: 0.1,
    });
  }

  // Deterministic road geometry equation
  public sampleRoad(z: number): RoadSample {
    let x = 0;
    let y = 0;
    let bump = 0;

    if (this.terrainType === 'mountains') {
      // Sweeping mountain curves and steep rolling hills
      x = Math.sin(z * 0.012) * 18 + Math.cos(z * 0.004) * 12;
      y = Math.sin(z * 0.008) * 14 + Math.cos(z * 0.02) * 4;
      bump = Math.sin(z * 0.4) * 0.08 * this.config.bumpiness;
    } else if (this.terrainType === 'sand_road') {
      // Bumpy dunes, potholes, slight S-curves
      x = Math.sin(z * 0.008) * 10 + Math.sin(z * 0.025) * 6;
      y = Math.sin(z * 0.015) * 6 + Math.cos(z * 0.04) * 1.5;
      // High frequency corrugated bumps & potholes
      bump = (Math.sin(z * 0.8) * 0.18 + Math.cos(z * 1.4) * 0.12) * this.config.bumpiness;
    } else if (this.terrainType === 'ice_bergs') {
      // Gentle long drifts across frozen lakes and glacier mounds
      x = Math.sin(z * 0.01) * 22;
      y = Math.sin(z * 0.006) * 8 + Math.cos(z * 0.015) * 3;
      bump = Math.sin(z * 0.3) * 0.06;
    } else {
      // City Road: Wide, gentle freeway curves, slight highway overpass ramps
      x = Math.sin(z * 0.004) * 8;
      y = Math.sin(z * 0.003) * 3;
      bump = 0;
    }

    // Derivative slope
    const sampleDelta = 1.0;
    const nextY = this.sampleElevationOnly(z + sampleDelta);
    const slope = (nextY - y) / sampleDelta;
    const banking = Math.max(-0.3, Math.min(0.3, (this.sampleXOnly(z + sampleDelta) - x) * 0.1));

    return { x, y: y + bump, slope, banking, bump };
  }

  private sampleXOnly(z: number): number {
    if (this.terrainType === 'mountains') return Math.sin(z * 0.012) * 18 + Math.cos(z * 0.004) * 12;
    if (this.terrainType === 'sand_road') return Math.sin(z * 0.008) * 10 + Math.sin(z * 0.025) * 6;
    if (this.terrainType === 'ice_bergs') return Math.sin(z * 0.01) * 22;
    return Math.sin(z * 0.004) * 8;
  }

  private sampleElevationOnly(z: number): number {
    if (this.terrainType === 'mountains') return Math.sin(z * 0.008) * 14 + Math.cos(z * 0.02) * 4;
    if (this.terrainType === 'sand_road') return Math.sin(z * 0.015) * 6 + Math.cos(z * 0.04) * 1.5;
    if (this.terrainType === 'ice_bergs') return Math.sin(z * 0.006) * 8 + Math.cos(z * 0.015) * 3;
    return Math.sin(z * 0.003) * 3;
  }

  private buildInitialWorld() {
    for (let i = -1; i < this.visibleChunksAhead; i++) {
      this.spawnChunk(i);
    }

    if (this.config.hasTraffic) {
      this.initTrafficCars();
    }
  }

  private spawnChunk(chunkIndex: number) {
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `chunk_${chunkIndex}`;

    const startZ = chunkIndex * this.chunkLength;
    const segments = 10;
    const dz = this.chunkLength / segments;

    const roadWidth = this.terrainType === 'city_road' ? 14 : 9.5;
    const terrainSpan = 70;

    // Build curved road ribbon
    const roadGeo = new THREE.PlaneGeometry(roadWidth, this.chunkLength, 4, segments);
    roadGeo.rotateX(-Math.PI / 2);

    const pos = roadGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const zOffset = pos.getZ(i);
      const worldZ = startZ + this.chunkLength * 0.5 + zOffset;
      const sample = this.sampleRoad(worldZ);

      // Adjust X and Y
      const currentX = pos.getX(i);
      pos.setX(i, currentX + sample.x);
      pos.setY(i, sample.y + 0.05);
    }
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.receiveShadow = true;
    chunkGroup.add(roadMesh);

    // Side curbs / barrier strips
    const curbGeo = new THREE.BoxGeometry(0.5, 0.25, this.chunkLength);
    const curbLeft = new THREE.Mesh(curbGeo, this.curbMaterial);
    const curbRight = new THREE.Mesh(curbGeo, this.curbMaterial);
    const midSample = this.sampleRoad(startZ + this.chunkLength * 0.5);

    curbLeft.position.set(midSample.x - roadWidth * 0.5 - 0.25, midSample.y + 0.12, startZ + this.chunkLength * 0.5);
    curbRight.position.set(midSample.x + roadWidth * 0.5 + 0.25, midSample.y + 0.12, startZ + this.chunkLength * 0.5);
    chunkGroup.add(curbLeft, curbRight);

    // Surrounding terrain planes
    const groundGeo = new THREE.PlaneGeometry(terrainSpan, this.chunkLength, 12, segments);
    groundGeo.rotateX(-Math.PI / 2);
    const groundPos = groundGeo.attributes.position;
    for (let i = 0; i < groundPos.count; i++) {
      const zOffset = groundPos.getZ(i);
      const worldZ = startZ + this.chunkLength * 0.5 + zOffset;
      const sample = this.sampleRoad(worldZ);
      const xOffset = groundPos.getX(i);

      let groundY = sample.y - 0.2;
      // Add rolling mountain/dune relief away from road
      const distFromRoad = Math.abs(xOffset - sample.x);
      if (this.terrainType === 'mountains') {
        groundY += Math.sin(xOffset * 0.08 + worldZ * 0.05) * 6 + (distFromRoad > 12 ? Math.pow(distFromRoad * 0.2, 1.4) : 0);
      } else if (this.terrainType === 'sand_road') {
        groundY += Math.sin(xOffset * 0.1 + worldZ * 0.08) * 3 + Math.cos(worldZ * 0.2) * 1.5;
      } else if (this.terrainType === 'ice_bergs') {
        groundY += Math.sin(xOffset * 0.06 + worldZ * 0.04) * 4;
      }

      groundPos.setX(i, xOffset + sample.x * 0.5);
      groundPos.setY(i, groundY);
    }
    groundGeo.computeVertexNormals();

    const groundMesh = new THREE.Mesh(groundGeo, this.groundMaterial);
    groundMesh.receiveShadow = true;
    chunkGroup.add(groundMesh);

    // Decorate chunk with scenery props
    this.decorateChunk(chunkGroup, startZ, midSample.x, roadWidth);

    // Spawn collectibles (Coins, Fuel, Nitro)
    this.spawnChunkCollectibles(chunkGroup, startZ);

    this.scene.add(chunkGroup);
    this.roadChunks.push(chunkGroup);
  }

  private decorateChunk(chunk: THREE.Group, startZ: number, centerX: number, roadWidth: number) {
    const halfWidth = roadWidth * 0.5;

    if (this.terrainType === 'mountains') {
      // Pine Trees & Rock Boulders
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const propZ = startZ + (i * 8) + 4;
        const sample = this.sampleRoad(propZ);
        const propX = sample.x + side * (halfWidth + 4 + (i * 2));

        if (i % 2 === 0) {
          // Pine tree (Trunk + 3 Cones)
          const treeGroup = new THREE.Group();
          const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 0.75;
          treeGroup.add(trunk);

          const leafMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
          for (let l = 0; l < 3; l++) {
            const coneGeo = new THREE.ConeGeometry(1.6 - l * 0.35, 1.8, 7);
            const cone = new THREE.Mesh(coneGeo, leafMat);
            cone.position.y = 1.6 + l * 1.1;
            treeGroup.add(cone);
          }
          treeGroup.position.set(propX, sample.y, propZ);
          chunk.add(treeGroup);
        } else {
          // Rock boulder
          const rockGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8);
          const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.set(propX, sample.y + 0.6, propZ);
          rock.rotation.set(Math.random(), Math.random(), Math.random());
          chunk.add(rock);
        }
      }
    } else if (this.terrainType === 'sand_road') {
      // Cacti, Sandstone Arches, Pothole markers
      for (let i = 0; i < 5; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const propZ = startZ + i * 10 + 5;
        const sample = this.sampleRoad(propZ);
        const propX = sample.x + side * (halfWidth + 3 + i * 2);

        // Cactus
        const cactusGroup = new THREE.Group();
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
        const stemGeo = new THREE.CylinderGeometry(0.22, 0.22, 2.8, 8);
        const stem = new THREE.Mesh(stemGeo, cactusMat);
        stem.position.y = 1.4;
        cactusGroup.add(stem);

        const armGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.9, 6);
        armGeo.rotateZ(Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, cactusMat);
        arm.position.set(0.4, 1.8, 0);
        cactusGroup.add(arm);

        cactusGroup.position.set(propX, sample.y, propZ);
        chunk.add(cactusGroup);

        // Pothole on road
        if (i === 2 && this.config.hasPotholes) {
          const potholeGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12);
          const potholeMat = new THREE.MeshStandardMaterial({ color: 0x3f1d0b, roughness: 0.95 });
          const pothole = new THREE.Mesh(potholeGeo, potholeMat);
          pothole.position.set(sample.x + (Math.random() * 3 - 1.5), sample.y + 0.08, propZ);
          chunk.add(pothole);
        }
      }
    } else if (this.terrainType === 'ice_bergs') {
      // Giant Icebergs in distance & Snow pines
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const propZ = startZ + i * 12 + 6;
        const sample = this.sampleRoad(propZ);

        // Giant translucent iceberg
        const bergGeo = new THREE.ConeGeometry(6 + Math.random() * 4, 14, 6);
        const bergMat = new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          metalness: 0.5,
          roughness: 0.15,
        });
        const berg = new THREE.Mesh(bergGeo, bergMat);
        berg.position.set(sample.x + side * (halfWidth + 18 + i * 4), sample.y + 5, propZ);
        berg.rotation.y = Math.random() * Math.PI;
        chunk.add(berg);
      }
    } else {
      // City Road: Streetlights & Highway Overhead signs
      for (let i = 0; i < 3; i++) {
        const propZ = startZ + i * 16 + 8;
        const sample = this.sampleRoad(propZ);

        // Double-headed LED highway streetlight
        const lightGroup = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.75;
        lightGroup.add(pole);

        const armGeo = new THREE.BoxGeometry(roadWidth + 1.2, 0.12, 0.12);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.y = 7.4;
        lightGroup.add(arm);

        // Glowing LED lamps
        const lampMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x93c5fd,
          emissiveIntensity: 2.2,
        });
        const lampLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), lampMat);
        lampLeft.position.set(-halfWidth * 0.5, 7.3, 0);
        const lampRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), lampMat);
        lampRight.position.set(halfWidth * 0.5, 7.3, 0);
        lightGroup.add(lampLeft, lampRight);

        lightGroup.position.set(sample.x + halfWidth + 1.0, sample.y, propZ);
        chunk.add(lightGroup);

        // Skyscraper silhouettes in background
        const bldgGeo = new THREE.BoxGeometry(10 + Math.random() * 8, 30 + Math.random() * 30, 10 + Math.random() * 8);
        const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.position.set(sample.x + (i % 2 === 0 ? -32 : 32), 15, propZ);
        chunk.add(bldg);
      }
    }
  }

  private spawnChunkCollectibles(chunk: THREE.Group, startZ: number) {
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });

    const nitroGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.7, 12);
    const nitroMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    const fuelGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const fuelMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    // Spawn 2-3 items per chunk
    for (let i = 0; i < 3; i++) {
      const itemZ = startZ + i * 15 + 7;
      const sample = this.sampleRoad(itemZ);
      const laneOffset = (i % 3 - 1) * 2.2;
      const itemPos = new THREE.Vector3(sample.x + laneOffset, sample.y + 0.85, itemZ);

      let itemType: 'coin' | 'nitro' | 'fuel' = 'coin';
      let mesh: THREE.Mesh;

      if (i === 1 && Math.random() > 0.4) {
        itemType = Math.random() > 0.5 ? 'nitro' : 'fuel';
        mesh = new THREE.Mesh(itemType === 'nitro' ? nitroGeo : fuelGeo, itemType === 'nitro' ? nitroMat : fuelMat);
      } else {
        mesh = new THREE.Mesh(coinGeo, coinMat);
      }

      mesh.position.copy(itemPos);
      chunk.add(mesh);

      this.collectibles.push({
        type: itemType,
        position: itemPos,
        mesh,
        collected: false,
        value: itemType === 'coin' ? 50 : itemType === 'nitro' ? 100 : 25,
      });
    }
  }

  // ===================== AI TRAFFIC CARS =====================
  private initTrafficCars() {
    const carColors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#f8fafc', '#64748b'];
    const laneX = [-4.5, -1.5, 1.5, 4.5];

    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const color = carColors[i % carColors.length];
      const carMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

      // Sedan body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 3.8), carMat);
      body.position.y = 0.5;
      group.add(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.0), darkMat);
      cabin.position.set(0, 1.0, -0.2);
      group.add(cabin);

      // Tail lights
      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      tl.position.set(0, 0.6, -1.9);
      group.add(tl);

      // Head lights
      const hl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      hl.position.set(0, 0.5, 1.9);
      group.add(hl);

      const lane = i % 4;
      const initialZ = 60 + i * 45;
      const sample = this.sampleRoad(initialZ);

      group.position.set(sample.x + laneX[lane], sample.y, initialZ);
      this.scene.add(group);

      this.trafficCars.push({
        mesh: group,
        lane,
        z: initialZ,
        speed: 16 + Math.random() * 8, // m/s
        active: true,
        color,
      });
    }
  }

  public update(playerZ: number, delta: number) {
    // 1. Recycle road chunks ahead / behind
    const currentChunkIndex = Math.floor(playerZ / this.chunkLength);

    if (currentChunkIndex > this.currentBaseChunkIndex) {
      // Spawn new chunk ahead
      const newChunkZ = currentChunkIndex + this.visibleChunksAhead;
      this.spawnChunk(newChunkZ);

      // Remove oldest chunk behind
      const oldChunk = this.roadChunks.shift();
      if (oldChunk) {
        this.scene.remove(oldChunk);
        oldChunk.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            (o as THREE.Mesh).geometry?.dispose();
          }
        });
      }

      this.currentBaseChunkIndex = currentChunkIndex;

      // Clean up past collectibles
      this.collectibles = this.collectibles.filter((c) => c.position.z > playerZ - 30);
    }

    // 2. Animate collectible coin spins
    const spinRate = delta * 3.5;
    for (const c of this.collectibles) {
      if (!c.collected) {
        c.mesh.rotation.y += spinRate;
      }
    }

    // 3. Update AI Traffic cars
    if (this.config.hasTraffic) {
      const laneX = [-4.5, -1.5, 1.5, 4.5];
      for (const car of this.trafficCars) {
        car.z += car.speed * delta;

        // If traffic car fell far behind player, respawn far ahead
        if (car.z < playerZ - 30) {
          car.z = playerZ + 200 + Math.random() * 80;
          car.lane = Math.floor(Math.random() * 4);
        }

        const sample = this.sampleRoad(car.z);
        car.mesh.position.set(sample.x + laneX[car.lane], sample.y, car.z);
        car.mesh.rotation.y = sample.banking;
      }
    }
  }

  public dispose() {
    for (const chunk of this.roadChunks) {
      this.scene.remove(chunk);
      chunk.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          (o as THREE.Mesh).geometry?.dispose();
        }
      });
    }
    this.roadChunks = [];

    for (const car of this.trafficCars) {
      this.scene.remove(car.mesh);
      car.mesh.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          (o as THREE.Mesh).geometry?.dispose();
        }
      });
    }
    this.trafficCars = [];
    this.collectibles = [];
  }
}
