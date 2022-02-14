import * as THREE from 'three';
import { MeshPhongMaterial, TextureLoader, Vector4 } from 'three';

export const terrainMaterial = new MeshPhongMaterial({ color: 0xffffff });
export const terrainMaterials = [
    new MeshPhongMaterial({ color: 0xfffffb, uniforms: { a: { value: 0 } } }),
    new MeshPhongMaterial({ color: 0xfffffc }),
    new MeshPhongMaterial({ color: 0xfffffd }),
    new MeshPhongMaterial({ color: 0xfffffe }),
    new MeshPhongMaterial({ color: 0xffffff })];
const textureLoader = new TextureLoader();
// const grassTexture = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/grasslight-big.jpg`)
// const rockTexture = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/rock_boulder_dry_diff_1k.png`)
const grassTexture = textureLoader.load('http://127.0.0.1:5501/textures/grasslight-big.jpg')
const rockTexture = textureLoader.load('http://127.0.0.1:5501/textures/rock_boulder_dry_diff_1k.png')
// const grassTexture = textureLoader.load('./textures/grasslight-big.jpg')
// const rockTexture = textureLoader.load('./textures/rock_boulder_dry_diff_1k.png')
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
rockTexture.wrapS = THREE.RepeatWrapping;
rockTexture.wrapT = THREE.RepeatWrapping;
terrainMaterials.forEach(material => {
    material.onBeforeCompile = (shader, renderer) => {
        console.log('onBeforeCompile');
        shader.vertexShader =
            `
#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#ifdef USE_TRIPLANETEXTURE
    varying vec3  vtriCoord;
    varying vec3  vtriNormal;
#endif
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <normal_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <displacementmap_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    vViewPosition = - mvPosition.xyz;
    #include <worldpos_vertex>
    #if defined(USE_TRIPLANETEXTURE)
        vec4 triWorldPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
            triWorldPosition = instanceMatrix * triWorldPosition;
        #endif
        triWorldPosition = modelMatrix * triWorldPosition;
        vtriCoord = triWorldPosition.xyz;
        vtriNormal =  vec3( normal ) ;
    #endif
    #include <envmap_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
}`;
        shader.fragmentShader =
            `
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#ifdef USE_TRIPLANETEXTURE
    uniform vec4 bbox; 
    varying vec3  vtriCoord;
    varying vec3  vtriNormal;
    uniform sampler2D grassTexture;
    uniform sampler2D rockTexture;
    // uniform sampler2D grassTexture;
    // uniform sampler2D grassTexture; 
//    vec4 triplaneblend(vec3 normal,sampler2D texture,vec3 coord){
//         vec3 blending =abs(normal,texture);
//         blending = normalize(max(blending, 0.001)); // Force weights to sum to 1.0
//         float b = (blending.x + blending.y + blending.z);
//         blending /= vec3(b, b, b);
     
//         vec4 xaxis = texture2D( grassTexture, coord.yz*0.1);
//         vec4 yaxis = texture2D( grassTexture, coord.xz*0.1);
//         vec4 zaxis = texture2D( grassTexture, coord.xy*0.1);
//         // blend the results of the 3 planar projections.
//         vec4 tex = xaxis * blending.x + xaxis * blending.y + zaxis * blending.z;
//         return tex;
//     }
#endif
void main() {
    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #ifdef USE_TRIPLANETEXTURE  
        vec3 blending =abs(vtriNormal);
        blending = normalize(max(blending, 0.001)); // Force weights to sum to 1.0
        float b = (blending.x + blending.y + blending.z);
        blending /=b;

        
        vec4 xaxis,yaxis,zaxis; 
        xaxis = texture2D(grassTexture, vtriCoord.yz*0.1);
        yaxis = texture2D(grassTexture, vtriCoord.xz*0.1);
        zaxis = texture2D(grassTexture, vtriCoord.xy*0.1);
        vec4 grassTex = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z; 
    
        xaxis = texture2D(rockTexture, vtriCoord.yz*0.1);
        yaxis = texture2D(rockTexture, vtriCoord.xz*0.1);
        zaxis = texture2D(rockTexture, vtriCoord.xy*0.1);
        vec4 rockTex = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z; 
        float amount = smoothstep (0.6,0.8,vtriNormal.y);

        vec4 tex =amount* grassTex+(1.0-amount)*rockTex;
         
        // blend the results of the 3 planar projections.
        diffuseColor *= tex;
        if(vtriCoord.x>bbox.x && vtriCoord.z>bbox.y && vtriCoord.x<bbox.z && vtriCoord.z<bbox.w)
            discard;
    #endif
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <normal_fragment_begin>
    #include <normal_fragment_maps>
    #include <emissivemap_fragment>
    #include <lights_phong_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>
    #include <aomap_fragment>
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
    #include <envmap_fragment>
    #include <output_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
}`  ;

        shader.defines = shader.defines || {};
        shader.uniforms.grassTexture = { value: grassTexture };
        shader.uniforms.rockTexture = { value: rockTexture };
        shader.uniforms.bbox = { value: new Vector4() };
        terrainMaterial.uniforms = shader.uniforms;
        shader.defines['USE_TRIPLANETEXTURE'] = '';
        debugger
    }

    material.onBeforeRender = function (shader, renderer) {
        if (shader.uniforms && this.bbox && !shader.uniforms.bbox.value.equals(this.bbox)) {
            // debugger
            shader.uniforms.bbox.value.copy(this.bbox);
        }
    }
})
//     new THREE.ShaderMaterial({
//     vertexShader: vs,
//     fragmentShader: fs,
//     defines: {},
//     uniforms: {}
// });
