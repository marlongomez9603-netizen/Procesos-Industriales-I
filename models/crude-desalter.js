import * as THREE from 'three';

// ============================================================================
// Desalador de Crudo (Crude Desalter)
// ----------------------------------------------------------------------------
// Quita sal y agua al crudo ANTES de la destilación atmosférica. El crudo se
// mezcla con agua de lavado a través de una válvula de mezcla; la emulsión
// entra a recipientes electrostáticos donde un campo de alto voltaje coalesce
// las gotas de agua salada, que decantan al fondo (salmuera). El crudo
// desalado sale por arriba. Configuración típica de dos etapas en serie.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.42 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matInsulation = () => new THREE.MeshStandardMaterial({ color: 0xe7e2d6, metalness: 0.05, roughness: 0.85 });
const matWater      = () => new THREE.MeshStandardMaterial({ color: 0x4a9bd1, metalness: 0.4,  roughness: 0.45 });
const matBrine      = () => new THREE.MeshStandardMaterial({ color: 0x7a8a6a, metalness: 0.3,  roughness: 0.6 });
const matElectrode  = () => new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.8,  roughness: 0.35 });
const matMotor      = () => new THREE.MeshStandardMaterial({ color: 0x2e7d46, metalness: 0.55, roughness: 0.45 });
const matFrame      = () => new THREE.MeshStandardMaterial({ color: 0x586273, metalness: 0.7,  roughness: 0.45 });
const matConcrete   = () => new THREE.MeshStandardMaterial({ color: 0x6b7079, metalness: 0.05, roughness: 0.95 });
const matPipe       = () => new THREE.MeshStandardMaterial({ color: 0xb0b5bd, metalness: 0.8,  roughness: 0.4 });

function tagGroup(group, data, explodeOffset) {
  group.userData = { ...data };
  if (explodeOffset) group.userData._explodeOffset = explodeOffset.clone();
  group.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (!o.userData || !o.userData.id) o.userData = { ...data }; }
  });
  return group;
}
function pipeSegment(a, b, mat, r = 0.08) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb); if (len < 0.001) return null;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
  p.position.copy(va.clone().add(vb).multiplyScalar(0.5)); p.lookAt(vb); p.rotateX(Math.PI / 2);
  return p;
}
function addPipes(parent, pts, mat, r = 0.08) {
  for (let i = 0; i < pts.length - 1; i++) { const s = pipeSegment(pts[i], pts[i + 1], mat, r); if (s) parent.add(s); }
}
function flange(R, y, mat, x = 0, z = 0) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.04, 0.05, 12, 36), mat);
  ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); return ring;
}
function horizontalVessel(g, x, y, z, R, L, shell, head) {
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 32), shell);
  drum.rotation.z = Math.PI / 2; drum.position.set(x, y, z); g.add(drum);
  [-L / 2, L / 2].forEach((ox) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), head);
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2; c.position.set(x + ox, y, z); g.add(c);
  });
  [-L / 3, L / 3].forEach((ox) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.25, y - R - 0.2, R * 1.5), matFrame());
    sad.position.set(x + ox, (y - R) / 2, z); g.add(sad);
  });
  return drum;
}

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 12), matConcrete());
  pad.position.y = 0.2; g.add(pad);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.12, 12.4), matSteelDark());
  lip.position.y = 0.06; g.add(lip);
  return tagGroup(g, {
    id: 'des-skid', title: 'Cimentación y plataforma', category: 'Estructura',
    description: 'Losa de hormigón y estructura metálica que soportan los recipientes a presión, las bombas y los intercambiadores del tren de desalado.',
    specs: 'Hormigón H-35 · 20 × 12 m'
  });
}

function buildFeedPump() {
  const g = new THREE.Group();
  const x = -8.5, z = 0;
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.8), matConcrete());
  ped.position.set(x, 0.55, z); g.add(ped);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 20), matSteel());
  pump.rotation.z = Math.PI / 2; pump.position.set(x - 0.4, 0.9, z); g.add(pump);
  const vol = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), matSteel());
  vol.position.set(x - 0.7, 0.9, z); vol.scale.set(1, 1, 0.85); g.add(vol);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 20), matMotor());
  motor.rotation.z = Math.PI / 2; motor.position.set(x + 0.3, 0.9, z); g.add(motor);
  return tagGroup(g, {
    id: 'des-feed-pump', title: 'Bomba de carga de crudo', category: 'Bombeo',
    description: 'Bomba centrífuga que impulsa el crudo a través del tren de precalentamiento y la válvula de mezcla hasta los desaladores, venciendo la caída de presión del sistema.',
    specs: 'API 610 · Sello mecánico doble · Caudal según capacidad de la refinería'
  }, new THREE.Vector3(-3, -1, 0));
}

function buildPreheatExchangers() {
  const g = new THREE.Group();
  [[-6, 2.0], [-6, 3.4]].forEach(([x, y]) => {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 3.0, 28), matSteel());
    sh.rotation.z = Math.PI / 2; sh.position.set(x, y, 2.5); g.add(sh);
    [-1.5, 1.5].forEach((ox) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
      c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2; c.position.set(x + ox, y, 2.5); g.add(c);
    });
    [-0.9, 0.9].forEach((ox) => {
      const sad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.7), matFrame());
      sad.position.set(x + ox, y - 0.7, 2.5); g.add(sad);
    });
  });
  return tagGroup(g, {
    id: 'des-preheat', title: 'Intercambiadores de precalentamiento', category: 'Intercambio de calor',
    description: 'Tren de intercambiadores carcasa-tubos que precalientan el crudo recuperando calor de las corrientes calientes de la refinería. El desalado funciona mejor a 120-150 °C porque baja la viscosidad y mejora la coalescencia del agua.',
    specs: 'Carcasa-tubos · Crudo precalentado a 120-150 °C'
  }, new THREE.Vector3(-3, 1.5, 2));
}

function buildMixingValve() {
  const g = new THREE.Group();
  const x = -3.5, y = 1.4, z = 0;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), matSteelDark());
  body.scale.set(1, 1.2, 1); body.position.set(x, y, z); g.add(body);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), matSteel());
  stem.position.set(x, y + 0.6, z); g.add(stem);
  const hand = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 10, 24), matSteel());
  hand.position.set(x, y + 0.95, z); g.add(hand);
  // tramos de tubería a ambos lados
  const inP = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.6, 16), matPipe());
  inP.rotation.z = Math.PI / 2; inP.position.set(x - 0.6, y, z); g.add(inP);
  const outP = inP.clone(); outP.position.set(x + 0.6, y, z); g.add(outP);
  return tagGroup(g, {
    id: 'des-mixing-valve', title: 'Válvula de mezcla', category: 'Tubería',
    description: 'Válvula que provoca una caída de presión controlada para mezclar íntimamente el crudo con el agua de lavado, formando una emulsión fina. Un mezclado demasiado intenso crea emulsiones difíciles de romper; demasiado suave deja sal sin lavar.',
    specs: 'ΔP típico 1-2 bar · Punto de mezcla agua/crudo (4-8 % vol de agua)'
  }, new THREE.Vector3(0, 2, 0));
}

function buildWashWater() {
  const g = new THREE.Group();
  // Reubicado al rincón posterior-izquierdo, fuera del desalador 1 (z=-2.5).
  const x = -7.5, z = -4.2;

  // Pequeño cimiento de hormigón bajo el tanque
  const tankPad = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 1.9), matConcrete());
  tankPad.position.set(x, 0.49, z); g.add(tankPad);

  // Tanque vertical de agua de lavado: faldón + cuerpo + domo + flange
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.5, 28), matSteelDark());
  skirt.position.set(x, 0.83, z); g.add(skirt);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 28), matWater());
  tank.position.set(x, 2.18, z); g.add(tank);
  g.add(flange(0.7, 3.28, matSteelDark(), x, z));
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteelDark()
  );
  dome.position.set(x, 3.28, z); g.add(dome);
  // Boquilla de venteo en lo alto
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 12), matSteelDark());
  vent.position.set(x, 4.0, z); g.add(vent);
  // Indicador de nivel lateral
  const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 10), matSteel());
  lg.position.set(x + 0.78, 2.0, z); g.add(lg);

  // Pedestal de bomba al costado del tanque
  const pumpPad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.7), matConcrete());
  pumpPad.position.set(x + 1.8, 0.49, z); g.add(pumpPad);
  // Bomba centrífuga (cuerpo + voluta + motor)
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 18), matSteel());
  pump.rotation.z = Math.PI / 2; pump.position.set(x + 1.5, 0.78, z); g.add(pump);
  const vol = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), matSteel());
  vol.position.set(x + 1.34, 0.78, z); vol.scale.set(1, 1, 0.85); g.add(vol);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 18), matMotor());
  motor.rotation.z = Math.PI / 2; motor.position.set(x + 1.95, 0.78, z); g.add(motor);
  const coup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), matSteelDark());
  coup.rotation.z = Math.PI / 2; coup.position.set(x + 1.72, 0.78, z); g.add(coup);

  // Línea de succión: salida del tanque -> bomba (línea corta)
  addPipes(g, [[x, 0.83, z], [x + 0.7, 0.83, z], [x + 1.3, 0.78, z]], matWater(), 0.05);
  // Línea de descarga (ortogonal): bomba -> válvula de mezcla en (-3.5, 1.4, 0)
  addPipes(g, [
    [x + 2.1, 0.78, z],
    [x + 2.1, 0.78, 0],
    [-3.5, 0.78, 0],
    [-3.5, 1.4, 0],
  ], matWater(), 0.06);

  return tagGroup(g, {
    id: 'des-wash-water',
    title: 'Inyección de agua de lavado',
    category: 'Equipo principal',
    description: 'Sistema que dosifica agua dulce (4-8 % vol sobre el crudo) que se mezcla con el crudo en la válvula de mezcla para disolver las sales. El agua arrastra los cloruros y luego se separa en los desaladores como salmuera.',
    specs: 'Agua desmineralizada o condensado · 4-8 % vol sobre carga · Bomba dosificadora'
  }, new THREE.Vector3(-2, -1, -2));
}

function buildDesalter(stage, x, z) {
  const g = new THREE.Group();
  const y = 2.0, R = 1.1, L = 5.5;
  horizontalVessel(g, x, y, z, R, L, matSteel(), matSteelDark());
  // electrodos internos (rejillas) visibles
  for (let i = -1; i <= 1; i++) {
    const grid = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 3.0), matElectrode());
    grid.position.set(x + i * 1.1, y + 0.3, z); g.add(grid);
  }
  // bushing de alto voltaje en la parte superior
  const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.6, 16), matInsulation());
  bush.position.set(x, y + R + 0.3, z); g.add(bush);
  // boquilla de entrada (emulsión) abajo, salida de crudo arriba, salmuera fondo
  const inN = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 16), matSteelDark());
  inN.position.set(x - L / 2 - 0.1, y - R + 0.2, z); inN.rotation.z = Math.PI / 2; g.add(inN);
  const brineN = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.4, 16), matBrine());
  brineN.position.set(x, y - R - 0.15, z); g.add(brineN);
  g.add(flange(R, y, matSteelDark(), x - L / 2 + 0.05, z));
  return tagGroup(g, {
    id: `des-vessel-${stage}`, title: `Desalador electrostático (etapa ${stage})`, category: 'Equipo principal',
    description: stage === 1
      ? 'Recipiente horizontal a presión donde un campo eléctrico de alto voltaje entre rejillas hace que las pequeñas gotas de agua salada se unan (coalescencia) y decanten al fondo como salmuera. La primera etapa retira la mayor parte de la sal.'
      : 'Segunda etapa que afina el desalado: el crudo de la primera etapa se relava con agua fresca para alcanzar especificaciones muy bajas de sal (típicamente < 1 lb/1000 bbl), protegiendo los equipos aguas abajo de la corrosión.',
    specs: 'Ø 2.2 m × 5.5 m · Campo 16-33 kV · T 120-150 °C · P 10-15 bar'
  }, new THREE.Vector3(0, stage === 1 ? -0.5 : 1.5, stage === 1 ? -3 : 3));
}

function buildBrineSystem() {
  const g = new THREE.Group();
  const x = 6.5, z = 0;
  horizontalVessel(g, x, 1.2, z, 0.55, 2.6, matSteelWarm(), matSteelDark());
  // línea de salmuera desde los desaladores
  addPipes(g, [[2.0, 0.85, -2.5], [x - 1.4, 0.85, -2.5], [x - 1.4, 0.85, 0], [x, 0.85, 0]], matBrine(), 0.08);
  addPipes(g, [[5.0, 0.85, 2.5], [x - 1.4, 0.85, 2.5]], matBrine(), 0.08);
  return tagGroup(g, {
    id: 'des-brine', title: 'Tambor y línea de salmuera', category: 'Equipo principal',
    description: 'Recoge el agua salada (salmuera) decantada en los desaladores. Antes de enviarla al tratamiento de efluentes se separa el aceite arrastrado, que se recupera. La salmuera lleva los cloruros que causarían corrosión en la columna atmosférica.',
    specs: 'Separación agua/aceite · Salmuera al tratamiento de efluentes'
  }, new THREE.Vector3(3, -0.5, 0));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();
  // crudo: bomba -> precalentadores -> válvula de mezcla -> desalador 1
  addPipes(g, [[-8.5, 0.9, 0], [-8.5, 2.0, 0], [-6, 2.0, 1.0], [-6, 2.0, 2.5]], m, 0.14);
  addPipes(g, [[-6, 3.4, 2.5], [-4.2, 3.4, 0], [-4.2, 1.4, 0], [-4.1, 1.4, 0]], m, 0.14);
  // mezcla -> desalador 1 (z=-2.5)
  addPipes(g, [[-2.9, 1.4, 0], [-2.9, 1.4, -2.5], [-1.6, 1.4, -2.5]], m, 0.14);
  // desalador 1 -> desalador 2 (z=2.5)
  addPipes(g, [[1.5, 2.6, -2.5], [3.5, 2.6, -2.5], [3.5, 2.6, 2.5], [1.5, 2.6, 2.5]], m, 0.12);
  // crudo desalado de salida (desde tope de etapa 2)
  addPipes(g, [[2.0, 2.9, 2.5], [4.5, 2.9, 2.5], [4.5, 2.9, 5.5], [9.5, 2.9, 5.5]], m, 0.14);
  return tagGroup(g, {
    id: 'des-piping', title: 'Tubería de proceso', category: 'Tubería',
    description: 'Líneas que conectan los equipos: carga de crudo, agua de lavado, transferencia entre etapas, salmuera y la salida de crudo desalado hacia la unidad de destilación atmosférica.',
    specs: 'Acero al carbono · Algunas líneas con revestimiento anticorrosión'
  });
}

export function buildCrudeDesalter() {
  const root = new THREE.Group();
  root.name = 'CrudeDesalter';
  root.add(buildSkid());
  root.add(buildFeedPump());
  root.add(buildPreheatExchangers());
  root.add(buildMixingValve());
  root.add(buildWashWater());
  root.add(buildDesalter(1, -0.5, -2.5));
  root.add(buildDesalter(2, -0.5, 2.5));
  root.add(buildBrineSystem());
  root.add(buildPiping());
  return root;
}
