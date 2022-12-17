import { createGLContext } from '../engine/webgl2';
import { makeShader } from '../globals';
import { Cube, cubeTexCoords } from '../vertices';
import { FPSCam3D } from './utils/views';

import img from './assets/eff.png';

const ctx = createGLContext(document.getElementById('c') as any, 300, 300, true);
(onresize = ctx.resize)();

/**
* Texture vertex
*/
const vertexTex = makeShader`
    layout(location=0)in vec4 aPos;
    layout(location=1)in vec2 aTex;
    uniform mat4 uMat;
    out vec2 vTex;

    void main() {
        gl_Position = uMat * aPos;
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

const shader = ctx.shader(
    vertexTex,
    fragmentTex,
).use();

const { vao, draw } = ctx.createMesh(
    Cube(10),
    // aPos
    [[0, 3, 24]]
);

// aTex
ctx.buffer().bind().setData(cubeTexCoords);
vao.setPtr(1, 2);
const tx = ctx.texture().setImage(img);

const target = ctx.texture();
const renderTarget = ctx.renderTargetContext(target);

const cam = FPSCam3D(.01, 0, 0, 20, 1);

export const update = (dt: number) => {
    cam.update(dt);
};

const initCam = cam.mat();
export const render = () => {
    vao.bind();
    shader.use();

    shader.uniform`uPos`.u4f(0, 0, 0, 0);

    renderTarget.enable();
        ctx.clear();

        shader.uniform`uMat`.m4fv(initCam);

        tx.bind();
        draw();
    renderTarget.disable();

    ctx.clear();

    shader.uniform`uMat`.m4fv(cam.mat());

    target.bind();
    draw();
};
