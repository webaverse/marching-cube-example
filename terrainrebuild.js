import { TerrainChunk } from "./terrainchunk.js";

export class TerrainChunkRebuilder {
    constructor(params) {
        this._pool = {};
        this.tm = params.tm;
        this.params = params;
        this._Reset();
    }

    AllocateChunk(params) {
        const w = params.width;

        if (!(w in this._pool)) {
            this._pool[w] = [];
        }

        let c = null;
        if (this._pool[w].length > 0) {
            c = this._pool[w].pop();
            c.params = params;
        } else {
            c = new TerrainChunk(params);
        }

        c.Hide();

        this._queued.push(c);

        return c;
    }

    sort() {
        this._queued.sort((a, b) => b.params.width - a.params.width);
    }

    _RecycleChunks(chunks) {

        for (let c of chunks) {
            if (!(c.chunk.params.width in this._pool)) {
                this._pool[c.chunk.params.width] = [];
            }

            c.chunk.Hide();

            this._pool[c.chunk.params.width].push(c.chunk);
        }
    }

    _Reset() {
        this._active = null;
        this._queued = [];
        this._old = [];
        this._new = [];
    }

    get Busy() {
        return this._active;
    }

    update() {
        if (this._active) {
            const r = this._active.next();
            if (r.done) {
                this._active = null;
            }
        } else {
            const b = this._queued.pop();
            if (b) {
                this._active = b._Rebuild();
                this._new.push(b);
            }
        }

        if (this._active) {
            return;
        }

        if (!this._queued.length) {
            this._RecycleChunks(this._old);
            for (let b of this._new) {
                b.Show();
            }
            this._Reset();
        }
    }
}