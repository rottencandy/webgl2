import { mat4 } from 'gl-matrix';
import { CompRender } from '../components/render';
import { bindVAO, getUniformLoc, m4fset, mesh, shaderProgram, useProgram } from '../core/webgl2-stateless';
import { Plane } from '../vertices';

const vert = `#version 300 es
precision lowp float;
layout(location=0)in vec2 aPos;
uniform mat4 uVPMat;
out vec3 nearP;
out vec3 farP;
out mat4 VPMat;

vec3 unproject(float x, float y, float z, mat4 proj) {
    vec4 point = inverse(proj) * vec4(x, y, z, 1.);
    return point.xyz / point.w;
}

void main() {
    // -1 -> 1
    vec2 p = aPos - 1.;
    nearP = unproject(p.x, p.y, 0., uVPMat);
    farP = unproject(p.x, p.y, 1., uVPMat);
    VPMat = uVPMat;
    gl_Position = vec4(p, 0., 1.);
}`;

const frag = `#version 300 es
precision lowp float;
in vec3 nearP;
in vec3 farP;
in mat4 VPMat;
out vec4 fragColor;

vec4 grid(vec3 fragPos3D) {
    vec2 coord = fragPos3D.xz;
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
    vec4 clipPos = VPMat * vec4(p.xyz, 1.);
    float depth = clipPos.z / clipPos.w;
    return depth * .5 + .5;
}

void main() {
    // compute pixel pos using slope
    float t = -nearP.y / (farP.y - nearP.y);
    vec3 fragPos3D = nearP + t * (farP - nearP);

    gl_FragDepth = computeDepth(fragPos3D);

    fragColor = grid(fragPos3D) * step(0., t) * smoothstep(.5, .0, t);
}
`;

let vao: WebGLVertexArrayObject, prg: WebGLProgram, draw: () => void, uVPMat: WebGLUniformLocation, loaded = false;
const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);
    m4fset(gl, uVPMat, mat);
    draw();
};

export const enableGrid = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (loaded) return;
    prg = shaderProgram(gl, vert, frag);
    uVPMat = getUniformLoc(gl, prg, 'uVPMat');
    [vao, draw] = mesh(gl, Plane(2), [[0, 2]]);
    loaded = true;
};

export const disableGrid = () => {
    CompRender.splice(CompRender.indexOf(render));
};
