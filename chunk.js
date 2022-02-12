import * as THREE from 'three';
import { terrainMaterial } from './material.js';

const isoLevel = 0;

export default class Chunk extends THREE.Mesh {

    constructor(origin, chunkSize, level, x, z, geometryUtils) {
        super();
        this.geometryUtils = geometryUtils;
        this.level = level;
        this.x = x;
        this.z = z;
        this.uid = `${x}_${z}`;
        this.spacing = 1;
        this.segment = 32; //分段
        this.origin = new THREE.Vector3;
        this.ID = '';
        this.origin.copy(origin);
        this.boundsSize = chunkSize;
        this.unitSize = this.boundsSize / this.segment;
        this.yUnitSize = 4;
        this.material = terrainMaterial;

        this.build();
    }

    updateXZ(chunkSize, x, z, px, pz) {
        this.boundsSize = chunkSize
        this.x = x;
        this.z = z;
        this.origin.x = px;
        this.origin.z = pz;
        this.uid = `${x}_${z}`;
        this.build();
    }

    update(origin, chunkSize = 100) {
        this.origin.copy(origin);
        this.boundsSize = chunkSize;
        this.unitSize = this.boundsSize / this.segment;
        this.build();
    }

    build() {
        const output = this.geometryUtils.generateChunk(this.origin.x, 0, this.origin.z, this.boundsSize);

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.positions, 3));
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(output.faces, 1));
        this.geometry.computeVertexNormals();

        this.physicalgeometry = this.geometry.toNonIndexed();
    }

}
