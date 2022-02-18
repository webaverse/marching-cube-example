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
	}

	init() {

		this._generateBuffers();
	}

	_generateBuffers() {

		const maxSegment = 32;

		const outputBuffer = this.moduleInstance._generateTerrain(200, this.chunkCount, maxSegment);

		const head = outputBuffer / 4;

		const positionCount = this.chunkCount * this.chunkCount * maxSegment * maxSegment * 20;
		const faceCount = this.chunkCount * this.chunkCount * maxSegment * maxSegment * 20;

		const positionBuffer = this.moduleInstance.HEAP32.subarray(head + 0, head + 1)[0];
		const faceBuffer = this.moduleInstance.HEAP32.subarray(head + 1, head + 2)[0];
		const groupBuffer = this.moduleInstance.HEAP32.subarray(head + 2, head + 3)[0];

		this.positions = this.moduleInstance.HEAPF32.subarray(positionBuffer / 4, positionBuffer / 4 + positionCount * 3);
		this.faces = this.moduleInstance.HEAP32.subarray(faceBuffer / 4, faceBuffer / 4 + faceCount);
		this.groups = this.moduleInstance.HEAP32.subarray(groupBuffer / 4, groupBuffer / 4 + this.chunkCount * this.chunkCount * 2);

		this.geometry = new THREE.BufferGeometry();
		this.geometry.setIndex(new THREE.Uint32BufferAttribute(this.faces, 1));
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount * this.chunkCount; i++) {
			this.geometry.addGroup(this.groups[2 * i], this.groups[2 * i + 1], 0);
		}

		this.mesh = new THREE.Mesh(this.geometry, [new THREE.MeshBasicMaterial({ color: 0xff0000 })]);
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

	}

}
