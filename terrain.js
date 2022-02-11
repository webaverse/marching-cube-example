import * as THREE from 'three';
import Chunk from './chunk.js';
import { terrainMaterial } from './material.js';

export default class Terrain extends THREE.Object3D {
    constructor(physics) {
        super();
        this.physics = physics;
        this.chunks = {};
        this.chunkSize = 64;
        this.maxChunkNum = 121;
        this.levelChunks = {};
        this.maxLevel = 1;
        this.center = {};
        this.changed = false;
        this.bboxs = []

        this.terrainGeometry = new THREE.BufferGeometry();
        this.terrainMesh = new THREE.Mesh(this.terrainGeometry, terrainMaterial);


        //center chunk   charater use chunk;
        this.centerChunks = new THREE.Object3D();
        this.add(this.centerChunks);

        for (let i = 0; i < this.maxLevel; i++) {
            this.buildLevelChunk(i);
        }

    }

    updateView(position, onchange) {
        for (let i = 0; i < this.maxLevel; i++) {
            //生成所有的地形LOD
            this.updateBuildChunk(position, i);
        }
        if (onchange && this.changed) {
            onchange();
            this.changed = false;
        } 
    }

    selectedViewable(level) {
        const cx = this.center[level].x;
        const cz = this.center[level].z;

        const levelChunk = this.levelChunks[level];

        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = cx + i;
                const iz = cz + j;
                if (i == -2 || j == -2 || i == 1 || j == 1) {
                    levelChunk[`${ix}_${iz}`].visible = true;
                } else {
                    levelChunk[`${ix}_${iz}`].visible = false;
                }
            }
        }
    }

    updateBuildChunk(position, level) {
        const px = position.x;
        const pz = position.z;

        const chunkSize = this.chunkSize * (2 ** level)
        const cx = Math.floor((px + chunkSize) / chunkSize) - 1;
        const cz = Math.floor((pz + chunkSize) / chunkSize) - 1;
        const center = this.center[level];

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

    buildLevelChunk(level, cx = 0, cz = 0) {
        if (!this.levelChunks[level])
            this.levelChunks[level] = {};

        this.center[level] = { x: cx, z: cz };

        const chunkSize = this.chunkSize * (2 ** level)
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx - 1;
                const iz = j + cz - 1;
                const x = (i + cx) * chunkSize;
                const z = (j + cz) * chunkSize;

                const chunk = new Chunk(new THREE.Vector3(x, 0, z), chunkSize, level, ix, iz);
                this.levelChunks[level][`${ix}_${iz}`] = chunk;
                if (level === 0)
                    this.centerChunks.add(chunk);
                else
                    this.add(chunk);
                // chunk.position.y = -5 * level
            }
        }

    }

    buildLevelBoundChunk(level = 2) {
        const size = this.chunkSize * (2 ** level);
        const lsize = this.chunkSize * (2 ** (level + 1));
        for (let i = -2; i < 2; i++) {
            const chunck1 = new Chunk(new THREE.Vector3(size, 0, size * i), size, level, x, z);
            this.add(chunck1);
            const chunck2 = new Chunk(new THREE.Vector3(-lsize, 0, size * i), size, level, x, z);
            this.add(chunck2);
        }
        for (let i = -1; i < 1; i++) {
            const chunck1 = new Chunk(new THREE.Vector3(size * i, 0, size), size);
            this.add(chunck1);
            const chunck2 = new Chunk(new THREE.Vector3(size * i, 0, -lsize), size);
            this.add(chunck2);
        }
    }
} 
