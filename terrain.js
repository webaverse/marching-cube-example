import * as THREE from 'three';
import Chunck from './chunk.js';

export default class Terrain extends THREE.Object3D {
    constructor(physics) {
        super();
        this.physics = physics; 
        this.chunks = {};
        this.chunkSize = 128;
        this.maxChunkNum = 121;
        this.levelChunk = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        for (let i = -2; i <= 1; i++) {
            for (let j = -2; j <= 1; j++) {
                const chunck = new Chunck(new THREE.Vector3(i * this.chunkSize, 0, j * this.chunkSize), this.chunkSize); 
                this.add(chunck);
                this.levelChunk[1].push(chunck);
            }
        }
        
        this.buildLevelBoundChunk(2);
        this.buildLevelBoundChunk(3);
        this.buildLevelBoundChunk(4);
        this.buildLevelBoundChunk(5);
    }
    updateView(position) {
    }
    buildLevelBoundChunk(level = 2) {
        const size = this.chunkSize * (2 ** (level - 1));
        const lsize = this.chunkSize * (2 ** level);
        for (let i = -2; i < 2; i++) {
            const chunck1 = new Chunck(new THREE.Vector3(size, 0, size * i), size);
            this.add(chunck1);
            this.levelChunk[level].push(chunck1);
            const chunck2 = new Chunck(new THREE.Vector3(-lsize, 0, size * i), size);
            this.add(chunck2);
            this.levelChunk[level].push(chunck2);
        }
        for (let i = -1; i < 1; i++) {
            const chunck1 = new Chunck(new THREE.Vector3(size * i, 0, size), size);
            this.add(chunck1);
            this.levelChunk[level].push(chunck1);
            const chunck2 = new Chunck(new THREE.Vector3(size * i, 0, -lsize), size);
            this.add(chunck2);
            this.levelChunk[level].push(chunck2);
        }
    }
} 
