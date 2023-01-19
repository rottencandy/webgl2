///<reference path="../global.d.ts" />
import mat4, { copy as m4copy, create as m4create } from 'gl-matrix/mat4';
import { CompMotionBlur } from '../components/motion-blur';
import { CompRender } from '../components/render';
import { bindTexture, bindVAO, buffer, loadTextureImage, makeShader, mesh, setBufferData, setVAOPtr, shaderProgram, texture, uniformFns, useProgram } from '../core/webgl2-stateless';
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

/**
* Velocity buffer
*/
const vertexVel = makeShader`
    layout(location=0)in vec4 aPos;
    uniform mat4 uVP;
    uniform mat4 uPrevVP;
    out vec4 vPos;
    out vec4 vPrevPos;

    void main() {
        vPos = uVP * aPos;
        vPrevPos = uPrevVP * aPos;
        gl_Position = vPos;
    }`;
const fragmentVel = makeShader`
    in vec4 vPos;
    in vec4 vPrevPos;
    out uvec2 outVel;

    void main() {
        vec2 a = vPos.xy / vPos.w;
        vec2 b = vPrevPos.xy / vPrevPos.w;
        vec2 outFloat = (a - b) * .5 + .5;
        outFloat *= 1000.;
        outVel = uvec2(int(outFloat.x), int(outFloat.y));
    }`;

const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);
    bindTexture(gl, tex);
    uniform('uVP').m4fv(mat);
    draw();
};

const velocity = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, velPrg);
    velUniform('uVP').m4fv(mat);
    velUniform('uPrevVP').m4fv(prevMat);
    draw();
    m4copy(prevMat, mat);
};

let prg: WebGLProgram, velPrg: WebGLProgram, vao: WebGLVertexArrayObject, tex: WebGLTexture, uniform, velUniform, draw: () => void, init = false, prevMat = m4create();
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    CompMotionBlur.push(velocity);
    if (init) return;
    init = true;

    [ vao, draw ] = mesh(gl, Cube(10), [[0, 3, 24]]);

    // aTex
    setBufferData(gl, buffer(gl), cubeTexCoords);
    setVAOPtr(gl, vao, 1, 2);
    tex = texture(gl);
    loadTextureImage(gl, tex, img);

    prg = shaderProgram(gl, vertexTex, fragmentTex);
    velPrg = shaderProgram(gl, vertexVel, fragmentVel);
    uniform = uniformFns(gl, prg);
    velUniform = uniformFns(gl, velPrg);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
