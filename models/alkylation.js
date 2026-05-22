import * as THREE from 'three';

// ============================================================================
// Unidad de Alquilación con Ácido Sulfúrico (tipo Stratco)
// ----------------------------------------------------------------------------
// Combina isobutano con olefinas ligeras (propileno/butilenos) en presencia de
// H2SO4 como catalizador para producir alquilato: gasolina de alto octanaje,
// sin azufre, sin aromáticos ni olefinas. La reacción es muy exotérmica y se
// opera en frío (4-10 °C) mediante un ciclo de autorefrigeración.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.42 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matAcidShell  = () => new THREE.MeshStandardMaterial({ color: 0xcdbb6a, metalness: 0.7,  roughness: 0.4 });
const matAcid       = () => new THREE.MeshStandardMaterial({ color: 0xd4a72c, metalness: 0.4,  roughness: 0.5 });
const matCaustic    = () => new THREE.MeshStandardMaterial({ color: 0x6aa9c7, metalness: 0.4,  roughness: 0.5 });
const matRefrig     = () => new THREE.MeshStandardMaterial({ color: 0x4a8fd1, metalness: 0.5,  roughness: 0.45 });
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
function hVessel(g, x, y, z, R, L, shell, head, saddleH = 0.8) {
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 32), shell);
  drum.rotation.z = Math.PI / 2; drum.position.set(x, y, z); g.add(drum);
  [-L / 2, L / 2].forEach((ox) => { const c = new THREE.Mesh(new THREE.SphereGeometry(R, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), head); c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2; c.position.set(x + ox, y, z); g.add(c); });
  [-L / 3, L / 3].forEach((ox) => { const sad = new THREE.Mesh(new THREE.BoxGeometry(0.2, saddleH, R * 1.5), matFrame()); sad.position.set(x + ox, y - R - saddleH / 2, z); g.add(sad); });
  return drum;
}
function column(g, x, z, R, H, baseY, mat) {
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 0.9, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.45, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32), mat);
  shell.position.set(x, baseY + 0.9 + H / 2, z); g.add(shell);
  const n = Math.floor(H / 1.5);
  for (let i = 0; i < n; i++) g.add(flange(R, baseY + 1.8 + i * 1.5, matSteelDark(), x, z));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.set(x, baseY + 0.9 + H, z); g.add(dome);
}

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 16), matConcrete());
  pad.position.y = 0.2; g.add(pad);
  return tagGroup(g, { id: 'alk-skid', title: 'Cimentación y plataforma', category: 'Estructura',
    description: 'Losa con recubrimiento antiácido y estructura metálica que soportan el reactor, el decantador, las columnas y el tren de refrigeración.', specs: 'Hormigón H-40 · 24 × 16 m · Recubrimiento epoxi antiácido' });
}

function buildContactor() {
  const g = new THREE.Group();
  const x = -1, y = 2.4, z = 0;
  hVessel(g, x, y, z, 1.0, 5.0, matAcidShell(), matSteelDark());
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 16), matMotor());
  motor.position.set(x, y + 1.3, z); g.add(motor);
  const cIn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 14), matRefrig());
  cIn.rotation.z = Math.PI / 2; cIn.position.set(x - 2.6, y + 0.4, z); g.add(cIn);
  return tagGroup(g, {
    id: 'alk-contactor', title: 'Reactor / Contactor', category: 'Equipo principal',
    description: 'Reactor horizontal donde se emulsionan intensamente las olefinas, el isobutano y el ácido sulfúrico mediante un impulsor interno. Un haz tubular interno vaporiza refrigerante para retirar el calor de reacción y mantener 4-10 °C.',
    specs: 'Ø 2.0 m × 5 m · T 4-10 °C · Reacción exotérmica · Emulsión ácido/HC'
  }, new THREE.Vector3(0, 0, 0));  // ancla
}

function buildSettler() {
  const g = new THREE.Group();
  hVessel(g, 4.5, 2.4, 0, 1.1, 5.5, matAcidShell(), matSteelDark());
  return tagGroup(g, {
    id: 'alk-settler', title: 'Decantador de ácido', category: 'Equipo principal',
    description: 'Recipiente donde la emulsión se separa por gravedad en fase ácida (abajo, retorna al contactor) y fase hidrocarburo (arriba, sigue al tratamiento y fraccionamiento). El tiempo de residencia debe ser suficiente para una buena separación.',
    specs: 'Ø 2.2 m × 5.5 m · Tiempo de residencia ~30 min'
  }, new THREE.Vector3(2.5, 0, 0));
}

function buildRefrigeration() {
  const g = new THREE.Group();
  // compresor
  const x = -8, z = -3.5;
  const ped = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 1.4), matConcrete()); ped.position.set(x, 0.5, z); g.add(ped);
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 24), matSteel());
  casing.rotation.z = Math.PI / 2; casing.position.set(x - 0.7, 1.2, z); g.add(casing);
  const driver = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 20), matMotor());
  driver.rotation.z = Math.PI / 2; driver.position.set(x + 0.8, 1.2, z); g.add(driver);
  // acumulador
  hVessel(g, -4.5, 4.2, -3.5, 0.8, 3.5, matSteel(), matSteelDark(), 1.0);
  // condensador air-cooler
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.4), matSteelDark());
  cooler.position.set(-5.5, 6.2, -3.5); g.add(cooler);
  [-0.7, 0.7].forEach((dx) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 14), matSteel()); f.position.set(-5.5 + dx, 6.4, -3.5); g.add(f); });
  // succión y retorno
  addPipes(g, [[-1, 3.8, 0], [-1, 3.8, -3.5], [-8, 3.8, -3.5], [-8, 1.9, -3.5]], matRefrig(), 0.16);
  addPipes(g, [[-2.5, 4.2, -3.5], [-2.5, 3.0, 0], [-1, 3.0, 0]], matRefrig(), 0.1);
  return tagGroup(g, {
    id: 'alk-refrigeration', title: 'Ciclo de refrigeración', category: 'Equipo principal',
    description: 'Sistema de autorefrigeración: el refrigerante (isobutano/propano) se vaporiza dentro del contactor absorbiendo el calor de reacción, el compresor lo comprime, el condensador lo licúa y el acumulador lo devuelve al reactor. Es lo que mantiene la baja temperatura necesaria para la selectividad.',
    specs: 'Compresor centrífugo · Condensador air-cooler · Refrigerante iC4/C3'
  }, new THREE.Vector3(-3, 1.5, -3));
}

function buildTreating() {
  const g = new THREE.Group();
  const x = 6.5, z = -3.0;
  const d1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 24), matCaustic());
  d1.position.set(x, 1.6, z); g.add(d1);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
  c1.position.set(x, 2.8, z); g.add(c1);
  const d2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 24), matSteel());
  d2.position.set(x + 1.3, 1.6, z); g.add(d2);
  const c2 = c1.clone(); c2.position.set(x + 1.3, 2.8, z); g.add(c2);
  return tagGroup(g, {
    id: 'alk-treating', title: 'Lavado cáustico y de agua', category: 'Equipo principal',
    description: 'Drums donde el hidrocarburo del decantador se lava con sosa cáustica (NaOH) y luego con agua para neutralizar restos de ácido y ésteres antes del fraccionamiento, evitando corrosión y problemas de producto.',
    specs: 'NaOH 10-15 % w · Lavado de agua dulce posterior'
  }, new THREE.Vector3(2.5, 0, -3));
}

function buildDIB() {
  const g = new THREE.Group();
  column(g, -1, 5.5, 1.1, 10.5, 1.0, matSteel());
  const reb = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 20), matSteel());
  reb.rotation.z = Math.PI / 2; reb.position.set(0.8, 1.6, 5.5); g.add(reb);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.0, 24), matSteel());
  drum.rotation.z = Math.PI / 2; drum.position.set(1.0, 12.6, 5.5); g.add(drum);
  return tagGroup(g, {
    id: 'alk-dib', title: 'Desisobutanizador (DIB)', category: 'Columna',
    description: 'Columna principal de fraccionamiento. Separa el isobutano por la cabeza (se recicla al reactor para mantener una alta relación isobutano/olefina), el n-butano por extracción lateral y el alquilato (gasolina) por el fondo como producto principal.',
    specs: 'Ø 2.2 m × 10.5 m · 60 platos · Reflujo elevado para recuperar iC4'
  }, new THREE.Vector3(0, 0, 3.5));
}

function buildDepropanizer() {
  const g = new THREE.Group();
  column(g, 4.5, 5.5, 0.65, 6.5, 1.0, matSteel());
  return tagGroup(g, {
    id: 'alk-depropanizer', title: 'Despropanizador', category: 'Columna',
    description: 'Columna auxiliar que retira el propano del lazo de isobutano/refrigerante para evitar su acumulación. El propano se exporta como GLP.',
    specs: 'Ø 1.3 m × 6.5 m · Producto: propano GLP por cabeza'
  }, new THREE.Vector3(3, 0, 3));
}

function buildAcidStorage() {
  const g = new THREE.Group();
  const x = 9.5, z = 2.5;
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 3.5, 32), matAcidShell());
  t1.position.set(x, 1.95, z); g.add(t1);
  const cap1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matAcidShell());
  cap1.position.set(x, 3.7, z); g.add(cap1);
  const t2 = t1.clone(); t2.material = matSteelDark(); t2.position.set(x, 1.95, z - 2.5); g.add(t2);
  const cap2 = cap1.clone(); cap2.material = matSteelDark(); cap2.position.set(x, 3.7, z - 2.5); g.add(cap2);
  addPipes(g, [[x, 1.0, z], [4.5, 2.4, 0]], matAcid(), 0.06);
  return tagGroup(g, {
    id: 'alk-acid-storage', title: 'Tanques de ácido (fresco y gastado)', category: 'Equipo principal',
    description: 'Almacenan el H2SO4 fresco (98 %) que se dosifica al contactor y el ácido gastado (se diluye por agua y polímeros) que se envía a una planta de regeneración. Mantener la concentración del ácido por encima de ~88 % es crítico para la reacción.',
    specs: 'Ácido fresco 98 % · Ácido gastado 88-92 % · Acero al carbono'
  }, new THREE.Vector3(3, 0, 2));
}

function buildFeedTreatment() {
  const g = new THREE.Group();
  const x = -8, z = 4.5;
  const coal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.2, 24), matSteel());
  coal.position.set(x, 2.0, z); g.add(coal);
  const capC = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
  capC.position.set(x, 3.6, z); g.add(capC);
  const dr = coal.clone(); dr.position.set(x + 1.4, 2.0, z); g.add(dr);
  const capD = capC.clone(); capD.position.set(x + 1.4, 3.6, z); g.add(capD);
  return tagGroup(g, {
    id: 'alk-feed-treat', title: 'Coalescedor y secador de carga', category: 'Equipo principal',
    description: 'Eliminan el agua de la carga antes del reactor. El agua diluye el ácido (su mayor enemigo) y dispara la corrosión, por lo que se retira con un coalescedor y un secador de tamiz molecular.',
    specs: 'Coalescedor + tamiz molecular 3A · Salida < 10 ppm H2O'
  }, new THREE.Vector3(-3, 0, 3));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();
  // recirculación de ácido decantador -> contactor
  addPipes(g, [[3.0, 2.0, 0], [1.5, 2.0, 0]], matAcid(), 0.12);
  // hidrocarburo settler -> tratamiento
  addPipes(g, [[7.0, 3.2, 0], [7.0, 2.8, -3], [6.5, 2.8, -3]], m, 0.1);
  // tratamiento -> DIB
  addPipes(g, [[7.8, 2.8, -3], [7.8, 2.8, 5.5], [0.1, 4.5, 5.5]], m, 0.1);
  // reciclo isobutano DIB -> carga
  addPipes(g, [[1.0, 12.8, 5.5], [-8, 12.8, 5.5], [-8, 1.0, 5.5]], matRefrig(), 0.09);
  // alquilato producto (fondo DIB)
  addPipes(g, [[-1, 1.7, 5.5], [-1, 0.6, 5.5], [-11, 0.6, 5.5]], m, 0.1);
  return tagGroup(g, {
    id: 'alk-piping', title: 'Tubería de proceso', category: 'Tubería',
    description: 'Líneas que conectan los equipos: carga olefina+isobutano, recirculación de ácido, hidrocarburo al tratamiento, alimentación al DIB, reciclo de isobutano y producto alquilato.',
    specs: 'Materiales según servicio · Líneas de ácido en acero al carbono'
  });
}

export function buildAlkylation() {
  const root = new THREE.Group();
  root.name = 'Alkylation';
  root.add(buildSkid());
  root.add(buildContactor());
  root.add(buildSettler());
  root.add(buildRefrigeration());
  root.add(buildTreating());
  root.add(buildDIB());
  root.add(buildDepropanizer());
  root.add(buildAcidStorage());
  root.add(buildFeedTreatment());
  root.add(buildPiping());
  return root;
}
