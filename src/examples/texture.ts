import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexTex, fragmentTex } from './shaders';
import { Cube, cubeTexCoords } from '../vertices';
import { FPSCamera } from './cameras';

import img from './wood.png';

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
vao_.setPtr_(1, 3);
ctx.texture_().setImage_(img);

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update_(dt);
};

export const render = () => {
    ctx.clear_();

    vao_.bind_();
    shader.use_();

    shader.uniform_`uPos`.u4f_(0, 0, 0, 0);
    shader.uniform_`uMat`.m4fv_(cam.mat_());
    draw_();
};
