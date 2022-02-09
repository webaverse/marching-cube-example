import * as THREE from 'three';
import metaversefile from 'metaversefile'
import Terrain from './terrain.js';

const { useFrame, useLocalPlayer, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;



export default () => {
    const physics = usePhysics();
    const geometryUtils = useGeometryUtils();

    const rootScene = new THREE.Object3D();
    const terrain = new Terrain(physics, geometryUtils);
    rootScene.add(terrain);

    const physicsIds = [];
    // terrain.children.forEach(mesh => {
    //     const physicsId = physics.addGeometry(mesh)
    //     physicsIds.push(physicsId);
    // });
    const physicsId = physics.addGeometry(terrain)
    physicsIds.push(physicsId);


    useCleanup(() => {
        for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
        }
    });

    return rootScene;
}