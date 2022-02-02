"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainMaterial = void 0;
const three_1 = require("three");
const vs = `

`;
const fs = `

`;
exports.TerrainMaterial = new three_1.ShaderMaterial({
    vertexShader: vs,
    fragmentShader: fs,
    defines: {},
    uniforms: {}
});
