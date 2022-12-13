import { createGLContext } from '../engine/webgl2';
import { Cube } from '../vertices';
import { FPSCam3D } from './views';
import { makeShader } from '../globals';

const ctx = createGLContext(document.getElementById('c') as any, 300, 300, true);
(onresize = ctx.resize)();

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

const shader = ctx.shader(
    `#version 300 es
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
    }`,
    frag,
).use();

// main cube
const { vao, draw } = ctx.createMesh(
    Cube(10),
    [ [0, 3, 24]]
);

// light cube
const lightSh = ctx.shader(
    vertexPos,
    fragmentStatic
).use();
const { vao: lightVao, draw: drawLight } = ctx.createMesh(
    Cube(3),
    [
        [0, 3, 24],
    ]
);

const cam = FPSCam3D();

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    ctx.clear();
    const mat = cam.mat();

    // draw main cube
    vao.bind();
    shader.use();
    shader.uniform`uPos`.u4f(0, 0, 0, 0);
    shader.uniform`uMat`.m4fv(mat);
    shader.uniform`uCam`.u3f(cam.eye[0], cam.eye[1], cam.eye[2]);
    draw();

    // draw light cube
    lightVao.bind();
    lightSh.use();
    lightSh.uniform`uMat`.m4fv(mat);
    lightSh.uniform`uColor`.u3f(1, 1, 1);
    lightSh.uniform`uPos`.u4f(20, 20, 20, 0);
    drawLight();
};
