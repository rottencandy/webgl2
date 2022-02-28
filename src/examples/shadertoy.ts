import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { Plane } from '../vertices';

const ctx = createGLContext(getById('c'));
ctx.resize_();
onresize = ctx.resize_;

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

const shader = ctx.shader_(
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
).use_();
shader.use_().uniform_`aspect`.u1f_(400 / 300);

const { draw_ } = ctx.createMesh_(
    Plane(2),
    [[0, 3, 24]]
);

export const update = () => {};

let iTime = 0;
export const render = () => {
    shader.uniform_`iTime`.u1f_(iTime+=.01);
    ctx.clear_();
    draw_();
};
