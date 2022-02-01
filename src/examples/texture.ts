import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexTex, fragmentTex } from './shaders';
import { Cube, cubeTexCoords } from '../vertices';
import { FPSCamera } from './cameras';

import img from './f-texture.png';


const ctx = createGLContext(getById('c'));
ctx.resize();
onresize = ctx.resize;

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
ctx.texture();
ctx.texture().setImage(img);
// ctx.texture().bind()
//     .setTexData(new Uint8Array([128, 64, 128, 0, 192, 0])).setFilter().setWrap();

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    ctx.clear();
    const mat = cam.mat();

    vao.bind();
    shader.use();

    shader.uniform`uPos`.u4f_(0, 0, 0, 0);
    shader.uniform`uMat`.m4fv_(mat);
    draw();
};
