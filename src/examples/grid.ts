import { mat4 } from 'gl-matrix';
import { CompRender } from '../engine/components/render';
import { bindVAO, mesh, shaderProgram, uniformFns, useProgram } from '../engine/webgl2-stateless';
import { Plane } from '../vertices';

const vert = `#version 300 es
precision lowp float;
layout(location=0)in vec2 aPos;
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
}`;

const frag = `#version 300 es
precision lowp float;
in vec3 nearP;
in vec3 farP;
in mat4 fragMat;
out vec4 fragColor;

vec4 grid(vec3 fragPos3D, float scale) {
    vec2 coord = fragPos3D.xz * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = 1. - min(grid.x, grid.y);
    vec4 color = vec4(vec3(.2), line);
    // x axis
    color.r = max(1. - step(0.9 * derivative.y, abs(fragPos3D.z)), color.r);
    // z axis
    color.g = max(1. - step(0.9 * derivative.x, abs(fragPos3D.x)), color.g);
    return color;
}

float computeDepth(vec3 p) {
    vec4 clipSpacePos = fragMat * vec4(p.xyz, 1.0);
    return clipSpacePos.z;
}

void main() {
    float t = -nearP.y / (farP.y - nearP.y);
    vec3 fragPos3D = nearP + t * (farP - nearP);

    gl_FragDepth = computeDepth(fragPos3D);

    fragColor = grid(fragPos3D, .1) * step(0., t) * smoothstep(.5, .0, t);
}
`;

let vao: WebGLVertexArrayObject, prg: WebGLProgram, draw: () => void, uniform: any, loaded = false;
const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);
    uniform('uMat').m4fv(mat);
    draw();
};

export const enableGrid = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (loaded) return;
    prg = shaderProgram(gl, vert, frag);
    uniform = uniformFns(gl, prg);
    [vao, draw] = mesh(gl, Plane(2), [[0, 2]]);
    loaded = true;
};

export const disableGrid = () => {
    CompRender.splice(CompRender.indexOf(render));
};
