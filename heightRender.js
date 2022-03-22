import * as THREE from 'three'
export class HeightRender {
    constructor(terrObj) {
        this.camera = new THREE.OrthographicCamera(-1000, 1000, 1000, -1000, 1, 2000);
        this.camera.position.y = 1000;
        this.camera.position.z = 0.0001;
        this.renderTarget = new THREE.WebGLRenderTarget(2048, 2048, { type });
        this.scene = new THREE.Scene;
        this.scene.add(terrObj);
    }

    get heightMap() {
        return this.renderTarget.texture;
    }

    calc(renderer) {
        renderer.setRenderTarget(this.renderTarget);
        scene.overrideMaterial = heightMaterial;
 
        scene.overrideMaterial = null;
        renderer.setRenderTarget(null);
    }

}


const heightMaterial = new THREE.ShaderMaterial({
    vertexShader: ` 
    varying float height;
    main(){ 
         height =  position.y;
         gl_Position = 
    }
    `,
    fragmentShader: `
    float packColor(vec3 color) {
        return color.r + color.g * 256.0 + color.b * 256.0 * 256.0;
    }
    
    vec3 unpackColor(float f) {
        vec3 color;
        color.b = floor(f / 256.0 / 256.0);
        color.g = floor((f - color.b * 256.0 * 256.0) / 256.0);
        color.r = floor(f - color.b * 256.0 * 256.0 - color.g * 256.0);
        // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!
        return color / 255.0;
    }

    varying float height;
    main(){ 
        vec3 rgb = unpackColor(height*100.0);
        gl_FragColor =vec4(rgb,1.0);
    }
    `
})