import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { vertexNormalFragShader, fragmentPhongShader } from './shaders';
import { Cube } from '../vertices';
import { FPSCamera } from './cameras';

const ctx = createGLContext(getById('c'));
ctx.resize();
onresize = ctx.resize;

const shader = ctx.createShader(
    vertexNormalFragShader,
    fragmentPhongShader
).use();

const verts = Cube(10);
ctx.createBuffer().bind().setData(verts.data);
const { vao, draw } = ctx.createMesh(verts.data, verts.indices);

vao
    .enable(shader.attribLoc('aPos'))
    .setPointer(shader.attribLoc('aPos'), 3, 24)
    .enable(shader.attribLoc('aNorm'))
    .setPointer(shader.attribLoc('aNorm'), 3, 24, 12);

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    vao.bind();
    shader.uniform('uMat').m4fv(cam.mat());
    shader.uniform('uCam').u3f(...cam.eye());
    shader.uniform('uLightPos').u3f(50., 30., 20.);
    shader.uniform('uColor').u3f(.2, .7, .5);
    ctx.clear();
    draw();
};
