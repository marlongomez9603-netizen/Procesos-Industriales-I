import * as THREE from 'three';

// Materials
const matSteel      = () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.7, roughness: 0.35 });
const matSteelDark  = () => new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.6, roughness: 0.5 });
const matHeavyWall  = () => new THREE.MeshStandardMaterial({ color: 0x707680, metalness: 0.65, roughness: 0.45 });
const matFurnace    = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.5, roughness: 0.6 });
const matCatalyst   = () => new THREE.MeshStandardMaterial({ color: 0x444a55, metalness: 0.2, roughness: 0.85 });
const matHot        = () => new THREE.MeshStandardMaterial({ color: 0xc94a3b, metalness: 0.4, roughness: 0.5 });
const matCold       = () => new THREE.MeshStandardMaterial({ color: 0x4a7fc9, metalness: 0.4, roughness: 0.5 });
const matH2         = () => new THREE.MeshStandardMaterial({ color: 0x7e57c2, metalness: 0.4, roughness: 0.5 });
const matFrame      = () => new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.6, roughness: 0.55 });
const matConcrete   = () => new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.05, roughness: 0.95 });
const matMotor      = () => new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.4, roughness: 0.6 });

function tagPart(mesh, data) {
  mesh.userData = { ...data };
  return mesh;
}

function pipeSegment(a, b, mat, radius = 0.1) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 16), mat);
  pipe.position.copy(mid);
  pipe.lookAt(vb);
  pipe.rotateX(Math.PI / 2);
  return pipe;
}

function makeBase() {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 16), matConcrete());
  pad.position.y = 0.2;
  g.add(tagPart(pad, {
    id: 'foundation',
    title: 'Cimentación de hormigón',
    category: 'Estructura',
    description: 'Losa de hormigón armado dimensionada para soportar las elevadas cargas estáticas de los reactores de alta presión y los compresores de hidrógeno.',
    specs: 'Hormigón H-40 · 28 × 16 m · Espesor 0.5 m'
  }));

  // Pipe rack
  for (let x = -12; x <= 12; x += 4) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6, 0.25), matFrame());
    post.position.set(x, 3.2, -7);
    g.add(post);
    const p2 = post.clone();
    p2.position.z = 7;
    g.add(p2);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(26, 0.2, 0.2), matFrame());
  rail.position.set(0, 6.0, -7);
  g.add(rail);
  const rail2 = rail.clone();
  rail2.position.z = 7;
  g.add(rail2);

  return g;
}

function makeHydrotreater() {
  // First-stage hydrotreating reactor (heavy-wall vertical reactor)
  const g = new THREE.Group();
  const x = -2.5, baseY = 1.4, R = 1.1;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.2, 32), matSteelDark());
  skirt.position.set(x, baseY - 0.6, 0);
  g.add(tagPart(skirt, {
    id: 'r1-skirt',
    title: 'Faldón del reactor R-1',
    category: 'Estructura',
    description: 'Soporte cilíndrico anclado al cimiento que sustenta el reactor de hidrotratamiento y desacopla las dilataciones térmicas.',
    specs: 'Acero al carbono · Ø 2.4 m · Altura 1.2 m'
  }));

  // Reactor shell — heavy-wall for high pressure service
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 9.5, 32), matHeavyWall());
  shell.position.set(x, baseY + 4.75, 0);
  g.add(tagPart(shell, {
    id: 'r1-hydrotreater',
    title: 'Reactor R-1 (hidrotratamiento)',
    category: 'Equipo principal',
    description: 'Reactor de lecho fijo en serie que prepara la carga eliminando azufre, nitrógeno, oxígeno y metales (HDS, HDN, HDM). Acondiciona el efluente para el reactor de hidrocraqueo aguas abajo.',
    specs: 'Ø 2.2 m × 9.5 m · 3 lechos · P 160 bar · T 360 °C · Catalizador NiMo/Al₂O₃'
  }));

  // Hemispherical heads (top and bottom)
  const headTop = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matHeavyWall()
  );
  headTop.position.set(x, baseY + 9.5, 0);
  g.add(headTop);
  const headBot = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matHeavyWall()
  );
  headBot.rotation.x = Math.PI;
  headBot.position.set(x, baseY, 0);
  g.add(headBot);

  // Catalyst beds (visible as darker bands inside) and quench distributor between them
  const bedYs = [baseY + 1.8, baseY + 4.6, baseY + 7.4];
  bedYs.forEach((y, i) => {
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 1.8, 24), matCatalyst());
    bed.position.set(x, y, 0);
    g.add(tagPart(bed, {
      id: `r1-bed-${i + 1}`,
      title: `R-1 lecho catalítico ${i + 1}`,
      category: 'Equipo principal',
      description: 'Lecho de catalizador de hidrotratamiento. La carga atraviesa los lechos en serie y se inyecta gas de quench (H₂ frío) entre ellos para controlar el aumento de temperatura por las reacciones exotérmicas.',
      specs: 'Volumen 5 m³ · Mallas internas y soportes de cerámica · Distribuidor de líquido'
    }));
  });

  // Quench rings between beds
  [baseY + 3.0, baseY + 5.8].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.08, 0.06, 12, 32), matH2());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, 0);
    g.add(tagPart(ring, {
      id: `r1-quench-${y.toFixed(1)}`,
      title: 'Anillo de quench (R-1)',
      category: 'Tubería',
      description: 'Anillo distribuidor que introduce hidrógeno frío entre lechos para reducir la temperatura del fluido y limitar la velocidad de las reacciones exotérmicas.',
      specs: 'Inyección de H₂ a 60 °C · Control feed-forward sobre ΔT de lecho'
    }));
  });

  return g;
}

function makeHydrocrackerReactor() {
  // Second-stage hydrocracking reactor — taller, similar diameter
  const g = new THREE.Group();
  const x = 1.5, baseY = 1.4, R = 1.2;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.2, 32), matSteelDark());
  skirt.position.set(x, baseY - 0.6, 0);
  g.add(tagPart(skirt, {
    id: 'r2-skirt',
    title: 'Faldón del reactor R-2',
    category: 'Estructura',
    description: 'Soporte cilíndrico del reactor de hidrocraqueo, dimensionado para soportar el peso adicional de la pared gruesa y los lechos catalíticos.',
    specs: 'Acero al carbono · Ø 2.6 m · Altura 1.2 m'
  }));

  // Shell
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 11.0, 32), matHeavyWall());
  shell.position.set(x, baseY + 5.5, 0);
  g.add(tagPart(shell, {
    id: 'r2-hydrocracker',
    title: 'Reactor R-2 (hidrocraqueo)',
    category: 'Equipo principal',
    description: 'Reactor principal de hidrocraqueo donde las moléculas pesadas se rompen catalíticamente en presencia de hidrógeno para producir destilados medios (kerosene, diésel) y naftas. Servicio extremadamente severo: alta presión, alta temperatura y atmósfera de H₂.',
    specs: 'Ø 2.4 m × 11 m · 4 lechos · P 175 bar · T 380–420 °C · Catalizador NiW/zeolita'
  }));

  // Heads
  const headTop = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matHeavyWall()
  );
  headTop.position.set(x, baseY + 11, 0);
  g.add(headTop);
  const headBot = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matHeavyWall()
  );
  headBot.rotation.x = Math.PI;
  headBot.position.set(x, baseY, 0);
  g.add(headBot);

  // 4 catalyst beds
  for (let i = 0; i < 4; i++) {
    const y = baseY + 1.6 + i * 2.4;
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 1.8, 24), matCatalyst());
    bed.position.set(x, y, 0);
    g.add(tagPart(bed, {
      id: `r2-bed-${i + 1}`,
      title: `R-2 lecho catalítico ${i + 1}`,
      category: 'Equipo principal',
      description: 'Lecho de catalizador de hidrocraqueo. Las reacciones combinan ruptura catalítica sobre la zeolita y saturación de olefinas sobre la función metálica, controladas por inyección de quench entre lechos.',
      specs: 'Volumen 6 m³ · Bandeja distribuidora y de redistribución entre lechos'
    }));
  }

  // Quench rings (3, between 4 beds)
  for (let i = 0; i < 3; i++) {
    const y = baseY + 2.8 + i * 2.4;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.08, 0.06, 12, 32), matH2());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, 0);
    g.add(ring);
  }

  return g;
}

function makeFiredHeater() {
  // Charge heater upstream of R-1
  const g = new THREE.Group();
  const x = -8, z = -3.5;

  const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.0, 2.4), matFurnace());
  box.position.set(x, 2.2, z);
  g.add(tagPart(box, {
    id: 'charge-heater',
    title: 'Horno de carga',
    category: 'Equipo principal',
    description: 'Horno de proceso que precalienta la mezcla de carga + hidrógeno de reciclo hasta la temperatura de entrada al reactor R-1, aportando el calor faltante tras el intercambio con el efluente.',
    specs: 'Carga térmica 30 MW · Tubos verticales · Combustible: fuel gas + makeup'
  }));

  // Twin stacks
  [-0.7, 0.7].forEach((ox) => {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 3.2, 20), matSteelDark());
    stack.position.set(x + ox, 6.0, z);
    g.add(stack);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 20), matSteel());
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x + ox, 7.6, z);
    g.add(cap);
  });

  // Burner access
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16), matSteelDark());
  burner.rotation.z = Math.PI / 2;
  burner.position.set(x + 1.4, 0.8, z);
  g.add(burner);

  return g;
}

function makeFeedEffluentExchangers() {
  // Train of vertical feed/effluent exchangers (2 in series) to recover heat
  const g = new THREE.Group();
  const positions = [[-5.5, 4.5], [-3.5, 4.5]];

  positions.forEach((p, i) => {
    const x = p[0], z = p[1];
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.0, 32), matSteel());
    shell.position.set(x, 1.2 + 2.5, z);
    g.add(tagPart(shell, {
      id: `cfe-${i + 1}`,
      title: `Intercambiador carga/efluente ${i + 1}`,
      category: 'Intercambio de calor',
      description: 'Intercambiador de alta presión que precalienta la carga al reactor con el efluente caliente, recuperando energía y minimizando la carga del horno.',
      specs: 'Carcasa Ø 1.1 m × 5 m · P diseño 180 bar · Materiales con resistencia a H₂'
    }));
    [-2.5, 2.5].forEach((dy) => {
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        matSteelDark()
      );
      head.rotation.x = dy > 0 ? 0 : Math.PI;
      head.position.set(x, 1.2 + 2.5 + dy, z);
      g.add(head);
    });
    [-1.5, 1.5].forEach((dy) => {
      const sad = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.7), matFrame());
      sad.position.set(x, 1.2 + 2.5 + dy, z);
      sad.visible = false;
      g.add(sad);
    });
  });

  return g;
}

function makeHpSeparator() {
  // High pressure separator (horizontal drum)
  const g = new THREE.Group();
  const x = 5.5, z = 4.0;

  [-1.2, 1.2].forEach((ox) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.9), matFrame());
    sad.position.set(x + ox, 0.95, z);
    g.add(sad);
  });

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 28), matHeavyWall());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x, 1.8, z);
  g.add(tagPart(drum, {
    id: 'hp-separator',
    title: 'Separador de alta presión (HP)',
    category: 'Equipo principal',
    description: 'Recipiente de alta presión que separa el gas rico en H₂ del líquido condensado tras enfriar el efluente del reactor. El gas se envía al absorbedor de aminas y al compresor de reciclo; el líquido pasa al separador de baja presión.',
    specs: 'Ø 1.4 m × 3.2 m · P 160 bar · T 50 °C · Tres fases (gas/HC/agua)'
  }));
  [-1.6, 1.6].forEach((ox) => {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matHeavyWall()
    );
    head.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    head.position.set(x + ox, 1.8, z);
    g.add(head);
  });

  return g;
}

function makeLpSeparator() {
  // Low pressure separator (smaller horizontal drum)
  const g = new THREE.Group();
  const x = 5.5, z = -4.0;

  [-1.0, 1.0].forEach((ox) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.7), matFrame());
    sad.position.set(x + ox, 0.75, z);
    g.add(sad);
  });

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 24), matSteel());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x, 1.4, z);
  g.add(tagPart(drum, {
    id: 'lp-separator',
    title: 'Separador de baja presión (LP)',
    category: 'Equipo principal',
    description: 'Flashea el líquido del HP separator a baja presión, liberando los gases disueltos (H₂S, livianos) y enviando el líquido al fraccionador. El gas se trata en otra columna de aminas.',
    specs: 'Ø 1.1 m × 2.6 m · P 10 bar · T 50 °C'
  }));
  [-1.3, 1.3].forEach((ox) => {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matSteelDark()
    );
    head.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    head.position.set(x + ox, 1.4, z);
    g.add(head);
  });

  return g;
}

function makeAmineAbsorber() {
  // Tall narrow column for H2S removal from recycle gas
  const g = new THREE.Group();
  const x = 8.5, z = 3.5;
  const baseY = 1.2;
  const R = 0.55;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 0.9, 24), matSteelDark());
  skirt.position.set(x, baseY, z);
  g.add(skirt);

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 6.5, 32), matSteel());
  shell.position.set(x, baseY + 0.45 + 3.25, z);
  g.add(tagPart(shell, {
    id: 'amine-absorber',
    title: 'Absorbedor de aminas',
    category: 'Columna',
    description: 'Columna de absorción donde una solución de aminas (MDEA) elimina el H₂S del gas de reciclo antes de retornarlo a los reactores, evitando la corrosión y manteniendo el catalizador activo.',
    specs: 'Ø 1.1 m × 6.5 m · 24 platos válvula · Solución MDEA 45 % w'
  }));

  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.05, 10, 28), matSteelDark());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, baseY + 1.3 + i * 1.4, z);
    g.add(ring);
  }

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.set(x, baseY + 0.45 + 6.5, z);
  g.add(dome);

  return g;
}

function makeRecycleCompressor() {
  const g = new THREE.Group();
  const x = -8, z = 4.5;

  const ped = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 1.4), matConcrete());
  ped.position.set(x, 0.85, z);
  g.add(ped);

  const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24), matSteel());
  casing.rotation.z = Math.PI / 2;
  casing.position.set(x - 0.7, 1.7, z);
  g.add(tagPart(casing, {
    id: 'recycle-h2-compressor',
    title: 'Compresor de hidrógeno de reciclo',
    category: 'Bombeo',
    description: 'Compresor centrífugo de varias etapas que devuelve el hidrógeno separado en el HP separator (y tratado en el absorbedor de aminas) a la succión del horno de carga, manteniendo la alta presión parcial de H₂ requerida en los reactores.',
    specs: 'Caudal 80 000 Nm³/h · ΔP 8 bar · Accionamiento por turbina de vapor de alta presión'
  }));

  const driver = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 20), matMotor());
  driver.rotation.z = Math.PI / 2;
  driver.position.set(x + 0.7, 1.7, z);
  g.add(driver);

  const coup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12), matSteelDark());
  coup.rotation.z = Math.PI / 2;
  coup.position.set(x + 0.05, 1.7, z);
  g.add(coup);

  return g;
}

function makeMakeupCompressor() {
  // Reciprocating makeup H2 compressor (two stages, shown as block + cylinders)
  const g = new THREE.Group();
  const x = -8, z = -5.0;

  const ped = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 1.6), matConcrete());
  ped.position.set(x, 0.85, z);
  g.add(ped);

  // Crankcase block
  const block = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.2), matSteelDark());
  block.position.set(x, 1.5, z);
  g.add(tagPart(block, {
    id: 'makeup-h2-compressor',
    title: 'Compresor de hidrógeno de aporte (makeup)',
    category: 'Bombeo',
    description: 'Compresor reciprocante de varias etapas que comprime el hidrógeno fresco proveniente de la unidad de hidrógeno hasta la presión del lazo de reciclo.',
    specs: '4 etapas · Caudal 25 000 Nm³/h · P final 175 bar · Motor eléctrico'
  }));

  // Cylinder heads
  [-0.7, 0.0, 0.7].forEach((ox) => {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), matSteel());
    cyl.position.set(x + ox, 2.15, z);
    g.add(cyl);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16), matSteelDark());
    head.position.set(x + ox, 2.45, z);
    g.add(head);
  });

  // Motor
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 20), matMotor());
  motor.rotation.z = Math.PI / 2;
  motor.position.set(x + 2.2, 1.5, z);
  g.add(motor);

  return g;
}

function makeFractionator() {
  // Product fractionator with multiple side cuts
  const g = new THREE.Group();
  const x = -2, z = 5.5;
  const baseY = 1.2;
  const R = 1.0;

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.0, 24), matSteelDark());
  skirt.position.set(x, baseY, z);
  g.add(skirt);

  // Shell — slightly wider mid-section visualization with single cylinder
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 10.0, 32), matSteel());
  shell.position.set(x, baseY + 0.5 + 5.0, z);
  g.add(tagPart(shell, {
    id: 'product-fractionator',
    title: 'Fraccionadora de productos',
    category: 'Columna',
    description: 'Columna de destilación atmosférica que separa el efluente líquido del hidrocraqueo en sus fracciones: gases C1–C4 por cabeza, nafta ligera, nafta pesada, kerosene, diésel y aceite no convertido (UCO) por el fondo.',
    specs: 'Ø 2.0 m × 10 m · 38 platos · 4 extracciones laterales con strippers'
  }));

  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.06, 12, 32), matSteelDark());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, baseY + 1.8 + i * 1.4, z);
    g.add(ring);

    // Side draw nozzles
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12), matSteelDark());
    noz.rotation.z = Math.PI / 2;
    noz.position.set(x + R + 0.15, baseY + 1.8 + i * 1.4, z);
    g.add(noz);
  }

  // Top dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.set(x, baseY + 0.5 + 10.0, z);
  g.add(dome);

  // Overhead drum
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.0, 24), matSteel());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x + 2.0, baseY + 0.5 + 10.0 + 0.7, z);
  g.add(tagPart(drum, {
    id: 'overhead-drum',
    title: 'Tambor de cabeza',
    category: 'Equipo principal',
    description: 'Recibe los vapores condensados de cabeza del fraccionador, separa gases, agua y nafta inestabilizada. Parte del líquido se devuelve como reflujo y el resto se envía a tratamiento.',
    specs: 'Ø 1.0 m × 2.0 m · Tres fases'
  }));
  [-1.0, 1.0].forEach((ox) => {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matSteelDark()
    );
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    c.position.set(x + 2.0 + ox, baseY + 0.5 + 10.0 + 0.7, z);
    g.add(c);
  });

  // Reboiler (horizontal)
  const reb = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 20), matSteel());
  reb.rotation.z = Math.PI / 2;
  reb.position.set(x + 1.6, 1.6, z);
  g.add(tagPart(reb, {
    id: 'fractionator-reboiler',
    title: 'Reboiler del fraccionador',
    category: 'Intercambio de calor',
    description: 'Intercambiador horno + horizontal que aporta el calor al fondo del fraccionador para mantener el perfil de temperatura y la separación de los cortes.',
    specs: 'Servicio fuel oil / fondos · 6 MW'
  }));

  return g;
}

function makeProcessPiping() {
  const g = new THREE.Group();

  // Feed line to charge heater (cold)
  const fc1 = pipeSegment([-12, 1.0, 0], [-8, 1.0, -3.5], matCold(), 0.12);
  const fc2 = pipeSegment([-8, 1.0, -3.5], [-8, 0.4, -3.5], matCold(), 0.12);
  g.add(tagPart(fc1, {
    id: 'feed-line',
    title: 'Línea de carga (VGO)',
    category: 'Tubería',
    description: 'Carga al hidrocraqueo, típicamente gasóleo de vacío (VGO) y/o aceites residuales hidrotratados, mezclada con el gas de reciclo a la entrada del horno.',
    specs: 'Ø 0.25 m · T entrada 200 °C · Caudal 1500 m³/d'
  }));
  g.add(fc2);

  // Heater outlet to R-1 top (hot)
  const h1 = pipeSegment([-8, 4.2, -3.5], [-8, 11.5, -3.5], matHot(), 0.15);
  const h2 = pipeSegment([-8, 11.5, -3.5], [-2.5, 11.5, 0], matHot(), 0.15);
  const h3 = pipeSegment([-2.5, 11.5, 0], [-2.5, 10.9, 0], matHot(), 0.15);
  g.add(tagPart(h1, {
    id: 'heater-outlet',
    title: 'Línea de salida del horno (hacia R-1)',
    category: 'Tubería',
    description: 'Conduce la mezcla calentada (carga + H₂ de reciclo) desde la salida del horno hasta la entrada superior del reactor de hidrotratamiento.',
    specs: 'Ø 0.3 m · T 380 °C · P 165 bar · Aislamiento'
  }));
  g.add(h2); g.add(h3);

  // R-1 bottom to R-2 top (interreactor)
  const ir1 = pipeSegment([-2.5, 1.4, 0], [-2.5, 0.8, 0], matHot(), 0.12);
  const ir2 = pipeSegment([-2.5, 0.8, 0], [1.5, 0.8, 0], matHot(), 0.12);
  const ir3 = pipeSegment([1.5, 0.8, 0], [1.5, 13.0, 0], matHot(), 0.12);
  const ir4 = pipeSegment([1.5, 13.0, 0], [1.5, 12.4, 0], matHot(), 0.12);
  g.add(tagPart(ir1, {
    id: 'interreactor-line',
    title: 'Línea entre reactores (R-1 → R-2)',
    category: 'Tubería',
    description: 'Lleva el efluente hidrotratado del reactor R-1 hacia la cabeza del reactor de hidrocraqueo R-2.',
    specs: 'Ø 0.25 m · Aislamiento térmico · T 370 °C'
  }));
  g.add(ir2); g.add(ir3); g.add(ir4);

  // R-2 effluent down to CFE exchangers
  const eff1 = pipeSegment([1.5, 1.4, 0], [1.5, 0.8, 0], matHot(), 0.13);
  const eff2 = pipeSegment([1.5, 0.8, 0], [-3.5, 0.8, 4.5], matHot(), 0.13);
  const eff3 = pipeSegment([-3.5, 0.8, 4.5], [-3.5, 1.0, 4.5], matHot(), 0.13);
  g.add(tagPart(eff1, {
    id: 'reactor-effluent',
    title: 'Línea de efluente de reactor',
    category: 'Tubería',
    description: 'Efluente caliente del R-2 que se enfría en los intercambiadores carga/efluente cediendo calor a la carga, antes de ir al HP separator.',
    specs: 'Ø 0.3 m · T 400 °C bajando a 60 °C tras CFE'
  }));
  g.add(eff2); g.add(eff3);

  // CFE outlet (cold side) to HP separator
  const hp1 = pipeSegment([-3.5, 6.0, 4.5], [5.5, 6.0, 4.0], matHot(), 0.12);
  const hp2 = pipeSegment([5.5, 6.0, 4.0], [5.5, 2.5, 4.0], matHot(), 0.12);
  g.add(hp1); g.add(hp2);

  // HP gas to amine absorber bottom
  const ag1 = pipeSegment([5.5, 2.4, 4.0], [8.5, 2.4, 3.5], matH2(), 0.1);
  g.add(tagPart(ag1, {
    id: 'sour-gas-line',
    title: 'Línea de gas ácido (al absorbedor)',
    category: 'Tubería',
    description: 'Gas rico en hidrógeno con H₂S y NH₃ que va del HP separator a la base del absorbedor de aminas.',
    specs: 'Ø 0.2 m · H₂S 1–3 % vol · P 155 bar'
  }));

  // Treated gas from absorber top to recycle compressor suction
  const tg1 = pipeSegment([8.5, 8.5, 3.5], [-8, 8.5, 4.5], matH2(), 0.1);
  const tg2 = pipeSegment([-8, 8.5, 4.5], [-8, 2.4, 4.5], matH2(), 0.1);
  g.add(tg1); g.add(tg2);

  // Recycle compressor discharge to heater inlet (joining feed)
  const rc1 = pipeSegment([-7.3, 1.7, 4.5], [-7.3, 1.0, -3.5], matH2(), 0.1);
  g.add(tagPart(rc1, {
    id: 'recycle-h2-line',
    title: 'Línea de hidrógeno de reciclo',
    category: 'Tubería',
    description: 'Hidrógeno tratado que se reincorpora al lazo, mezclándose con la carga antes del horno para garantizar la relación H₂/HC requerida.',
    specs: 'Ø 0.22 m · H₂ > 88 % vol · P 175 bar'
  }));

  // Makeup compressor discharge tying into recycle line
  const mk1 = pipeSegment([-5.8, 2.4, -5.0], [-5.8, 2.4, -3.5], matH2(), 0.08);
  const mk2 = pipeSegment([-5.8, 2.4, -3.5], [-7.3, 2.4, -3.5], matH2(), 0.08);
  g.add(tagPart(mk1, {
    id: 'makeup-h2-line',
    title: 'Línea de hidrógeno de aporte',
    category: 'Tubería',
    description: 'Aporte fresco de H₂ desde la unidad de hidrógeno para compensar el consumido en las reacciones y las purgas del lazo.',
    specs: 'Ø 0.15 m · H₂ > 99 % vol · 25 000 Nm³/h'
  }));
  g.add(mk2);

  // HP liquid to LP separator
  const lp1 = pipeSegment([5.5, 1.3, 4.0], [5.5, 1.3, -4.0], matCold(), 0.1);
  g.add(lp1);

  // LP liquid to fractionator
  const fl1 = pipeSegment([5.5, 1.3, -4.0], [-2, 1.3, -4.0], matCold(), 0.1);
  const fl2 = pipeSegment([-2, 1.3, -4.0], [-2, 4.5, 5.5], matHot(), 0.1);
  g.add(tagPart(fl1, {
    id: 'liquid-to-fractionator',
    title: 'Línea hacia fraccionador',
    category: 'Tubería',
    description: 'Líquido del separador de baja presión que se precalienta y entra al fraccionador para la separación de los productos.',
    specs: 'Ø 0.2 m · T entrada 350 °C tras precalentamiento'
  }));
  g.add(fl2);

  return g;
}

export function buildHydrocracking() {
  const root = new THREE.Group();
  root.name = 'Hydrocracking';

  root.add(makeBase());
  root.add(makeHydrotreater());
  root.add(makeHydrocrackerReactor());
  root.add(makeFiredHeater());
  root.add(makeFeedEffluentExchangers());
  root.add(makeHpSeparator());
  root.add(makeLpSeparator());
  root.add(makeAmineAbsorber());
  root.add(makeRecycleCompressor());
  root.add(makeMakeupCompressor());
  root.add(makeFractionator());
  root.add(makeProcessPiping());

  return root;
}
