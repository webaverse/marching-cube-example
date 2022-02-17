import * as THREE from 'three'
import { terrainMaterial } from './material.js';
import { QuadTree } from "./quadtree.js";
import { TerrainChunkRebuilder } from "./terrainrebuild.js";

function genKey(c) {
    return c.position[0] + '/' + c.position[1] + ' [' + c.dimensions[0] + ']';
}

/**
 * 计算交叉部分
 * @param {*} dictA 
 * @param {*} dictB 
 * @returns 
 */
const DictIntersection = (dictA, dictB) => {
    const intersection = {};
    for (let k in dictB) {
        if (k in dictA) {
            intersection[k] = dictA[k];
        }
    }
    return intersection
}

/**
 * dictA中删除dictB所有的值
 * @param {*} dictA 
 * @param {*} dictB 
 * @returns 
 */
const DictDifference = (dictA, dictB) => {
    const diff = { ...dictA };
    for (let k in dictB) {
        delete diff[k];
    }
    return diff;
}



const _MIN_CELL_SIZE = 500;
const _FIXED_GRID_SIZE = 10;
const _MIN_CELL_RESOLUTION = 64;

export class TerrainManager {
    constructor(geoUtils) {
        this.geoUtils = geoUtils;//
        this.init();
        this.geometry = new THREE.BufferGeometry();
        this.object = new THREE.Mesh(this.geometry, terrainMaterial);
        this._group = new THREE.Group();

        this.chunkLength = 64 * 64 * 16;
        this.vertices = new Float32Array(this.chunkLength * 3 * 200);
        this.normals = new Float32Array(this.chunkLength * 3 * 200);
        this.indices = new Float32Array(this.chunkLength * 200);
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3))
        // this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3))
        this.geometry.setIndex(new THREE.Uint32BufferAttribute(this.indices, 1))
    }

    init() {
        this._builder = new TerrainChunkRebuilder({ tm: this });

        this.initTerrain();
    }

    initTerrain() {
        this._chunks = {};
    }

    _CreateTerrainChunk(offset, width) {
        const params = {
            group: this._group,
            material: this._material,
            width: width,
            offset: new THREE.Vector3(offset.x, offset.y, 0),
            resolution: _MIN_CELL_RESOLUTION,
            terrainM: this
            // heightGenerators: [new HeightGenerator(this._noise, offset, 100000, 100000 + 1)],
        };

        return this._builder.AllocateChunk(params);
    }

    update(position) {
        this._builder.update()

        if (!this._builder.Busy)
            this.updateVisibleChunk(position)
    }

    countDic(dic) {
        let i = 0;
        for (const key in dic) {
            i++;
        }
        return i;
    }

    updateVisibleChunk(position) {
        const q = new QuadTree({
            min: new THREE.Vector2(-16384, -16384),
            max: new THREE.Vector2(16384, 16384),
        });

        q.insert(position);

        const children = q.getChildren();

        let newTerrainChunks = {};
        const center = new THREE.Vector2();
        const dimensions = new THREE.Vector2();

        let newChunkLen = 0;
        for (let c of children) {
            newChunkLen++
            c.bounds.getCenter(center);
            c.bounds.getSize(dimensions);

            const child = {
                position: [center.x, center.y],
                bounds: c.bounds,
                dimensions: [dimensions.x, dimensions.y],
            };

            const k = genKey(child);
            newTerrainChunks[k] = child;
        }
        // console.log('new chunk length:' + newChunkLen);

        const cnewTerrainChunks = this.countDic(newTerrainChunks)
        const c_chunks = this.countDic(this._chunks)
        const intersection = DictIntersection(this._chunks, newTerrainChunks);
        const difference = DictDifference(newTerrainChunks, this._chunks);
        const recycle = Object.values(DictDifference(this._chunks, newTerrainChunks));

        const cintersection = this.countDic(intersection)
        const cdifference = this.countDic(difference)
        const crecycle = this.countDic(recycle)
        if (cdifference > 0)
            console.log(cnewTerrainChunks, c_chunks, cintersection, cdifference, crecycle)

        this._builder._old.push(...recycle);

        newTerrainChunks = intersection;

        for (let k in difference) {
            const [xp, zp] = difference[k].position;

            const offset = new THREE.Vector2(xp, zp);
            newTerrainChunks[k] = {
                position: [xp, zp],
                chunk: this._CreateTerrainChunk(offset, difference[k].dimensions[0]),
            };
        }

        this._builder.sort();

        this._chunks = newTerrainChunks;
        let le = 0
        for (const key in this._chunks) {
            le++
        }
        // console.log([le, this._group.children.length]);
    }

}