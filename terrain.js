import * as THREE from 'three';
import { Vector3 } from 'three';
import Chunk from './chunk.js';
import { terrainMaterial } from './material.js';

export default class Terrain extends THREE.Object3D {
    constructor(physics) {
        super();
        this.physics = physics;
        this.chunks = {};
        this.chunkSize = 64;
        this.maxChunkNum = 24;
        this.levelChunks = [];
        this.levelCaches = [];
        this.maxLevel = 5;
        this.center = {};
        this.changed = false;
        this.bboxs = []

        this.terrainGeometry = new THREE.BufferGeometry();
        this.terrainMesh = new THREE.Mesh(this.terrainGeometry, terrainMaterial);


        //center chunk   charater use chunk;
        // this.centerChunks = new THREE.Object3D();
        // this.add(this.centerChunks);

        for (let i = 1; i < 5; i++) {
            this.buildLevelChunk(i);
        }

    }

    updateView(position, onchange) {
        for (let i = 4; i < 5; i++) {
            //生成所有的地形LOD
            this.updateBuildChunk(position, i);
        }
        if (onchange && this.changed) {
            onchange();
            this.changed = false;
        }
    }


    updateBuildChunk(position, level) {
        const px = position.x;
        const pz = position.z;

        const chunkSize = this.chunkSize * (2 ** level)
        const cx = Math.floor((px + chunkSize) / chunkSize);
        const cz = Math.floor((pz + chunkSize) / chunkSize);
        const center = this.center[level];

        const needUpdate = Math.abs(cx - center.x) > 1 || Math.abs(cz - center.z) >= 1;

        if (!needUpdate)
            return void 0;

        console.log([cx, cz]);

        this.changed = true;

        this.center[level].x = cx;
        this.center[level].z = cz;

        const enableChunks = {};
        const levelChunk = this.levelChunks[level];
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx;
                const iz = j + cz;
                const key = `${ix}_${iz}`;
                if (levelChunk[key]) {
                    enableChunks[key] = levelChunk[key];
                    delete levelChunk[key];
                }
            }
        }
        const levelCache = this.levelCaches[level];
        for (const key in levelChunk) {
            const ck = levelChunk[key]
            this.remove(ck);
            levelCache.push(ck);
            levelCache[key] = ck;
            delete levelCache[ck.key];

            if (levelCache > this.maxChunkNum) {
                levelCache.shift();
            }
            delete levelChunk[key]
        }

        // const keyDix = {}; 

        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx;
                const iz = j + cz;
                const px = (i + cx) * chunkSize;
                const pz = (j + cz) * chunkSize;
                const key = `${ix}_${iz}`;
                // keyDix[key] = key;
                if (enableChunks[key]) {
                    levelChunk[key] = enableChunks[key];
                } else {
                    console.log(key)
                    let chunk;
                    if (levelCache[key]) {
                        chunk = levelCache[key];
                        const ipos = levelCache.indexOf(chunk);
                        levelCache.splice(ipos, 1);
                        delete levelCache[key];
                        levelChunk[key] = chunk;
                        this.add(chunk)
                    } else if (levelCache.length === this.maxChunkNum) {
                        chunk = levelCache.shift();
                        chunk.updateXZ(chunkSize, ix, iz, px, pz);
                        levelChunk[chunk.key] = chunk;
                        this.add(chunk)
                    } else {
                        chunk = new Chunk(new Vector3(px, 0, pz), chunkSize, level, ix, iz);
                        levelChunk[chunk.key] = chunk;
                        this.add(chunk)
                    }
                }
            }
        }

        // let t = 0
        // for (const key in levelChunk) {
        //     t++;
        // }
        // for (const key in keyDix) {
        //     if (!levelChunk[key])
        //         debugger
        // }
        // if (t !== 16)
        //     debugger

    }

    buildLevelChunk(level, cx = 0, cz = 0) {
        if (!this.levelChunks[level]) {
            this.levelChunks[level] = {};
            this.levelCaches[level] = []
        }

        this.center[level] = { x: cx, z: cz };

        const chunkSize = this.chunkSize * (2 ** level)
        const bbox = new THREE.Vector4();
        bbox.x = bbox.y = -chunkSize
        bbox.z = bbox.w = chunkSize

        let chunk;
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const ix = i + cx;
                const iz = j + cz;
                const x = (i + cx) * chunkSize;
                const z = (j + cz) * chunkSize;

                chunk = new Chunk(new THREE.Vector3(x, 0, z), chunkSize, level, ix, iz);
                this.levelChunks[level][`${ix}_${iz}`] = chunk;
                this.add(chunk);
            }
        }
        chunk.material.bbox = chunk.material.bbox || new THREE.Vector4;

        const bwidth = -2 * chunkSize;
        chunk.material.bbox.set(-bwidth, -bwidth, bwidth, bwidth);

    }


} 
