import { createGLContext } from '../engine/webgl2';
import { Plane } from '../vertices';

const ctx = createGLContext(document.getElementById('c') as any);
(onresize = ctx.resize)();

const frag = `#version 300 es
precision lowp float;
in vec2 vFragCoord;
uniform float iTime;
out vec4 fragColor;

void main() {
    vec2 uv = vFragCoord;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col, 1.);
}
`;

const shader = ctx.shader(
    `#version 300 es
    precision lowp float;
    layout(location=0)in vec2 aPos;
    uniform float aspect;
    out vec2 vFragCoord;

    void main() {
        // -1 -> 1
        vec2 vwPos = aPos - 1.;
        gl_Position = vec4(vwPos, 0., 1.);
        // adjust UV for non-square aspect ratio
        vFragCoord = vec2(vwPos.x * aspect, vwPos.y);
    }`,
    frag,
).use();
shader.use().uniform`aspect`.u1f(400 / 300);

const { draw } = ctx.createMesh(
    Plane(2),
    [[0, 2]]
);

export const update = () => {};

let iTime = 0;
export const render = () => {
    shader.uniform`iTime`.u1f(iTime+=.01);
    ctx.clear();
    draw();
};
