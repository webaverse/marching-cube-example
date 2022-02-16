import * as THREE from 'three';
import { terrainMaterial } from './material.js';
export class TerrainChunk {
    constructor(params) {
        this._params = params;
        this.terrain = params.terrainM;
        this._Init(params);
    }

    _Init(params) {  
        const vertices = params.vertices || new Float32Array();
        const index = params.index || new Uint32Array();
        const offset = params.offset || 0;
        const length = params.length || 0;
        this.vertice = vertices.subarray(offset * 3, (offset + length) * 3);
        this.index = index.subarray(offset, offset + length);

        this._plane = new THREE.Mesh(
            terrainMaterial);
        this._plane.castShadow = false;
        this._plane.receiveShadow = true;
        this._plane.rotation.x = -Math.PI / 2;

        // const buffergeometry = params.buffergeometry || new THREE.BufferGeometry();
        this.buffergeometry = new THREE.BufferGeometry();
        // const isExist = false;
        // for (let i = 0; i < buffergeometry.groups.length; i++) {
        //     const group = buffergeometry.groups[i];
        //     if (group.start === offset) {
        //         isExist = true
        //     }
        // }
        // if (!isExist)
        //     buffergeometry.addGroup(offset, length);
 
        this.yUnitSize = 4;

        this.noiseScale = 3;
        this.octaves = 8;
        this.persistence = 1.15;
        this.lacunarity = 1.6;
        this.floorOffset = 20.0;
        this.hardFloor = 2.0;
        this.hardFloorWeight = 3.05;
        this.noiseWeight = 6.09;
    }

    Hide() {

    }

    Show() {

    }

    _Rebuild() { 
        const output = this.terrain.geoUtils.generateChunk(
            this.offset.x, 0, this.offset.y, this.params.width,
            this.noiseScale, this.octaves, this.persistence, this.lacunarity, this.floorOffset,
            this.hardFloor, this.hardFloorWeight, this.noiseWeight
        );

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.positions, 3));
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(output.faces, 1));
        this.geometry.computeVertexNormals();

        this.physicalgeometry = this.geometry.toNonIndexed();
    }
}