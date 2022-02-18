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
const tx = ctx.texture_().setImage_(img);

const target = ctx.texture_();
const withTarget = ctx.renderTargetContext_(target);

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update_(dt);
};

const initCam = cam.mat_();
export const render = () => {
    vao_.bind_();
    shader.use_();

    shader.uniform_`uPos`.u4f_(0, 0, 0, 0);

    withTarget(() => {
        ctx.clear_();

        shader.uniform_`uMat`.m4fv_(initCam);

        tx.bind_();
        draw_();
    });

    ctx.clear_();

    shader.uniform_`uMat`.m4fv_(cam.mat_());

    target.bind_();
    draw_();
};
