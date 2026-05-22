import * as THREE from 'three';

// ============================================================================
// Unidad de Destilación al Vacío (VDU)
// ----------------------------------------------------------------------------
// Torre swaged (estrecha abajo, ancha arriba) para manejar el gran volumen de
// vapor a baja presión, con horno de carga, sistema de eyectores de vapor con
// intercondensadores, sump, pumparounds y sus enfriadores. Cada grupo expone
// userData._explodeOffset para la vista explosionada.
//
// Materiales PBR claros y metálicos para aprovechar el environment map (IBL)
// y el tone mapping ACES del visor.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.42 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matInsulation = () => new THREE.MeshStandardMaterial({ color: 0xe7e2d6, metalness: 0.05, roughness: 0.85 });
const matFurnace    = () => new THREE.MeshStandardMaterial({ color: 0x9ba1a9, metalness: 0.55, roughness: 0.5 });
const matRefractory = () => new THREE.MeshStandardMaterial({ color: 0xb2906f, metalness: 0.1,  roughness: 0.9 });
const matPacking    = () => new THREE.MeshStandardMaterial({ color: 0xb89a4f, metalness: 0.7,  roughness: 0.4 });
const matAsphalt    = () => new THREE.MeshStandardMaterial({ color: 0x35373c, metalness: 0.2,  roughness: 0.8 });
const matMotor      = () => new THREE.MeshStandardMaterial({ color: 0x2e7d46, metalness: 0.55, roughness: 0.45 });
const matFrame      = () => new THREE.MeshStandardMaterial({ color: 0x586273, metalness: 0.7,  roughness: 0.45 });
const matConcrete   = () => new THREE.MeshStandardMaterial({ color: 0x6b7079, metalness: 0.05, roughness: 0.95 });
const matPipe       = () => new THREE.MeshStandardMaterial({ color: 0xb0b5bd, metalness: 0.8,  roughness: 0.4 });
const matSteam      = () => new THREE.MeshStandardMaterial({ color: 0xd6dde4, metalness: 0.5,  roughness: 0.4 });
const matCW         = () => new THREE.MeshStandardMaterial({ color: 0x5b8fc9, metalness: 0.5,  roughness: 0.45 });

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

function flange(R, y, mat, x = 0, z = 0) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.04, 0.06, 12, 40), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y, z);
  return ring;
}

function manhole(R, y, angle, mat) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 24), mat);
  m.rotation.z = Math.PI / 2; m.rotation.y = -angle;
  m.position.set(Math.cos(angle) * (R + 0.1), y, Math.sin(angle) * (R + 0.1));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 24), matSteel());
  lid.rotation.z = Math.PI / 2; lid.rotation.y = -angle;
  lid.position.set(Math.cos(angle) * (R + 0.26), y, Math.sin(angle) * (R + 0.26));
  g.add(m); g.add(lid);
  return g;
}

function ringPlatform(R, y, mat) {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(R + 0.05, R + 1.0, 44),
    new THREE.MeshStandardMaterial({ color: 0x5c6573, metalness: 0.6, roughness: 0.6, side: THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI / 2; deck.position.y = y;
  g.add(deck);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(R + 0.97, 0.025, 8, 52), mat);
  rail.rotation.x = Math.PI / 2; rail.position.y = y + 1.0;
  g.add(rail);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), mat);
    post.position.set(Math.cos(a) * (R + 0.97), y + 0.5, Math.sin(a) * (R + 0.97));
    g.add(post);
  }
  return g;
}

// ---------------------------------------------------------------------------

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 16), matConcrete());
  pad.position.y = 0.2;
  g.add(pad);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.12, 16.5), matSteelDark());
  lip.position.y = 0.06;
  g.add(lip);
  return tagGroup(g, {
    id: 'vdu-skid',
    title: 'Cimentación y plataforma',
    category: 'Estructura',
    description: 'Losa de hormigón armado y estructura metálica que soportan la torre de vacío, el horno y el sistema de eyectores.',
    specs: 'Hormigón H-40 · 26 × 16 m · Espesor 0.4 m'
  });
}

function buildColumnSkirt() {
  const g = new THREE.Group();
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 1.6, 40), matSteelWarm());
  skirt.position.y = 1.2;
  g.add(skirt);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), matSteelDark());
    vent.rotation.z = Math.PI / 2; vent.rotation.y = -a;
    vent.position.set(Math.cos(a) * 1.08, 0.85, Math.sin(a) * 1.08);
    g.add(vent);
  }
  g.add(flange(1.0, 2.0, matSteelDark()));
  return tagGroup(g, {
    id: 'vdu-skirt',
    title: 'Faldón de la torre',
    category: 'Columna',
    description: 'Soporte cilíndrico que ancla la torre al cimiento. Calculado para vacío interno + cargas de viento y sísmica.',
    specs: 'Acero al carbono · Ø 2.0 m · Altura 1.6 m'
  }, new THREE.Vector3(0, -3, 0));
}

function buildBottomHead() {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  head.scale.set(1, 0.6, 1); head.rotation.x = Math.PI; head.position.y = 2.05;
  g.add(head);
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 18), matAsphalt());
  noz.position.set(0, 1.55, 0);
  g.add(noz);
  // anillo de vapor de stripping
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 10, 28), matSteam());
  ring.rotation.x = Math.PI / 2; ring.position.y = 2.4;
  g.add(ring);
  return tagGroup(g, {
    id: 'vdu-bottom-head',
    title: 'Cabezal inferior',
    category: 'Columna',
    description: 'Casquete que cierra el fondo de la torre. Aloja el anillo de vapor de stripping y la salida de asfalto / residuo de vacío.',
    specs: 'Tapa 2:1 elíptica · Acero al carbono'
  }, new THREE.Vector3(0, -1.8, 0));
}

function makeSwagedSection(opts) {
  const { yBottom, height, R, prevR, packing = false, sideNozzles = [], manholes = [], insul = 0 } = opts;
  const g = new THREE.Group();
  const yC = yBottom + height / 2;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, height, 40), matSteel());
  shell.position.y = yC;
  g.add(shell);
  if (prevR && Math.abs(prevR - R) > 0.01) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(R, prevR, 0.5, 40), matSteelDark());
    cone.position.y = yBottom - 0.25;
    g.add(cone);
  }
  if (insul > 0) {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.06, R * 1.06, height * insul, 40), matInsulation());
    ins.position.y = yC - height * (1 - insul) / 2;
    g.add(ins);
  }
  if (packing) {
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, height * 0.6, 36), matPacking());
    bed.position.y = yC;
    g.add(bed);
  }
  g.add(flange(R, yBottom, matSteelDark()));
  g.add(flange(R, yBottom + height, matSteelDark()));
  sideNozzles.forEach((n) => {
    const angle = n.angle ?? 0;
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(n.r ?? 0.16, n.r ?? 0.16, 0.5, 18), matSteelDark());
    noz.rotation.z = Math.PI / 2; noz.rotation.y = -angle;
    noz.position.set(Math.cos(angle) * (R + 0.2), yBottom + height * n.h, Math.sin(angle) * (R + 0.2));
    g.add(noz);
  });
  manholes.forEach((m) => g.add(manhole(R, yBottom + height * m.h, m.angle ?? Math.PI / 2, matSteelDark())));
  return { group: g, yTop: yBottom + height };
}

function buildStrippingSection() {
  const { group } = makeSwagedSection({
    yBottom: 2.4, height: 2.2, R: 0.85, prevR: 0.85, insul: 0.5,
    sideNozzles: [{ h: 0.25, angle: 0, r: 0.16 }],
    manholes: [{ h: 0.7, angle: Math.PI / 2 }],
  });
  return tagGroup(group, {
    id: 'vdu-stripping',
    title: 'Sección de stripping',
    category: 'Columna',
    description: 'Sección de fondo donde el vapor de stripping arrastra los hidrocarburos volátiles del asfalto, maximizando el rendimiento de destilados al vacío.',
    specs: 'Ø 1.7 m × 2.2 m · 4 platos · Vapor 0.5–1 % w sobre carga'
  }, new THREE.Vector3(0, -0.7, 0));
}

function buildFlashSection() {
  const { group } = makeSwagedSection({
    yBottom: 4.6, height: 2.6, R: 1.4, prevR: 0.85, packing: true,
    sideNozzles: [{ h: 0.2, angle: 0, r: 0.3 }, { h: 0.7, angle: Math.PI, r: 0.16 }],
    manholes: [{ h: 0.5, angle: Math.PI * 0.35 }],
  });
  return tagGroup(group, {
    id: 'vdu-flash',
    title: 'Zona de flasheo + lavado + HVGO',
    category: 'Columna',
    description: 'Recibe la mezcla del horno por la zona de flasheo. El lecho de lavado (wash bed) retiene gotas de asfalto y protege la calidad del gasóleo pesado de vacío (HVGO), que se extrae en esta sección.',
    specs: 'Ø 2.8 m × 2.6 m · Wash bed de relleno estructurado · Plato chimenea HVGO'
  }, new THREE.Vector3(0, 0, 0));  // anchor
}

function buildLvgoSection() {
  const { group } = makeSwagedSection({
    yBottom: 7.2, height: 2.8, R: 2.0, prevR: 1.4, packing: true,
    sideNozzles: [{ h: 0.35, angle: 0, r: 0.16 }, { h: 0.7, angle: Math.PI, r: 0.14 }],
    manholes: [{ h: 0.5, angle: Math.PI / 2 }],
  });
  return tagGroup(group, {
    id: 'vdu-lvgo',
    title: 'Sección de LVGO',
    category: 'Columna',
    description: 'Sección de gran diámetro para reducir la velocidad de los vapores en vacío profundo. Aloja el lecho y el plato chimenea de extracción del gasóleo ligero de vacío (LVGO).',
    specs: 'Ø 4.0 m × 2.8 m · Relleno estructurado · LVGO pumparound'
  }, new THREE.Vector3(0, 1.6, 0));
}

function buildTopHead() {
  const g = new THREE.Group();
  const R = 2.0, yBase = 10.0;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.scale.set(1, 0.65, 1); dome.position.y = yBase;
  g.add(dome);
  const vapor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 24), matSteelDark());
  vapor.rotation.z = Math.PI / 2; vapor.position.set(R - 0.1, yBase + 0.5, 0);
  g.add(vapor);
  g.add(flange(0.55, yBase + 0.5, matSteelDark(), R + 0.2, 0));
  return tagGroup(g, {
    id: 'vdu-top-head',
    title: 'Cabezal superior (domo)',
    category: 'Columna',
    description: 'Cabeza de la torre con la salida de vapores de gran diámetro hacia el primer eyector. El diseño minimiza la caída de presión para conservar el vacío.',
    specs: 'Tapa 2:1 elíptica · Salida de vapores Ø 1.0 m'
  }, new THREE.Vector3(0, 3.2, 0));
}

function buildInternals() {
  const g = new THREE.Group();
  // wash bed grid
  const wash = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.7, 36), matPacking());
  wash.position.y = 5.4;
  g.add(wash);
  // HVGO bed
  const hvgo = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 1.0, 36), matPacking());
  hvgo.position.y = 6.6;
  g.add(hvgo);
  // LVGO bed
  const lvgo = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 1.0, 36), matPacking());
  lvgo.position.y = 8.6;
  g.add(lvgo);
  // platos chimenea (discos)
  [4.8, 6.0, 7.4].forEach((y, i) => {
    const R = i < 2 ? 1.35 : 1.92;
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.06, 36),
      new THREE.MeshStandardMaterial({ color: 0xc7a85e, metalness: 0.75, roughness: 0.35 }));
    tray.position.y = y;
    g.add(tray);
    // chimenea central
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xc7a85e, metalness: 0.75, roughness: 0.35 }));
    chim.position.y = y + 0.2;
    g.add(chim);
  });
  return tagGroup(g, {
    id: 'vdu-internals',
    title: 'Internos (lechos de relleno y platos chimenea)',
    category: 'Columna',
    description: 'Relleno estructurado del wash bed y de las secciones HVGO/LVGO, más los platos chimenea que recolectan el líquido de cada corte para su extracción y pumparound.',
    specs: 'Relleno estructurado tipo Mellapak · Platos chimenea con tubos de vapor · Mínima pérdida de carga (crítico en vacío)'
  }, new THREE.Vector3(0, 5.0, 0));
}

function buildPlatforms() {
  const g = new THREE.Group();
  g.add(ringPlatform(1.4, 4.6, matFrame()));
  g.add(ringPlatform(2.0, 7.2, matFrame()));
  g.add(ringPlatform(2.0, 9.8, matFrame()));
  const stair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10, 0.1), matFrame());
  stair.position.set(2.9, 5.5, 0); stair.rotation.z = 0.2;
  g.add(stair);
  return tagGroup(g, {
    id: 'vdu-platforms',
    title: 'Plataformas y escaleras',
    category: 'Estructura',
    description: 'Plataformas circulares de operación a la altura de manholes/boquillas y escalera de acceso a los distintos niveles de la torre.',
    specs: 'Rejilla galvanizada · Barandilla 1.0 m'
  }, new THREE.Vector3(0, 0, 0));
}

function buildChargeHeater() {
  const g = new THREE.Group();
  const x = -9.0, z = -2.0;
  const refr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 2.8), matRefractory());
  refr.position.set(x, 0.65, z);
  g.add(refr);
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.2, 2.6), matFurnace());
  box.position.set(x, 3.0, z);
  g.add(box);
  for (const dx of [-0.9, 0, 0.9]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 14), matSteelDark());
    b.rotation.x = Math.PI / 2; b.position.set(x + dx, 1.1, z + 1.35);
    g.add(b);
  }
  const breech = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 1.0, 0.7, 24), matSteelDark());
  breech.position.set(x, 5.45, z);
  g.add(breech);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.6, 24), matSteelDark());
  stack.position.set(x, 8.05, z);
  g.add(stack);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.06, 8, 24), matSteel());
  cap.rotation.x = Math.PI / 2; cap.position.set(x, 10.35, z);
  g.add(cap);
  return tagGroup(g, {
    id: 'vdu-heater',
    title: 'Horno de carga',
    category: 'Equipo principal',
    description: 'Calienta el crudo reducido (topped crude) hasta 400–455 °C con inyección de vapor en los pasos para reducir la presión parcial de hidrocarburos y minimizar el coquizado de los tubos.',
    specs: 'Carga térmica ~60 MW · T salida 750–850 °F · Tubos verticales'
  }, new THREE.Vector3(-5, 0, 0));
}

function buildEjectorSystem() {
  const g = new THREE.Group();
  const baseY = 5.0, ez = -4.5;
  // estructura
  for (const dz of [-1.0, 1.0]) for (const dx of [-3.0, -0.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, baseY + 1, 0.14), matFrame());
    post.position.set(-2.0 + dx + 1.0, (baseY + 1) / 2, ez + dz);
    g.add(post);
  }
  const plat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.6), matFrame());
  plat.position.set(-2.0, baseY, ez);
  g.add(plat);
  // tres eyectores
  [-3.2, -2.0, -0.8].forEach((ex) => {
    const conv = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.1, 0.5, 18), matSteel());
    conv.position.set(ex, baseY + 0.35, ez);
    g.add(conv);
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16), matSteel());
    throat.position.set(ex, baseY + 0.75, ez);
    g.add(throat);
    const div = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 0.8, 18), matSteelDark());
    div.position.set(ex, baseY + 1.25, ez);
    g.add(div);
    const motive = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 12), matSteam());
    motive.rotation.z = Math.PI / 2;
    motive.position.set(ex - 0.4, baseY + 0.35, ez);
    g.add(motive);
  });
  // colector de vapor motor
  const header = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.0, 14), matSteam());
  header.rotation.z = Math.PI / 2;
  header.position.set(-2.0, baseY + 2.4, ez);
  g.add(header);
  return tagGroup(g, {
    id: 'vdu-ejectors',
    title: 'Eyectores de vapor',
    category: 'Equipo principal',
    description: 'Tren de eyectores de vapor de tres etapas que genera el vacío profundo de la torre. Cada eyector acelera el vapor motor en una tobera convergente-divergente para arrastrar y comprimir los gases no condensables.',
    specs: 'Tres etapas en serie · Vapor motor 12 bar · Relación de compresión ~6:1 por etapa'
  }, new THREE.Vector3(-3, 2.5, -3.5));
}

function buildIntercondensers() {
  const g = new THREE.Group();
  const ez = -4.5, y = 3.6;
  [-3.2, -2.0, -0.8].forEach((ex, i) => {
    const cond = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 24), matSteel());
    cond.rotation.z = Math.PI / 2;
    cond.position.set(ex, y, ez);
    g.add(cond);
    [-0.65, 0.65].forEach((ox) => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
      cap.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
      cap.position.set(ex + ox, y, ez);
      g.add(cap);
    });
    // CW nozzles
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), matCW());
    cw.position.set(ex, y + 0.45, ez + 0.3);
    g.add(cw);
  });
  return tagGroup(g, {
    id: 'vdu-intercondensers',
    title: 'Intercondensadores (CW)',
    category: 'Intercambio de calor',
    description: 'Intercambiadores de superficie refrigerados con agua (CW) que condensan el vapor motor y los hidrocarburos arrastrados entre etapas de eyectores, descargando el condensado al sump por piernas barométricas.',
    specs: 'Servicio agua de refrigeración (CW) · Conexión barométrica al sump'
  }, new THREE.Vector3(-3, 1.0, -3.5));
}

function buildSump() {
  const g = new THREE.Group();
  const x = -2.0, z = -6.5, y = 0.9;
  [-0.95, 0.95].forEach((ox) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.7), matFrame());
    sad.position.set(x + ox, 0.55, z);
    g.add(sad);
  });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.8, 28), matSteel());
  drum.rotation.z = Math.PI / 2; drum.position.set(x, y, z);
  g.add(drum);
  [-1.4, 1.4].forEach((ox) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
    cap.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    cap.position.set(x + ox, y, z);
    g.add(cap);
  });
  return tagGroup(g, {
    id: 'vdu-sump',
    title: 'Sump (recolector)',
    category: 'Equipo principal',
    description: 'Recipiente horizontal que recoge el condensado de los intercondensadores por las piernas barométricas, separando el aceite recuperado del agua aceitosa que se envía a tratamiento de efluentes.',
    specs: 'Tres fases (gas/HC/agua) · Skimmer y rebosadero internos'
  }, new THREE.Vector3(-3, -1, -4));
}

function buildPumparoundCoolers() {
  const g = new THREE.Group();
  [[4.5, 4.0, 'LVGO'], [4.5, 2.0, 'HVGO']].forEach(([x, z]) => {
    const cooler = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 24), matSteel());
    cooler.rotation.z = Math.PI / 2; cooler.position.set(x, 1.8, z);
    g.add(cooler);
    [-0.85, 0.85].forEach((ox) => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
      cap.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
      cap.position.set(x + ox, 1.8, z);
      g.add(cap);
    });
    [-0.5, 0.5].forEach((ox) => {
      const sad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.5), matFrame());
      sad.position.set(x + ox, 1.35, z);
      g.add(sad);
    });
  });
  return tagGroup(g, {
    id: 'vdu-pa-coolers',
    title: 'Enfriadores de pumparound',
    category: 'Intercambio de calor',
    description: 'Intercambiadores carcasa-tubos que enfrían los pumparounds de LVGO y HVGO antes de retornarlos a la torre, recuperando el calor para precalentar la carga o generar vapor.',
    specs: 'Carcasa-tubos · Servicio HC / agua o carga'
  }, new THREE.Vector3(4, 0, 3));
}

function buildPumparoundPumps() {
  const g = new THREE.Group();
  [[4.5, 5.5], [6.0, 5.5], [7.5, 5.5]].forEach(([x, z]) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), matConcrete());
    ped.position.set(x, 0.55, z);
    g.add(ped);
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 18), matSteel());
    pump.rotation.z = Math.PI / 2; pump.position.set(x - 0.3, 0.82, z);
    g.add(pump);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.58, 18), matMotor());
    motor.rotation.z = Math.PI / 2; motor.position.set(x + 0.25, 0.82, z);
    g.add(motor);
  });
  return tagGroup(g, {
    id: 'vdu-pa-pumps',
    title: 'Bombas de pumparound y producto',
    category: 'Bombeo',
    description: 'Bombas centrífugas que recirculan los pumparounds de LVGO/HVGO y extraen los productos hacia los enfriadores y tanques.',
    specs: 'Bombas API 610 · Sello mecánico doble · Servicio HC caliente'
  }, new THREE.Vector3(4, -1, 4));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();
  const segs = [
    // transferencia horno → torre
    pipeSegment([-9.0, 5.2, -2.0], [-9.0, 6.0, -2.0], m, 0.26),
    pipeSegment([-9.0, 6.0, -2.0], [-9.0, 6.0, 0], m, 0.26),
    pipeSegment([-9.0, 6.0, 0], [-1.4, 6.0, 0], m, 0.26),
    // vapores de cabeza → eyectores
    pipeSegment([1.9, 10.5, 0], [1.9, 10.5, -4.5], m, 0.34),
    pipeSegment([1.9, 10.5, -4.5], [-0.8, 10.5, -4.5], m, 0.34),
    pipeSegment([-0.8, 10.5, -4.5], [-0.8, 6.3, -4.5], m, 0.34),
    // asfalto
    pipeSegment([0, 1.4, 0], [0, 0.5, 0], matAsphalt(), 0.13),
    pipeSegment([0, 0.5, 0], [9.0, 0.5, 0], matAsphalt(), 0.13),
    // piernas barométricas
    pipeSegment([-3.2, 3.0, -4.5], [-3.2, 1.5, -6.5], matPipe(), 0.07),
    pipeSegment([-2.0, 3.0, -4.5], [-2.0, 1.4, -6.5], matPipe(), 0.07),
    pipeSegment([-0.8, 3.0, -4.5], [-0.8, 1.5, -6.5], matPipe(), 0.07),
  ];
  segs.forEach((p) => p && g.add(p));
  return tagGroup(g, {
    id: 'vdu-piping',
    title: 'Tubería de proceso',
    category: 'Tubería',
    description: 'Líneas que conectan los equipos: transferencia horno-torre, vapores de cabeza a los eyectores, productos LVGO/HVGO, asfalto de fondo y piernas barométricas hacia el sump.',
    specs: 'Aislamiento térmico en líneas calientes · Líneas de cabeza de gran diámetro'
  });
}

export function buildVacuumDistillation() {
  const root = new THREE.Group();
  root.name = 'VacuumDistillation';
  root.add(buildSkid());
  root.add(buildChargeHeater());
  root.add(buildColumnSkirt());
  root.add(buildBottomHead());
  root.add(buildStrippingSection());
  root.add(buildFlashSection());
  root.add(buildLvgoSection());
  root.add(buildTopHead());
  root.add(buildInternals());
  root.add(buildPlatforms());
  root.add(buildEjectorSystem());
  root.add(buildIntercondensers());
  root.add(buildSump());
  root.add(buildPumparoundCoolers());
  root.add(buildPumparoundPumps());
  root.add(buildPiping());
  return root;
}
