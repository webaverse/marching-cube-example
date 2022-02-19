import * as THREE from './three.module.js';

export class TerrainManager {

	constructor(chunkSize, range, moduleInstance) {

		this.chunkRange = range;
		this.chunkSize = chunkSize;
		this.moduleInstance = moduleInstance;

		this.center = new THREE.Vector3();
		this.chunkCount = this.chunkRange * 2 + 1;

		this.targetChunkIds = this._calculateTargetChunks();
		this.currentChunkIds = [...this.targetChunkIds];

		this.segment = 32;

		/*
		 * if following parameters are too small, memory areas of chunks can be overlaid
		 * if too big, memory will be over allocated;
		 */
		this.vertexStrideParam = 20;
		this.faceStrideParam = 20;
	}

	init() {

		this._generateBuffers();
	}

	_generateBuffers() {

		const outputBuffer = this.moduleInstance._generateTerrain(
			this.chunkSize, this.chunkCount, this.segment, this.vertexStrideParam, this.faceStrideParam
		);

		const head = outputBuffer / 4;

		const positionCount = this.chunkCount * this.chunkCount * this.segment * this.segment * this.vertexStrideParam;
		const faceCount = this.chunkCount * this.chunkCount * this.segment * this.segment * this.faceStrideParam;

		this.positionBuffer = this.moduleInstance.HEAP32.subarray(head + 0, head + 1)[0];
		this.normalBuffer = this.moduleInstance.HEAP32.subarray(head + 1, head + 2)[0];
		this.faceBuffer = this.moduleInstance.HEAP32.subarray(head + 2, head + 3)[0];
		this.groupBuffer = this.moduleInstance.HEAP32.subarray(head + 3, head + 4)[0];

		this.positions = this.moduleInstance.HEAPF32.subarray(this.positionBuffer / 4, this.positionBuffer / 4 + positionCount * 3);
		this.normals = this.moduleInstance.HEAPF32.subarray(this.normalBuffer / 4, this.normalBuffer / 4 + positionCount * 3);
		this.faces = this.moduleInstance.HEAPU32.subarray(this.faceBuffer / 4, this.faceBuffer / 4 + faceCount);
		this.groups = this.moduleInstance.HEAP32.subarray(this.groupBuffer / 4, this.groupBuffer / 4 + this.chunkCount * this.chunkCount * 2);

		console.log(">>> positions: ", this.positions);

		this.geometry = new THREE.BufferGeometry();

		this.indexAttribute = new THREE.Uint32BufferAttribute();
		this.indexAttribute.array = this.faces;
		this.indexAttribute.itemSize = 1;
		this.indexAttribute.count = this.faces.length;
		this.indexAttribute.setUsage( THREE.DynamicDrawUsage );

		this.positionAttribute = new THREE.Float32BufferAttribute();
		this.positionAttribute.array = this.positions;
		this.positionAttribute.itemSize = 3;
		this.positionAttribute.count = this.positions.length / 3;
		this.positionAttribute.setUsage( THREE.DynamicDrawUsage );

		this.normalAttribute = new THREE.Float32BufferAttribute();
		this.normalAttribute.array = this.normals;
		this.normalAttribute.itemSize = 3;
		this.normalAttribute.count = this.normals.length / 3;
		this.normalAttribute.setUsage( THREE.DynamicDrawUsage );

		this.geometry.setIndex(this.indexAttribute);
		this.geometry.setAttribute('position', this.positionAttribute);
		this.geometry.setAttribute('normal', this.normalAttribute);

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount * this.chunkCount; i++) {
			this.geometry.addGroup(this.groups[2 * i], this.groups[2 * i + 1], 0);
		}

		this.mesh = new THREE.Mesh(this.geometry, [new THREE.MeshLambertMaterial({ color: 0xff0000 })]);
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

	updateCenter(pos) {

		this.center = pos;

		this.targetChunkIds = this._calculateTargetChunks();
	}

	updateChunk() {

		// console.log(">>> current ids: ", this.currentChunkIds);
		// console.log(">>> target ids: ", this.targetChunkIds);

		let chunkIdToAdd = this.targetChunkIds.filter(id => !this.currentChunkIds.includes(id)).at(0);

		if (!!chunkIdToAdd) {
			let chunkIdToRemove = this.currentChunkIds.filter(id => !this.targetChunkIds.includes(id)).at(0);
			let index = this.currentChunkIds.indexOf(chunkIdToRemove);
			this.currentChunkIds[index] = chunkIdToAdd;

			// console.log(">>> to allocate: ", chunkIdToAdd);
			// console.log(">>> to deallocate: ", chunkIdToRemove);
			// console.log(">>> index: ", index);

			let gridId = chunkIdToAdd.split(':');

			this._updateChunkGeometry(index, new THREE.Vector3(gridId[0] * this.chunkSize, 0, gridId[1] * this.chunkSize));
		}

	}

	_updateChunkGeometry(index, chunkOrigin) {

		console.log(">>> update chunk index: ", index);

		const vertexStride = this.segment * this.segment * this.vertexStrideParam;
		const faceStride = this.segment * this.segment * this.faceStrideParam;

		this.moduleInstance._updateChunk(
			this.positionBuffer, this.normalBuffer, this.faceBuffer, this.groupBuffer,
			chunkOrigin.x, chunkOrigin.y, chunkOrigin.z,
			this.chunkSize, this.segment, index, index * vertexStride, index * faceStride
		);

		this.indexAttribute.updateRange = { offset: index * faceStride, count: faceStride };
		this.indexAttribute.needsUpdate = true;

		this.positionAttribute.updateRange = { offset: index * vertexStride * 3, count: vertexStride * 3 };
		this.positionAttribute.needsUpdate = true;

		this.normalAttribute.updateRange = { offset: index * vertexStride * 3, count: vertexStride * 3 };
		this.normalAttribute.needsUpdate = true;

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount * this.chunkCount; i++) {
			this.geometry.addGroup(this.groups[2 * i], this.groups[2 * i + 1], 0);
		}
	}

}
