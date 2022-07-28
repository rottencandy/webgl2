import { GL_R8, GL_RED } from '../engine/gl-constants';
import { createGLContext } from '../engine/webgl2';
import { getById } from '../globals';
import { Plane, planeTexCoords } from '../vertices';
import { FPSCamera } from './cameras';

const ctx = createGLContext(getById('c'), 300, 300);
ctx.resize_();
onresize = ctx.resize_;


const runShader = ctx.shader_(
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
    uniform sampler2D uTex;
    const float S = 16.;
    const float W = 4.;

    #define SKY_ID 0
    #define PLN_ID 1

    float Dist(vec3 p) {
        float plane = p.y - 1.;
        float sphere = length(p-vec3(2)) - 2.;
        return min(plane, sphere);
    }

    float CachedDist(vec3 p) {
        float zindex = floor(p.z);
        float xp = mod(zindex, W) + p.x / S;
        float yp = floor(zindex / W) + p.y / S;
        vec2 texp = vec2(xp, yp) / W;
        return texture(uTex, texp).x * S;
    }

    int RM(vec3 ro, vec3 rd) {
        float dO = 0.;
        for (int i = 0; i < 256; i++) {
            vec3 p = ro + rd * dO;
            if (p.x > S  || p.y > S  || p.z > S) { return SKY_ID; }
            if (p.x < 0. || p.y < 0. || p.z < 0.) { return SKY_ID; }
            float dS = CachedDist(p);
            dO += dS;
            if (dS <= 0.) { return PLN_ID; }
        }
        return SKY_ID;
    }

    vec3 Material(int id) {
        switch(id) {
            case SKY_ID: return vec3(.7, .8, .9);
            case PLN_ID: return vec3(.4, .6, .4);
        }
    }

    void main() {
        int id = RM(vRO, vRD);
        vec3 col = Material(id);
        fragColor = vec4(col, 1.);
        // fragColor = texture(uTex, vUV);
    }
    `);
runShader.use_().uniform_`aspect`.u1f_(300 / 300);

const initShader = ctx.shader_(
    `#version 300 es
    precision lowp float;
    layout(location=0)in vec2 aPos;
    out vec2 vPos;
    const float S = 64.;

    void main() {
        gl_Position = vec4(aPos-1., 0, 1);
        vPos = (aPos / 2.) * S;
    }`,

    `#version 300 es
    precision lowp float;
    in vec2 vPos;
    out vec4 outDist;
    const float S = 64.;
    const float D = 16.;

    float Dist(vec3 p) {
        float plane = p.y - 1.;
        float sphere = length(p-vec3(2)) - 2.;
        return min(plane, sphere);
    }

    void main() {
        float posX = mod(vPos.x, D);
        float posY = mod(vPos.y, D);
        float posZ = (vPos.x / D) + (vPos.y / D) * (S / D);
        outDist = vec4(Dist(vec3(posX, posY, posZ)) / D, 0, 0, 1);
    }
    `,
);

const { draw_, vao_ } = ctx.createMesh_(
    Plane(2),
    [[0, 3, 24]]
);

// aTex
ctx.buffer_().bind_().setData_(planeTexCoords);
vao_.setPtr_(1, 2);
const target = ctx.texture_().bind_();
const withTarget = ctx.renderTargetContext_(target, 64, 64, GL_R8, GL_RED);
withTarget(() => {
    ctx.clear_();
    initShader.use_();
    draw_();
});
target.bind_();

const cam = FPSCamera(.01, 3, 3, 3);

export const update = (dt: number) => {
    cam.update_(dt);
};

runShader.use_();
export const render = () => {
    ctx.clear_();
    runShader.uniform_`uCamPos`.u3f_(cam.eye_[0], cam.eye_[1], cam.eye_[2]);
    runShader.uniform_`uLookDir`.u3f_(cam.lookDir_[0], cam.lookDir_[1], cam.lookDir_[2]);
    draw_();
};
