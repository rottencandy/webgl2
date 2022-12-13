import { createGLContext } from '../engine/webgl2';
import { Plane } from '../vertices';
import { FPSCam3D } from './utils/views';

const cam = FPSCam3D(.01, 5, 3, 5, 1);

const ctx = createGLContext(document.getElementById('c') as any, 300, 300, true);
(onresize = ctx.resize)();

const { draw, vao } = ctx.createMesh(
    Plane(2),
    [[0, 2]]
);
vao.setPtr(1, 2);

const runShader = ctx.shader(
    `#version 300 es
    precision lowp float;
    layout(location=0)in vec2 aPos;
    uniform float aspect;
    uniform vec3 uLookDir, uCamPos;
    out vec3 vRO, vRD;
    out vec2 vUV;
    const float FOV = 45.;
    const vec3 UP = vec3(0, 1, 0);

    void main() {
        vec2 vwPos = aPos - 1.;
        gl_Position = vec4(vwPos, 0., 1.);

        vec3 offsets = vec3(vec2(vwPos.x * aspect, vwPos.y) * tan(radians(FOV) / 2.), 1.);
        vec3 rFront = uLookDir;
        vec3 rRight = normalize(cross(rFront, UP));
        vec3 rUp    = cross(rRight, rFront);
        vec3 rDir = rFront + rRight * offsets.x + rUp * offsets.y;

        vRD = normalize(rDir);
        vRO = uCamPos;
        vUV = vwPos * .5 + .5;
    }`,

    `#version 300 es
    precision lowp float;
    in vec3 vRO, vRD;
    in vec2 vUV;
    out vec4 fragColor;
    uniform sampler2D uDistTex;
    uniform sampler2D uNormTex;
    // texture size, ideally a square
    const float S = 16.;
    // dimension size * no. of z panels in one axis
    const float W = 4.;

    #define SKY_ID 0
    #define PLN_ID 1

    vec4 CachedDist(vec3 p) {
        float zindex = floor(p.z);
        float xp = mod(zindex, W) + p.x / S;
        float yp = floor(zindex / W) + p.y / S;
        vec2 texp = vec2(xp, yp) / W;
        vec3 norm = texture(uNormTex, texp).xyz * 2. - 1.;
        float offset = length(norm * fract(p));
        return vec4(texture(uDistTex, texp).x * S, norm);
    }

    vec4 RM(vec3 ro, vec3 rd) {
        float dO = 0.;
        for (int i = 0; i < 256; i++) {
            vec3 p = ro + rd * dO;
            if (p.x > S  || p.y > S  || p.z > S ||
                p.x < 0. || p.y < 0. || p.z < 0.) { return vec4(SKY_ID, 0,0,0); }
            vec4 dists = CachedDist(p);
            float dS = dists.x;
            dO += dS;
            if (dS <= 0.) { return vec4(PLN_ID, dists.yzw); }
        }
        return vec4(SKY_ID, 0,0,0);
    }

    float DiffuseLight(vec3 n) {
        vec3 lightDir = vec3(.5, .3, .2);
        return max(dot(n, lightDir), 0.);
    }

    vec3 Material(float id, vec3 norm) {
        switch(int(id)) {
            case SKY_ID:
                return vec3(.7, .8, .9);
            case PLN_ID:
                return vec3(.4, .6, .4) * DiffuseLight(norm);
        }
    }

    void main() {
        vec4 data = RM(vRO, vRD);
        float id = data.x;
        vec3 col = Material(id, data.yzw);
        fragColor = vec4(col, 1.);
    }
    `);
runShader.use().uniform`aspect`.u1f(300 / 300);

const initVert = `#version 300 es
precision lowp float;
layout(location=0)in vec2 aPos;
out vec2 vPos;
// texture size, dimension size * no. of z panels in one axis
const float S = 64.;

void main() {
    gl_Position = vec4(aPos-1., 0, 1);
    vPos = (aPos / 2.) * S;
}`;

const initFragBase = `#version 300 es
precision lowp float;
in vec2 vPos;
out vec4 outDist;
// dimension size, ideally a square
const float D = 16.;
// texture size, dimension size * no. of z panels in one axis
const float S = 64.;

float Dist(vec3 p) {
    float plane = p.y - 1.;
    float sphere = length(p-vec3(2)) - 2.;
    return min(plane, sphere);
}

vec3 Norm(vec3 p) {
    vec2 e = vec2(.01, 0);
    vec3 n = Dist(p) - vec3(
        Dist(p - e.xyy),
        Dist(p - e.yxy),
        Dist(p - e.yyx)
    );
    return normalize(n);
}

void main() {
    float posX = mod(vPos.x, D);
    float posY = mod(vPos.y, D);
    float posZ = (vPos.x / D) + (vPos.y / D) * (S / D);`;

const initDistShader = ctx.shader(
    initVert,
    `${initFragBase}outDist = vec4(Dist(vec3(posX, posY, posZ)) / D, 0, 0, 1); }`,
);

const initNormShader = ctx.shader(
    initVert,
    `${initFragBase}outDist = vec4(Norm(vec3(posX, posY, posZ)) * .5 + .5, 1); }`,
);

// uDistTex
const distTex = ctx.texture();
const forDist = ctx.renderTargetContext(distTex, 64, 64);
forDist(() => {
    ctx.clear();
    initDistShader.use();
    draw();
});

// uNormTex
const normTex = ctx.texture();
const forNorm = ctx.renderTargetContext(normTex, 64, 64);
forNorm(() => {
    ctx.clear();
    initNormShader.use();
    draw();
});

runShader.use();
distTex.setUnit(runShader.uniform`uDistTex`.loc, 0);
normTex.setUnit(runShader.uniform`uNormTex`.loc, 1);

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    ctx.clear();
    runShader.uniform`uCamPos`.u3f(cam.eye[0], cam.eye[1], cam.eye[2]);
    runShader.uniform`uLookDir`.u3f(cam.lookDir[0], cam.lookDir[1], cam.lookDir[2]);
    draw();
};
