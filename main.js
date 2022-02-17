
import * as THREE from 'three'
import * as OrbitControls from "three/examples/jsm/controls/OrbitControls";
import { TerrainManager } from './terrainman.js';
const app = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
const controls = new OrbitControls.OrbitControls(camera, renderer.domElement);
const terrainManger = new TerrainManager(); 
function init() {
  camera.position.y = 100.1;
  camera.position.z = 0.01;
  controls.update();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff);
  window.addEventListener('resize', (ev) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  app.append(renderer.domElement);
  terrainManger.update(camera.position);
  
  scene.add(terrainManger._group);
  scene.add(new THREE.Mesh(new THREE.BoxBufferGeometry(5, 100, 5), new THREE.MeshBasicMaterial({ color: 0xafaf00 })));
  scene.add(new THREE.AxesHelper(10000));
  const dirLight = new THREE.DirectionalLight(0xcfcfcf);
  dirLight.position.set(100, 70, 100);
  scene.add(dirLight);
  scene.add(new THREE.HemisphereLight(0xafafaf, 0x555555));
}
function loop() {
  terrainManger.update(camera.position) 
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
init();
loop();
