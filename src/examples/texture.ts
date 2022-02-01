import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexTex, fragmentTex } from './shaders';
import { Cube, cubeTexCoords } from '../vertices';
import { FPSCamera } from './cameras';

import img from './f-texture.png';


const ctx = createGLContext(getById('c'));
ctx.resize_();
onresize = ctx.resize_;

const shader = ctx.shader_(
    vertexTex,
    fragmentTex,
).use_();

const { vao_, draw_ } = ctx.createMesh_(
    Cube(10),
    // aPos
    [[0, 3, 24]]
);

// aTex
ctx.buffer_().bind_().setData_(cubeTexCoords);
vao_.setPtr_(1, 2);
ctx.texture_();
ctx.texture_().setImage_(img);
// ctx.texture().bind()
//     .setTexData(new Uint8Array([128, 64, 128, 0, 192, 0])).setFilter().setWrap();

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update_(dt);
};

export const render = () => {
    ctx.clear_();
    const mat = cam.mat_();

    vao_.bind_();
    shader.use_();

    shader.uniform_`uPos`.u4f_(0, 0, 0, 0);
    shader.uniform_`uMat`.m4fv_(mat);
    draw_();
};
