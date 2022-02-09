import * as THREE from 'three';
import Perlin from './perlin.js'
import * as mc from './mc.js'
const _v1 = new THREE.Vector3;
const _v2 = new THREE.Vector3;

const isoLevel = 0;

export default class Chunck extends THREE.Mesh {
    constructor(origin, chunkSize, geometryUtils) {
        super();
        this.geometryUtils = geometryUtils;
        this.origin = origin;
        this.chunkSize = chunkSize;
        this.material = new THREE.MeshPhysicalMaterial({ color: 0x777777, wireframe: false, side: THREE.DoubleSide});
        this.build();
    }

    update(origin, chunkSize = 100) {
        this.origin.copy(origin);
        this.chunkSize = chunkSize;
        this.build();
    }

    build(){
        const output = this.geometryUtils.generateChunk(this.origin.x, this.origin.y, this.origin.z, this.chunkSize);

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.positions, 3));
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(output.faces, 1));
        this.geometry.computeVertexNormals();
        this.geometry = this.geometry.toNonIndexed();
    }
}
