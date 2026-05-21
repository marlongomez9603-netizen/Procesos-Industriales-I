import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { models } from './models/index.js';

// Persistent settings ------------------------------------------------------
const STORAGE_PREFIX = 'pi:';
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch {}
  },
};
const SK = {
  theme: 'theme',
  model: 'modelId',
  colors: 'colorByCategory',
  transformMode: 'transformMode',
  pose: (id) => `pose:${id}`,
  camera: 'camera',
};
// --------------------------------------------------------------------------

const container = document.getElementById('canvas-container');
const loadingEl = document.getElementById('loading');
const infoEl = document.getElementById('info');
const partsListEl = document.getElementById('parts-list');
const modelSelect = document.getElementById('model-select');
const modelDescription = document.getElementById('model-description');

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
container.appendChild(tooltip);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1419);
scene.fog = new THREE.Fog(0x0f1419, 30, 90);

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return new THREE.Color(v || fallback);
}

function syncSceneToTheme() {
  const bg = cssColor('--bg', '#0f1419');
  scene.background.copy(bg);
  if (scene.fog) scene.fog.color.copy(bg);
  if (typeof ground !== 'undefined' && ground.material) {
    ground.material.color.copy(cssColor('--panel-2', '#1f2630'));
  }
  if (typeof grid !== 'undefined' && grid.material) {
    grid.material.color.copy(cssColor('--grid-color', '#2d3744'));
  }
}

const savedTheme = store.get(SK.theme, 'dark');
document.documentElement.setAttribute('data-theme', savedTheme);

// Mobile drawer
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const backdrop = document.getElementById('backdrop');

function setDrawer(open) {
  sidebar.classList.toggle('open', open);
  menuToggle.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  backdrop.hidden = !open;
  // animate backdrop fade
  if (open) requestAnimationFrame(() => backdrop.classList.add('visible'));
  else backdrop.classList.remove('visible');
}

menuToggle.addEventListener('click', () => {
  setDrawer(!sidebar.classList.contains('open'));
});
backdrop.addEventListener('click', () => setDrawer(false));

// Close drawer on selecting a part from the list (better UX on mobile)
partsListEl.addEventListener('click', () => {
  if (window.matchMedia('(max-width: 820px)').matches) setDrawer(false);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  store.set(SK.theme, next);
  syncSceneToTheme();
});

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(18, 14, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 5, 0);

// Lighting
scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x1a2028, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(20, 30, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x6688aa, 0.35);
fill.position.set(-15, 10, -10);
scene.add(fill);

// Ground
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 64),
  new THREE.MeshStandardMaterial({ color: 0x1f2630, roughness: 0.95, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(40, 40, 0x2d3744, 0x2d3744);
grid.position.y = 0.01;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

syncSceneToTheme();

// Transform controls (for moving/rotating the loaded model)
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.size = 0.8;
transformControls.setSpace('world');
transformControls.addEventListener('dragging-changed', (e) => {
  controls.enabled = !e.value;
});
transformControls.addEventListener('objectChange', () => {
  updateCoords();
  savePose();
});
scene.add(transformControls);
transformControls.visible = false;
transformControls.enabled = false;

const initialPose = new THREE.Vector3();
const initialRot = new THREE.Euler();

// UI elements for transforms
const btnTranslate = document.getElementById('btn-translate');
const btnRotate = document.getElementById('btn-rotate');
const btnOff = document.getElementById('btn-off');
const btnDefault = document.getElementById('btn-default');
const coordX = document.getElementById('coord-x');
const coordY = document.getElementById('coord-y');
const coordZ = document.getElementById('coord-z');

function setTransformMode(mode, { persist = true } = {}) {
  [btnTranslate, btnRotate, btnOff].forEach((b) => b.classList.remove('active'));
  if (mode === 'translate') {
    transformControls.setMode('translate');
    transformControls.visible = true;
    transformControls.enabled = true;
    btnTranslate.classList.add('active');
  } else if (mode === 'rotate') {
    transformControls.setMode('rotate');
    transformControls.visible = true;
    transformControls.enabled = true;
    btnRotate.classList.add('active');
  } else {
    mode = 'off';
    transformControls.visible = false;
    transformControls.enabled = false;
    btnOff.classList.add('active');
  }
  if (persist) store.set(SK.transformMode, mode);
}

function savePose() {
  if (!currentModelGroup || !currentModelId) return;
  store.set(SK.pose(currentModelId), {
    pos: currentModelGroup.position.toArray(),
    rot: [
      currentModelGroup.rotation.x,
      currentModelGroup.rotation.y,
      currentModelGroup.rotation.z,
    ],
  });
}

btnTranslate.addEventListener('click', () => setTransformMode('translate'));
btnRotate.addEventListener('click', () => setTransformMode('rotate'));
btnOff.addEventListener('click', () => setTransformMode('off'));
btnDefault.addEventListener('click', () => {
  if (!currentModelGroup) return;
  currentModelGroup.position.set(0, 0, 0);
  currentModelGroup.rotation.set(0, 0, 0);
  frameCameraToModel();
  updateCoords();
  savePose();
  store.set(SK.camera, {
    pos: camera.position.toArray(),
    target: controls.target.toArray(),
  });
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return; // don't hijack browser shortcuts (Ctrl+R, etc.)
  if (e.key === 'g' || e.key === 'G') setTransformMode('translate');
  else if (e.key === 'r' || e.key === 'R') setTransformMode('rotate');
  else if (e.key === 'Escape') setTransformMode('off');
});

function updateCoords() {
  if (!currentModelGroup) return;
  coordX.textContent = currentModelGroup.position.x.toFixed(2);
  coordY.textContent = currentModelGroup.position.y.toFixed(2);
  coordZ.textContent = currentModelGroup.position.z.toFixed(2);
}

// Model management
let currentModelGroup = null;
let currentModelId = null;
let selectableParts = [];
let selected = null;
let hovered = null;
const HIGHLIGHT_COLOR = new THREE.Color(0xff7a45);
const HOVER_COLOR = new THREE.Color(0x4aa3ff);

function clearModel() {
  if (currentModelGroup) {
    transformControls.detach();
    scene.remove(currentModelGroup);
    currentModelGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
  currentModelGroup = null;
  selectableParts = [];
  selected = null;
  hovered = null;
}

// Palette per category (used by the color toggle)
const CATEGORY_COLORS = {
  'Estructura':         0x4aa3ff,
  'Columna':            0xff7a45,
  'Equipo principal':   0xe53935,
  'Intercambio de calor': 0xab47bc,
  'Bombeo':             0x66bb6a,
  'Tubería':            0xffca28,
  'Cuerpo':             0x26a69a,
};
const DEFAULT_CATEGORY_COLOR = 0x9e9e9e;

function categoryColor(cat) {
  const v = CATEGORY_COLORS[cat];
  return new THREE.Color(v ?? DEFAULT_CATEGORY_COLOR);
}

function collectSelectableParts(root) {
  const parts = [];
  root.traverse((o) => {
    if (o.isMesh && o.userData && o.userData.title) {
      // store original emissive as the default baseline
      if (o.material && o.material.emissive) {
        o.userData._origEmissive = o.material.emissive.clone();
        o.userData._origEmissiveIntensity = o.material.emissiveIntensity ?? 1;
        o.userData._baseEmissive = o.userData._origEmissive.clone();
        o.userData._baseEmissiveIntensity = o.userData._origEmissiveIntensity;
      }
      o.castShadow = true;
      o.receiveShadow = true;
      parts.push(o);
    } else if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return parts;
}

function setEmissive(mesh, color, intensity) {
  if (!mesh.material || !mesh.material.emissive) return;
  mesh.material.emissive.copy(color);
  mesh.material.emissiveIntensity = intensity;
}

function restoreEmissive(mesh) {
  if (!mesh.material || !mesh.material.emissive) return;
  const base = mesh.userData._baseEmissive || mesh.userData._origEmissive || new THREE.Color(0x000000);
  mesh.material.emissive.copy(base);
  mesh.material.emissiveIntensity = mesh.userData._baseEmissiveIntensity ?? mesh.userData._origEmissiveIntensity ?? 1;
}

let colorByCategoryOn = store.get(SK.colors, false);

function applyCategoryColors() {
  selectableParts.forEach((mesh) => {
    if (!mesh.material || !mesh.material.emissive) return;
    if (colorByCategoryOn) {
      const col = categoryColor(mesh.userData.category);
      mesh.userData._baseEmissive = col;
      mesh.userData._baseEmissiveIntensity = 0.55;
    } else {
      mesh.userData._baseEmissive = mesh.userData._origEmissive.clone();
      mesh.userData._baseEmissiveIntensity = mesh.userData._origEmissiveIntensity;
    }
    // Don't override the active selection's highlight
    if (mesh !== selected && mesh !== hovered) {
      restoreEmissive(mesh);
    }
  });
}

function refreshLegend() {
  const legendEl = document.getElementById('legend');
  if (!colorByCategoryOn) {
    legendEl.classList.remove('visible');
    legendEl.innerHTML = '';
    return;
  }
  const cats = new Set();
  selectableParts.forEach((m) => cats.add(m.userData.category || '—'));
  legendEl.innerHTML = '';
  cats.forEach((cat) => {
    const li = document.createElement('li');
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = '#' + categoryColor(cat).getHexString();
    li.appendChild(sw);
    const label = document.createElement('span');
    label.textContent = cat;
    li.appendChild(label);
    legendEl.appendChild(li);
  });
  legendEl.classList.add('visible');
}

const toggleColors = document.getElementById('toggle-colors');
toggleColors.checked = colorByCategoryOn;
toggleColors.addEventListener('change', (e) => {
  colorByCategoryOn = e.target.checked;
  store.set(SK.colors, colorByCategoryOn);
  applyCategoryColors();
  refreshLegend();
});

function selectPart(mesh) {
  if (selected && selected !== mesh) restoreEmissive(selected);
  selected = mesh;
  if (mesh) {
    setEmissive(mesh, HIGHLIGHT_COLOR, 0.55);
    showInfo(mesh.userData);
    highlightInList(mesh.userData.id);
  } else {
    showInfo(null);
    highlightInList(null);
  }
}

const infoModal = document.getElementById('info-modal');
document.getElementById('info-close').addEventListener('click', () => {
  if (selected) restoreEmissive(selected);
  selected = null;
  highlightInList(null);
  showInfo(null);
});

function showInfo(data) {
  if (!data) {
    infoEl.innerHTML = '';
    infoModal.hidden = true;
    return;
  }
  infoEl.innerHTML = `
    <h3>${escapeHtml(data.title)}</h3>
    ${data.category ? `<span class="tag">${escapeHtml(data.category)}</span>` : ''}
    <p>${escapeHtml(data.description || 'Sin descripción.')}</p>
    ${data.specs ? `<p class="muted">${escapeHtml(data.specs)}</p>` : ''}
  `;
  infoModal.hidden = false;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function refreshPartsList() {
  partsListEl.innerHTML = '';
  // Group unique by id (some parts may share id if grouped)
  const seen = new Map();
  selectableParts.forEach((p) => {
    const id = p.userData.id;
    if (!seen.has(id)) seen.set(id, p);
  });
  for (const [id, mesh] of seen) {
    const li = document.createElement('li');
    li.textContent = mesh.userData.title;
    li.dataset.id = id;
    li.addEventListener('click', () => {
      selectPart(mesh);
      focusCameraOn(mesh);
    });
    partsListEl.appendChild(li);
  }
}

function highlightInList(id) {
  partsListEl.querySelectorAll('li').forEach((li) => {
    li.classList.toggle('active', li.dataset.id === id);
  });
}

function focusCameraOn(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  controls.target.lerp(center, 0.6);
}

function loadModel(modelDef) {
  clearModel();
  currentModelGroup = modelDef.build();
  currentModelId = modelDef.id;
  scene.add(currentModelGroup);
  selectableParts = collectSelectableParts(currentModelGroup);
  refreshPartsList();
  showInfo(null);
  modelDescription.textContent = modelDef.description || '';

  initialPose.copy(currentModelGroup.position);
  initialRot.copy(currentModelGroup.rotation);

  // Restore saved pose for this model, if any
  const savedPose = store.get(SK.pose(currentModelId));
  if (savedPose && savedPose.pos && savedPose.rot) {
    currentModelGroup.position.fromArray(savedPose.pos);
    currentModelGroup.rotation.set(savedPose.rot[0], savedPose.rot[1], savedPose.rot[2]);
  }

  transformControls.attach(currentModelGroup);
  const savedMode = store.get(SK.transformMode, 'off');
  setTransformMode(savedMode, { persist: false });
  updateCoords();

  // Re-apply category colors if the toggle is on for the new model
  applyCategoryColors();
  refreshLegend();

  // Frame the camera to model bounds (only if no camera saved)
  const savedCam = store.get(SK.camera);
  if (!savedCam) frameCameraToModel();
}

function frameCameraToModel() {
  if (!currentModelGroup) return;
  const box = new THREE.Box3().setFromObject(currentModelGroup);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  const dist = Math.max(size.x, size.y, size.z) * 1.6;
  camera.position.set(center.x + dist, center.y + dist * 0.7, center.z + dist);
  camera.near = 0.1;
  camera.far = dist * 10;
  camera.updateProjectionMatrix();
  controls.update();
}

// Populate model dropdown
models.forEach((m, i) => {
  const opt = document.createElement('option');
  opt.value = m.id;
  opt.textContent = m.name;
  modelSelect.appendChild(opt);
});
modelSelect.addEventListener('change', (e) => {
  const def = models.find((m) => m.id === e.target.value);
  if (def) {
    store.set(SK.model, def.id);
    loadModel(def);
  }
});

// Initial model: restore from storage if valid, else first
const savedModelId = store.get(SK.model);
const initialModel = models.find((m) => m.id === savedModelId) || models[0];
modelSelect.value = initialModel.id;
loadModel(initialModel);

// Apply saved camera (after loadModel, which only frames if none saved)
const savedCamera = store.get(SK.camera);
if (savedCamera && savedCamera.pos && savedCamera.target) {
  camera.position.fromArray(savedCamera.pos);
  controls.target.fromArray(savedCamera.target);
  controls.update();
}

let cameraSaveTimer = null;
controls.addEventListener('change', () => {
  if (cameraSaveTimer) return;
  cameraSaveTimer = setTimeout(() => {
    cameraSaveTimer = null;
    store.set(SK.camera, {
      pos: camera.position.toArray(),
      target: controls.target.toArray(),
    });
  }, 250);
});

loadingEl.style.display = 'none';

// Picking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(selectableParts, false);
  return hits.length ? hits[0].object : null;
}

let downX = 0, downY = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downX = e.clientX; downY = e.clientY;
});
renderer.domElement.addEventListener('pointerup', (e) => {
  const dx = Math.abs(e.clientX - downX);
  const dy = Math.abs(e.clientY - downY);
  const threshold = e.pointerType === 'touch' ? 10 : 4;
  if (dx > threshold || dy > threshold) return; // drag, ignore
  updatePointer(e);
  const obj = pick();
  if (obj) selectPart(obj);
  else selectPart(null);
});

renderer.domElement.addEventListener('pointermove', (e) => {
  updatePointer(e);
  const obj = pick();
  if (hovered && hovered !== obj && hovered !== selected) {
    restoreEmissive(hovered);
  }
  if (obj && obj !== selected) {
    setEmissive(obj, HOVER_COLOR, 0.35);
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX - container.getBoundingClientRect().left) + 'px';
    tooltip.style.top = (e.clientY - container.getBoundingClientRect().top) + 'px';
    tooltip.textContent = obj.userData.title;
    container.style.cursor = 'pointer';
  } else if (!obj) {
    tooltip.style.display = 'none';
    container.style.cursor = 'default';
  }
  hovered = obj;
});

renderer.domElement.addEventListener('pointerleave', () => {
  if (hovered && hovered !== selected) restoreEmissive(hovered);
  hovered = null;
  tooltip.style.display = 'none';
});

// Resize
function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
const ro = new ResizeObserver(resize);
ro.observe(container);
resize();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
