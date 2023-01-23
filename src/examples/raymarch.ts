import { Cube } from '../vertices';
import { CompRender } from '../components/render';
import { bindVAO, makeShader, mesh, shaderProgram, uniformFns, useProgram } from '../core/webgl2-stateless';
import mat4 from 'gl-matrix/mat4';
import vec3 from 'gl-matrix/vec3';

/**
* Calculates vertices
*/
const vertexPos = makeShader`
layout(location=0)in vec4 aPos;
uniform mat4 uMat;
uniform vec4 uPos;

void main() {
    gl_Position = uMat * (uPos + aPos);
}`;

/**
* Static light color
*/
const fragmentStatic = makeShader`
uniform vec3 uColor;
out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.);
}`;

const frag = `#version 300 es
precision lowp float;
in vec3 ro, hitPos;
out vec4 outColor;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01

float GetDist(vec3 p) {
    vec4 s = vec4(5., 5., 5., 1.);
    return length(p - s.xyz) - s.w;
}

vec3 GetNormal(vec3 p) {
    float d = GetDist(p);
    vec2 e = vec2(.01, .0);

    vec3 n = d - vec3(
        GetDist(p - e.xyy),
        GetDist(p - e.yxy),
        GetDist(p - e.yyx)
    );

    return normalize(n);
}

float RayMarch(vec3 ro, vec3 rd) {
    float dO = 0.;

    for(int i = 0; i<MAX_STEPS; i++) {
        vec3 p = ro + dO * rd;
        float dS = GetDist(p);
        dO += dS;
        if (dO > MAX_DIST || dS < SURF_DIST) break;
    }
    return dO;
}

void main() {
    vec3 rd = normalize(hitPos - ro);
    float d = RayMarch(ro, rd);

    vec3 col = vec3(0.);
    if (d > MAX_DIST) {
        discard;
    } else {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        col.rgb = n;
    }

    outColor = vec4(col, 1.);
}
`;

const vert = `#version 300 es
precision lowp float;
layout(location=0)in vec4 aPos;
uniform mat4 uMat;
uniform vec4 uPos;
uniform vec3 uCam;
out vec3 ro, hitPos;

void main() {
    gl_Position = uMat * (uPos + aPos);

    // move cam from global to local space
    // (would likely need inverse of modelview mat)
    ro = uCam - uPos.xyz;

    // obj in local space
    hitPos = aPos.xyz;
}`;

export const render = (gl: WebGL2RenderingContext, vpMat: mat4, eye: vec3) => {
    // draw main cube
    bindVAO(gl, vao);
    useProgram(gl, rmPrg);
    rmUniform`uPos`.u4f(0, 0, 0, 0);
    rmUniform`uMat`.m4fv(vpMat);
    rmUniform`uCam`.u3f(eye[0], eye[1], eye[2]);
    draw();

    // draw light cube
    bindVAO(gl, lightVao);
    useProgram(gl, lightPrg);
    lightUniform`uMat`.m4fv(vpMat);
    lightUniform`uColor`.u3f(1, 1, 1);
    lightUniform`uPos`.u4f(20, 20, 20, 0);
    drawLight();
};

let init = false, vao: WebGLVertexArrayObject, lightVao: WebGLVertexArrayObject, lightPrg: WebGLProgram, rmPrg: WebGLProgram, rmUniform, lightUniform, draw, drawLight;
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (init) return;
    init = true;

    // main cube
    [ vao, draw ] = mesh(
        gl,
        Cube(10),
        [[0, 3, 24]]
    );

    // light cube
    [ lightVao, drawLight ] = mesh(
        gl,
        Cube(3),
        [[0, 3, 24]]
    );
    rmPrg = shaderProgram(gl, vert, frag);
    lightPrg = shaderProgram(gl, vertexPos, fragmentStatic);

    rmUniform = uniformFns(gl, rmPrg);
    lightUniform = uniformFns(gl, lightPrg);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
