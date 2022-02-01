import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexNormalFrag, fragmentPhong, vertexPos, fragmentStatic } from './shaders';
import { Cube } from '../vertices';
import { FPSCamera } from './cameras';

const ctx = createGLContext(getById('c'));
ctx.resize_();
onresize = ctx.resize_;

const shader = ctx.shader_(
    vertexNormalFrag,
    fragmentPhong
).use_();

const { vao_, draw_ } = ctx.createMesh_(
    Cube(10),
    [
        // aPos
        [0, 3, 24],
        // aNorm
        [1, 3, 24, 12],
    ]
);

const lightSh = ctx.shader_(
    vertexPos,
    fragmentStatic
).use_();

const { vao_: lightVao, draw_: drawLight } = ctx.createMesh_(
    Cube(3),
    [
        [0, 3, 24],
    ]
);

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
    shader.uniform_`uCam`.u3f_(cam.eye_[0], cam.eye_[1], cam.eye_[2]);
    shader.uniform_`uLightPos`.u3f_(20, 20, 20);
    shader.uniform_`uColor`.u3f_(.2, .7, .5);
    draw_();

    lightVao.bind_();
    lightSh.use_();

    lightSh.uniform_`uMat`.m4fv_(mat);
    lightSh.uniform_`uColor`.u3f_(1, 1, 1);
    lightSh.uniform_`uPos`.u4f_(20, 20, 20, 0);
    drawLight();
};
