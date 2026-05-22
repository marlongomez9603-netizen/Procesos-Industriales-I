import * as THREE from 'three';

// Materials
const matSteel       = () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.7, roughness: 0.35 });
const matSteelDark   = () => new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.6, roughness: 0.5 });
const matRefractory  = () => new THREE.MeshStandardMaterial({ color: 0xa8856e, metalness: 0.2, roughness: 0.85 });
const matHot         = () => new THREE.MeshStandardMaterial({ color: 0xc94a3b, metalness: 0.4, roughness: 0.5 });
const matCold        = () => new THREE.MeshStandardMaterial({ color: 0x4a7fc9, metalness: 0.4, roughness: 0.5 });
const matCatalyst    = () => new THREE.MeshStandardMaterial({ color: 0xc97a3b, metalness: 0.35, roughness: 0.55 });
const matFrame       = () => new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.6, roughness: 0.55 });
const matConcrete    = () => new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.05, roughness: 0.95 });
const matMotor       = () => new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.4, roughness: 0.6 });

function tagPart(mesh, data) {
  mesh.userData = { ...data };
  return mesh;
}

// Pipe segment between two points
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
  const pad = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 14), matConcrete());
  pad.position.y = 0.2;
  g.add(tagPart(pad, {
    id: 'foundation',
    title: 'Cimentación de hormigón',
    category: 'Estructura',
    description: 'Losa de hormigón armado que soporta las cargas estáticas y dinámicas de los recipientes principales del FCC.',
    specs: 'Hormigón H-35 · 22 × 14 m · Espesor 0.4 m'
  }));

  // Steel structure / pipe rack
  const beamMat = matFrame();
  for (let x = -9; x <= 9; x += 6) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5, 0.25), beamMat);
    post.position.set(x, 2.7, -6);
    g.add(post);
    const post2 = post.clone();
    post2.position.z = 6;
    g.add(post2);
  }
  // Top rails
  const rail = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 0.2), beamMat);
  rail.position.set(0, 5.0, -6);
  g.add(rail);
  const rail2 = rail.clone();
  rail2.position.z = 6;
  g.add(rail2);

  return g;
}

function makeRegenerator() {
  // Large diameter vessel, refractory lined (shown as outer steel)
  const g = new THREE.Group();
  const x = 3.5, baseY = 1.8, R = 2.2;

  // Skirt
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.05, 1.2, 32), matSteelDark());
  skirt.position.set(x, baseY - 0.6, 0);
  g.add(tagPart(skirt, {
    id: 'regen-skirt',
    title: 'Faldón del regenerador',
    category: 'Estructura',
    description: 'Soporte cilíndrico anclado a la cimentación que sustenta el peso del regenerador y permite la dilatación térmica del recipiente.',
    specs: 'Acero al carbono · Ø 4.6 m · Altura 1.2 m'
  }));

  // Cylindrical shell
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 5.5, 32), matSteel());
  shell.position.set(x, baseY + 2.75, 0);
  g.add(tagPart(shell, {
    id: 'regenerator',
    title: 'Regenerador',
    category: 'Equipo principal',
    description: 'Recipiente donde el catalizador agotado se regenera quemando el coque depositado con aire en lecho fluidizado a 680–730 °C. La energía liberada precalienta el catalizador antes de retornar al riser.',
    specs: 'Ø 4.4 m × 5.5 m · Lecho fluidizado · Refractario interno 150 mm · T diseño 760 °C'
  }));

  // Top dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.set(x, baseY + 5.5, 0);
  g.add(dome);

  // Cyclones on top (two pairs primary/secondary - simplified)
  for (let i = 0; i < 2; i++) {
    const angle = (i / 2) * Math.PI * 2 + Math.PI / 4;
    const cx = x + Math.cos(angle) * 1.0;
    const cz = Math.sin(angle) * 1.0;
    const cyc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.18, 1.4, 16), matSteel());
    cyc.position.set(cx, baseY + 5.5 + 1.0, cz);
    g.add(tagPart(cyc, {
      id: `regen-cyclone-${i + 1}`,
      title: `Ciclón regenerador ${i + 1}`,
      category: 'Equipo principal',
      description: 'Separador ciclónico de doble etapa que retiene las partículas finas de catalizador arrastradas por los gases de combustión antes de su salida hacia la chimenea.',
      specs: 'Diseño Stairmand de alta eficiencia · 99.99 % retención sobre 10 μm'
    }));
    // Dipleg back to bed
    const dip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.5, 12), matCatalyst());
    dip.position.set(cx, baseY + 3.5, cz);
    g.add(dip);
  }

  // Air distributor at base (toroidal ring)
  const airRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, 0.12, 12, 32), matCold());
  airRing.rotation.x = Math.PI / 2;
  airRing.position.set(x, baseY + 0.4, 0);
  g.add(tagPart(airRing, {
    id: 'air-grid',
    title: 'Distribuidor de aire',
    category: 'Tubería',
    description: 'Anillo distribuidor con boquillas que introduce aire de combustión de manera uniforme en el lecho del regenerador para mantener la fluidización y oxidar el coque.',
    specs: 'Acero inoxidable refractado · Caudal 90 000 Nm³/h'
  }));

  return g;
}

function makeReactor() {
  // Reactor vessel (smaller diameter than regenerator) at left
  const g = new THREE.Group();
  const x = -1.0, baseY = 3.2, R = 1.2;

  // Skirt
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 1.0, 24), matSteelDark());
  skirt.position.set(x, baseY - 0.5, 0);
  g.add(tagPart(skirt, {
    id: 'reactor-skirt',
    title: 'Faldón del reactor',
    category: 'Estructura',
    description: 'Soporte vertical que ancla el reactor al cimiento y desacopla las cargas térmicas del recipiente.',
    specs: 'Acero al carbono · Ø 2.5 m · Altura 1.0 m'
  }));

  // Reactor shell
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 3.0, 32), matSteel());
  shell.position.set(x, baseY + 1.5, 0);
  g.add(tagPart(shell, {
    id: 'reactor',
    title: 'Reactor (disengager)',
    category: 'Equipo principal',
    description: 'Recipiente de desacople donde el catalizador caliente cae al stripper mientras que los vapores craqueados ascienden hacia los ciclones y luego a la fraccionadora principal.',
    specs: 'Ø 2.4 m × 3.0 m · T operación 520 °C · Refractario anti-erosión'
  }));

  // Dome top
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.set(x, baseY + 3.0, 0);
  g.add(dome);

  // Stripper section below disengager (extension)
  const stripper = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.7, 1.5, 24), matSteel());
  stripper.position.set(x, baseY - 1.25, 0);
  g.add(tagPart(stripper, {
    id: 'stripper',
    title: 'Stripper (despojador)',
    category: 'Equipo principal',
    description: 'Sección inferior donde se inyecta vapor para arrastrar los hidrocarburos atrapados entre las partículas de catalizador antes de enviarlas al regenerador.',
    specs: 'Vapor de stripping 2 kg/t catalizador · Bafles en cascada'
  }));

  // Reactor cyclones (smaller)
  for (let i = 0; i < 2; i++) {
    const angle = (i / 2) * Math.PI * 2 + Math.PI / 4;
    const cx = x + Math.cos(angle) * 0.55;
    const cz = Math.sin(angle) * 0.55;
    const cyc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 1.0, 16), matSteel());
    cyc.position.set(cx, baseY + 3.0 + 0.7, cz);
    g.add(tagPart(cyc, {
      id: `reactor-cyclone-${i + 1}`,
      title: `Ciclón reactor ${i + 1}`,
      category: 'Equipo principal',
      description: 'Ciclones internos que separan el catalizador del flujo de vapores craqueados, devolviéndolo al lecho denso a través de los diplegs.',
      specs: '2 etapas en serie · 99.995 % retención global'
    }));
    const dip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.5, 10), matCatalyst());
    dip.position.set(cx, baseY + 1.5, cz);
    g.add(dip);
  }

  return g;
}

function makeRiser() {
  // Vertical riser pipe from below the reactor up into the reactor disengager
  const g = new THREE.Group();
  const x = -1.0;
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 8.0, 24), matRefractory());
  riser.position.set(x, 4.5, 0);
  g.add(tagPart(riser, {
    id: 'riser',
    title: 'Riser (tubo elevador)',
    category: 'Equipo principal',
    description: 'Reactor tubular vertical donde tiene lugar el craqueo catalítico en transporte neumático: la carga vaporizada y el catalizador caliente reaccionan en milisegundos mientras ascienden.',
    specs: 'Ø 0.6 m × 8 m · Tiempo de residencia 2–4 s · Refractario erosivo'
  }));

  // Feed injection nozzles (radial small pipes near the bottom)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), matHot());
    n.position.set(x + Math.cos(a) * 0.45, 1.5, Math.sin(a) * 0.45);
    n.rotation.z = Math.PI / 2;
    n.rotation.y = -a;
    g.add(n);
  }
  // A representative feed nozzle as a selectable part
  const feedNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 12), matHot());
  feedNozzle.rotation.z = Math.PI / 2;
  feedNozzle.position.set(x + 0.9, 1.5, 0);
  g.add(tagPart(feedNozzle, {
    id: 'feed-nozzles',
    title: 'Boquillas de inyección de carga',
    category: 'Tubería',
    description: 'Atomizan la carga (gasóleo de vacío precalentado) con vapor de dispersión en finas gotas para vaporización instantánea en contacto con el catalizador.',
    specs: 'Tipo Optimix / dual-flow · 6–8 inyectores radiales'
  }));

  return g;
}

function makeCatalystLines() {
  const g = new THREE.Group();

  // Spent catalyst line: from reactor/stripper bottom over to regenerator (sloping down)
  const spent = pipeSegment([-1.0, 2.0, 0], [3.5, 1.6, 0], matCatalyst(), 0.22);
  g.add(tagPart(spent, {
    id: 'spent-catalyst-line',
    title: 'Línea de catalizador agotado',
    category: 'Tubería',
    description: 'Tubo inclinado que transporta el catalizador con coque desde el stripper hasta el regenerador. Una válvula de tajadera (slide valve) controla el flujo y el diferencial de presión entre los recipientes.',
    specs: 'Ø 0.45 m · Refractario interno · Slide valve API 6D'
  }));

  // Slide valve representation on spent line
  const sv1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.45), matSteelDark());
  sv1.position.set(1.5, 1.8, 0);
  g.add(tagPart(sv1, {
    id: 'spent-slide-valve',
    title: 'Slide valve de catalizador agotado',
    category: 'Tubería',
    description: 'Válvula de placa deslizante que regula el caudal de catalizador agotado hacia el regenerador, manteniendo el control de inventario y el diferencial de presión.',
    specs: 'API 6D · Servicio erosivo · Actuador hidráulico'
  }));

  // Regenerated catalyst line: from regenerator bottom down to riser base
  const regen = pipeSegment([3.5, 1.6, 0], [-1.0, 1.0, 0], matCatalyst(), 0.22);
  g.add(tagPart(regen, {
    id: 'regen-catalyst-line',
    title: 'Línea de catalizador regenerado',
    category: 'Tubería',
    description: 'Conduce el catalizador caliente y limpio desde el regenerador hasta la base del riser, donde se mezcla con la carga vaporizada para iniciar las reacciones de craqueo.',
    specs: 'Ø 0.45 m · Refractario interno · T 700 °C'
  }));

  const sv2 = sv1.clone();
  sv2.position.set(1.0, 1.2, 0);
  g.add(tagPart(sv2, {
    id: 'regen-slide-valve',
    title: 'Slide valve de catalizador regenerado',
    category: 'Tubería',
    description: 'Válvula deslizante que controla la temperatura del riser regulando el caudal de catalizador caliente alimentado a la zona de reacción.',
    specs: 'API 6D · Lazo de control de temperatura de salida del riser'
  }));

  return g;
}

function makeFlueGasStack() {
  const g = new THREE.Group();
  const x = 3.5, z = -3.5;

  // Horizontal duct from regenerator dome to stack
  const duct = pipeSegment([3.5, 8.0, 0], [3.5, 8.0, -3.5], matSteelDark(), 0.35);
  g.add(duct);

  // CO boiler / waste heat boiler representation (a horizontal box)
  const wh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.4), matSteelDark());
  wh.position.set(x + 1.4, 8.0, -2.0);
  g.add(tagPart(wh, {
    id: 'co-boiler',
    title: 'Caldera de recuperación de calor (CO boiler)',
    category: 'Intercambio de calor',
    description: 'Recupera el calor de los gases de combustión del regenerador (700 °C) y oxida el CO residual, generando vapor de alta presión para la planta.',
    specs: 'Producción 60 t/h vapor 40 bar · Quemador suplementario'
  }));

  // Tall stack
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 10, 24), matSteelDark());
  stack.position.set(x, 9.0, z);
  g.add(tagPart(stack, {
    id: 'flue-stack',
    title: 'Chimenea de gases de combustión',
    category: 'Equipo principal',
    description: 'Evacúa los gases de combustión del regenerador hacia la atmósfera tras pasar por la caldera de recuperación y los equipos de control ambiental.',
    specs: 'Altura total 14 m · Ø 1.3 m · Acero refractado · Monitorización CEMS'
  }));

  // Cap rim
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 24), matSteel());
  cap.rotation.x = Math.PI / 2;
  cap.position.set(x, 14.0, z);
  g.add(cap);

  return g;
}

function makeMainFractionator() {
  // Tall column to the left of the reactor for product separation
  const g = new THREE.Group();
  const x = -6.5, R = 0.95;
  const baseY = 1.2;

  // Skirt
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 1.1, 0.9, 24), matSteelDark());
  skirt.position.set(x, baseY, 0);
  g.add(skirt);

  // Shell (single tall cylinder)
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 8.5, 32), matSteel());
  shell.position.set(x, baseY + 0.45 + 4.25, 0);
  g.add(tagPart(shell, {
    id: 'main-fractionator',
    title: 'Fraccionadora principal',
    category: 'Columna',
    description: 'Columna que separa los productos craqueados del FCC en fracciones: gases livianos por la cabeza, nafta, LCO (light cycle oil), HCO y slurry/decant oil por el fondo.',
    specs: 'Ø 1.9 m × 8.5 m · 30 platos · Pumparounds intermedios'
  }));

  // Flange rings to evoke trays
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.05, 10, 28), matSteelDark());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, baseY + 1.4 + i * 1.6, 0);
    g.add(ring);
  }

  // Top dome + overhead drum
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    matSteel()
  );
  dome.position.set(x, baseY + 0.45 + 8.5, 0);
  g.add(dome);

  // Overhead receiver drum (horizontal cylinder)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 24), matSteel());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x + 1.4, baseY + 0.45 + 8.5 + 0.6, 0);
  g.add(tagPart(drum, {
    id: 'overhead-drum',
    title: 'Tambor de cabeza',
    category: 'Equipo principal',
    description: 'Recibe los vapores condensados de la cabeza de la fraccionadora, separa el agua, los gases y la nafta inestabilizada; parte se devuelve como reflujo a la columna.',
    specs: 'Ø 0.9 m × 1.8 m · Tres fases · Bota de agua'
  }));

  // Hemispherical caps for drum
  [-0.9, 0.9].forEach((ox) => {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matSteel()
    );
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    c.position.set(x + 1.4 + ox, baseY + 0.45 + 8.5 + 0.6, 0);
    g.add(c);
  });

  // Reactor-to-fractionator vapor line (large pipe)
  const vapor = pipeSegment([-1.0, 6.5, 0], [-6.5, 6.5, 0], matHot(), 0.28);
  g.add(tagPart(vapor, {
    id: 'reactor-vapor-line',
    title: 'Línea de vapores del reactor',
    category: 'Tubería',
    description: 'Tubería de gran diámetro que transporta los vapores craqueados desde la cabeza del reactor hasta la fraccionadora principal, evitando condensaciones intermedias.',
    specs: 'Ø 0.55 m · Aislamiento térmico · T 520 °C'
  }));

  return g;
}

function makeAirBlower() {
  const g = new THREE.Group();
  const x = 7.0, z = 4.0;

  // Pedestal
  const ped = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1.4), matConcrete());
  ped.position.set(x, 0.85, z);
  g.add(ped);

  // Blower casing (cylindrical)
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.0, 24), matSteel());
  casing.rotation.z = Math.PI / 2;
  casing.position.set(x - 0.5, 1.6, z);
  g.add(tagPart(casing, {
    id: 'air-blower',
    title: 'Soplante de aire principal',
    category: 'Bombeo',
    description: 'Sopladora axial accionada por turbina de vapor o motor eléctrico que suministra el aire de combustión al regenerador a la presión y caudal requeridos.',
    specs: 'Caudal 90 000 Nm³/h · Presión 2.5 bar · 8 MW'
  }));

  // Motor / turbine
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 20), matMotor());
  motor.rotation.z = Math.PI / 2;
  motor.position.set(x + 0.6, 1.6, z);
  g.add(motor);

  // Inlet filter (box)
  const filter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), matSteelDark());
  filter.position.set(x - 1.4, 1.6, z);
  g.add(filter);

  // Air discharge pipe down to the regenerator
  const disch = pipeSegment([x - 0.5, 1.6, z], [x - 0.5, 1.6, 0.5], matCold(), 0.18);
  g.add(disch);
  const disch2 = pipeSegment([x - 0.5, 1.6, 0.5], [3.5, 2.2, 0.5], matCold(), 0.18);
  g.add(disch2);

  return g;
}

function makeFeedSystem() {
  const g = new THREE.Group();

  // Feed surge drum to the front-left
  const x = -6.5, z = 4.0;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.2, 24), matSteel());
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x, 1.4, z);
  g.add(tagPart(drum, {
    id: 'feed-drum',
    title: 'Tambor de carga',
    category: 'Equipo principal',
    description: 'Tambor amortiguador que estabiliza el caudal y la presión de la carga (gasóleo de vacío) antes de ser bombeada y precalentada hacia el riser.',
    specs: 'Ø 1.1 m × 2.2 m · 10 min de retención'
  }));
  // Caps
  [-1.1, 1.1].forEach((ox) => {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      matSteelDark()
    );
    c.rotation.z = ox > 0 ? -Math.PI / 2 : Math.PI / 2;
    c.position.set(x + ox, 1.4, z);
    g.add(c);
  });

  // Feed pump
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.7), matConcrete());
  ped.position.set(x + 2.0, 0.78, z);
  g.add(ped);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20), matSteel());
  pump.rotation.z = Math.PI / 2;
  pump.position.set(x + 1.6, 1.05, z);
  g.add(tagPart(pump, {
    id: 'feed-pump',
    title: 'Bomba de carga',
    category: 'Bombeo',
    description: 'Bomba centrífuga que envía la carga a alta presión a través del precalentador y las boquillas de inyección del riser.',
    specs: 'Caudal 60 m³/h · TDH 120 m · Sello dual API Plan 53A'
  }));
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 20), matMotor());
  motor.rotation.z = Math.PI / 2;
  motor.position.set(x + 2.4, 1.05, z);
  g.add(motor);

  // Feed line to riser
  const fl1 = pipeSegment([x + 2.4, 1.05, z], [x + 2.4, 1.05, 0], matHot(), 0.1);
  g.add(fl1);
  const fl2 = pipeSegment([x + 2.4, 1.05, 0], [-1.0, 1.5, 0], matHot(), 0.1);
  g.add(tagPart(fl2, {
    id: 'feed-line',
    title: 'Línea de carga al riser',
    category: 'Tubería',
    description: 'Conduce la carga precalentada y atomizada con vapor de dispersión hasta las boquillas de inyección situadas en la base del riser.',
    specs: 'Acero al carbono · Ø 200 mm · Aislamiento 75 mm'
  }));

  return g;
}

export function buildFccUnit() {
  const root = new THREE.Group();
  root.name = 'FCC';

  root.add(makeBase());
  root.add(makeRegenerator());
  root.add(makeReactor());
  root.add(makeRiser());
  root.add(makeCatalystLines());
  root.add(makeFlueGasStack());
  root.add(makeMainFractionator());
  root.add(makeAirBlower());
  root.add(makeFeedSystem());

  return root;
}
