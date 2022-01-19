import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexNormalFrag, fragmentPhong } from './shaders';
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

const cam = FPSCamera();

const uMat = shader.uniform('uMat');
const uCam = shader.uniform('uCam');
const uLightPos = shader.uniform('uLightPos');
const uColor = shader.uniform('uColor');

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    vao.bind();
    uMat.m4fv(cam.mat());
    uCam.u3f(...cam.eye);
    uLightPos.u3f(50., 30., 20.);
    uColor.u3f(.2, .7, .5);
    ctx.clear();
    draw();
};
