
import * as THREE from 'three'
import * as OrbitControls from "three/examples/jsm/controls/OrbitControls";
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";
import Stats from "three/examples/jsm/libs/stats.module";
import { TerrainManager } from './terrainman.js';
const app = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, antialias: true });
const scene = new THREE.Scene();

scene.fog = new THREE.Fog(0xffffff, 100, 6000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
const controls = new OrbitControls.OrbitControls(camera, renderer.domElement);
const terrainManger = new TerrainManager();
let water, sky, sunPosition = new THREE.Vector3();;

var stats = new Stats();

stats.setMode(0); // 0: fps, 1: ms

// 放在左上角
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild(stats.domElement);
const waterHeight = 40;

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

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('./textures/waternormals.jpg', function (texture) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;


      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );
  water.material.uniforms.size.value = 10;

  water.rotation.x = - Math.PI / 2;
  water.position.y = waterHeight;

  scene.add(water);


  sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  updateSun();
}


const parameters = {
  elevation: 30,
  azimuth: 180
};
const pmremGenerator = new THREE.PMREMGenerator(renderer);
function updateSun() {

  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sunPosition.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms['sunPosition'].value.copy(sunPosition);
  water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

  // scene.environment = pmremGenerator.fromScene(sky).texture;
}


let fps = 0;
let time = performance.now();

function loop() {
  terrainManger.update(camera.position)
  renderer.render(scene, camera);

  water.material.uniforms['time'].value += 0.01;
  requestAnimationFrame(loop);
  const now = performance.now();
  fps++;
  if (now - time > 1000) {
    time = now;
    console.log(fps);
    fps = 0;
  }

  stats.update();
}
init();
loop();
