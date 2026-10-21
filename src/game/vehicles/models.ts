import * as THREE from 'three';
import { VehicleDefinition, VehicleCustomization, RimStyle, TireType } from '../types';

export interface VehicleMeshBundle {
  root: THREE.Group;
  steerNodes: THREE.Group[];
  spinNodes: THREE.Mesh[];
  materialsToTintDirt: THREE.MeshStandardMaterial[];
  originalRoughness: number[];
  exhaustPoints: THREE.Vector3[];
  cargoGroup: THREE.Group;
  cargoItems: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglowMesh: THREE.Mesh | null;
  updateCustomization: (custom: VehicleCustomization, dirtLevel: number) => void;
  dispose: () => void;
}

// Procedural tire tread texture generator (Zero 404 dependencies)
function createTireTexture(tireType: TireType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#0d0f12';
  ctx.lineWidth = 8;

  if (tireType === 'all_terrain') {
    // Deep chevron / block treads
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(128, y + 16);
      ctx.lineTo(236, y);
      ctx.stroke();

      ctx.fillStyle = '#262b33';
      ctx.fillRect(40, y + 6, 24, 16);
      ctx.fillRect(192, y + 6, 24, 16);
    }
  } else if (tireType === 'ice_spikes') {
    // Metal studs on grooved rubber
    for (let y = 0; y < 256; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();

      // Studs
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(64, y + 12, 4, 0, Math.PI * 2);
      ctx.arc(128, y + 12, 4, 0, Math.PI * 2);
      ctx.arc(192, y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Street slick longitudinal grooves
    ctx.lineWidth = 6;
    for (let x = 32; x < 256; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Rim Model Assembly
function createWheelAssembly(
  radius: number,
  width: number,
  rimStyle: RimStyle,
  tireType: TireType,
  rimColorHex: string,
  caliperColorHex: string
): { wheelNode: THREE.Group; spinMesh: THREE.Mesh; rimMat: THREE.MeshStandardMaterial } {
  const wheelNode = new THREE.Group();

  // Spin sub-group
  const spinGroup = new THREE.Group();
  wheelNode.add(spinGroup);

  // Tire rubber
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireTexture = createTireTexture(tireType);
  const tireMat = new THREE.MeshStandardMaterial({
    map: tireTexture,
    color: 0x1f2328,
    roughness: 0.88,
    metalness: 0.1,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  spinGroup.add(tireMesh);

  // Rim metal
  const rimRadius = radius * 0.62;
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColorHex),
    metalness: rimStyle === 'deepdish' ? 0.95 : 0.85,
    roughness: rimStyle === 'deepdish' ? 0.15 : 0.28,
  });

  const rimBarrelGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, width * 1.02, 18, 1, true);
  rimBarrelGeo.rotateZ(Math.PI / 2);
  const rimBarrel = new THREE.Mesh(rimBarrelGeo, rimMat);
  spinGroup.add(rimBarrel);

  // Spokes design
  const spokeGroup = new THREE.Group();
  if (rimStyle === 'sport5') {
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spokeGeo = new THREE.BoxGeometry(width * 0.9, rimRadius * 0.95, rimRadius * 0.18);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.y = (rimRadius * 0.45) * Math.cos(angle);
      spoke.position.z = (rimRadius * 0.45) * Math.sin(angle);
      spoke.rotation.x = -angle;
      spokeGroup.add(spoke);
    }
  } else if (rimStyle === 'beadlock') {
    // Heavy offroad ring
    const ringGeo = new THREE.TorusGeometry(rimRadius * 0.92, width * 0.08, 8, 20);
    ringGeo.rotateY(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, rimMat);
    spokeGroup.add(ring);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spokeGeo = new THREE.BoxGeometry(width * 0.9, rimRadius * 0.85, rimRadius * 0.16);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.y = (rimRadius * 0.4) * Math.cos(angle);
      spoke.position.z = (rimRadius * 0.4) * Math.sin(angle);
      spoke.rotation.x = -angle;
      spokeGroup.add(spoke);
    }
  } else if (rimStyle === 'deepdish') {
    // Deep center cap + 6 chunky dish spokes
    const dishCapGeo = new THREE.CylinderGeometry(rimRadius * 0.4, rimRadius * 0.25, width * 0.95, 16);
    dishCapGeo.rotateZ(Math.PI / 2);
    const dishCap = new THREE.Mesh(dishCapGeo, rimMat);
    spokeGroup.add(dishCap);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const spokeGeo = new THREE.BoxGeometry(width * 0.8, rimRadius * 0.88, rimRadius * 0.22);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.y = (rimRadius * 0.45) * Math.cos(angle);
      spoke.position.z = (rimRadius * 0.45) * Math.sin(angle);
      spoke.rotation.x = -angle;
      spokeGroup.add(spoke);
    }
  } else if (rimStyle === 'golden_mesh') {
    // BBS cross-mesh spokes
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const spokeGeo = new THREE.BoxGeometry(width * 0.8, rimRadius * 0.92, rimRadius * 0.08);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.y = (rimRadius * 0.46) * Math.cos(angle);
      spoke.position.z = (rimRadius * 0.46) * Math.sin(angle);
      spoke.rotation.x = -angle;
      spokeGroup.add(spoke);
    }
  } else {
    // Turbine fins
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spokeGeo = new THREE.BoxGeometry(width * 0.88, rimRadius * 0.9, rimRadius * 0.12);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.y = (rimRadius * 0.45) * Math.cos(angle);
      spoke.position.z = (rimRadius * 0.45) * Math.sin(angle);
      spoke.rotation.x = -angle + 0.35;
      spokeGroup.add(spoke);
    }
  }
  spinGroup.add(spokeGroup);

  // Brake disc inside (stationary relative to spin)
  const discGeo = new THREE.CylinderGeometry(rimRadius * 0.72, rimRadius * 0.72, width * 0.15, 16);
  discGeo.rotateZ(Math.PI / 2);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
  const discMesh = new THREE.Mesh(discGeo, discMat);
  wheelNode.add(discMesh);

  // Brake caliper
  const caliperGeo = new THREE.BoxGeometry(width * 0.3, rimRadius * 0.35, rimRadius * 0.4);
  const caliperMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(caliperColorHex), roughness: 0.35, metalness: 0.6 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, rimRadius * 0.45, 0);
  wheelNode.add(caliper);

  return { wheelNode, spinMesh: tireMesh, rimMat };
}

// Build dynamic cargo crates/barrels
function buildCargoPayload(cargoCapacity: number): { group: THREE.Group; items: THREE.Mesh[] } {
  const group = new THREE.Group();
  const items: THREE.Mesh[] = [];

  const crateWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.85,
    metalness: 0.05,
  });

  const barrelMetalMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
    metalness: 0.75,
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.5,
    metalness: 0.4,
  });

  for (let i = 0; i < cargoCapacity; i++) {
    let mesh: THREE.Mesh;
    if (i % 2 === 0) {
      // Wooden crate
      const geo = new THREE.BoxGeometry(0.7, 0.65, 0.7);
      mesh = new THREE.Mesh(geo, crateWoodMat);
    } else if (i % 3 === 0) {
      // Hazardous Tech Container
      const geo = new THREE.BoxGeometry(0.8, 0.55, 0.6);
      mesh = new THREE.Mesh(geo, hazardMat);
    } else {
      // Oil / Fuel Barrel
      const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.75, 12);
      mesh = new THREE.Mesh(geo, barrelMetalMat);
    }
    mesh.castShadow = true;
    mesh.position.set((i % 2 === 0 ? -0.35 : 0.35) * (cargoCapacity > 2 ? 1 : 0), 0.35 + Math.floor(i / 2) * 0.6, -0.6 - Math.floor(i / 2) * 0.7);
    group.add(mesh);
    items.push(mesh);
  }

  return { group, items };
}

export function buildVehicle3D(
  definition: VehicleDefinition,
  customization: VehicleCustomization
): VehicleMeshBundle {
  const root = new THREE.Group();
  const steerNodes: THREE.Group[] = [];
  const spinNodes: THREE.Mesh[] = [];
  const materialsToTintDirt: THREE.MeshStandardMaterial[] = [];
  const originalRoughness: number[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];
  const exhaustPoints: THREE.Vector3[] = [];

  // PBR materials
  const bodyPaintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.primaryColor),
    metalness: customization.paintFinish === 'metallic' ? 0.92 : customization.paintFinish === 'satin' ? 0.65 : 0.25,
    roughness: customization.paintFinish === 'matte' ? 0.75 : customization.paintFinish === 'satin' ? 0.38 : 0.18,
  });
  materialsToTintDirt.push(bodyPaintMat);
  originalRoughness.push(bodyPaintMat.roughness);

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.secondaryColor),
    metalness: 0.6,
    roughness: 0.35,
  });
  materialsToTintDirt.push(secondaryMat);
  originalRoughness.push(secondaryMat.roughness);

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.08,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.75,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });

  const headlampMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  const taillampMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: new THREE.Color(0xff1744),
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  // Base dimensions based on vehicle category & stats
  const { category, stats, id } = definition;

  // Assembly logic based on category
  if (category === 'truck') {
    // ========================================================
    // TRUCK MODELING (Titan 6x6, Baja Trophy, Apex Van)
    // ========================================================
    const is6x6 = stats.wheelCount === 6;
    const isVan = id === 'apex_van';
    const isBaja = id === 'baja_trophy';

    const cabinLength = isVan ? 4.2 : 2.2;
    const cabinWidth = isBaja ? 2.3 : 2.4;
    const cabinHeight = isVan ? 2.1 : 1.7;
    const groundClearance = stats.clearanceM;

    // Heavy Steel Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.35, is6x6 ? 6.2 : 4.8);
    const chassis = new THREE.Mesh(chassisGeo, darkTrimMat);
    chassis.position.set(0, groundClearance + 0.3, 0);
    chassis.castShadow = true;
    root.add(chassis);

    // Truck Cabin
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, bodyPaintMat);
    cabin.position.set(0, groundClearance + cabinHeight * 0.5 + 0.3, isVan ? 0 : 1.2);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    root.add(cabin);

    // Front Windshield Glass
    const windshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.92, cabinHeight * 0.45, 0.15);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, groundClearance + cabinHeight * 0.75 + 0.3, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.05);
    windshield.rotation.x = -0.22;
    root.add(windshield);

    // Side windows
    const sideWinGeo = new THREE.BoxGeometry(cabinWidth + 0.04, cabinHeight * 0.35, cabinLength * 0.4);
    const sideWin = new THREE.Mesh(sideWinGeo, glassMat);
    sideWin.position.set(0, groundClearance + cabinHeight * 0.72 + 0.3, (isVan ? 0.3 : 1.2));
    root.add(sideWin);

    // Truck Flatbed / Cargo Bed or Van Rear
    if (!isVan) {
      const bedLength = is6x6 ? 3.6 : 2.5;
      const bedWidth = cabinWidth * 0.96;
      const bedGeo = new THREE.BoxGeometry(bedWidth, 0.25, bedLength);
      const bed = new THREE.Mesh(bedGeo, secondaryMat);
      bed.position.set(0, groundClearance + 0.5, -1.6);
      bed.castShadow = true;
      root.add(bed);

      // Bed side walls
      const wallGeo = new THREE.BoxGeometry(0.12, 0.7, bedLength);
      const leftWall = new THREE.Mesh(wallGeo, secondaryMat);
      leftWall.position.set(-bedWidth * 0.5 + 0.06, groundClearance + 0.85, -1.6);
      root.add(leftWall);

      const rightWall = new THREE.Mesh(wallGeo, secondaryMat);
      rightWall.position.set(bedWidth * 0.5 - 0.06, groundClearance + 0.85, -1.6);
      root.add(rightWall);

      // Rear tailgate
      const gateGeo = new THREE.BoxGeometry(bedWidth, 0.7, 0.12);
      const gate = new THREE.Mesh(gateGeo, secondaryMat);
      gate.position.set(0, groundClearance + 0.85, -1.6 - bedLength * 0.5 + 0.06);
      root.add(gate);
    }

    // Heavy Grille & Radiator
    const grilleGeo = new THREE.BoxGeometry(cabinWidth * 0.7, cabinHeight * 0.4, 0.2);
    const grille = new THREE.Mesh(grilleGeo, darkTrimMat);
    grille.position.set(0, groundClearance + 0.7, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.02);
    root.add(grille);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.22, 0.15);
    const hlLeft = new THREE.Mesh(hlGeo, headlampMat);
    hlLeft.position.set(-cabinWidth * 0.38, groundClearance + 0.75, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.12);
    const hlRight = new THREE.Mesh(hlGeo, headlampMat);
    hlRight.position.set(cabinWidth * 0.38, groundClearance + 0.75, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.12);
    root.add(hlLeft, hlRight);
    headlights.push(hlLeft, hlRight);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.28, 0.18, 0.12);
    const tlLeft = new THREE.Mesh(tlGeo, taillampMat);
    tlLeft.position.set(-cabinWidth * 0.4, groundClearance + 0.8, is6x6 ? -3.45 : isVan ? -2.15 : -2.85);
    const tlRight = new THREE.Mesh(tlGeo, taillampMat);
    tlRight.position.set(cabinWidth * 0.4, groundClearance + 0.8, is6x6 ? -3.45 : isVan ? -2.15 : -2.85);
    root.add(tlLeft, tlRight);
    taillights.push(tlLeft, tlRight);

    // Bullbar if chosen
    if (customization.bumper === 'steel_bullbar' || isBaja) {
      const barMat = chromeMat;
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, cabinWidth * 0.9, 12);
      barGeo.rotateZ(Math.PI / 2);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, groundClearance + 0.65, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.32);
      root.add(bar);

      const uprightGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8);
      const up1 = new THREE.Mesh(uprightGeo, barMat);
      up1.position.set(-0.55, groundClearance + 0.75, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.3);
      const up2 = new THREE.Mesh(uprightGeo, barMat);
      up2.position.set(0.55, groundClearance + 0.75, (isVan ? 0 : 1.2) + cabinLength * 0.5 + 0.3);
      root.add(up1, up2);
    }

    // Roof light bar / rack
    if (customization.roofPart === 'light_bar') {
      const rackGeo = new THREE.BoxGeometry(cabinWidth * 0.85, 0.1, 0.18);
      const rack = new THREE.Mesh(rackGeo, darkTrimMat);
      rack.position.set(0, groundClearance + cabinHeight + 0.38, (isVan ? 0 : 1.2) + cabinLength * 0.35);
      root.add(rack);

      for (let i = -2; i <= 2; i++) {
        const spotGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10);
        spotGeo.rotateX(Math.PI / 2);
        const spot = new THREE.Mesh(spotGeo, headlampMat);
        spot.position.set(i * (cabinWidth * 0.18), groundClearance + cabinHeight + 0.44, (isVan ? 0 : 1.2) + cabinLength * 0.35 + 0.06);
        root.add(spot);
        headlights.push(spot);
      }
    }

    // Exhaust Pipes
    const exGeo = new THREE.CylinderGeometry(0.08, 0.08, is6x6 ? 1.6 : 0.8, 12);
    const exLeft = new THREE.Mesh(exGeo, chromeMat);
    if (is6x6) {
      // Dual vertical diesel smokestacks!
      exLeft.position.set(-cabinWidth * 0.5 - 0.1, groundClearance + 1.8, 0.2);
      const exRight = new THREE.Mesh(exGeo, chromeMat);
      exRight.position.set(cabinWidth * 0.5 + 0.1, groundClearance + 1.8, 0.2);
      root.add(exLeft, exRight);
      exhaustPoints.push(new THREE.Vector3(-cabinWidth * 0.5 - 0.1, groundClearance + 2.6, 0.2));
      exhaustPoints.push(new THREE.Vector3(cabinWidth * 0.5 + 0.1, groundClearance + 2.6, 0.2));
    } else {
      exLeft.rotateX(Math.PI / 2);
      exLeft.position.set(-cabinWidth * 0.35, groundClearance + 0.35, -2.6);
      root.add(exLeft);
      exhaustPoints.push(new THREE.Vector3(-cabinWidth * 0.35, groundClearance + 0.35, -3.0));
    }

    // Wheels placement
    const wheelRadius = isBaja ? 0.65 : is6x6 ? 0.68 : 0.52;
    const wheelWidth = isBaja ? 0.42 : 0.38;
    const trackWidth = cabinWidth + 0.1;

    // Front Left & Right (Steering)
    const frontZ = isVan ? 1.4 : 1.8;
    const flAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    flAssembly.wheelNode.position.set(-trackWidth * 0.5, wheelRadius, frontZ);
    root.add(flAssembly.wheelNode);
    steerNodes.push(flAssembly.wheelNode);
    spinNodes.push(flAssembly.spinMesh);

    const frAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    frAssembly.wheelNode.position.set(trackWidth * 0.5, wheelRadius, frontZ);
    root.add(frAssembly.wheelNode);
    steerNodes.push(frAssembly.wheelNode);
    spinNodes.push(frAssembly.spinMesh);

    // Rear Axle 1
    const r1Z = is6x6 ? -1.3 : -1.5;
    const rlAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    rlAssembly.wheelNode.position.set(-trackWidth * 0.5, wheelRadius, r1Z);
    root.add(rlAssembly.wheelNode);
    spinNodes.push(rlAssembly.spinMesh);

    const rrAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    rrAssembly.wheelNode.position.set(trackWidth * 0.5, wheelRadius, r1Z);
    root.add(rrAssembly.wheelNode);
    spinNodes.push(rrAssembly.spinMesh);

    // Rear Axle 2 (for 6x6)
    if (is6x6) {
      const r2Z = -2.7;
      const r2lAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
      r2lAssembly.wheelNode.position.set(-trackWidth * 0.5, wheelRadius, r2Z);
      root.add(r2lAssembly.wheelNode);
      spinNodes.push(r2lAssembly.spinMesh);

      const r2rAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
      r2rAssembly.wheelNode.position.set(trackWidth * 0.5, wheelRadius, r2Z);
      root.add(r2rAssembly.wheelNode);
      spinNodes.push(r2rAssembly.spinMesh);
    }

  } else if (category === 'car') {
    // ========================================================
    // CAR MODELING (Phantom GT, Overland 4x4, Drift Muscle)
    // ========================================================
    const isSupercar = id === 'phantom_gt';
    const isSUV = id === 'overland_4x4';
    const isMuscle = id === 'drift_muscle';

    const carLength = isSupercar ? 4.6 : 4.4;
    const carWidth = isSupercar ? 2.1 : isSUV ? 2.0 : 1.95;
    const carHeight = isSupercar ? 0.95 : isSUV ? 1.6 : 1.15;
    const groundClearance = stats.clearanceM;

    // Main Lower Chassis & Silhouette
    const bodyLowerGeo = new THREE.BoxGeometry(carWidth, 0.45, carLength);
    const bodyLower = new THREE.Mesh(bodyLowerGeo, bodyPaintMat);
    bodyLower.position.set(0, groundClearance + 0.35, 0);
    bodyLower.castShadow = true;
    bodyLower.receiveShadow = true;
    root.add(bodyLower);

    // Cabin Greenhouse / Cockpit
    const cabinWidth = carWidth * (isSupercar ? 0.75 : 0.85);
    const cabinLen = isSupercar ? 2.0 : isSUV ? 2.8 : 2.2;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, carHeight * 0.65, cabinLen);
    const cabinMesh = new THREE.Mesh(cabinGeo, secondaryMat);
    cabinMesh.position.set(0, groundClearance + 0.45 + (carHeight * 0.65) * 0.5, isSUV ? -0.2 : -0.2);
    cabinMesh.castShadow = true;
    root.add(cabinMesh);

    // Windshield & Windows
    const frontWindshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.94, carHeight * 0.55, 0.12);
    const windshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    windshield.position.set(0, groundClearance + 0.55 + carHeight * 0.3, isSUV ? 1.05 : 0.7);
    windshield.rotation.x = isSupercar ? -0.55 : isSUV ? -0.25 : -0.4;
    root.add(windshield);

    const rearGlass = new THREE.Mesh(frontWindshieldGeo, glassMat);
    rearGlass.position.set(0, groundClearance + 0.55 + carHeight * 0.3, isSUV ? -1.45 : -1.1);
    rearGlass.rotation.x = isSupercar ? 0.45 : 0.15;
    root.add(rearGlass);

    // Hood & Nose Aerodynamics
    if (isSupercar) {
      // Aerodynamic wedge hood
      const hoodGeo = new THREE.ConeGeometry(carWidth * 0.5, 1.4, 4);
      hoodGeo.rotateX(Math.PI / 2);
      hoodGeo.rotateY(Math.PI / 4);
      const hood = new THREE.Mesh(hoodGeo, bodyPaintMat);
      hood.scale.set(1.4, 0.3, 1.0);
      hood.position.set(0, groundClearance + 0.35, 1.7);
      root.add(hood);
    } else if (isMuscle) {
      // Supercharger Blower Intake on hood!
      const blowerGeo = new THREE.BoxGeometry(0.5, 0.25, 0.6);
      const blower = new THREE.Mesh(blowerGeo, chromeMat);
      blower.position.set(0, groundClearance + 0.65, 0.9);
      root.add(blower);

      const butterfliesGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
      butterfliesGeo.rotateZ(Math.PI / 2);
      const butterflies = new THREE.Mesh(butterfliesGeo, taillampMat);
      butterflies.position.set(0, groundClearance + 0.72, 1.15);
      root.add(butterflies);
    }

    // Front Bumper Splitter / Bullbar
    if (customization.bumper === 'carbon_splitter' || isSupercar) {
      const splitGeo = new THREE.BoxGeometry(carWidth * 1.04, 0.08, 0.6);
      const split = new THREE.Mesh(splitGeo, darkTrimMat);
      split.position.set(0, groundClearance + 0.12, carLength * 0.5 + 0.1);
      root.add(split);
    } else if (customization.bumper === 'steel_bullbar' || isSUV) {
      const barGeo = new THREE.CylinderGeometry(0.05, 0.05, carWidth * 0.9, 10);
      barGeo.rotateZ(Math.PI / 2);
      const bar = new THREE.Mesh(barGeo, darkTrimMat);
      bar.position.set(0, groundClearance + 0.45, carLength * 0.5 + 0.15);
      root.add(bar);
    }

    // Rear Spoiler Wing
    if (customization.spoiler === 'gt_downforce' || (isSupercar && customization.spoiler !== 'none')) {
      const wingGeo = new THREE.BoxGeometry(carWidth * 0.95, 0.06, 0.45);
      const wing = new THREE.Mesh(wingGeo, darkTrimMat);
      wing.position.set(0, groundClearance + carHeight * 0.75 + 0.45, -carLength * 0.48);
      wing.castShadow = true;
      root.add(wing);

      // Wing uprights
      const stGeo = new THREE.BoxGeometry(0.05, 0.35, 0.2);
      const stL = new THREE.Mesh(stGeo, darkTrimMat);
      stL.position.set(-carWidth * 0.32, groundClearance + carHeight * 0.75 + 0.25, -carLength * 0.48);
      const stR = new THREE.Mesh(stGeo, darkTrimMat);
      stR.position.set(carWidth * 0.32, groundClearance + carHeight * 0.75 + 0.25, -carLength * 0.48);
      root.add(stL, stR);
    } else if (customization.spoiler === 'sport_wing') {
      const duckGeo = new THREE.BoxGeometry(carWidth * 0.8, 0.12, 0.2);
      const duck = new THREE.Mesh(duckGeo, secondaryMat);
      duck.position.set(0, groundClearance + carHeight * 0.6, -carLength * 0.48);
      root.add(duck);
    }

    // Roof accessories (Roof Rack / Cargo Box on SUV)
    if (customization.roofPart === 'cargo_box' || isSUV) {
      const rackGeo = new THREE.BoxGeometry(carWidth * 0.75, 0.25, carLength * 0.4);
      const rack = new THREE.Mesh(rackGeo, darkTrimMat);
      rack.position.set(0, groundClearance + carHeight + 0.25, -0.2);
      root.add(rack);
    }

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.14, 0.1);
    const hlLeft = new THREE.Mesh(hlGeo, headlampMat);
    hlLeft.position.set(-carWidth * 0.38, groundClearance + 0.45, carLength * 0.5 - 0.05);
    const hlRight = new THREE.Mesh(hlGeo, headlampMat);
    hlRight.position.set(carWidth * 0.38, groundClearance + 0.45, carLength * 0.5 - 0.05);
    root.add(hlLeft, hlRight);
    headlights.push(hlLeft, hlRight);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const tlLeft = new THREE.Mesh(tlGeo, taillampMat);
    tlLeft.position.set(-carWidth * 0.38, groundClearance + 0.48, -carLength * 0.5 + 0.05);
    const tlRight = new THREE.Mesh(tlGeo, taillampMat);
    tlRight.position.set(carWidth * 0.38, groundClearance + 0.48, -carLength * 0.5 + 0.05);
    root.add(tlLeft, tlRight);
    taillights.push(tlLeft, tlRight);

    // Exhaust Tips
    const exGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12);
    exGeo.rotateX(Math.PI / 2);
    const exL = new THREE.Mesh(exGeo, chromeMat);
    exL.position.set(-0.45, groundClearance + 0.25, -carLength * 0.5 - 0.05);
    const exR = new THREE.Mesh(exGeo, chromeMat);
    exR.position.set(0.45, groundClearance + 0.25, -carLength * 0.5 - 0.05);
    root.add(exL, exR);
    exhaustPoints.push(new THREE.Vector3(-0.45, groundClearance + 0.25, -carLength * 0.5 - 0.2));
    exhaustPoints.push(new THREE.Vector3(0.45, groundClearance + 0.25, -carLength * 0.5 - 0.2));

    // Wheels placement
    const wheelRadius = isSUV ? 0.48 : isSupercar ? 0.38 : 0.42;
    const wheelWidth = isSupercar ? 0.36 : 0.32;
    const trackWidth = carWidth * 0.95;
    const frontZ = carLength * 0.32;
    const rearZ = -carLength * 0.32;

    const flAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    flAssembly.wheelNode.position.set(-trackWidth * 0.5, wheelRadius, frontZ);
    root.add(flAssembly.wheelNode);
    steerNodes.push(flAssembly.wheelNode);
    spinNodes.push(flAssembly.spinMesh);

    const frAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    frAssembly.wheelNode.position.set(trackWidth * 0.5, wheelRadius, frontZ);
    root.add(frAssembly.wheelNode);
    steerNodes.push(frAssembly.wheelNode);
    spinNodes.push(frAssembly.spinMesh);

    const rlAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    rlAssembly.wheelNode.position.set(-trackWidth * 0.5, wheelRadius, rearZ);
    root.add(rlAssembly.wheelNode);
    spinNodes.push(rlAssembly.spinMesh);

    const rrAssembly = createWheelAssembly(wheelRadius, wheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    rrAssembly.wheelNode.position.set(trackWidth * 0.5, wheelRadius, rearZ);
    root.add(rrAssembly.wheelNode);
    spinNodes.push(rrAssembly.spinMesh);

  } else {
    // ========================================================
    // MOTORCYCLE MODELING (Hayate Superbike, Enduro 450, Chopper)
    // ========================================================
    const isSport = id === 'hayate_1000';
    const isEnduro = id === 'enduro_450';
    const isChopper = id === 'highway_cruiser';

    const bikeWheelRadius = isEnduro ? 0.48 : 0.38;
    const bikeWheelWidth = 0.22;
    const wheelbase = isChopper ? 2.1 : 1.65;
    const groundClearance = stats.clearanceM;

    // Main Tubular Frame
    const frameGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    frameGeo.rotateZ(Math.PI / 2);
    const frameMesh = new THREE.Mesh(frameGeo, darkTrimMat);
    frameMesh.position.set(0, groundClearance + 0.45, 0);
    root.add(frameMesh);

    // Engine Block
    const engineGeo = new THREE.BoxGeometry(0.38, 0.45, 0.55);
    const engineMat = isChopper ? chromeMat : darkTrimMat;
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, groundClearance + 0.38, 0);
    root.add(engine);

    // Fuel Tank & Fairings
    if (isSport) {
      // Aerodynamic race fairings
      const fairingGeo = new THREE.BoxGeometry(0.55, 0.65, 1.4);
      const fairing = new THREE.Mesh(fairingGeo, bodyPaintMat);
      fairing.position.set(0, groundClearance + 0.65, 0.1);
      fairing.castShadow = true;
      root.add(fairing);

      // Windscreen
      const screenGeo = new THREE.BoxGeometry(0.42, 0.35, 0.3);
      const screen = new THREE.Mesh(screenGeo, glassMat);
      screen.position.set(0, groundClearance + 1.0, 0.5);
      screen.rotation.x = -0.55;
      root.add(screen);
    } else if (isEnduro) {
      // Slim dirt bike body & high fender
      const tankGeo = new THREE.BoxGeometry(0.35, 0.4, 0.9);
      const tank = new THREE.Mesh(tankGeo, bodyPaintMat);
      tank.position.set(0, groundClearance + 0.65, 0.1);
      root.add(tank);

      const fenderGeo = new THREE.BoxGeometry(0.32, 0.05, 0.65);
      const fender = new THREE.Mesh(fenderGeo, bodyPaintMat);
      fender.position.set(0, groundClearance + 0.72, 0.85);
      fender.rotation.x = 0.2;
      root.add(fender);
    } else {
      // Chopper peanut tank & teardrop seat
      const tankGeo = new THREE.SphereGeometry(0.28, 12, 12);
      tankGeo.scale(1.0, 0.75, 1.4);
      const tank = new THREE.Mesh(tankGeo, bodyPaintMat);
      tank.position.set(0, groundClearance + 0.68, 0.25);
      root.add(tank);
    }

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.32, 0.12, 0.55);
    const seat = new THREE.Mesh(seatGeo, darkTrimMat);
    seat.position.set(0, groundClearance + 0.6, -0.35);
    root.add(seat);

    // Steering Head & Handlebars (Pivots with steering!)
    const steerHeadGroup = new THREE.Group();
    steerHeadGroup.position.set(0, groundClearance + 0.5, wheelbase * 0.5);
    root.add(steerHeadGroup);
    steerNodes.push(steerHeadGroup);

    // Front Forks
    const forkGeo = new THREE.CylinderGeometry(0.035, 0.035, isChopper ? 1.4 : 1.0, 8);
    const forkL = new THREE.Mesh(forkGeo, chromeMat);
    forkL.position.set(-0.16, -0.15, 0);
    forkL.rotation.x = isChopper ? -0.38 : -0.22;
    const forkR = new THREE.Mesh(forkGeo, chromeMat);
    forkR.position.set(0.16, -0.15, 0);
    forkR.rotation.x = isChopper ? -0.38 : -0.22;
    steerHeadGroup.add(forkL, forkR);

    // Handlebar bar
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, isChopper ? 0.95 : 0.75, 8);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, chromeMat);
    bar.position.set(0, 0.45, 0);
    steerHeadGroup.add(bar);

    // Headlight
    const hlGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12);
    hlGeo.rotateX(Math.PI / 2);
    const hl = new THREE.Mesh(hlGeo, headlampMat);
    hl.position.set(0, 0.35, 0.15);
    steerHeadGroup.add(hl);
    headlights.push(hl);

    // Front Wheel attached to steering head
    const frontWheelAssembly = createWheelAssembly(bikeWheelRadius, bikeWheelWidth, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    frontWheelAssembly.wheelNode.position.set(0, -groundClearance * 0.5, isChopper ? 0.3 : 0.15);
    steerHeadGroup.add(frontWheelAssembly.wheelNode);
    spinNodes.push(frontWheelAssembly.spinMesh);

    // Rear Wheel (Fixed to frame)
    const rearWheelAssembly = createWheelAssembly(bikeWheelRadius, bikeWheelWidth + 0.04, customization.rimStyle, customization.tireType, customization.rimColor, customization.caliperColor);
    rearWheelAssembly.wheelNode.position.set(0, bikeWheelRadius, -wheelbase * 0.5);
    root.add(rearWheelAssembly.wheelNode);
    spinNodes.push(rearWheelAssembly.spinMesh);

    // Taillight
    const tlGeo = new THREE.BoxGeometry(0.15, 0.08, 0.08);
    const tl = new THREE.Mesh(tlGeo, taillampMat);
    tl.position.set(0, groundClearance + 0.65, -wheelbase * 0.5 - 0.15);
    root.add(tl);
    taillights.push(tl);

    // Exhaust Pipe
    const exGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8);
    exGeo.rotateX(Math.PI / 2);
    const ex = new THREE.Mesh(exGeo, chromeMat);
    ex.position.set(0.24, groundClearance + 0.28, -0.4);
    root.add(ex);
    exhaustPoints.push(new THREE.Vector3(0.24, groundClearance + 0.28, -1.0));
  }

  // Underglow Mesh (Grounded planar glow beneath vehicle)
  let underglowMesh: THREE.Mesh | null = null;
  if (customization.underglow !== 'none') {
    const ugGeo = new THREE.PlaneGeometry(2.4, 4.2);
    ugGeo.rotateX(-Math.PI / 2);
    const ugMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(customization.underglow),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    underglowMesh = new THREE.Mesh(ugGeo, ugMat);
    underglowMesh.position.set(0, 0.06, 0);
    root.add(underglowMesh);
  }

  // Cargo group
  const { group: cargoGroup, items: cargoItems } = buildCargoPayload(stats.cargoCapacity);
  root.add(cargoGroup);

  // Dynamic customization and dirt updating
  const updateCustomization = (custom: VehicleCustomization, dirtLevel: number) => {
    // Dirt tinting: blends dirt brown/gray and increases roughness
    const dirtColor = new THREE.Color(0x5c4033);
    const clampedDirt = Math.max(0, Math.min(1, dirtLevel));

    // Body paint
    const baseColor = new THREE.Color(custom.primaryColor);
    const finalColor = baseColor.clone().lerp(dirtColor, clampedDirt * 0.65);
    bodyPaintMat.color = finalColor;
    bodyPaintMat.roughness = originalRoughness[0] + clampedDirt * 0.55;

    // Secondary paint
    const secColor = new THREE.Color(custom.secondaryColor);
    secondaryMat.color = secColor.clone().lerp(dirtColor, clampedDirt * 0.5);
    secondaryMat.roughness = originalRoughness[1] + clampedDirt * 0.45;

    // Underglow color update
    if (underglowMesh) {
      if (custom.underglow === 'none') {
        underglowMesh.visible = false;
      } else {
        underglowMesh.visible = true;
        (underglowMesh.material as THREE.MeshBasicMaterial).color.set(custom.underglow);
      }
    }
  };

  const dispose = () => {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  };

  return {
    root,
    steerNodes,
    spinNodes,
    materialsToTintDirt,
    originalRoughness,
    exhaustPoints,
    cargoGroup,
    cargoItems,
    headlights,
    taillights,
    underglowMesh,
    updateCustomization,
    dispose,
  };
}
