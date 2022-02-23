import * as THREE from 'three';
import { terrainMaterial } from './material.js';

export class TerrainManager {

	constructor(chunkSize, range, geometryUtils) {

		this.chunkRange = range;
		this.chunkSize = chunkSize;
		this.geometryUtils = geometryUtils;

		this.center = new THREE.Vector3();
		this.chunkCount = this.chunkRange * 2 + 1;

		this.targetChunkIds = this._calculateTargetChunks();
		this.currentChunks = this.targetChunkIds.map((v, i) => { return { slots: [i, i], chunkId: v } });

		this.segment = 16;

		/*
		 * if following parameters are too small, memory areas of chunks can be overlaid
		 * if too big, memory will be over allocated;
		 */
		this.vertexBufferSizeParam = 20;
		this.indexBufferSizeParam = 20;

		this._initializeTerrain();
	}

	_initializeTerrain() {

		this.bufferFactory = this.geometryUtils.generateTerrain(
			this.chunkSize, this.chunkCount, this.segment,
			this.vertexBufferSizeParam, this.indexBufferSizeParam
		);

		this.geometry = new THREE.BufferGeometry();

		this.indexAttribute = new THREE.Uint32BufferAttribute();
		this.indexAttribute.array = this.bufferFactory.indices;
		this.indexAttribute.itemSize = 1;
		this.indexAttribute.count = this.bufferFactory.indices.length;
		this.indexAttribute.setUsage(THREE.DynamicDrawUsage);

		this.positionAttribute = new THREE.Float32BufferAttribute();
		this.positionAttribute.array = this.bufferFactory.positions;
		this.positionAttribute.itemSize = 3;
		this.positionAttribute.count = this.bufferFactory.positions.length / 3;
		this.positionAttribute.setUsage(THREE.DynamicDrawUsage);

		this.normalAttribute = new THREE.Float32BufferAttribute();
		this.normalAttribute.array = this.bufferFactory.normals;
		this.normalAttribute.itemSize = 3;
		this.normalAttribute.count = this.bufferFactory.normals.length / 3;
		this.normalAttribute.setUsage(THREE.DynamicDrawUsage);

		this.geometry.setIndex(this.indexAttribute);
		this.geometry.setAttribute('position', this.positionAttribute);
		this.geometry.setAttribute('normal', this.normalAttribute);

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount * this.chunkCount; i++) {
			this.geometry.addGroup(
				this.bufferFactory.indexRanges[2 * i], this.bufferFactory.indexRanges[2 * i + 1], 0
			);
		}

		this.mesh = new THREE.Mesh(
			this.geometry, [terrainMaterial]
		);

		this.mesh.frustumCulled = false;
	}

	_calculateTargetChunks() {

		let centerChunkGridX = Math.floor(this.center.x / this.chunkSize);
		let centerChunkGridZ = Math.floor(this.center.z / this.chunkSize);

		let targetChunks = [];

		for (let i = centerChunkGridX - this.chunkRange; i < centerChunkGridX + this.chunkRange + 1; i++) {
			for (let j = centerChunkGridZ - this.chunkRange; j < centerChunkGridZ + this.chunkRange + 1; j++) {
				targetChunks.push(i + ':' + j);
			}
		}

		return targetChunks;
	}

	terrain() {
		return this.mesh;
	}

	updateCenter(pos) {

		this.center = pos;

		this.targetChunkIds = this._calculateTargetChunks();
	}

	updateChunk() {

		const buf = this.bufferFactory;

		let chunkIdToAdd = this.targetChunkIds.filter(
			id => !this.currentChunks.map(v => v.chunkId).includes(id)
		).at(0);

		let chunksToRemove = this.currentChunks.filter(
			chunk => !this.targetChunkIds.includes(chunk.chunkId)
		);

		chunksToRemove.forEach(chunk => {
			this.geometryUtils.deallocateChunk(
				chunk.slots[0], chunk.slots[1], this.chunkCount ** 2,
				buf.chunkVertexRangeBuffer,
				buf.vertexFreeRangeBuffer,
				buf.chunkIndexRangeBuffer,
				buf.indexFreeRangeBuffer
			);
		});

		this.currentChunks = this.currentChunks.filter(
			chunk => this.targetChunkIds.includes(chunk.chunkId)
		);

		if (!!chunkIdToAdd) {
			let gridId = chunkIdToAdd.split(':');

			let slots = this.geometryUtils.generateChunk(
				buf.positionBuffer, buf.normalBuffer, buf.indexBuffer,
				buf.chunkVertexRangeBuffer,
				buf.vertexFreeRangeBuffer,
				buf.chunkIndexRangeBuffer,
				buf.indexFreeRangeBuffer,
				gridId[0] * this.chunkSize, 0, gridId[1] * this.chunkSize,
				this.chunkSize, this.segment, this.chunkCount ** 2
			);

			this.currentChunks.push({ slots: slots, chunkId: chunkIdToAdd });

			this._updateChunkGeometry(slots);
		}

	}

	_updateChunkGeometry(slots) {

		const buf = this.bufferFactory;

		this.indexAttribute.updateRange = {
			offset: buf.indexRanges[slots[1] * 2],
			count: buf.indexRanges[slots[1] * 2 + 1]
		};
		this.indexAttribute.needsUpdate = true;

		this.positionAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3
		};
		this.positionAttribute.needsUpdate = true;

		this.normalAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3
		};
		this.normalAttribute.needsUpdate = true;

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount * this.chunkCount; i++) {
			this.geometry.addGroup(
				buf.indexRanges[i * 2],
				buf.indexRanges[i * 2 + 1],
				0
			);
		}
	}

}
