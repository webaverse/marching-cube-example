export class Grass {
    constructor() {

    }



    initBladeIndices(indices, vc1, vc2, i) {
        let seg;
        // blade front side
        for (seg = 0; seg < BLADE_SEGS; ++seg) {
            indices[i++] = vc1 + 0 // tri 1
            indices[i++] = vc1 + 1
            indices[i++] = vc1 + 2
            indices[i++] = vc1 + 2 // tri 2
            indices[i++] = vc1 + 1
            indices[i++] = vc1 + 3
            vc1 += 2
        }
        // blade back side
        for (seg = 0; seg < BLADE_SEGS; ++seg) {
            indices[i++] = vc2 + 2 // tri 1
            indices[i++] = vc2 + 1
            indices[i++] = vc2 + 0
            indices[i++] = vc2 + 3 // tri 2
            indices[i++] = vc2 + 1
            indices[i++] = vc2 + 2
            vc2 += 2
        }
    }

    /** Set up shape variations for each blade of grass */
    initBladeShapeVerts(shape, numBlades, offset) {
        let noise = 0
        for (let i = 0; i < numBlades; ++i) {
            noise = Math.abs(simplex(offset[i * 4 + 0] * 0.03, offset[i * 4 + 1] * 0.03))
            noise = noise * noise * noise
            noise *= 5.0
            shape[i * 4 + 0] = BLADE_WIDTH + Math.random() * BLADE_WIDTH * 0.5 // width
            shape[i * 4 + 1] = BLADE_HEIGHT_MIN + Math.pow(Math.random(), 4.0) * (BLADE_HEIGHT_MAX - BLADE_HEIGHT_MIN) + // height
                noise
            shape[i * 4 + 2] = 0.0 + Math.random() * 0.3 // lean
            shape[i * 4 + 3] = 0.05 + Math.random() * 0.3 // curve
        }
    }

    /** Set up positons & rotation for each blade of grass */
    initBladeOffsetVerts(offset, numBlades, patchRadius) {
        for (let i = 0; i < numBlades; ++i) {
            offset[i * 4 + 0] = nrand() * patchRadius // x
            offset[i * 4 + 1] = nrand() * patchRadius // y
            offset[i * 4 + 2] = 0.0 // z
            offset[i * 4 + 3] = Math.PI * 2.0 * Math.random() // rot
        }
    }

    /** Set up indices for 1 blade */
    initBladeIndexVerts(vindex) {
        for (let i = 0; i < vindex.length; ++i) {
            vindex[i] = i
        }
    }

    update(time, camPos, camDir, drawPos) {
        const mat = mesh.material;
        mat.uniforms['time'].value = time
        let p = mat.uniforms['camDir'].value
        p[0] = camDir.x
        p[1] = camDir.y
        p[2] = camDir.z
        p = mat.uniforms['drawPos'].value
        p[0] = drawPos.x
        p[1] = drawPos.y
    }

}

const GrassShader = {
    vertex: ``,
    fragment: ``
}