import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initRenderer, initCamera, initStats, initOrbitControls } from './util.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const renderer = initRenderer({ antialias: true });
const stats = initStats();

const perspectiveCamera = initCamera(new THREE.Vector3(0, 60, 160));

const ORTHO_SIZE = 80;
let aspect = window.innerWidth / window.innerHeight;
const orthographicCamera = new THREE.OrthographicCamera(
  -ORTHO_SIZE * aspect,
  ORTHO_SIZE * aspect,
  ORTHO_SIZE,
  -ORTHO_SIZE,
  0.1,
  1000
);
orthographicCamera.position.copy(perspectiveCamera.position);
orthographicCamera.lookAt(0, 0, 0);

let currentCamera = perspectiveCamera;
let controls = initOrbitControls(currentCamera, renderer);

const ambientLight = new THREE.AmbientLight(0x808080);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2048, 0);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
scene.add(sunLight);

const sunGeometry = new THREE.SphereGeometry(10, 48, 48);
const sunMaterial = new THREE.MeshPhongMaterial({
  color: 0xffaa00,
  emissive: 0xffaa00,
  shininess: 60
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 0, 0);
sunMesh.castShadow = false;
sunMesh.receiveShadow = false;
scene.add(sunMesh);

const textureLoader = new THREE.TextureLoader();

const planetConfigs = [
  { name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6', rotationSpeed: 0.02,  orbitSpeed: 0.02,  texture: './Mercury.jpg' },
  { name: 'Venus',   radius: 3.0, distance: 35, color: '#e39e1c', rotationSpeed: 0.015, orbitSpeed: 0.015, texture: './Venus.jpg' },
  { name: 'Earth',   radius: 3.5, distance: 50, color: '#3498db', rotationSpeed: 0.01,  orbitSpeed: 0.01,  texture: './Earth.jpg' },
  { name: 'Mars',    radius: 2.5, distance: 65, color: '#c0392b', rotationSpeed: 0.008, orbitSpeed: 0.008, texture: './Mars.jpg' }
];

const planetObjects = [];

const cameraState = { current: 'Perspective' };

function setCamera(mode) {
  const oldPos = currentCamera.position.clone();
  const oldTarget = controls.target.clone();

  if (mode === 'Perspective') {
    currentCamera = perspectiveCamera;
  } else {
    orthographicCamera.position.copy(oldPos);
    orthographicCamera.lookAt(oldTarget);
    currentCamera = orthographicCamera;
  }

  controls.dispose();
  controls = initOrbitControls(currentCamera, renderer);
  controls.target.copy(oldTarget);
  cameraState.current = mode;
}

const cameraActions = {
  switchCamera: () => {
    const next = cameraState.current === 'Perspective' ? 'Orthographic' : 'Perspective';
    setCamera(next);
  }
};

const gui = new GUI();

const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(cameraActions, 'switchCamera').name('Switch Camera Type');
cameraFolder.add(cameraState, 'current').name('Current Camera').listen();

for (const cfg of planetConfigs) {
  const pivot = new THREE.Object3D();
  scene.add(pivot);

  const geometry = new THREE.SphereGeometry(cfg.radius, 48, 48);

  const materialParams = { color: cfg.color, shininess: 30 };
  if (cfg.texture) materialParams.map = textureLoader.load(cfg.texture);
  const material = new THREE.MeshPhongMaterial(materialParams);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(cfg.distance, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pivot.add(mesh);

  const params = { rotationSpeed: cfg.rotationSpeed, orbitSpeed: cfg.orbitSpeed };

  const folder = gui.addFolder(cfg.name);
  folder.add(params, 'rotationSpeed', 0, 0.1, 0.001).name('Rotation Speed');
  folder.add(params, 'orbitSpeed', 0, 0.1, 0.001).name('Orbit Speed');

  planetObjects.push({ pivot, mesh, params });
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  aspect = window.innerWidth / window.innerHeight;

  perspectiveCamera.aspect = aspect;
  perspectiveCamera.updateProjectionMatrix();

  orthographicCamera.left = -ORTHO_SIZE * aspect;
  orthographicCamera.right = ORTHO_SIZE * aspect;
  orthographicCamera.top = ORTHO_SIZE;
  orthographicCamera.bottom = -ORTHO_SIZE;
  orthographicCamera.updateProjectionMatrix();
});

function render() {
  stats.update();
  controls.update();

  for (const obj of planetObjects) {
    obj.pivot.rotation.y += obj.params.orbitSpeed;
    obj.mesh.rotation.y += obj.params.rotationSpeed;
  }

  renderer.render(scene, currentCamera);
  requestAnimationFrame(render);
}

render();
