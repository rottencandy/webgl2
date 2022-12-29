import { setupKeyListener } from '../engine/input';
import { createGLContext } from '../engine/webgl2';
import { Plane } from '../vertices';
import { FPSCam3D } from './utils/views';

const width = 300, height = 300;
const aspect = width / height;
const ctx = createGLContext(document.getElementById('c') as any, width, height);
(onresize = ctx.resize)();
setupKeyListener(document.getElementById('c') as any, true);

const frag = `#version 300 es
precision lowp float;
in vec3 nearP;
in vec3 farP;
in mat4 fragMat;
uniform float iTime;
out vec4 fragColor;

vec4 grid(vec3 fragPos3D, float scale) {
    vec2 coord = fragPos3D.xz * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = 1. - min(grid.x, grid.y);
    vec4 color = vec4(vec3(.2), line);
    // x axis
    color.r = max(1. - step(0.1 * derivative.y, abs(fragPos3D.z)), color.r);
    // z axis
    color.g = max(1. - step(0.1 * derivative.x, abs(fragPos3D.x)), color.g);
    return color;
}

float computeDepth(vec3 p) {
    vec4 clipSpacePos = fragMat * vec4(p.xyz, 1.0);
    return clipSpacePos.z / clipSpacePos.w;
}

void main() {
    float t = -nearP.y / (farP.y - nearP.y);
    vec3 fragPos3D = nearP + t * (farP - nearP);

    gl_FragDepth = computeDepth(fragPos3D);

    fragColor = grid(fragPos3D, 10.) * step(0., t) * smoothstep(.1, .0, t);
}
`;

const shader = ctx.shader(
    `#version 300 es
    precision lowp float;
    layout(location=0)in vec2 aPos;
    uniform float aspect;
    uniform mat4 uMat;
    out vec3 nearP;
    out vec3 farP;
    out mat4 fragMat;

    vec3 unproject(float x, float y, float z, mat4 proj) {
        vec4 point = inverse(proj) * vec4(x, y, z, 1.);
        return point.xyz / point.w;
    }

    void main() {
        // -1 -> 1
        vec2 p = aPos - 1.;
        nearP = unproject(p.x, p.y, 0., uMat);
        farP = unproject(p.x, p.y, 1., uMat);
        fragMat = uMat;
        gl_Position = vec4(p, 0., 1.);
    }`,
    frag,
).use();

const { draw } = ctx.createMesh(
    Plane(2),
    [[0, 2]]
);

const cam = FPSCam3D(.001, 0, 1, 3, aspect);

export const update = (dt: number) => {
    cam.update(dt);
};

let iTime = 0;
export const render = () => {
    const mat = cam.mat();

    shader.uniform`iTime`.u1f(iTime+=.01);
    shader.uniform`uMat`.m4fv(mat);

    ctx.clear();
    draw();
};
