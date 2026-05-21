import * as THREE from 'three';

// Materials
const matSteel = () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.7, roughness: 0.35 });
const matSteelDark = () => new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.6, roughness: 0.5 });
const matFurnace = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.5, roughness: 0.6 });
const matPipeHot = () => new THREE.MeshStandardMaterial({ color: 0xc94a3b, metalness: 0.4, roughness: 0.5 });
const matPipeCold = () => new THREE.MeshStandardMaterial({ color: 0x4a7fc9, metalness: 0.4, roughness: 0.5 });
const matFrame = () => new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.6, roughness: 0.55 });
const matMotor = () => new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.4, roughness: 0.6 });
const matConcrete = () => new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.05, roughness: 0.95 });

function tagPart(mesh, data) {
  mesh.userData = { ...data };
  return mesh;
}

function makeFrame() {
  // Steel platform skid that ties the equipment together
  const group = new THREE.Group();
  const baseY = 0.5;
  const w = 14, d = 10;

  // Concrete pad
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(w + 2, 0.4, d + 2),
    matConcrete()
  );
  pad.position.y = 0.2;
  group.add(pad);

  // Frame beams (outline)
  const beamMat = matFrame();
  const beamGeo = (lx, ly, lz) => new THREE.BoxGeometry(lx, ly, lz);
  const corners = [
    [-w / 2, baseY, -d / 2], [w / 2, baseY, -d / 2],
    [-w / 2, baseY, d / 2], [w / 2, baseY, d / 2],
  ];
  // Vertical posts
  corners.forEach(([x, y, z]) => {
    const post = new THREE.Mesh(beamGeo(0.25, 1.0, 0.25), beamMat);
    post.position.set(x, y, z);
    group.add(post);
  });
  // Top rails along X
  [-d / 2, d / 2].forEach((z) => {
    const r = new THREE.Mesh(beamGeo(w, 0.18, 0.18), beamMat);
    r.position.set(0, baseY + 0.5, z);
    group.add(r);
  });
  [-w / 2, w / 2].forEach((x) => {
    const r = new THREE.Mesh(beamGeo(0.18, 0.18, d), beamMat);
    r.position.set(x, baseY + 0.5, 0);
    group.add(r);
  });

  const skid = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.12, d),
    new THREE.MeshStandardMaterial({ color: 0x5a6470, metalness: 0.5, roughness: 0.6 })
  );
  skid.position.y = baseY + 0.55;
  group.add(skid);

  // Tag the whole skid as one selectable part via the deck
  tagPart(skid, {
    id: 'skid',
    title: 'Estructura de soporte (skid)',
    category: 'Estructura',
    description: 'Bastidor metálico modular que soporta y conecta los equipos principales de la planta, permitiendo transporte e instalación como una unidad compacta.',
    specs: 'Acero estructural ASTM A36 · Plataforma 14 × 10 m'
  });

  return group;
}

function makeColumn() {
  // Main distillation column with stacked sections
  const group = new THREE.Group();
  const sections = 5;
  const sectionH = 1.6;
  const radius = 0.85;
  const baseY = 1.2;

  // Bottom skirt
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.05, radius * 1.15, 0.8, 32),
    matSteelDark()
  );
  skirt.position.set(0, baseY, 0);
  group.add(tagPart(skirt, {
    id: 'column-skirt',
    title: 'Faldón de la columna',
    category: 'Columna',
    description: 'Soporte cilíndrico que ancla la columna de destilación al skid y transmite las cargas al cimiento.',
    specs: 'Acero al carbono · Ø 1.9 m × 0.8 m'
  }));

  // Stacked sections (each is a selectable tray section)
  for (let i = 0; i < sections; i++) {
    const y = baseY + 0.5 + sectionH / 2 + i * sectionH;
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, sectionH, 32),
      matSteel()
    );
    shell.position.y = y;
    tagPart(shell, {
      id: `column-section-${i + 1}`,
      title: `Sección ${i + 1} de la columna`,
      category: 'Columna',
      description: `Tramo ${i + 1} de la columna de destilación. Contiene platos o relleno donde se produce el intercambio másico entre vapor ascendente y líquido descendente.`,
      specs: 'Acero inoxidable 304 · Ø 1.7 m · Altura 1.6 m'
    });
    group.add(shell);

    // Ring flange between sections
    const flange = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.08, 0.08, 12, 32),
      matSteelDark()
    );
    flange.rotation.x = Math.PI / 2;
    flange.position.y = y - sectionH / 2;
    group.add(flange);

    // Side manhole
    const manhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.3, 16),
      matSteelDark()
    );
    manhole.rotation.z = Math.PI / 2;
    manhole.position.set(radius + 0.1, y, 0);
    group.add(manhole);
  }

  // Top dome
  const topY = baseY + 0.5 + sectionH * sections;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.y = topY;
  group.add(dome);

  // Condenser drum on top (horizontal cylinder)
  const condenser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 2.2, 24),
    matSteel()
  );
  condenser.rotation.z = Math.PI / 2;
  condenser.position.set(1.2, topY + 0.9, 0);
  group.add(tagPart(condenser, {
    id: 'condenser',
    title: 'Condensador / tambor de reflujo',
    category: 'Columna',
    description: 'Condensa los vapores de cabeza de la columna. Parte del condensado retorna a la columna como reflujo y el resto se envía como producto destilado.',
    specs: 'Carcasa Ø 1.1 m × 2.2 m · Servicio agua/glicol'
  }));

  // Dome caps for condenser
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSteel());
  c1.rotation.z = -Math.PI / 2;
  c1.position.set(1.2 + 1.1, topY + 0.9, 0);
  group.add(c1);
  const c2 = c1.clone();
  c2.rotation.z = Math.PI / 2;
  c2.position.set(1.2 - 1.1, topY + 0.9, 0);
  group.add(c2);

  // Top vent stack
  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 1.4, 16),
    matSteelDark()
  );
  vent.position.set(0, topY + 0.7, 0);
  group.add(vent);

  return group;
}

function makeStairs() {
  const group = new THREE.Group();
  // Simplified spiral platforms around the column
  const platforms = 4;
  const radius = 1.35;
  for (let i = 0; i < platforms; i++) {
    const y = 2.3 + i * 1.6;
    const angle = i * Math.PI / 2;
    const plat = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.05, radius + 0.35, 24, 1, angle, Math.PI * 0.7),
      new THREE.MeshStandardMaterial({ color: 0x5a6470, metalness: 0.5, roughness: 0.7, side: THREE.DoubleSide })
    );
    plat.rotation.x = -Math.PI / 2;
    plat.position.y = y;
    group.add(plat);

    // railing posts
    for (let k = 0; k < 6; k++) {
      const a = angle + (k / 5) * Math.PI * 0.7;
      const px = Math.cos(a) * (radius + 0.32);
      const pz = Math.sin(a) * (radius + 0.32);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), matFrame());
      post.position.set(px, y + 0.3, pz);
      group.add(post);
    }
  }

  // tag the whole stair group via a thin invisible-ish marker (use first platform)
  if (group.children[0]) {
    tagPart(group.children[0], {
      id: 'stairs',
      title: 'Plataformas y escaleras',
      category: 'Estructura',
      description: 'Plataformas de inspección y escaleras helicoidales que dan acceso a manholes, válvulas e instrumentación en distintos niveles de la columna.',
      specs: 'Rejilla de acero galvanizado · Barandilla 1.1 m'
    });
  }
  return group;
}

function makeFurnace() {
  const group = new THREE.Group();
  // Furnace placed to the left of the column
  const x = -5.5, z = -0.5;

  // Main box
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.6, 2.2),
    matFurnace()
  );
  box.position.set(x, 2.0, z);
  group.add(tagPart(box, {
    id: 'furnace',
    title: 'Horno de proceso',
    category: 'Equipo principal',
    description: 'Aporta el calor necesario al fluido de proceso mediante quemadores en la base. El calor se transfiere por radiación y convección a los tubos del serpentín interno.',
    specs: 'Carga térmica ~ 8 MW · Combustible: gas natural'
  }));

  // Burner access on side
  const burner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16),
    matSteelDark()
  );
  burner.rotation.z = Math.PI / 2;
  burner.position.set(x + 1.2, 0.6, z);
  group.add(burner);

  // Two stacks on top
  [-0.55, 0.55].forEach((ox) => {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 2.6, 20),
      matSteelDark()
    );
    stack.position.set(x + ox, 3.8 + 1.3, z);
    group.add(stack);
    // top cap rim
    const cap = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 20), matSteel());
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x + ox, 5.1 + 1.3 - 0.7, z);
    group.add(cap);
  });

  // Tag a stack separately
  const tagStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.2, 20),
    matSteelDark()
  );
  tagStack.position.set(x, 6.7, z);
  tagStack.visible = false; // logical marker, hide
  group.add(tagStack);

  // Real selectable stack: tag the right stack
  const rightStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.3, 20),
    matSteelDark()
  );
  rightStack.position.set(x + 0.55, 6.5, z);
  group.add(tagPart(rightStack, {
    id: 'stack',
    title: 'Chimenea de gases',
    category: 'Equipo principal',
    description: 'Evacúa los gases de combustión del horno hacia la atmósfera. Su altura asegura una correcta dispersión cumpliendo normativa ambiental.',
    specs: 'Acero al carbono refractado · Altura total 6.5 m'
  }));

  return group;
}

function makeRegasifier() {
  // Three horizontal heat exchangers stacked / aligned representing regasification train
  const group = new THREE.Group();
  const baseX = -2.5, baseY = 1.3, baseZ = 3.5;

  const positions = [
    [baseX - 0.0, baseY, baseZ + 0.0],
    [baseX + 1.6, baseY + 0.0, baseZ + 0.0],
    [baseX + 0.8, baseY + 1.1, baseZ + 0.0],
  ];

  positions.forEach((p, i) => {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 2.6, 24),
      matSteel()
    );
    shell.rotation.z = Math.PI / 2;
    shell.position.set(p[0], p[1], p[2]);
    group.add(tagPart(shell, {
      id: `regasifier-${i + 1}`,
      title: `Regasificador ${i + 1}`,
      category: 'Intercambio de calor',
      description: 'Intercambiador de calor de carcasa y tubos utilizado para vaporizar el fluido criogénico mediante un medio caliente, retornando el producto a fase gaseosa.',
      specs: 'Carcasa Ø 0.9 m × 2.6 m · 120 tubos Ø 19 mm · Servicio GNL/agua'
    }));

    // End caps
    [-1.3, 1.3].forEach((ox) => {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        matSteelDark()
      );
      cap.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
      cap.position.set(p[0] + ox, p[1], p[2]);
      group.add(cap);
    });

    // Saddle supports
    [-0.8, 0.8].forEach((ox) => {
      const sad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), matFrame());
      sad.position.set(p[0] + ox, p[1] - 0.55, p[2]);
      group.add(sad);
    });
  });

  return group;
}

function makePumps() {
  const group = new THREE.Group();
  // Three pump+motor sets at the front of the skid
  const positions = [
    [-2.0, 0, 3.8],
    [0.2, 0, 4.0],
    [2.4, 0, 3.8],
  ];

  positions.forEach((p, i) => {
    // Pedestal
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.7), matConcrete());
    ped.position.set(p[0], 0.78, p[2]);
    group.add(ped);

    // Pump body
    const pump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20),
      matSteel()
    );
    pump.rotation.z = Math.PI / 2;
    pump.position.set(p[0] - 0.4, 1.05, p[2]);
    group.add(tagPart(pump, {
      id: `pump-${i + 1}`,
      title: `Bomba centrífuga ${i + 1}`,
      category: 'Bombeo',
      description: 'Bomba centrífuga accionada por motor eléctrico que impulsa el fluido de proceso a través de la planta. Una unidad funciona en operación normal y otra queda en reserva (configuración 2×100 %).',
      specs: 'Caudal 50 m³/h · TDH 80 m · Sello mecánico API Plan 53A'
    }));

    // Volute (sphere flatten)
    const vol = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), matSteel());
    vol.position.set(p[0] - 0.65, 1.05, p[2]);
    vol.scale.set(1, 1, 0.8);
    group.add(vol);

    // Motor
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 20),
      matMotor()
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(p[0] + 0.25, 1.05, p[2]);
    group.add(motor);

    // Coupling
    const coup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.15, 12), matSteelDark());
    coup.rotation.z = Math.PI / 2;
    coup.position.set(p[0] - 0.1, 1.05, p[2]);
    group.add(coup);

    // Motor fan cap
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 16), matSteelDark());
    fan.rotation.z = Math.PI / 2;
    fan.position.set(p[0] + 0.65, 1.05, p[2]);
    group.add(fan);
  });

  return group;
}

function makePiping() {
  const group = new THREE.Group();

  const segment = (a, b, mat, r = 0.06) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
    pipe.position.copy(mid);
    pipe.lookAt(vb);
    pipe.rotateX(Math.PI / 2);
    return pipe;
  };

  // Hot pipes: from furnace top into the column base/side
  const hot = matPipeHot();
  group.add(segment([-5.5, 5.5, -0.5], [-5.5, 6.5, -0.5], hot));
  group.add(segment([-5.5, 6.5, -0.5], [-2.5, 6.5, -0.5], hot));
  group.add(segment([-2.5, 6.5, -0.5], [-2.5, 4.5, -0.5], hot));
  group.add(segment([-2.5, 4.5, -0.5], [-0.85, 4.5, 0], hot));

  group.add(segment([-5.5, 2.0, 0.6], [-2.5, 2.0, 0.6], hot));
  group.add(segment([-2.5, 2.0, 0.6], [-2.5, 2.6, 0.6], hot));
  group.add(segment([-2.5, 2.6, 0.6], [-0.85, 2.6, 0.6], hot));

  // Cold pipes: column bottom -> regasifier -> pumps -> out
  const cold = matPipeCold();
  group.add(segment([0.85, 2.0, 0], [2.5, 2.0, 0], cold));
  group.add(segment([2.5, 2.0, 0], [2.5, 2.0, 2.5], cold));
  group.add(segment([2.5, 2.0, 2.5], [-1.5, 2.0, 2.5], cold));
  group.add(segment([-1.5, 2.0, 2.5], [-1.5, 1.3, 3.0], cold));

  // From regasifier to pumps
  group.add(segment([0.0, 1.3, 3.5], [0.0, 1.05, 3.8], cold));
  group.add(segment([2.0, 1.3, 3.5], [2.0, 1.05, 3.8], cold));

  // Outlet from pumps along the front
  group.add(segment([-2.0, 1.05, 4.3], [2.4, 1.05, 4.3], cold));
  group.add(segment([2.4, 1.05, 4.3], [4.5, 1.05, 4.3], cold));
  group.add(segment([4.5, 1.05, 4.3], [4.5, 1.05, 0.0], cold));

  // Tag pipes as one selectable bundle (tag a representative)
  if (group.children[0]) {
    tagPart(group.children[0], {
      id: 'pipes-hot',
      title: 'Líneas de proceso calientes',
      category: 'Tubería',
      description: 'Líneas que transportan el fluido de proceso desde el horno hacia la columna a alta temperatura. Aisladas térmicamente para minimizar pérdidas y proteger al personal.',
      specs: 'Acero al carbono · Schedule 40 · Aislamiento 75 mm lana mineral'
    });
  }
  if (group.children[7]) {
    tagPart(group.children[7], {
      id: 'pipes-cold',
      title: 'Líneas de fondos / refrigeración',
      category: 'Tubería',
      description: 'Líneas que transportan los fondos de la columna y los retornos de refrigeración hacia los intercambiadores y bombas.',
      specs: 'Acero inoxidable 304 · Schedule 40S'
    });
  }
  return group;
}

export function buildIndustrialPlant() {
  const root = new THREE.Group();
  root.name = 'IndustrialPlant';

  root.add(makeFrame());
  root.add(makeColumn());
  root.add(makeStairs());
  root.add(makeFurnace());
  root.add(makeRegasifier());
  root.add(makePumps());
  root.add(makePiping());

  return root;
}
