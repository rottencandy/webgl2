import { startLoop } from './engine/loop';
import { createGLContext } from './engine/webgl2';
import { CANVAS, radians } from './engine/globals';
import { Camera } from './engine/cam';
import { Cube } from './vertices';
import { sliderNoLoop } from './debug';

const ctx = createGLContext(CANVAS);

const shader = ctx.createShader(
    `#version 300 es
precision mediump float;
in vec4 aPos;
uniform mat4 uMat;

void main() {
gl_Position = uMat * aPos;
}`,
    `#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
outColor = vec4(.1, .7, .5, 1);
}`
).use();

ctx.createBuffer().bind().setData(Cube(10));

ctx
    .createVAO()
    .bind()
    .enable(shader.attribLoc('aPos'))
    .setPointer(shader.attribLoc('aPos'), 3, 24);
//    .enable(shader.attribLoc('aNorm'))
//    .setPointer(shader.attribLoc('aNorm'), 3, 24, 12);

const cam = Camera(radians(45), 1, 500);
cam.moveTo(20, 20, 20);
cam.recalculate();

shader.uniform('uMat').m4fv(cam.matrix);

ctx.clear();
ctx.draw(6 * 6);
