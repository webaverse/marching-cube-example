import * as THREE from 'three';
import metaversefile from 'metaversefile'
import { TerrainManager } from './terrain-manager.js';

const { useFrame, useLocalPlayer, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;


export default () => {

    const physics = usePhysics();
    const geometryUtils = useGeometryUtils();

    const rootScene = new THREE.Object3D();


    const terrainManager = new TerrainManager(128, 2, geometryUtils);
    const terrain = terrainManager.mesh;

    let physicsIdChunkIdPairs = [];

    let chunkIdMeshPairs = terrainManager.getInitialChunkMeshes();

    chunkIdMeshPairs.forEach(pair => {

        if (!!pair[1]) {
            rootScene.add(pair[1]);
            const physicsId = physics.addGeometry(pair[1]);
            physicsIdChunkIdPairs.push({ physicsId: physicsId, chunkId: pair[0] });
        }
    });

    terrainManager.onRemoveChunks = async (chunkIds) => {
        physicsIdChunkIdPairs.filter(pair => chunkIds.includes(pair.chunkId))
        .forEach(pair => {
            physics.removeGeometry(pair.physicsId);
            physicsIdChunkIdPairs.re
        });

        physicsIdChunkIdPairs = physicsIdChunkIdPairs.filter(pair => !chunkIds.includes(pair.chunkId));
    };

    terrainManager.onAddChunk = async (chunkId) => {
        const mesh = terrainManager.getChunkMesh(chunkId);
        const physicsId = physics.addGeometry(mesh);
        physicsIdChunkIdPairs.push({ physicsId: physicsId, chunkId: chunkId });
    };

    rootScene.add(terrain);

    const player = useLocalPlayer();
    player.position.y = 100;
    terrainManager.updateCenter(player.position);
    terrainManager.updateChunk();

    useFrame(() => {

        terrainManager.updateCenter(player.position);
        terrainManager.updateChunk();
    });

    rootScene.add(new THREE.AxesHelper(1000))

    return rootScene;
}
