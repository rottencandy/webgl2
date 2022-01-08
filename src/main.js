import { startLoop } from './engine/loop';
import { createGLContext } from './engine/webgl2';
import { getById, radians } from './engine/globals';
import Camera from './engine/cam';
import { vertexNormalFragShader, fragmentPhongLightShader } from './shaders';
import { Cube } from './vertices';
import { sliderNoLoop } from './debug';

const ctx = createGLContext(getById('c'));
ctx.resize();
onresize = ctx.resize;

const shader = ctx.createShader(
    vertexNormalFragShader,
    fragmentPhongLightShader
).use();

const verts = Cube(10);
ctx.createBuffer().bind().setData(verts.data);

ctx
    .createVAO()
    .bind()
    .enable(shader.attribLoc('aPos'))
    .setPointer(shader.attribLoc('aPos'), 3, 24)
    .enable(shader.attribLoc('aNorm'))
    .setPointer(shader.attribLoc('aNorm'), 3, 24, 12);

ctx.createElementBuffer().bind().setIndices(verts.indices);

const cam = Camera(radians(45), 1, 500, 400 / 300)
    .moveTo(20, 20, 20)
    .recalculate();

shader.uniform('uMat').m4fv(cam.matrix);
shader.uniform('uCam').u3f(...cam.eye);
shader.uniform('uLightPos').u3f(50., 30., 20.);
shader.uniform('uColor').u3f(.2, .7, .5);

ctx.clear();
ctx.drawElements(6 * 6);
