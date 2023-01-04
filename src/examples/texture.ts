import { mat4 } from 'gl-matrix';
///<reference path="../global.d.ts" />
import { CompRender } from '../engine/components/render';
import { bindTexture, bindVAO, buffer, loadTextureImage, mesh, setBufferData, setVAOPtr, shaderProgram, texture, uniformFns, useProgram } from '../engine/webgl2-stateless';
import { makeShader } from '../globals';
import { Cube, cubeTexCoords } from '../vertices';

import img from './assets/wood.png';

/**
* Texture vertex
*/
const vertexTex = makeShader`
    layout(location=0)in vec4 aPos;
    layout(location=1)in vec2 aTex;
    uniform mat4 uVP;
    out vec2 vTex;

    void main() {
        gl_Position = uVP * aPos;
        vTex = aTex;
    }`;

/**
* Texture fragment
*/
const fragmentTex = makeShader`
    in vec2 vTex;
    uniform sampler2D uTex;
    out vec4 outColor;

    void main() {
        outColor = texture(uTex, vTex);
    }`;

const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);
    bindTexture(gl, tex);

    uniform('uPos').u4f(0, 0, 0, 0);
    uniform('uVP').m4fv(mat);
    draw();
};

let prg: WebGLProgram, vao: WebGLVertexArrayObject, tex: WebGLTexture, uniform, draw: () => void, init = false;
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (init) return;
    init = true;

    [ vao, draw ] = mesh(gl, Cube(10), [[0, 3, 24]]);

    // aTex
    setBufferData(gl, buffer(gl), cubeTexCoords);
    setVAOPtr(gl, vao, 1, 2);
    tex = texture(gl);
    loadTextureImage(gl, tex, img);

    prg = shaderProgram(gl, vertexTex, fragmentTex);
    uniform = uniformFns(gl, prg);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
