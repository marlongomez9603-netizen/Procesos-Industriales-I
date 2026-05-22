import * as THREE from 'three';

// ============================================================================
// Unidad de Isomerización C5/C6 (tipo Penex)
// ----------------------------------------------------------------------------
// Convierte n-pentano y n-hexano (bajo octanaje) en sus isómeros ramificados
// (isopentano, dimetilbutanos...) que tienen octanaje mucho mayor, sobre un
// catalizador de alúmina clorada muy sensible al agua. Reactores lead-lag a
// baja temperatura, secadores de carga, inyección de cloruro orgánico,
// estabilizador con lavador cáustico y desisohexanizador de reciclo.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.42 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matFurnace    = () => new THREE.MeshStandardMaterial({ color: 0x9ba1a9, metalness: 0.55, roughness: 0.5 });
const matCatalyst   = () => new THREE.MeshStandardMaterial({ color: 0xc7903b, metalness: 0.6,  roughness: 0.5 });
const matH2         = () => new THREE.MeshStandardMaterial({ color: 0x7e57c2, metalness: 0.5,  roughness: 0.45 });
const matChloride   = () => new THREE.MeshStandardMaterial({ color: 0x8fc750, metalness: 0.4,  roughness: 0.5 });
const matCaustic    = () => new THREE.MeshStandardMaterial({ color: 0x6aa9c7, metalness: 0.4,  roughness: 0.5 });
const matHot        = () => new THREE.MeshStandardMaterial({ color: 0xc0563b, metalness: 0.5,  roughness: 0.45 });
const matMotor      = () => new THREE.MeshStandardMaterial({ color: 0x2e7d46, metalness: 0.55, roughness: 0.45 });
const matFrame      = () => new THREE.MeshStandardMaterial({ color: 0x586273, metalness: 0.7,  roughness: 0.45 });
const matConcrete   = () => new THREE.MeshStandardMaterial({ color: 0x6b7079, metalness: 0.05, roughness: 0.95 });
const matPipe       = () => new THREE.MeshStandardMaterial({ color: 0xb0b5bd, metalness: 0.8,  roughness: 0.4 });

function tagGroup(group, data, explodeOffset) {
  group.userData = { ...data };
  if (explodeOffset) group.userData._explodeOffset = explodeOffset.clone();
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (!o.userData || !o.userData.id) o.userData = { ...data }; } });
  return group;
}
function pipeSegment(a, b, mat, r = 0.08) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb); if (len < 0.001) return null;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
  p.position.copy(va.clone().add(vb).multiplyScalar(0.5)); p.lookAt(vb); p.rotateX(Math.PI / 2); return p;
}
function addPipes(parent, pts, mat, r = 0.08) { for (let i = 0; i < pts.length - 1; i++) { const s = pipeSegment(pts[i], pts[i + 1], mat, r); if (s) parent.add(s); } }
function flange(R, y, mat, x = 0, z = 0) { const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.04, 0.05, 12, 36), mat); ring.rotation.x = Math.PI / 2; ring.position.set(x, y, z); return ring; }

function vReactor(g, x, z, R, H, baseY, label) {
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.0, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.5, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32), matSteel());
  shell.position.set(x, baseY + 1.0 + H / 2, z); g.add(shell);
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, H * 0.7, 28), matCatalyst());
  bed.position.set(x, baseY + 1.0 + H / 2, z); g.add(bed);
  [0, 1].forEach((i) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
    cap.rotation.x = i === 0 ? Math.PI : 0; cap.position.set(x, baseY + 1.0 + (i === 0 ? 0 : H), z); g.add(cap);
  });
}

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 14), matConcrete());
  pad.position.y = 0.2; g.add(pad);
  return tagGroup(g, { id: 'iso-skid', title: 'Cimentación y estructura', category: 'Estructura',
    description: 'Losa y estructura metálica que soportan los reactores, secadores, columnas y compresor de la unidad de isomerización.', specs: 'Hormigón H-35 · 22 × 14 m' });
}

function buildFeedDryers() {
  const g = new THREE.Group();
  [[-8.5, 4.0], [-8.5, 5.6]].forEach(([x, z]) => {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.6, 20), matSteelWarm());
    skirt.position.set(x, 0.9, z); g.add(skirt);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.6, 24), matSteel());
    drum.position.set(x, 3.0, z); g.add(drum);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
    cap.position.set(x, 4.8, z); g.add(cap);
  });
  return tagGroup(g, {
    id: 'iso-dryers', title: 'Secadores de carga', category: 'Equipo principal',
    description: 'Dos recipientes con tamiz molecular en modo lead-lag (uno en servicio, otro en regeneración) que eliminan el agua de la carga. El agua es el principal veneno del catalizador clorado: hay que dejarla por debajo de 0.1 ppm.',
    specs: 'Ø 1.0 m × 3.6 m · Tamiz molecular 3A · Salida < 0.1 ppm H2O'
  }, new THREE.Vector3(-3, 0, 3));
}

function buildCFE() {
  const g = new THREE.Group();
  const x = -4.5, z = 4.5;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.0, 32), matSteel());
  shell.position.set(x, 3.5, z); g.add(shell);
  [-2.5, 2.5].forEach((dy) => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.55, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark()); c.rotation.x = dy > 0 ? 0 : Math.PI; c.position.set(x, 3.5 + dy, z); g.add(c); });
  return tagGroup(g, {
    id: 'iso-cfe', title: 'Intercambiador carga/efluente (CFE)', category: 'Intercambio de calor',
    description: 'Intercambiador de placas que precalienta la carga seca con el efluente caliente del último reactor, recuperando la mayor parte del calor necesario para alcanzar la temperatura de reacción.',
    specs: 'Placas soldadas · ΔT global ~80 °C'
  }, new THREE.Vector3(-2, 1.5, 3));
}

function buildHeater() {
  const g = new THREE.Group();
  const x = -5.5, z = -3.5;
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 1.6), matFurnace());
  box.position.set(x, 1.7, z); g.add(box);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 2.4, 16), matSteelDark());
  stack.position.set(x, 4.2, z); g.add(stack);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 20), matSteel());
  cap.rotation.x = Math.PI / 2; cap.position.set(x, 5.4, z); g.add(cap);
  return tagGroup(g, {
    id: 'iso-heater', title: 'Calentador de carga', category: 'Equipo principal',
    description: 'Aporta el calor final a la mezcla (carga + H2 + cloruro) tras el CFE para alcanzar la temperatura de reactor (~150 °C). Por la baja temperatura, en muchos casos es un calentador de vapor en vez de un horno de fuego.',
    specs: 'T salida ~150 °C · Vapor 40 bar o fuel gas'
  }, new THREE.Vector3(-3, 0, -3));
}

function buildReactors() {
  const g = new THREE.Group();
  vReactor(g, -1.0, 0, 0.7, 6.0, 1.0, 'R-1');
  vReactor(g, 2.0, 0, 0.7, 6.0, 1.0, 'R-2');
  return tagGroup(g, {
    id: 'iso-reactors', title: 'Reactores lead-lag (R-1 / R-2)', category: 'Equipo principal',
    description: 'Dos reactores de lecho fijo en serie con catalizador de alúmina clorada (Pt/Cl-Al2O3). Trabajan a baja temperatura porque el equilibrio termodinámico favorece los isómeros ramificados (más octanaje) en frío. La configuración lead-lag permite cambiar el orden para prolongar la vida del catalizador.',
    specs: 'Ø 1.4 m × 6 m c/u · Catalizador Pt/Cl-Al2O3 · T 120-180 °C · P 30 bar'
  }, new THREE.Vector3(0, 0, 0));  // ancla
}

function buildChlorideInjection() {
  const g = new THREE.Group();
  const x = 0.5, z = -3.5;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.6, 20), matChloride());
  drum.position.set(x, 1.6, z); g.add(drum);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), matChloride());
  cap.position.set(x, 2.4, z); g.add(cap);
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), matSteel());
  pump.position.set(x + 0.9, 0.9, z); g.add(pump);
  addPipes(g, [[x, 1.6, z], [x, 1.6, 0]], matChloride(), 0.04);
  return tagGroup(g, {
    id: 'iso-chloride', title: 'Inyección de cloruro orgánico', category: 'Equipo principal',
    description: 'Skid que dosifica continuamente un compuesto perclorado que en el reactor forma HCl, manteniendo la función ácida del catalizador clorado. Es de bajo caudal pero indispensable: sin cloruro el catalizador pierde actividad.',
    specs: '50-200 ppm sobre carga · Bomba de membrana · Lazo continuo'
  }, new THREE.Vector3(0, 0, -3));
}

function buildH2Makeup() {
  const g = new THREE.Group();
  const x = -8, z = -4.0;
  const ped = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.2), matConcrete()); ped.position.set(x, 0.5, z); g.add(ped);
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.9), matSteelDark()); block.position.set(x, 1.1, z); g.add(block);
  [-0.5, 0, 0.5].forEach((ox) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16), matSteel()); c.position.set(x + ox, 1.65, z); g.add(c); });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 20), matMotor());
  motor.rotation.z = Math.PI / 2; motor.position.set(x + 1.6, 1.1, z); g.add(motor);
  addPipes(g, [[x, 1.7, z], [x, 1.7, 0], [-1.0, 1.7, 0]], matH2(), 0.06);
  return tagGroup(g, {
    id: 'iso-h2', title: 'Compresor de hidrógeno (makeup)', category: 'Bombeo',
    description: 'Comprime el hidrógeno fresco hasta la presión del reactor. En Penex el proceso es "once-through" (sin reciclo de H2) y con relación H2/HC baja; el hidrógeno previene el coquizado más que actuar como reactivo.',
    specs: 'Reciprocante · once-through · Relación H2/HC ~0.06'
  }, new THREE.Vector3(-3, 0, -3));
}

function buildStabilizer() {
  const g = new THREE.Group();
  const x = 5.5, z = 4.5, baseY = 1.0, R = 0.75;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 0.9, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.45, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 7.5, 32), matSteel());
  shell.position.set(x, baseY + 0.9 + 3.75, z); g.add(shell);
  for (let i = 0; i < 4; i++) g.add(flange(R, baseY + 1.8 + i * 1.5, matSteelDark(), x, z));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.position.set(x, baseY + 0.9 + 7.5, z); g.add(dome);
  const reb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 20), matSteel());
  reb.rotation.z = Math.PI / 2; reb.position.set(x + 1.2, 1.4, z); g.add(reb);
  return tagGroup(g, {
    id: 'iso-stabilizer', title: 'Estabilizador', category: 'Columna',
    description: 'Columna que retira los hidrocarburos ligeros y el HCl formado por la disociación del cloruro. El producto de fondo (isomerato) cumple la presión de vapor para su mezcla en gasolina.',
    specs: 'Ø 1.5 m × 7.5 m · 32 platos · Reboiler termosifón'
  }, new THREE.Vector3(3, 0, 3));
}

function buildCausticScrubber() {
  const g = new THREE.Group();
  const x = 8.5, z = 4.5, baseY = 1.0, R = 0.45;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 4.5, 24), matCaustic());
  shell.position.set(x, baseY + 0.35 + 2.25, z); g.add(shell);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), matCaustic());
  dome.position.set(x, baseY + 0.35 + 4.5, z); g.add(dome);
  return tagGroup(g, {
    id: 'iso-scrubber', title: 'Lavador cáustico de offgas', category: 'Columna',
    description: 'Columna donde el gas de cabeza del estabilizador se contacta con sosa cáustica para neutralizar el HCl arrastrado, protegiendo de la corrosión el sistema de gas combustible aguas abajo.',
    specs: 'Ø 0.9 m × 4.5 m · NaOH 10 % w · Relleno aleatorio'
  }, new THREE.Vector3(3.5, 0, 3));
}

function buildDIH() {
  const g = new THREE.Group();
  const x = 8, z = -2.5, baseY = 1.0, R = 0.85;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.0, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.5, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 9.0, 32), matSteel());
  shell.position.set(x, baseY + 1.0 + 4.5, z); g.add(shell);
  for (let i = 0; i < 5; i++) g.add(flange(R, baseY + 2.2 + i * 1.4, matSteelDark(), x, z));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.position.set(x, baseY + 1.0 + 9.0, z); g.add(dome);
  const reb = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.6, 20), matSteel());
  reb.rotation.z = Math.PI / 2; reb.position.set(x + 1.4, 1.4, z); g.add(reb);
  return tagGroup(g, {
    id: 'iso-dih', title: 'Desisohexanizador (DIH)', category: 'Columna',
    description: 'Columna que separa el isomerato en una fracción de alto octanaje (producto, por cabeza) y una fracción rica en n-hexano y metilpentanos que se recicla al reactor para una segunda pasada, elevando el octanaje global.',
    specs: 'Ø 1.7 m × 9 m · 60 platos · Configuración con reciclo de n-C6'
  }, new THREE.Vector3(3, 0, -2));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();
  // secadores -> CFE -> calentador -> R1
  addPipes(g, [[-8.5, 1.8, 4.0], [-4.5, 1.5, 4.5]], m, 0.09);
  addPipes(g, [[-4.5, 5.5, 4.5], [-4.5, 5.5, -3.5], [-5.5, 5.5, -3.5]], matHot(), 0.09);
  addPipes(g, [[-5.5, 3.0, -2.7], [-5.5, 7.0, -2.7], [-1.0, 7.0, 0]], matHot(), 0.09);
  // R1 -> R2
  addPipes(g, [[-1.0, 1.4, 0], [-1.0, 0.8, 0], [2.0, 0.8, 0], [2.0, 7.4, 0]], matHot(), 0.09);
  // R2 efluente -> CFE
  addPipes(g, [[2.0, 1.4, 0], [2.0, 0.6, 0], [-4.5, 0.6, 4.5], [-4.5, 1.0, 4.5]], matHot(), 0.09);
  // CFE -> estabilizador
  addPipes(g, [[-4.5, 6.0, 4.5], [5.5, 4.5, 4.5]], m, 0.08);
  // estabilizador -> DIH
  addPipes(g, [[5.5, 1.7, 4.5], [8.0, 1.0, -2.5], [8.0, 2.0, -2.5]], m, 0.08);
  // reciclo n-C6 DIH -> secadores
  addPipes(g, [[8.85, 5.0, -2.5], [10.0, 5.0, -2.5], [10.0, 5.0, 4.5], [-9, 5.0, 4.5]], m, 0.07);
  return tagGroup(g, {
    id: 'iso-piping', title: 'Tubería de proceso', category: 'Tubería',
    description: 'Líneas que conectan secadores, intercambiador, calentador, reactores, estabilizador, lavador y desisohexanizador, incluyendo el lazo de reciclo de n-hexano y la dosificación de cloruro e hidrógeno.',
    specs: 'Aislamiento en líneas calientes · Lazos de reciclo'
  });
}

export function buildIsomerization() {
  const root = new THREE.Group();
  root.name = 'Isomerization';
  root.add(buildSkid());
  root.add(buildFeedDryers());
  root.add(buildCFE());
  root.add(buildHeater());
  root.add(buildReactors());
  root.add(buildChlorideInjection());
  root.add(buildH2Makeup());
  root.add(buildStabilizer());
  root.add(buildCausticScrubber());
  root.add(buildDIH());
  root.add(buildPiping());
  return root;
}
