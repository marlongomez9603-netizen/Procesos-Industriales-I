import * as THREE from 'three';

// ============================================================================
// Unidad de Destilación Atmosférica (CDU)
// ----------------------------------------------------------------------------
// Enfoque equipo-por-equipo: la columna atmosférica es el centro, dividida en
// secciones, cabezales e internos, rodeada de horno, side strippers, sistema
// de cabeza y bombas. Cada grupo expone userData._explodeOffset para la vista
// explosionada (main.js interpola posición base → base + offset·factor).
//
// Materiales pensados para el environment map / tone mapping ACES del visor:
// acero claro y metálico que capta reflejos del IBL.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.4 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matInsulation = () => new THREE.MeshStandardMaterial({ color: 0xe7e2d6, metalness: 0.05, roughness: 0.85 });
const matFurnace    = () => new THREE.MeshStandardMaterial({ color: 0x9ba1a9, metalness: 0.55, roughness: 0.5 });
const matRefractory = () => new THREE.MeshStandardMaterial({ color: 0xb2906f, metalness: 0.1,  roughness: 0.9 });
const matInternals  = () => new THREE.MeshStandardMaterial({ color: 0xc7a85e, metalness: 0.75, roughness: 0.35 });
const matMotor      = () => new THREE.MeshStandardMaterial({ color: 0x2e7d46, metalness: 0.55, roughness: 0.45 });
const matFrame      = () => new THREE.MeshStandardMaterial({ color: 0x586273, metalness: 0.7,  roughness: 0.45 });
const matConcrete   = () => new THREE.MeshStandardMaterial({ color: 0x6b7079, metalness: 0.05, roughness: 0.95 });
const matPipe       = () => new THREE.MeshStandardMaterial({ color: 0xb0b5bd, metalness: 0.8,  roughness: 0.4 });

function tagGroup(group, data, explodeOffset) {
  group.userData = { ...data };
  if (explodeOffset) group.userData._explodeOffset = explodeOffset.clone();
  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (!o.userData || !o.userData.id) o.userData = { ...data };
    }
  });
  return group;
}

function pipeSegment(a, b, mat, radius = 0.08) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  if (len < 0.001) return null;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 16), mat);
  pipe.position.copy(va.clone().add(vb).multiplyScalar(0.5));
  pipe.lookAt(vb);
  pipe.rotateX(Math.PI / 2);
  return pipe;
}

function addPipes(parent, pts, mat, r = 0.08) {
  for (let i = 0; i < pts.length - 1; i++) {
    const s = pipeSegment(pts[i], pts[i + 1], mat, r);
    if (s) parent.add(s);
  }
}

function flange(R, y, mat, x = 0, z = 0) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.04, 0.055, 12, 40), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y, z);
  return ring;
}

function nozzle(len, r, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 18), mat);
}

function manhole(R, y, angle, mat, cx = 0, cz = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.28, 24), mat);
  m.rotation.z = Math.PI / 2;
  m.rotation.y = -angle;
  m.position.set(cx + Math.cos(angle) * (R + 0.1), y, cz + Math.sin(angle) * (R + 0.1));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 24), matSteel());
  lid.rotation.z = Math.PI / 2;
  lid.rotation.y = -angle;
  lid.position.set(cx + Math.cos(angle) * (R + 0.26), y, cz + Math.sin(angle) * (R + 0.26));
  const g = new THREE.Group();
  g.add(m); g.add(lid);
  return g;
}

// Plataforma circular alrededor de la columna
function ringPlatform(R, y, mat) {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(R + 0.05, R + 0.95, 40),
    new THREE.MeshStandardMaterial({ color: 0x5c6573, metalness: 0.6, roughness: 0.6, side: THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = y;
  g.add(deck);
  // barandilla
  const rail = new THREE.Mesh(new THREE.TorusGeometry(R + 0.92, 0.025, 8, 48), mat);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = y + 1.0;
  g.add(rail);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), mat);
    post.position.set(Math.cos(a) * (R + 0.92), y + 0.5, Math.sin(a) * (R + 0.92));
    g.add(post);
  }
  return g;
}

// ---------------------------------------------------------------------------

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 16), matConcrete());
  pad.position.y = 0.2;
  g.add(pad);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.12, 16.5), matSteelDark());
  lip.position.y = 0.06;
  g.add(lip);
  // pequeñas zapatas
  for (const [x, z] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), matConcrete());
    f.position.set(x, 0.25, z);
    g.add(f);
  }
  return tagGroup(g, {
    id: 'cdu-skid',
    title: 'Cimentación y plataforma',
    category: 'Estructura',
    description: 'Losa de hormigón armado y estructura metálica que soportan la columna, el horno y los equipos auxiliares de la unidad de destilación atmosférica.',
    specs: 'Hormigón H-35 · 22 × 16 m · Acero estructural galvanizado'
  });
}

function buildColumnSkirt() {
  const g = new THREE.Group();
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 1.8, 40), matSteelWarm());
  skirt.position.y = 1.3;
  g.add(skirt);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16), matSteelDark());
    vent.rotation.z = Math.PI / 2;
    vent.rotation.y = -a;
    vent.position.set(Math.cos(a) * 1.28, 0.9, Math.sin(a) * 1.28);
    g.add(vent);
  }
  g.add(flange(1.2, 2.2, matSteelDark()));
  return tagGroup(g, {
    id: 'cdu-skirt',
    title: 'Faldón de la columna',
    category: 'Columna',
    description: 'Soporte cilíndrico que ancla la columna al cimiento, transmite las cargas a la losa y aloja el sistema de venteo. Permite el acceso al cabezal inferior.',
    specs: 'Acero al carbono · Ø 2.6 m · Altura 1.8 m · 8 pernos de anclaje'
  }, new THREE.Vector3(0, -3, 0));
}

function buildBottomHead() {
  const g = new THREE.Group();
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  head.scale.set(1, 0.6, 1);
  head.rotation.x = Math.PI;
  head.position.y = 2.25;
  g.add(head);
  const noz = nozzle(0.6, 0.24, matSteelDark());
  noz.position.set(0, 1.65, 0);
  g.add(noz);
  g.add(flange(0.3, 1.4, matSteelDark()));
  // anillo de vapor de stripping
  const stmRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 10, 28), matSteelDark());
  stmRing.rotation.x = Math.PI / 2;
  stmRing.position.y = 2.5;
  g.add(stmRing);
  return tagGroup(g, {
    id: 'cdu-bottom-head',
    title: 'Cabezal inferior',
    category: 'Columna',
    description: 'Casquete semielipsoidal que cierra el fondo. Conecta con la salida de residuo atmosférico (long residue) y aloja el anillo distribuidor de vapor de stripping.',
    specs: 'Tapa 2:1 elíptica · Acero al carbono · Ø 2.4 m'
  }, new THREE.Vector3(0, -1.8, 0));
}

// Genera una sección cilíndrica de la columna con boquillas, manholes y flanges
function makeSection(opts) {
  const { yBottom, height, R, prevR, sideNozzles = [], manholes = [], insul = 0 } = opts;
  const g = new THREE.Group();
  const yC = yBottom + height / 2;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, height, 40), matSteel());
  shell.position.y = yC;
  g.add(shell);

  if (prevR && Math.abs(prevR - R) > 0.01) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(R, prevR, 0.4, 40), matSteelDark());
    cone.position.y = yBottom - 0.2;
    g.add(cone);
  }
  if (insul > 0) {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.06, R * 1.06, height * insul, 40), matInsulation());
    ins.position.y = yC - height * (1 - insul) / 2;
    g.add(ins);
  }
  g.add(flange(R, yBottom, matSteelDark()));
  g.add(flange(R, yBottom + height, matSteelDark()));

  sideNozzles.forEach((n) => {
    const angle = n.angle ?? 0;
    const noz = nozzle(0.5, n.r ?? 0.16, matSteelDark());
    noz.rotation.z = Math.PI / 2;
    noz.rotation.y = -angle;
    noz.position.set(Math.cos(angle) * (R + 0.2), yBottom + height * n.h, Math.sin(angle) * (R + 0.2));
    g.add(noz);
    g.add(flange(0.2, yBottom + height * n.h, matSteelDark(), Math.cos(angle) * (R + 0.42), Math.sin(angle) * (R + 0.42)));
  });
  manholes.forEach((m) => {
    g.add(manhole(R, yBottom + height * m.h, m.angle ?? Math.PI / 2, matSteelDark()));
  });
  return { group: g, yTop: yBottom + height };
}

function buildStrippingSection() {
  const { group } = makeSection({
    yBottom: 2.6, height: 2.6, R: 1.2, prevR: 1.2, insul: 0.5,
    sideNozzles: [{ h: 0.2, angle: 0, r: 0.18 }],
    manholes: [{ h: 0.75, angle: Math.PI / 2 }],
  });
  return tagGroup(group, {
    id: 'cdu-stripping',
    title: 'Sección de stripping',
    category: 'Columna',
    description: 'Sección bajo el plato de carga. El vapor de stripping inyectado en el fondo arrastra los ligeros del residuo, mejorando el rendimiento de gasóleo atmosférico.',
    specs: 'Ø 2.4 m × 2.6 m · 4 platos válvula · Vapor 1–2 % w sobre carga'
  }, new THREE.Vector3(0, -0.7, 0));
}

function buildFlashSection() {
  const { group } = makeSection({
    yBottom: 5.2, height: 2.6, R: 1.4, prevR: 1.2,
    sideNozzles: [{ h: 0.25, angle: 0, r: 0.3 }, { h: 0.6, angle: Math.PI, r: 0.15 }],
    manholes: [{ h: 0.5, angle: Math.PI * 0.35 }],
  });
  return tagGroup(group, {
    id: 'cdu-flash',
    title: 'Zona de flasheo / HGO',
    category: 'Columna',
    description: 'Recibe la mezcla bifásica del horno (zona de flasheo). Aloja el plato chimenea de extracción de gasóleo pesado (HGO) y la toma del pumparound inferior.',
    specs: 'Ø 2.8 m × 2.6 m · Entrada de transferencia Ø 0.85 m · Bottom pumparound'
  }, new THREE.Vector3(0, 0, 0));  // anchor
}

function buildMidSection() {
  const { group } = makeSection({
    yBottom: 7.8, height: 2.4, R: 1.5, prevR: 1.4,
    sideNozzles: [{ h: 0.4, angle: 0, r: 0.14 }, { h: 0.7, angle: Math.PI, r: 0.13 }],
    manholes: [{ h: 0.5, angle: Math.PI / 2 }],
  });
  return tagGroup(group, {
    id: 'cdu-mid',
    title: 'Sección de LGO / Kerosene',
    category: 'Columna',
    description: 'Platos chimenea para extracción de gasóleo ligero (LGO) y kerosene hacia sus side strippers. Recibe el retorno del pumparound medio.',
    specs: 'Ø 3.0 m × 2.4 m · 2 cortes laterales · Mid pumparound'
  }, new THREE.Vector3(0, 1.3, 0));
}

function buildTopSection() {
  const { group } = makeSection({
    yBottom: 10.2, height: 2.8, R: 1.7, prevR: 1.5,
    sideNozzles: [{ h: 0.35, angle: 0, r: 0.13 }, { h: 0.7, angle: Math.PI, r: 0.12 }, { h: 0.9, angle: Math.PI, r: 0.1 }],
    manholes: [{ h: 0.5, angle: Math.PI / 2 }],
  });
  return tagGroup(group, {
    id: 'cdu-top',
    title: 'Sección superior / Nafta pesada',
    category: 'Columna',
    description: 'Sección de mayor diámetro para el gran volumen de vapor ascendente. Aloja la extracción de nafta pesada y la entrada del reflujo desde el tambor de cabeza.',
    specs: 'Ø 3.4 m × 2.8 m · Top pumparound · Entrada de reflujo'
  }, new THREE.Vector3(0, 2.6, 0));
}

function buildTopHead() {
  const g = new THREE.Group();
  const R = 1.7, yBase = 13.0;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.scale.set(1, 0.7, 1);
  dome.position.y = yBase;
  g.add(dome);
  const vapor = nozzle(0.7, 0.42, matSteelDark());
  vapor.rotation.z = Math.PI / 2;
  vapor.position.set(R - 0.1, yBase + 0.55, 0);
  g.add(vapor);
  g.add(flange(0.45, yBase + 0.55, matSteelDark(), R + 0.2, 0));
  const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24), matSteelDark());
  mh.position.set(0, yBase + 1.2, 0);
  g.add(mh);
  return tagGroup(g, {
    id: 'cdu-top-head',
    title: 'Cabezal superior (domo)',
    category: 'Columna',
    description: 'Cabeza semielipsoidal con la salida de vapores hacia el condensador, manhole superior de inspección y boquilla de instrumentación de presión.',
    specs: 'Tapa 2:1 elíptica · Salida vapores Ø 0.85 m'
  }, new THREE.Vector3(0, 4.0, 0));
}

function buildInternals() {
  const g = new THREE.Group();
  const levels = [
    [3.4, 1.12], [4.0, 1.12], [4.6, 1.12],
    [6.0, 1.3], [6.6, 1.3], [7.2, 1.3],
    [8.4, 1.42], [9.0, 1.42], [9.6, 1.42],
    [10.8, 1.6], [11.4, 1.6], [12.0, 1.6], [12.6, 1.6],
  ];
  levels.forEach(([y, R]) => {
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.05, 40), matInternals());
    deck.position.y = y;
    g.add(deck);
    // pequeñas válvulas (bubble caps) sobre el plato
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), matInternals());
      cap.position.set(Math.cos(a) * R * 0.55, y + 0.08, Math.sin(a) * R * 0.55);
      g.add(cap);
    }
    // downcomer
    const dc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.12), matInternals());
    dc.position.set(R * 0.78, y - 0.12, 0);
    g.add(dc);
  });
  // demister pad
  const dem = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.18, 40),
    new THREE.MeshStandardMaterial({ color: 0xa39a8c, metalness: 0.3, roughness: 0.9 })
  );
  dem.position.y = 12.95;
  g.add(dem);
  return tagGroup(g, {
    id: 'cdu-internals',
    title: 'Internos (platos y demister)',
    category: 'Columna',
    description: 'Platos válvula que generan el contacto vapor-líquido, downcomers para el líquido descendente y demister pad en cabeza que retiene gotas arrastradas.',
    specs: 'Platos válvula tipo Glitsch V1 · Eficiencia Murphree ~65 % · Demister malla SS 304'
  }, new THREE.Vector3(0, 6.0, 0));
}

function buildPlatforms() {
  const g = new THREE.Group();
  g.add(ringPlatform(1.4, 5.0, matFrame()));
  g.add(ringPlatform(1.5, 7.7, matFrame()));
  g.add(ringPlatform(1.7, 10.1, matFrame()));
  g.add(ringPlatform(1.7, 12.9, matFrame()));

  // Escalera de gato con jaula de seguridad, vertical y adosada a la columna.
  const ladX = -1.95, ladZ = 0.6, yTop = 12.9;
  [-0.2, 0.2].forEach((dz) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, yTop - 0.6, 8), matFrame());
    rail.position.set(ladX, 0.6 + (yTop - 0.6) / 2, ladZ + dz);
    g.add(rail);
  });
  for (let y = 1.0; y <= yTop - 0.2; y += 0.4) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), matFrame());
    rung.rotation.x = Math.PI / 2; rung.position.set(ladX, y, ladZ); g.add(rung);
  }
  for (let y = 2.0; y <= yTop - 0.4; y += 0.8) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 6, 18), matFrame());
    hoop.rotation.x = Math.PI / 2; hoop.position.set(ladX - 0.22, y, ladZ); g.add(hoop);
  }
  [5.0, 7.7, 10.1, 12.9].forEach((y) => {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), matFrame());
    br.position.set(ladX + 0.3, y, ladZ); g.add(br);
  });

  return tagGroup(g, {
    id: 'cdu-platforms',
    title: 'Plataformas y escaleras',
    category: 'Estructura',
    description: 'Plataformas circulares de operación a la altura de cada manhole/boquilla y escalera de acceso a los distintos niveles de la columna.',
    specs: 'Rejilla galvanizada · Barandilla 1.0 m · Acceso a 4 niveles'
  }, new THREE.Vector3(0, 0, 0));
}

function buildChargeHeater() {
  const g = new THREE.Group();
  const x = -7.5, z = -2.0;
  const refr = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 2.6), matRefractory());
  refr.position.set(x, 0.65, z);
  g.add(refr);
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.0, 2.4), matFurnace());
  box.position.set(x, 2.9, z);
  g.add(box);
  // peephole / quemadores
  for (const dx of [-0.8, 0, 0.8]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 14), matSteelDark());
    b.rotation.x = Math.PI / 2;
    b.position.set(x + dx, 1.1, z + 1.25);
    g.add(b);
  }
  const breech = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 0.7, 24), matSteelDark());
  breech.position.set(x, 5.2, z);
  g.add(breech);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4.6, 24), matSteelDark());
  stack.position.set(x, 7.8, z);
  g.add(stack);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 24), matSteel());
  cap.rotation.x = Math.PI / 2;
  cap.position.set(x, 10.1, z);
  g.add(cap);
  return tagGroup(g, {
    id: 'cdu-heater',
    title: 'Horno de carga',
    category: 'Equipo principal',
    description: 'Horno de proceso que eleva la temperatura del crudo desalado hasta ~360 °C antes de su entrada a la zona de flasheo. Concentra la mayor parte de la carga térmica de la unidad.',
    specs: 'Carga térmica ~90 MW · T salida 360 °C · 4 pasos de serpentín · Fuel gas + fuel oil'
  }, new THREE.Vector3(-4.5, 0, 0));
}

function buildSideStrippers() {
  const g = new THREE.Group();
  [4.6, 6.1, 7.6].forEach((x) => {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.7, 24), matSteelWarm());
    skirt.position.set(x, 0.75, 2.0);
    g.add(skirt);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.2, 28), matSteel());
    shell.position.set(x, 3.2, 2.0);
    g.add(shell);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
    dome.scale.set(1, 0.6, 1);
    dome.position.set(x, 5.3, 2.0);
    g.add(dome);
    [1.7, 3.2, 4.7].forEach((yy) => g.add(flange(0.42, yy, matSteelDark(), x, 2.0)));
    const noz = nozzle(0.35, 0.1, matSteelDark());
    noz.rotation.z = Math.PI / 2;
    noz.position.set(x + 0.55, 1.5, 2.0);
    g.add(noz);
  });
  return tagGroup(g, {
    id: 'cdu-side-strippers',
    title: 'Side strippers (Kero / LGO / HGO)',
    category: 'Equipo principal',
    description: 'Tres pequeñas columnas que reciben los cortes laterales de la columna principal y los desorben con vapor para ajustar el flash point del producto, devolviendo los ligeros a la columna.',
    specs: 'Ø 0.84 m × 4.2 m c/u · 4–6 platos · Vapor de stripping 1 % w'
  }, new THREE.Vector3(3, 0, 2.5));
}

function buildOverheadSystem() {
  const g = new THREE.Group();
  const cx = 4.5, cz = -4.0;
  // Estructura de soporte: postes que llegan hasta el air-cooler (y=12.5),
  // con vigas horizontales a la altura del tambor y del cooler + arriostramiento.
  const postTop = 13.0;
  for (const dz of [-1.0, 1.0]) for (const dx of [-1.9, 1.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, postTop, 0.16), matFrame());
    post.position.set(cx + dx, postTop / 2, cz + dz);
    g.add(post);
  }
  // Vigas horizontales (a nivel de tambor y de cooler) que soportan los equipos
  [10.3, 12.5].forEach((y) => {
    [-1.0, 1.0].forEach((dz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.12, 0.12), matFrame());
      beam.position.set(cx, y, cz + dz); g.add(beam);
    });
    [-1.9, 1.9].forEach((dx) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), matFrame());
      beam.position.set(cx + dx, y, cz); g.add(beam);
    });
  });
  // Arriostramiento diagonal en los costados
  [-1.9, 1.9].forEach((dx) => {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.0, 0.08), matFrame());
    br.position.set(cx + dx, 7.5, cz - 1.0); br.rotation.x = 0.35; g.add(br);
  });
  // air cooler
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.45, 1.8), matSteelDark());
  cooler.position.set(cx, 12.5, cz);
  g.add(cooler);
  [-1.1, 1.1].forEach((dx) => {
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), matSteel());
    fan.position.set(cx + dx, 12.78, cz);
    g.add(fan);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.12), matSteelDark());
      blade.position.set(cx + dx + Math.cos(a) * 0.3, 12.82, cz + Math.sin(a) * 0.3);
      blade.rotation.y = a;
      g.add(blade);
    }
  });
  // tambor de reflujo
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 28), matSteel());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(cx, 10.3, cz);
  g.add(drum);
  [-1.6, 1.6].forEach((ox) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    c.position.set(cx + ox, 10.3, cz);
    g.add(c);
  });
  [-1.0, 1.0].forEach((ox) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.9), matFrame());
    sad.position.set(cx + ox, 9.5, cz);
    g.add(sad);
  });
  return tagGroup(g, {
    id: 'cdu-overhead',
    title: 'Sistema de cabeza',
    category: 'Equipo principal',
    description: 'Condensador air-cooler y tambor de reflujo. Condensa los vapores de cabeza, separa nafta ligera del agua y los gases incondensables, y devuelve parte del condensado como reflujo a la columna.',
    specs: 'Air cooler 4 ventiladores · Tambor Ø 1.4 m × 3.2 m · Separación trifásica'
  }, new THREE.Vector3(3, 1.5, -3.5));
}

function buildProductPumps() {
  const g = new THREE.Group();
  [4.6, 6.1, 7.6].forEach((x) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), matConcrete());
    ped.position.set(x, 0.55, 4.5);
    g.add(ped);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 18), matSteel());
    pump.rotation.z = Math.PI / 2;
    pump.position.set(x - 0.32, 0.82, 4.5);
    g.add(pump);
    const vol = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), matSteel());
    vol.position.set(x - 0.52, 0.82, 4.5); vol.scale.set(1, 1, 0.85);
    g.add(vol);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.58, 18), matMotor());
    motor.rotation.z = Math.PI / 2;
    motor.position.set(x + 0.24, 0.82, 4.5);
    g.add(motor);
  });
  return tagGroup(g, {
    id: 'cdu-product-pumps',
    title: 'Bombas de productos',
    category: 'Bombeo',
    description: 'Bombas centrífugas que extraen los productos de fondo de cada side stripper (kerosene, LGO, HGO) y los envían a sus intercambiadores y tanques.',
    specs: 'Tres bombas API 610 · Sello mecánico doble · 50–80 m³/h'
  }, new THREE.Vector3(3, -1, 4));
}

function buildPumparoundPumps() {
  const g = new THREE.Group();
  [-2.4, -3.5, -4.6].forEach((x) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), matConcrete());
    ped.position.set(x, 0.55, 4.5);
    g.add(ped);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 18), matSteel());
    pump.rotation.z = Math.PI / 2;
    pump.position.set(x - 0.3, 0.82, 4.5);
    g.add(pump);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.62, 18), matMotor());
    motor.rotation.z = Math.PI / 2;
    motor.position.set(x + 0.26, 0.82, 4.5);
    g.add(motor);
  });
  return tagGroup(g, {
    id: 'cdu-pa-pumps',
    title: 'Bombas de pumparound',
    category: 'Bombeo',
    description: 'Tres bombas que recirculan los pumparounds top/medio/fondo: extraen líquido del plato chimenea, lo enfrían y lo devuelven a la columna como reflujo interno regulando el perfil térmico.',
    specs: 'Tres bombas API 610 · Sello mecánico doble · Pumparounds top/medio/fondo'
  }, new THREE.Vector3(-2.5, -1, 4));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();

  // Transferencia horno -> zona de flasheo de la columna
  addPipes(g, [[-7.5, 5.2, -2.0], [-7.5, 6.0, -2.0], [-7.5, 6.0, 0], [-1.6, 6.0, 0]], m, 0.24);
  // Vapores de cabeza -> air cooler (entra al cooler en x=4.5)
  addPipes(g, [[1.5, 14.0, 0], [1.5, 14.0, -4.0], [4.5, 14.0, -4.0], [4.5, 13.0, -4.0]], m, 0.3);
  // Reflujo: tambor de cabeza -> tope de la columna
  addPipes(g, [[3.0, 10.3, -4.0], [-1.9, 10.3, -4.0], [-1.9, 11.6, 0]], m, 0.1);
  // Residuo atmosférico (fondo) -> hacia la VDU
  addPipes(g, [[0, 1.4, 0], [0, 0.5, 0], [9.0, 0.5, 0]], m, 0.13);

  // --- Side strippers (Kero / LGO / HGO): extracción de la columna, retorno de
  //     vapor y producto hacia las bombas. Strippers en x=4.6/6.1/7.6, z=2.0 ---
  const strX = [4.6, 6.1, 7.6];
  const cutY = [11.0, 9.0, 7.0];    // alturas de extracción en la columna (top/mid/flash)
  strX.forEach((sx, i) => {
    const colR = 1.7;               // radio aproximado del lado +x de la columna
    // Extracción de líquido columna -> tope del stripper
    addPipes(g, [[colR, cutY[i], 0], [sx, cutY[i], 0], [sx, cutY[i], 2.0], [sx, 5.3, 2.0]], m, 0.08);
    // Retorno de vapor stripper -> columna (un poco por encima de la extracción)
    addPipes(g, [[sx - 0.3, 5.0, 2.0], [sx - 0.3, cutY[i] + 0.5, 2.0], [colR, cutY[i] + 0.5, 0]], m, 0.07);
    // Producto: fondo del stripper -> bomba de producto (z=4.5)
    addPipes(g, [[sx + 0.55, 1.5, 2.0], [sx + 0.55, 1.5, 3.5], [sx, 0.82, 4.5]], m, 0.07);
    // Salida de producto bombeado
    addPipes(g, [[sx + 0.24, 0.82, 4.5], [sx + 0.24, 0.82, 6.0]], m, 0.06);
    // Vapor de stripping al fondo del stripper
    addPipes(g, [[sx - 0.55, 1.4, 2.0], [sx - 0.55, 0.9, 2.0]], m, 0.05);
  });

  // --- Pumparounds (top/medio/fondo): extracción del lado -x de la columna ->
  //     bomba (x=-2.4/-3.5/-4.6, z=4.5) -> retorno a la columna ---
  const paX = [-2.4, -3.5, -4.6];
  const paDrawY = [10.8, 8.2, 5.6];
  const paRetY = [11.4, 8.9, 6.3];
  paX.forEach((px, i) => {
    const colR = -1.6;
    // Extracción columna -> bomba
    addPipes(g, [[colR, paDrawY[i], 0], [px, paDrawY[i], 0], [px, paDrawY[i], 3.5], [px - 0.3, 1.05, 4.5]], m, 0.08);
    // Bomba -> retorno a la columna (más arriba que la extracción)
    addPipes(g, [[px + 0.26, 1.05, 4.5], [px + 0.6, 1.05, 2.0], [px + 0.6, paRetY[i], 0], [colR, paRetY[i], 0]], m, 0.07);
  });

  return tagGroup(g, {
    id: 'cdu-piping',
    title: 'Tubería de proceso',
    category: 'Tubería',
    description: 'Líneas que conectan los equipos: transferencia horno-columna, vapores de cabeza al condensador, reflujo, extracciones laterales y retornos de los side strippers, lazos de pumparound, productos y residuo atmosférico hacia las unidades aguas abajo.',
    specs: 'Aislamiento térmico en líneas calientes · Materiales según servicio'
  });
}

export function buildAtmosphericDistillation() {
  const root = new THREE.Group();
  root.name = 'AtmosphericDistillation';
  root.add(buildSkid());
  root.add(buildChargeHeater());
  root.add(buildColumnSkirt());
  root.add(buildBottomHead());
  root.add(buildStrippingSection());
  root.add(buildFlashSection());
  root.add(buildMidSection());
  root.add(buildTopSection());
  root.add(buildTopHead());
  root.add(buildInternals());
  root.add(buildPlatforms());
  root.add(buildSideStrippers());
  root.add(buildOverheadSystem());
  root.add(buildProductPumps());
  root.add(buildPumparoundPumps());
  root.add(buildPiping());
  return root;
}
