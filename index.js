import * as THREE from 'three';
import { Water } from "three/examples/jsm/objects/Water";
import { Sky } from "three/examples/jsm/objects/Sky";

import metaversefile from 'metaversefile'
import { TerrainManager } from './terrainman.js';

const { useFrame, useLocalPlayer, scene, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;



export default () => {
    const physics = usePhysics();

    const rootScene = new THREE.Object3D();
    const sunPosition = new THREE.Vector3();
    const parameters = {
        elevation: 30,
        azimuth: 180
    };

    const waterHeight = 40;

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/waternormals.jpg`, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            // fog: scene.fog !== undefined
        }
    );
    water.material.uniforms.size.value = 10;

    water.rotation.x = - Math.PI / 2;
    water.position.y = waterHeight;

    rootScene.add(water);


    const sky = new Sky();
    sky.scale.setScalar(10000);
    rootScene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    function updateSun() {

        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sunPosition.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sunPosition);
        water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

        // scene.environment = pmremGenerator.fromScene(sky).texture;
    }


    updateSun();



    // const geoUtils = useGeometryUtils();
    const terrain = new TerrainManager();
    // terrain._group.y = -100
    rootScene.add(terrain._group);

    let physicsIds = []; 

    useCleanup(() => {
        for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
        }
    });

    const player = useLocalPlayer();
    player.position.y = 150;
    const nextPosition = player.position.clone();
    terrain.update(player.position);
    const diffDis = 0;

    useFrame(() => {
        nextPosition.copy(player.position);
        terrain.update(player.position, () => {
            // for (const physicsId of physicsIds) {
            //     physics.removeGeometry(physicsId);
            // }    
            // // physicsIds = [];
            // terrain.physicalgeometrys.forEach((v, i) => {
            //     const physicsId = physics.addGeometry(v)
            //     physicsIds.push(physicsId);
            // });
        });
    });
    rootScene.add(new THREE.AxesHelper(1000));

    return rootScene;
}