import * as THREE from 'three';

// ============================================================================
// Unidad de Reformado Catalítico Continuo (CCR Platforming)
// ----------------------------------------------------------------------------
// Convierte nafta pesada de bajo octanaje en reformado de alto octanaje (rico
// en aromáticos) y produce hidrógeno como subproducto. Reactores apilados de
// lecho móvil, hornos intermedios (la reacción es endotérmica), regenerador
// continuo de catalizador, intercambiador carga/efluente, separador,
// compresor de reciclo y estabilizador.
// ============================================================================

const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xc6cad1, metalness: 0.9,  roughness: 0.28 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8,  roughness: 0.42 });
const matSteelWarm  = () => new THREE.MeshStandardMaterial({ color: 0xb7b2a6, metalness: 0.6,  roughness: 0.5 });
const matInsulation = () => new THREE.MeshStandardMaterial({ color: 0xe7e2d6, metalness: 0.05, roughness: 0.85 });
const matFurnace    = () => new THREE.MeshStandardMaterial({ color: 0x9ba1a9, metalness: 0.55, roughness: 0.5 });
const matCatalyst   = () => new THREE.MeshStandardMaterial({ color: 0xc7903b, metalness: 0.6,  roughness: 0.5 });
const matH2         = () => new THREE.MeshStandardMaterial({ color: 0x7e57c2, metalness: 0.5,  roughness: 0.45 });
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

function buildSkid() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 14), matConcrete());
  pad.position.y = 0.2; g.add(pad);
  return tagGroup(g, { id: 'ref-skid', title: 'Cimentación y estructura', category: 'Estructura',
    description: 'Losa y estructura metálica que soportan la torre de reactores apilados, los hornos y los equipos auxiliares.', specs: 'Hormigón H-35 · 22 × 14 m' });
}

function buildStackedReactors() {
  const g = new THREE.Group();
  const cx = 3, cz = 0, baseY = 1.0;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 1.4, 36), matSteelWarm());
  skirt.position.set(cx, baseY + 0.7, cz); g.add(skirt);
  let y = baseY + 1.4;
  const R = 1.0, H = 2.2;
  for (let i = 1; i <= 4; i++) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 36), matSteel());
    shell.position.set(cx, y + H / 2, cz); g.add(shell);
    // lecho de catalizador visible (anillo interior)
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, H * 0.7, 28), matCatalyst());
    bed.position.set(cx, y + H / 2, cz); g.add(bed);
    g.add(flange(R, y, matSteelDark(), cx, cz));
    if (i < 4) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R, 0.5, 36), matSteelDark());
      cone.position.set(cx, y + H + 0.25, cz); g.add(cone);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.4, 24), matSteelDark());
      neck.position.set(cx, y + H + 0.7, cz); g.add(neck);
      const cone2 = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.5, 0.5, 36), matSteelDark());
      cone2.position.set(cx, y + H + 1.15, cz); g.add(cone2);
      y += H + 1.4;
    } else { y += H; }
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.position.set(cx, y, cz); g.add(dome);
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.5, 16), matCatalyst());
  hopper.position.set(cx, y + 0.7, cz); g.add(hopper);
  return tagGroup(g, {
    id: 'ref-reactors', title: 'Torre de reactores apilados (R1-R4)', category: 'Equipo principal',
    description: 'Cuatro reactores de lecho móvil de flujo radial apilados verticalmente. La nafta atraviesa los cuatro en serie mientras el catalizador desciende lentamente por gravedad. Las reacciones (deshidrogenación, isomerización, deshidrociclación) son fuertemente endotérmicas: por eso entre reactor y reactor hay que recalentar el fluido en un horno.',
    specs: 'Ø 2.0 m · 4 etapas · Catalizador Pt-Sn/Al2O3 · T 510-525 °C · Lecho móvil'
  }, new THREE.Vector3(0, 0, 0));  // ancla
}

function buildFiredHeaters() {
  const g = new THREE.Group();
  const z = -4.0;
  for (let i = 0; i < 4; i++) {
    const x = -5 + i * 1.9;
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.0, 1.5), matFurnace());
    box.position.set(x, 1.9, z); g.add(box);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.0, 18), matSteelDark());
    stack.position.set(x, 4.9, z); g.add(stack);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 20), matSteel());
    cap.rotation.x = Math.PI / 2; cap.position.set(x, 6.4, z); g.add(cap);
  }
  return tagGroup(g, {
    id: 'ref-heaters', title: 'Tren de hornos intermedios (H1-H4)', category: 'Equipo principal',
    description: 'Un horno por reactor. Recalientan el fluido entre etapas para reponer el calor que consume la reacción endotérmica y mantener la temperatura (~520 °C) en cada reactor. Es una característica distintiva del reformado: hornos repartidos en serie.',
    specs: '4 celdas · Combustible fuel gas · T salida ~520 °C'
  }, new THREE.Vector3(-3, 0, -3));
}

function buildRegenerator() {
  const g = new THREE.Group();
  const x = -0.5, z = 3.5, baseY = 1.0, R = 0.75;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.0, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.5, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 7.0, 32), matSteel());
  shell.position.set(x, baseY + 0.5 + 3.5, z); g.add(shell);
  for (let i = 1; i <= 3; i++) g.add(flange(R, baseY + 0.5 + i * 1.75, matSteelDark(), x, z));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.position.set(x, baseY + 0.5 + 7.0, z); g.add(dome);
  const inH = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.5, 16), matCatalyst());
  inH.position.set(x, baseY + 0.5 + 7.6, z); g.add(inH);
  return tagGroup(g, {
    id: 'ref-regenerator', title: 'Regenerador CCR', category: 'Equipo principal',
    description: 'Columna de regeneración continua del catalizador. El catalizador agotado (con coque) entra por arriba y desciende por zonas de combustión del coque, oxiclorinación (recupera la función ácida) y secado, saliendo limpio por abajo. Mantiene la actividad del catalizador constante en el tiempo.',
    specs: 'Ø 1.5 m × 7 m · 4 zonas · Combustión + oxiclorinación + secado'
  }, new THREE.Vector3(-2, 0, 3));
}

function buildCatalystLines() {
  const g = new THREE.Group();
  // elevación de catalizador agotado: base reactores -> tope regenerador
  addPipes(g, [[3, 1.4, 0], [3, 11.0, 0], [-0.5, 11.0, 3.5], [-0.5, 9.6, 3.5]], matCatalyst(), 0.09);
  // catalizador regenerado: base regenerador -> tope reactores
  addPipes(g, [[-0.5, 1.3, 3.5], [-0.5, 12.0, 3.5], [3, 12.0, 0], [3, 11.5, 0]], matCatalyst(), 0.09);
  return tagGroup(g, {
    id: 'ref-catalyst-lines', title: 'Líneas de transporte de catalizador', category: 'Tubería',
    description: 'Conductos de elevación neumática que cierran el lazo de catalizador: llevan el catalizador agotado de la base de los reactores a la cabeza del regenerador, y el regenerado de vuelta a la cabeza de los reactores. Usan gas (N2 o H2) como portador.',
    specs: 'Transporte neumático en fase diluida · Lazo continuo'
  }, new THREE.Vector3(0, 2, 1.5));
}

function buildCFE() {
  const g = new THREE.Group();
  const x = 0.5, z = -0.5;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5.0, 32), matSteel());
  shell.position.set(x, 1.0 + 2.5, z); g.add(shell);
  [-2.5, 2.5].forEach((dy) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
    c.rotation.x = dy > 0 ? 0 : Math.PI; c.position.set(x, 1.0 + 2.5 + dy, z); g.add(c);
  });
  return tagGroup(g, {
    id: 'ref-cfe', title: 'Intercambiador carga/efluente (CFE)', category: 'Intercambio de calor',
    description: 'Intercambiador de placas (tipo Packinox) que precalienta la carga con el efluente caliente del último reactor. Recupera gran parte del calor y reduce drásticamente la carga de los hornos.',
    specs: 'Placas soldadas · ΔT global ~60 °C · Servicio carga/reformado'
  }, new THREE.Vector3(1, 1.5, -2));
}

function buildSeparator() {
  const g = new THREE.Group();
  const x = -3.5, z = 0;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.0, 28), matSteel());
  drum.rotation.z = Math.PI / 2; drum.position.set(x, 1.6, z); g.add(drum);
  [-1.5, 1.5].forEach((ox) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteelDark());
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2; c.position.set(x + ox, 1.6, z); g.add(c);
  });
  [-1.0, 1.0].forEach((ox) => { const sad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.9), matFrame()); sad.position.set(x + ox, 0.75, z); g.add(sad); });
  return tagGroup(g, {
    id: 'ref-separator', title: 'Separador de hidrógeno', category: 'Equipo principal',
    description: 'Separa el gas rico en hidrógeno del reformado líquido tras enfriar el efluente. El hidrógeno producido se recircula y el excedente (gran cantidad) se exporta a las unidades de hidrotratamiento e hidrocraqueo.',
    specs: 'Ø 1.4 m × 3 m · P ~15 bar · Producto: H2 de alta pureza'
  }, new THREE.Vector3(-2, 0.5, 0));
}

function buildRecycleCompressor() {
  const g = new THREE.Group();
  const x = -3.5, z = 3.5;
  const ped = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 1.2), matConcrete());
  ped.position.set(x, 0.5, z); g.add(ped);
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 24), matSteel());
  casing.rotation.z = Math.PI / 2; casing.position.set(x - 0.6, 1.1, z); g.add(casing);
  const driver = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20), matMotor());
  driver.rotation.z = Math.PI / 2; driver.position.set(x + 0.7, 1.1, z); g.add(driver);
  return tagGroup(g, {
    id: 'ref-compressor', title: 'Compresor de gas de reciclo', category: 'Bombeo',
    description: 'Comprime el gas rico en hidrógeno y lo recircula a la entrada del primer reactor. Mantener una alta presión parcial de H2 inhibe la formación de coque sobre el catalizador.',
    specs: 'Centrífugo · Relación H2/HC controlada · Accionado por turbina/motor'
  }, new THREE.Vector3(-2, -1, 3));
}

function buildStabilizer() {
  const g = new THREE.Group();
  const x = 7, z = 0, baseY = 1.0, R = 0.7;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 0.9, 24), matSteelWarm());
  skirt.position.set(x, baseY + 0.45, z); g.add(skirt);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 7.0, 32), matSteel());
  shell.position.set(x, baseY + 0.9 + 3.5, z); g.add(shell);
  for (let i = 0; i < 4; i++) g.add(flange(R, baseY + 1.8 + i * 1.5, matSteelDark(), x, z));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  dome.position.set(x, baseY + 0.9 + 7.0, z); g.add(dome);
  const reb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 20), matSteel());
  reb.rotation.z = Math.PI / 2; reb.position.set(x + 1.2, 1.4, z); g.add(reb);
  return tagGroup(g, {
    id: 'ref-stabilizer', title: 'Estabilizador', category: 'Columna',
    description: 'Columna de destilación que retira los hidrocarburos ligeros (C1-C4) del reformado líquido para ajustar su presión de vapor. El producto de fondo es el reformado de alto octanaje listo para mezcla en gasolina.',
    specs: 'Ø 1.4 m × 7 m · 35 platos · Producto: reformado RON 95-102'
  }, new THREE.Vector3(3, 0, 0));
}

function buildPiping() {
  const g = new THREE.Group();
  const m = matPipe();
  // efluente reactores -> CFE
  addPipes(g, [[3, 1.4, 0], [3, 6.5, 0], [0.5, 6.5, -0.5], [0.5, 5.5, -0.5]], matHot(), 0.12);
  // CFE -> hornos
  addPipes(g, [[0.5, 0.5, -0.5], [0.5, 0.7, -4], [-3.1, 0.7, -4]], m, 0.1);
  // hornos -> reactores (cada salida)
  for (let i = 0; i < 4; i++) { const x = -5 + i * 1.9; addPipes(g, [[x, 3.4, -4], [x, 7.5 + i, -2], [3, 7.5 + i, 0]], matHot(), 0.08); }
  // H2 de reciclo: separador -> compresor -> hornos
  addPipes(g, [[-3.5, 3.1, 0], [-3.5, 3.1, 3.5], [-4.2, 1.1, 3.5]], matH2(), 0.08);
  addPipes(g, [[-2.8, 1.1, 3.5], [-2.8, 0.7, -4]], matH2(), 0.08);
  return tagGroup(g, {
    id: 'ref-piping', title: 'Tubería de proceso', category: 'Tubería',
    description: 'Líneas que conectan reactores, hornos, intercambiador, separador y estabilizador, incluyendo el lazo de gas de reciclo de hidrógeno (en color distinto).',
    specs: 'Aislamiento en líneas calientes · Lazo de H2 de reciclo'
  });
}

export function buildCatalyticReforming() {
  const root = new THREE.Group();
  root.name = 'CatalyticReforming';
  root.add(buildSkid());
  root.add(buildStackedReactors());
  root.add(buildFiredHeaters());
  root.add(buildRegenerator());
  root.add(buildCatalystLines());
  root.add(buildCFE());
  root.add(buildSeparator());
  root.add(buildRecycleCompressor());
  root.add(buildStabilizer());
  root.add(buildPiping());
  return root;
}
