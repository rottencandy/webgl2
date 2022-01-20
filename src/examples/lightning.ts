import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexNormalFrag, fragmentPhong, vertexPos, fragmentStatic } from './shaders';
import { Cube } from '../vertices';
import { FPSCamera } from './cameras';

const ctx = createGLContext(getById('c'));
ctx.resize();
onresize = ctx.resize;

const shader = ctx.shader(
    vertexNormalFrag,
    fragmentPhong
).use();

const { vao, draw } = ctx.createMesh(
    Cube(10),
    [
        [shader.attribLoc('aPos'), 3, 24],
        [shader.attribLoc('aNorm'), 3, 24, 12],
    ]
);

const lightSh = ctx.shader(
    vertexPos,
    fragmentStatic
).use();

const { vao: lightVao, draw: drawLight } = ctx.createMesh(
    Cube(3),
    [
        [shader.attribLoc('aPos'), 3, 24],
    ]
);

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    ctx.clear();
    const mat = cam.mat();

    vao.bind();
    shader.use();

    shader.uniform('uPos').u4f(0, 0, 0, 0);
    shader.uniform('uMat').m4fv(mat);
    shader.uniform('uCam').u3f(...cam.eye);
    shader.uniform('uLightPos').u3f(20, 20, 20);
    shader.uniform('uColor').u3f(.2, .7, .5);
    draw();

    lightVao.bind();
    lightSh.use();

    lightSh.uniform('uMat').m4fv(mat);
    lightSh.uniform('uColor').u3f(1, 1, 1);
    lightSh.uniform('uPos').u4f(20, 20, 20, 0);
    drawLight();
};
