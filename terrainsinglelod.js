import * as THREE from 'three';
import Chunk from './chunk.js';
import { terrainMaterial } from './material.js';

export default class TerrainSingle extends THREE.Object3D {
    constructor(physics) {
        super();
        this.physics = physics;
        this.chunks = {};
        this.chunkSize = 64;
        this.maxChunkNum = 121;
        this.levelChunks = {};
        this.maxLevel = 3;
        this.center = {};
        this.changed = false;

        // this.terrainGeometry = new THREE.BufferGeometry();
        // this.terrainMesh = new THREE.Mesh(this.terrainGeometry, terrainMaterial);


        // //center chunk   charater use chunk;
        // this.centerChunks = new THREE.Object3D();
        // this.add(this.centerChunks);

        for (let i = 0; i < this.maxLevel; i++) {
            this.buildLevelChunk(i);
        }

    }

    updateView(position, onchange) {

        // if (onchange && this.changed) {
        //     onchange();
        //     this.changed = false;
        // } 
    }


    updateBuildChunk(position, level) { 
        const px = position.x;
        const pz = position.z;

        const chunkSize = this.chunkSize * (2 ** level)
        const cx = Math.floor(px / chunkSize);
        const cz = Math.floor(pz / chunkSize);
        const center = this.center[level];
        // const needUpdate = cx - center.x >= 1
        //     || cz - center.z >= 1
        //     || center.x - cx >= 2
        //     || center.z - cz >= 2;
        const needUpdate = cx !== center.x || cz !== center.z
        console.log([this.center[level].x - cx, this.center[level].z - cz]);
        if (!needUpdate)
            return void 0;
        this.changed = true;

        this.center[level].x = cx;
        this.center[level].z = cz;

        const enableChunks = {};
        const disableChunks = [];
        const levelChunk = this.levelChunks[level];
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx;
                const iz = j + cz;
                if (levelChunk[`${ix}_${iz}`]) {
                    enableChunks[`${ix}_${iz}`] = levelChunk[`${ix}_${iz}`];
                    delete levelChunk[`${ix}_${iz}`]
                }
            }
        }
        for (const key in levelChunk) {
            disableChunks.push(levelChunk[key]);
            delete levelChunk[key]
        }

        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx;
                const iz = j + cz;
                const px = (i + cx) * chunkSize;
                const pz = (j + cz) * chunkSize;
                if (enableChunks[`${ix}_${iz}`]) {
                    levelChunk[`${ix}_${iz}`] = enableChunks[`${ix}_${iz}`];
                } else {
                    const chunk = disableChunks.pop();
                    chunk.updateXZ(chunkSize, ix, iz, px, pz);

                    if (!chunk)
                        console.error('chunk 不存在！');

                    levelChunk[chunk.uid] = chunk;
                }
            }
        }

    }

    buildLevelChunk(level, orign = new THREE.Vector3, cx = 0, cz = 0) {
        if (!this.levelChunks[level])
            this.levelChunks[level] = {};

        this.center[level] = { x: cx, z: cz };

        const chunkSize = this.chunkSize * (2 ** level) 
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                if (i !== -2 && j !== -2 && i !== 1 && j !== 1 && level !== 0)
                    continue;

                const ix = i + cx;
                const iz = j + cz;
                const x = (i + cx) * chunkSize + orign.x;
                const z = (j + cz) * chunkSize + orign.z;
 
                const chunk = new Chunk(new THREE.Vector3(x, 0, z), chunkSize, level, ix, iz);
                this.levelChunks[level][`${x}_${z}`] = chunk;
                this.add(chunk);
            }
        }

    }




} 
