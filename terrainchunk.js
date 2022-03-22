import * as THREE from 'three';
import { Vector3 } from 'three';
import { terrainMaterial } from './material.js';
import Perlin from './perlin.js'
import * as mc from './mc.js'

const _v1 = new THREE.Vector3;
const _v2 = new THREE.Vector3;
const MAX_STEP = 5000;
const isoLevel = 0;
const interpolateVerts = (v1, v2) => {
    const t = (isoLevel - v1.w) / (v2.w - v1.w);
    _v1.set(v1.x, v1.y, v1.z);
    _v2.set(v2.x, v2.y, v2.z);
    return _v1.clone().add(_v2.sub(_v1).multiplyScalar(t));
};

export class TerrainChunk {
    constructor(params) {
        this._params = params;
        this.terrain = params.terrainM;
        this._Init(params);
    }
    set params(val) {
        this._params = val;
        this._Init(val);
    }

    get params() {
        return this._params;
    }

    _Init(params) {
        // const vertices = params.vertices || new Float32Array();
        // const index = params.index || new Uint32Array();
        // const offset = params.offset || 0;
        // const length = params.length || 0;
        // this.vertice = vertices.subarray(offset * 3, (offset + length) * 3);
        // this.index = index.subarray(offset, offset + length); 
        // const buffergeometry = params.buffergeometry || new THREE.BufferGeometry();
        this.geometry = new THREE.BufferGeometry();
        this._mesh = new THREE.Mesh(this.geometry, terrainMaterial);

        if (params.group.children.indexOf(this._mesh) === -1)
            params.group.add(this._mesh);
        else
            debugger

        // const isExist = false;
        // for (let i = 0; i < buffergeometry.groups.length; i++) {
        //     const group = buffergeometry.groups[i];
        //     if (group.start === offset) {
        //         isExist = true
        //     }
        // }
        // if (!isExist)
        //     buffergeometry.addGroup(offset, length);

        this.yUnitSize = 8;
        params.resolution = 24;
        this.unitSize = params.width / params.resolution;
        this.segment = params.resolution;

        this.noiseScale = 3;
        this.octaves = 8;
        this.persistence = 1.15;
        this.lacunarity = 1.6;
        this.floorOffset = 20.0;
        this.hardFloor = 2.0;
        this.hardFloorWeight = 3.05;
        this.noiseWeight = 6.09;
        this.origin = new Vector3(params.offset.x, 0, params.offset.y);
        // this._mesh.position.set(params.offset.x, 0, params.offset.y);
        this.index = 0;
    }

    Destroy() {
        this._params.group.remove(this._mesh);
    }

    Hide() {
        this._mesh.visible = false;
    }

    Show() {
        this._mesh.visible = true;
    }

    density(vec, noiseScale = 3, octaves = 6, persistence = 1.15, lacunarity = 1.4, floorOffset = 20, hardFloor = 2, hardFloorWeight = 3.05, noiseWeight = 6.09) {
        // const pos = this.position.clone().add(id/* _v1.copy(id).multiplyScalar(this.spacing).subScalar(this.boundsSize / 2) */);
        const origin = this.origin.clone();
        _v1.copy(vec);
        _v1.x *= this.unitSize;
        _v1.y *= this.yUnitSize;
        _v1.z *= this.unitSize;

        const curPos = origin.add(_v1);
        const offsetNoise = new THREE.Vector3;
        let noise = 0;
        let frequency = noiseScale / 2000;
        let amplitude = 1.1;
        let weight = 1.5;
        const weightMultiplier = 1.05;
        const params = { x: 1, y: 0.1 };
        for (let j = 0; j < octaves; j++) {
            _v2.copy(curPos).add(offsetNoise).multiplyScalar(frequency);
            const n = Perlin.Noisev3(_v2) / 2;
            let v = 1 - Math.abs(n);
            v = v * v;
            v *= weight;
            weight = Math.max(Math.min(v * weightMultiplier, 1), 0);
            noise += v * amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        let finalVal = -(curPos.y * 0.3 + floorOffset) + noise * noiseWeight + (curPos.y % params.x) * params.y;
        if (curPos.y < hardFloor) {
            finalVal += hardFloorWeight;
        }
        if (vec.y === 0)
            finalVal = 0.1

        const closeEdges = false;
        if (closeEdges) {
            // const edgeOffset = abs(pos * 2) - worldSize + spacing / 2;
            // const edgeWeight = saturate(sign(max(max(edgeOffset.x, edgeOffset.y), edgeOffset.z)));
            //     finalVal = finalVal * (1 - edgeWeight) - 100 * edgeWeight;
        }
        var index = this.indexFromCoord(vec.x, vec.y, vec.z);
        this.points[index] = new THREE.Vector4(curPos.x, curPos.y, curPos.z, finalVal);
        // this.min.min(this.points[index]);
        // this.max.max(this.points[index]);
    }
    build() {
        this.vertexDic = {};
        this.points = [];
        this.vertexs = [];
        this.index = 0;
        this.indexs = [];
        const halfSeg = this.segment / 2;

        for (let i = -halfSeg; i < halfSeg; i++) {
            for (let j = 0; j <= this.segment; j++) {
                for (let k = -halfSeg; k < halfSeg; k++) {
                    this.density(new THREE.Vector3(i, j, k));
                }
            }
        }

        for (let i = -halfSeg; i < halfSeg; i++) {
            for (let j = 0; j <= this.segment; j++) {
                for (let k = -halfSeg; k < halfSeg; k++) {
                    this.March(new THREE.Vector3(i, j, k));
                }
            }
        }
        const vs = [];
        for (let i = 0; i < this.vertexs.length; i++) {
            const p = this.vertexs[i];
            vs.push(p.x, p.y, p.z);
        }
        const vf = new THREE.Float32BufferAttribute(vs, 3);
        this.geometry.setAttribute('position', vf);
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(this.indexs, 1));
        this.geometry.computeVertexNormals();
        this.geometry.computeBoundingBox();

        // this.physicalgeometry = this.geometry.toNonIndexed();
    }
    indexFromCoord(x, y, z) {
        const seg = this.segment + 1;
        return z * seg * seg + y * seg + x;
    }
    March(vec) {
        // 8 corners of the current cube
        const cubeCorners = [
            this.points[this.indexFromCoord(vec.x, vec.y, vec.z)],
            this.points[this.indexFromCoord(vec.x + 1, vec.y, vec.z)],
            this.points[this.indexFromCoord(vec.x + 1, vec.y, vec.z + 1)],
            this.points[this.indexFromCoord(vec.x, vec.y, vec.z + 1)],
            this.points[this.indexFromCoord(vec.x, vec.y + 1, vec.z)],
            this.points[this.indexFromCoord(vec.x + 1, vec.y + 1, vec.z)],
            this.points[this.indexFromCoord(vec.x + 1, vec.y + 1, vec.z + 1)],
            this.points[this.indexFromCoord(vec.x, vec.y + 1, vec.z + 1)]
        ];

        const indices = [
            this.indexFromCoord(vec.x, vec.y, vec.z),
            this.indexFromCoord(vec.x + 1, vec.y, vec.z),
            this.indexFromCoord(vec.x + 1, vec.y, vec.z + 1),
            this.indexFromCoord(vec.x, vec.y, vec.z + 1),
            this.indexFromCoord(vec.x, vec.y + 1, vec.z),
            this.indexFromCoord(vec.x + 1, vec.y + 1, vec.z),
            this.indexFromCoord(vec.x + 1, vec.y + 1, vec.z + 1),
            this.indexFromCoord(vec.x, vec.y + 1, vec.z + 1)
        ];
        // Calculate unique index for each cube configuration.
        // There are 256 possible values
        // A value of 0 means cube is entirely inside surface; 255 entirely outside.
        // The value is used to look up the edge table, which indicates which edges of the cube are cut by the isosurface.
        let cubeIndex = 0;
        if (cubeCorners[0].w < isoLevel)
            cubeIndex |= 1;
        if (cubeCorners[1].w < isoLevel)
            cubeIndex |= 2;
        if (cubeCorners[2].w < isoLevel)
            cubeIndex |= 4;
        if (cubeCorners[3].w < isoLevel)
            cubeIndex |= 8;
        if (cubeCorners[4].w < isoLevel)
            cubeIndex |= 16;
        if (cubeCorners[5].w < isoLevel)
            cubeIndex |= 32;
        if (cubeCorners[6].w < isoLevel)
            cubeIndex |= 64;
        if (cubeCorners[7].w < isoLevel)
            cubeIndex |= 128;
        if (cubeIndex === 0)
            return;
        // Create triangles for current cube configuration
        for (let i = 0; mc.triangulation[cubeIndex][i] != -1; i += 3) {
            // Get indices of corner points A and B for each of the three edges
            // of the cube that need to be joined to form the triangle.
            const a0 = mc.cornerIndexAFromEdge[mc.triangulation[cubeIndex][i]];
            const b0 = mc.cornerIndexBFromEdge[mc.triangulation[cubeIndex][i]];
            const a1 = mc.cornerIndexAFromEdge[mc.triangulation[cubeIndex][i + 1]];
            const b1 = mc.cornerIndexBFromEdge[mc.triangulation[cubeIndex][i + 1]];
            const a2 = mc.cornerIndexAFromEdge[mc.triangulation[cubeIndex][i + 2]];
            const b2 = mc.cornerIndexBFromEdge[mc.triangulation[cubeIndex][i + 2]];

            const segs = [[a0, b0], [a2, b2], [a1, b1]]
            const vs = segs.map(v => {
                const vInx = [indices[v[0]], indices[v[1]]].sort((a, b) => a - b).join("_")
                let vP;
                if (this.vertexDic[vInx]) {
                    vP = this.vertexDic[vInx];
                } else {
                    vP = interpolateVerts(cubeCorners[v[0]], cubeCorners[v[1]]);
                    vP.index = this.index++;
                    this.vertexDic[vInx] = vP;
                    this.vertexs.push(vP);
                }
                return vP.index;
            })
            this.indexs.push(...vs);
            // const vAInx = [indices[a0], indices[b0]].sort((a, b) => a - b).join("_")
            // let vA, vB, vC;
            // if (this.vertexDic[vAInx]) {
            //     vA = this.vertexDic[vAInx]; 
            // } else {
            //     vA = this.interpolateVerts(cubeCorners[a0], cubeCorners[b0]);
            //     vA.index = this.index++;
            //     this.vertexDic[vAInx] = vA;
            //     this.vertexs.push(vA);
            // }

            // const vBInx = [indices[a1], indices[b1]].sort((a, b) => a - b).join("_")
            // if (this.vertexDic[vBInx]) {
            //     vB = this.vertexDic[vBInx]; 
            // } else {
            //     vB = this.interpolateVerts(cubeCorners[a1], cubeCorners[b1]);
            //     vB.index = this.index++;
            //     this.vertexDic[vBInx] = vB;
            //     this.vertexs.push(vB);
            // }

            // const vCInx = [indices[a2], indices[b2]].sort((a, b) => a - b).join("_")
            // if (this.vertexDic[vCInx]) {
            //     vC = this.vertexDic[vCInx];
            // } else {
            //     vC = this.interpolateVerts(cubeCorners[a2], cubeCorners[b2]);
            //     vC.index = this.index++;
            //     this.vertexDic[vCInx] = vC;
            //     this.vertexs.push(vC);
            // }

            // this.indexs.push(vA.index, vC.index, vB.index);
        }
    }

    *_Rebuild() {
        // const output = this.terrain.geoUtils.generateChunk(
        //     this.params.offset.x, 0, this.params.offset.y, this.params.width,
        //     this.noiseScale, this.octaves, this.persistence, this.lacunarity, this.floorOffset,
        //     this.hardFloor, this.hardFloorWeight, this.noiseWeight
        // );


        // this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.positions, 3));
        // this.geometry.setIndex(new THREE.Uint32BufferAttribute(output.faces, 1));
        // this.geometry.computeVertexNormals();

        // this.geometry.attributes.normal.needsUpdate = true;
        // this.geometry.attributes.position.needsUpdate = true;
        // this.geometry.index.needsUpdate = true;

        // this.physicalgeometry = this.geometry.toNonIndexed();

        this.vertexDic = {};
        this.points = [];
        this.vertexs = [];
        this.index = 0;
        this.indexs = [];


        const halfSeg = this.segment / 2;
        let count = 0;
        for (let i = -halfSeg; i <= halfSeg; i++) {
            for (let j = 0; j <= this.segment; j++) {
                for (let k = -halfSeg; k <= halfSeg; k++) {
                    this.density(new THREE.Vector3(i, j, k));
                    if (count++ > MAX_STEP) {
                        count = 0
                        // yield;
                    }
                }
            }
        }
        for (let i = -halfSeg; i < halfSeg; i++) {
            for (let j = 0; j < this.segment; j++) {
                for (let k = -halfSeg; k < halfSeg; k++) {
                    this.March(new THREE.Vector3(i, j, k));
                    if (count++ > MAX_STEP) {
                        count = 0
                        // yield;
                    }
                }
            }
        }

        const vs = [];
        for (let i = 0; i < this.vertexs.length; i++) {
            const p = this.vertexs[i];
            vs.push(p.x, p.y, p.z);
        }

        const vf = new THREE.Float32BufferAttribute(vs, 3);
        this.geometry.setAttribute('position', vf);
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(this.indexs, 1));
        this.geometry.computeVertexNormals();
        this.geometry.attributes.normal.needsUpdate = true;
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.index.needsUpdate = true;
        yield;
    }
}