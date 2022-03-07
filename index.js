import * as THREE from 'three';
import metaversefile from 'metaversefile'
import { TerrainManager } from './terrain-manager.js';

const { useFrame, useLocalPlayer, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;


export default () => {

    const physics = usePhysics();
    const geometryUtils = useGeometryUtils();

    const rootScene = new THREE.Object3D();

    const terrainManger = new TerrainManager(128, 2, geometryUtils);
    const terrain = terrainManger.mesh;

    rootScene.add(terrain);

    const player = useLocalPlayer();
    terrainManger.updateCenter(player.position);
    terrainManger.updateChunk();

    useFrame(() => {

        terrainManger.updateCenter(player.position);
        terrainManger.updateChunk();
    });

    rootScene.add(new THREE.AxesHelper(1000))

    return rootScene;
}
