import * as THREE from 'three';

const steel = () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.7, roughness: 0.35 });
const steelDark = () => new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.6, roughness: 0.5 });
const hot = () => new THREE.MeshStandardMaterial({ color: 0xc94a3b, metalness: 0.4, roughness: 0.5 });
const cold = () => new THREE.MeshStandardMaterial({ color: 0x4a7fc9, metalness: 0.4, roughness: 0.5 });
const frame = () => new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.6, roughness: 0.55 });

function tagPart(mesh, data) {
  mesh.userData = { ...data };
  return mesh;
}

export function buildHeatExchanger() {
  const root = new THREE.Group();

  // Shell
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 5, 32),
    steel()
  );
  shell.rotation.z = Math.PI / 2;
  shell.position.set(0, 1.6, 0);
  root.add(tagPart(shell, {
    id: 'shell',
    title: 'Carcasa (shell)',
    category: 'Cuerpo',
    description: 'Recipiente cilíndrico que aloja el haz tubular. El fluido del lado carcasa circula alrededor de los tubos guiado por deflectores (baffles).',
    specs: 'Acero al carbono SA-516 Gr.70 · Ø 1.6 m × 5 m · Diseño 10 bar / 200 °C'
  }));

  // Channel heads (left/right)
  [-1, 1].forEach((s) => {
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.6, 32),
      steelDark()
    );
    head.rotation.z = Math.PI / 2;
    head.position.set(s * 2.8, 1.6, 0);
    root.add(tagPart(head, {
      id: `head-${s > 0 ? 'right' : 'left'}`,
      title: `Cabezal ${s > 0 ? 'derecho' : 'izquierdo'}`,
      category: 'Cuerpo',
      description: 'Cabezal removible que permite acceso al haz tubular para limpieza e inspección. Distribuye el fluido del lado tubos a través del haz.',
      specs: 'Brida ANSI 150# · Tapa hemisférica'
    }));

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      steelDark()
    );
    dome.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    dome.position.set(s * 3.1, 1.6, 0);
    root.add(dome);
  });

  // Nozzles
  const nozzles = [
    { pos: [-2.5, 2.4, 0], rot: [0, 0, 0], mat: hot(), id: 'nozzle-hot-in', title: 'Tobera entrada fluido caliente', desc: 'Entrada del fluido caliente al lado tubos.' },
    { pos: [2.5, 2.4, 0], rot: [0, 0, 0], mat: hot(), id: 'nozzle-hot-out', title: 'Tobera salida fluido caliente', desc: 'Salida del fluido caliente del lado tubos.' },
    { pos: [-1.5, 0.8, 0], rot: [Math.PI, 0, 0], mat: cold(), id: 'nozzle-cold-in', title: 'Tobera entrada fluido frío', desc: 'Entrada del fluido frío al lado carcasa.' },
    { pos: [1.5, 0.8, 0], rot: [Math.PI, 0, 0], mat: cold(), id: 'nozzle-cold-out', title: 'Tobera salida fluido frío', desc: 'Salida del fluido frío del lado carcasa.' },
  ];
  nozzles.forEach((n) => {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16), n.mat);
    noz.position.set(...n.pos);
    noz.rotation.set(...n.rot);
    root.add(tagPart(noz, {
      id: n.id,
      title: n.title,
      category: 'Tubería',
      description: n.desc,
      specs: 'DN 200 · ANSI 150#'
    }));
  });

  // Saddle supports
  [-1.5, 1.5].forEach((x) => {
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 1.2), frame());
    sad.position.set(x, 0.35, 0);
    root.add(tagPart(sad, {
      id: `saddle-${x < 0 ? 'left' : 'right'}`,
      title: `Soporte tipo silleta ${x < 0 ? 'izquierdo' : 'derecho'}`,
      category: 'Estructura',
      description: 'Silleta soldada al cimiento que soporta la carcasa permitiendo la dilatación térmica.',
      specs: 'Acero estructural · Una silleta fija y otra deslizante'
    }));
  });

  return root;
}
