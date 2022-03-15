import * as THREE from 'three';
import { IDTech } from './idTech.js';


const textureLoader = new THREE.TextureLoader();

export function generateArrayTexture2D(width, height, cell = 16) {
  return new Promise((resolve, reject) => {
    new THREE.ImageLoader().load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/grasslight-big.jpg`, (image) => {
      // use canvas to get the pixel data array of the image
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      var imageData = ctx.getImageData(0, 0, width, height);
      var pixels = new Uint8Array(imageData.data.buffer);
      const texture2d = new THREE.DataTexture2DArray(pixels, width, height, height / cell);
      texture2d.format = THREE.RGBAFormat;
      texture2d.type = THREE.UnsignedByteType;
      texture2d.wrapS = THREE.RepeatWrapping;
      texture2d.wrapT = THREE.RepeatWrapping;
      texture2d.wrapT = THREE.RepeatWrapping;
      resolve(texture2d);
    })
  });

}


const grassTexture = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/grasslight-big.jpg`)
const rockTexture = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/rock_boulder_dry_diff_1k.png`);

const Idtech = new IDTech(512, 64);
Idtech.loadAll();

grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
rockTexture.wrapS = THREE.RepeatWrapping;
rockTexture.wrapT = THREE.RepeatWrapping;
THREE.InterleavedBufferAttribute
export const terrainMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

terrainMaterial.onBeforeCompile = (shader, renderer) => {
  shader.uniforms = shader.uniforms || {};
  terrainMaterial.uniforms = shader.uniforms;
  console.log('onBeforeCompile');
  shader.vertexShader = `
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
    attribute vec4 biome0;
    attribute vec4 biome1;
    attribute vec4 biome2;

    out vec3  vtriCoord;
    out vec3  vtriNormal;
    out float vTemperature; 
    out vec4  vbiome0;  
    out vec4  vbiome1;  
    out vec4  vbiome2;  
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
        vbiome0 = biome0;
        vbiome1 = biome1;
        vbiome2 = biome2;
        vec4 triWorldPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
            triWorldPosition = instanceMatrix * triWorldPosition;
        #endif
        triWorldPosition = modelMatrix * triWorldPosition;
        vtriCoord = triWorldPosition.xyz;
        vtriNormal = vec3(normal); 
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
    precision highp sampler2DArray; 
    uniform sampler2DArray terrainArrayTexture;  
    float B_T_H[256]=float[256](
        12.0,12.0,12.0,12.0,1.0,1.0,1.0,1.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,
        12.0,12.0,12.0,12.0,1.0,1.0,1.0,1.0,1.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,
        12.0,12.0,12.0,12.0,1.0,3.0,1.0,1.0,1.0,2.0,2.0,2.0,17.0,17.0,2.0,2.0,
        12.0,12.0,12.0,12.0,3.0,3.0,1.0,1.0,1.0,1.0,2.0,2.0,17.0,17.0,2.0,2.0,
        12.0,12.0,13.0,13.0,3.0,3.0,1.0,1.0,1.0,1.0,18.0,2.0,2.0,2.0,17.0,2.0,
        12.0,12.0,13.0,13.0,3.0,3.0,1.0,1.0,1.0,1.0,18.0,18.0,2.0,2.0,17.0,2.0,
        12.0,12.0,13.0,13.0,18.0,18.0,4.0,4.0,4.0,4.0,4.0,18.0,3.0,2.0,17.0,2.0,
        12.0,12.0,13.0,13.0,18.0,18.0,4.0,4.0,4.0,4.0,4.0,18.0,3.0,3.0,17.0,2.0,
        12.0,12.0,5.0,5.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,18.0,3.0,3.0,1.0,2.0,
        12.0,12.0,5.0,5.0,4.0,4.0,4.0,4.0,4.0,4.0,4.0,18.0,3.0,3.0,1.0,1.0,
        5.0,5.0,5.0,13.0,18.0,18.0,4.0,4.0,4.0,4.0,21.0,21.0,6.0,6.0,6.0,6.0,
        5.0,5.0,13.0,13.0,3.0,18.0,4.0,4.0,4.0,4.0,21.0,21.0,6.0,6.0,6.0,6.0,
        5.0,5.0,13.0,13.0,3.0,22.0,21.0,21.0,21.0,21.0,21.0,21.0,6.0,6.0,6.0,6.0,
        5.0,5.0,5.0,13.0,22.0,22.0,21.0,21.0,21.0,21.0,21.0,21.0,6.0,6.0,6.0,6.0,
        5.0,5.0,5.0,5.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,6.0,6.0,6.0,6.0,
        5.0,5.0,5.0,5.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,21.0,6.0,6.0,6.0,6.0
    );

     

    in vec4  vbiome0;  
    in vec4  vbiome1;  
    in vec4  vbiome2; 
    in vec3 vtriCoord;
    in vec3 vtriNormal;  

    vec4 triplaneTexture(sampler2DArray arrayTexture,vec3 vtriCoord,vec3 blending,float depth, float scale){ 
      vec4 xaxis,yaxis,zaxis;   
      xaxis = texture(arrayTexture, vec3(vtriCoord.yz*scale, depth));
      yaxis = texture(arrayTexture, vec3(vtriCoord.xz*scale, depth));
      zaxis = texture(arrayTexture, vec3(vtriCoord.xy*scale, depth));
      vec4 color= xaxis * blending.x + yaxis * blending.y + zaxis * blending.z; 
      return color;
    }

   float calcBiome(float temperature,float humidity,float biomes[256]){
    float t = floor( pow(temperature, 1.3) * 16.0);
    float h = floor( pow(humidity, 1.3) * 16.0); 
    float biome= biomes[int(round(t + 16.0 * h))];
    return biome;
   }
#endif
void main() {
    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
    #include <logdepthbuf_fragment>
    #include <map_fragment>

    #if defined(USE_TRIPLANETEXTURE)   
    vec3 blending =abs(vtriNormal);
    blending = normalize(max(blending, 0.001)); // Force weights to sum to 1.0
    float b = (blending.x + blending.y + blending.z);
    blending /= b; 

    //calc biomes; 
    float biomes[5] = float[5](0.0,0.0,0.0,0.0,0.0);
    vec4 texColor[5]; 
    biomes[0] = calcBiome(vbiome0[0],vbiome1[1],B_T_H);
    biomes[1] = calcBiome(vbiome0[1],vbiome1[2],B_T_H);
    biomes[2] = calcBiome(vbiome0[2],vbiome1[3],B_T_H);
    biomes[3] = calcBiome(vbiome0[3],vbiome2[0],B_T_H);
    biomes[4] = calcBiome(vbiome1[0],vbiome2[1],B_T_H);
 
    vec4 terrainColor = vec4(0.0);
    for(int bi =0;bi<5;bi++){ ;
      texColor[bi] = triplaneTexture(terrainArrayTexture,vtriCoord,blending,biomes[bi],0.04) ;
      terrainColor+=texColor[bi];
    } 
    terrainColor = terrainColor / 5.0;

    float oceanRandom =  vbiome2[3];
    float riverRandom =  vbiome2[2];
    if(oceanRandom < 80.0/255.0){
      terrainColor = triplaneTexture(terrainArrayTexture,vtriCoord,blending,0.0,0.04);
    }
   
    diffuseColor *= terrainColor; 
    
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
  shader.uniforms.terrainArrayTexture = { value: Idtech.texture };

  shader.defines['USE_TRIPLANETEXTURE'] = '';
}
