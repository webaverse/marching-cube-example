import * as THREE from 'three';
import metaversefile from 'metaversefile';

const {useFrame, useLocalPlayer, useCleanup, useMaterials, usePhysics} = metaversefile;

export default () => {

  const physics = usePhysics();

  const rootScene = new THREE.Object3D();

  const dims = [32, 32, 32];
  const shift = [0, 0, 0];
  const scale = [1.0, 1.0, 1.0];
  let potential = [];

  const center = new THREE.Vector3(...dims).multiplyScalar(0.5);

  for (let x = 0; x < dims[0]; x++) {
    for (let y = 0; y < dims[1]; y++) {
      for (let z = 0; z < dims[2]; z++) {
        potential[x * dims[0] * dims[1] + y * dims[0] + z] = -1;
        if (new THREE.Vector3(x, y, z).distanceTo(center) < dims[0] / 2 - 1) {
          potential[x * dims[0] * dims[1] + y * dims[0] + z] = new THREE.Vector3(x, y, z).distanceTo(center);
        }
      }
    }
  }

  const output = physics.marchingCubes(dims, potential, shift, scale);

  let geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.Uint16BufferAttribute(output.faces, 1));
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.positions, 3));

  rootScene.add(new THREE.Mesh(
    geometry, new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, wireframe: false })
  ));

  rootScene.add(new THREE.Mesh(
    geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, wireframe: true })
  ));

  useCleanup(() => {});

  return rootScene;
}
