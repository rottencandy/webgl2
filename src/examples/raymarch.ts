import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { fragmentStatic, vertexPos } from './shaders';
import { Cube } from '../vertices';
import { FPSCamera } from './cameras';

const ctx = createGLContext(getById('c'));
ctx.resize_();
onresize = ctx.resize_;

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

const shader = ctx.shader_(
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
).use_();

// main cube
const { vao_, draw_ } = ctx.createMesh_(
    Cube(10),
    [ [0, 3, 24]]
);

// light cube
const lightSh = ctx.shader_(
    vertexPos,
    fragmentStatic
).use_();
const { vao_: lightVao, draw_: drawLight } = ctx.createMesh_(
    Cube(3),
    [
        [0, 3, 24],
    ]
);

const cam = FPSCamera();

export const update = (dt: number) => {
    cam.update_(dt);
};

export const render = () => {
    ctx.clear_();
    const mat = cam.mat_();

    // draw main cube
    vao_.bind_();
    shader.use_();
    shader.uniform_`uPos`.u4f_(0, 0, 0, 0);
    shader.uniform_`uMat`.m4fv_(mat);
    shader.uniform_`uCam`.u3f_(cam.eye_[0], cam.eye_[1], cam.eye_[2]);
    draw_();

    // draw light cube
    lightVao.bind_();
    lightSh.use_();
    lightSh.uniform_`uMat`.m4fv_(mat);
    lightSh.uniform_`uColor`.u3f_(1, 1, 1);
    lightSh.uniform_`uPos`.u4f_(20, 20, 20, 0);
    drawLight();
};
