import { startLoop } from './engine/loop';
import { createGLContext } from './engine/webgl2';
import { CANVAS, GAME_WIDTH, GAME_HEIGHT } from './engine/globals';
import { Plane } from './engine/shapes';

const ctx = createGLContext(CANVAS);

const shader = ctx.createShader(
    `#version 300 es
precision mediump float;
in vec2 aPos;
uniform vec2 uRes;

void main() {
vec2 clipSpace = (aPos / uRes) * 2. - 1.;
gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`,
    `#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
outColor = vec4(.1, .7, .5, 1);
}`
).use();

shader.uniform('uRes').u2f(GAME_WIDTH, GAME_HEIGHT);
ctx.createBuffer().bind().setData(Plane(100));

ctx.createVAO(shader.attribLoc('aPos')).bind().enable().setPointer(2);

ctx.clear(.1, .1, .1);
ctx.draw(6);
