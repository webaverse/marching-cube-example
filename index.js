import * as THREE from 'three';
import metaversefile from 'metaversefile'
import { TerrainMan } from './terrainman.js';

const { useFrame, useLocalPlayer, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;



export default () => {
    const physics = usePhysics();

    const rootScene = new THREE.Object3D();
    const geoUtils = useGeometryUtils();
    const terrain = new TerrainMan(geoUtils);
    rootScene.add(terrain.object);

    let physicsIds = [];
    // terrain.children.forEach(mesh => {
    //     const physicsId = physics.addGeometry(mesh)
    //     physicsIds.push(physicsId);
    // });
    // const physicsId = physics.addGeometry(terrain)
    // physicsIds.push(physicsId);

    useCleanup(() => {
        for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
        }
    });

    const player = useLocalPlayer();
    const nextPosition = player.position.clone();
    terrain.update(player.position);
    const diffDis = 0;

    useFrame(() => {
        nextPosition.copy(player.position);
        terrain.update(player.position, () => {
            // for (const physicsId of physicsIds) {
            //     physics.removeGeometry(physicsId);
            // }    
            // physicsIds = [];
            // const physicsId = physics.addGeometry(terrain)
            // physicsIds.push(physicsId);
        });
    });
    rootScene.add(new THREE.AxesHelper(1000))

    return rootScene;
}