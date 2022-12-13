import { createGLContext } from '../engine/webgl2';
import { Plane } from '../vertices';
import { FPSCam3D } from './views';

const ctx = createGLContext(document.getElementById('c') as any);
(onresize = ctx.resize)();

const frag = `#version 300 es
precision lowp float;
in vec3 vRO, vRD;
in vec2 vUV;
uniform float iTime;
out vec4 fragColor;
#define MAX_STEPS 256
#define MAX_DIST  256.
#define SURF_DIST .001

#define SKY_ID 0
#define OBJ_ID 1
#define PLN_ID 2

vec3 OpMove(vec3 p, vec3 x) { return p + x; }
float SphereSDF(vec3 p, float r) {
    return length(p) - r;
}
float AAPlaneSDF(vec3 p, float height) {
    return p.y - height;
}

vec2 Dist(vec3 p) {
    float sphere = SphereSDF(p, 1.);
    float plane = AAPlaneSDF(p, -2.);
    float d = 0.;
    int id = SKY_ID;
    if (sphere < plane) {
        d = sphere;
        id = OBJ_ID;
    } else {
        d = plane;
        id = PLN_ID;
    }
    return vec2(d, id);
}

vec2 RM(vec3 ro, vec3 rd, int maxIter) {
    float dO = 0.;
    float id = float(SKY_ID);
    for (int i = 0; i < MAX_STEPS; i++) {
        vec2 dist = Dist(ro + rd * dO);
        float dS = dist.x;
        id = dist.y;
        dO += dS;
        if (dO > MAX_DIST) {
            return vec2(MAX_DIST, SKY_ID);
        }
        if (i > maxIter || abs(dS) < SURF_DIST) {
            break;
        }
    }
    return vec2(dO, id);
}

vec3 Norm(vec3 p, float id) {
    vec2 e = vec2(SURF_DIST, 0);

    vec3 n = Dist(p).x - vec3(
        Dist(p - e.xyy).x,
        Dist(p - e.yxy).x,
        Dist(p - e.yyx).x
    );
    return normalize(n);
}

float DiffuseLight(vec3 n, vec3 p, vec3 lightDir) {
    return max(dot(n, lightDir), 0.);
}

float HardShadow(vec3 p, vec3 n, vec3 lightDir) {
    float sdist = RM(p + n * SURF_DIST * 2., lightDir, 128).x;
    return sdist < MAX_DIST ? .7 : .95;
}

vec3 Material(float id, vec3 p, float light, vec3 n) {
    switch(int(id)) {
        case SKY_ID:
            return vec3(.7, .8, .9);
        case OBJ_ID:
            return vec3(.8, .6, .5) * light;
        case PLN_ID:
            return vec3(.6, .7, .6) * light;
    }
}

void main() {
    vec2 ray = RM(vRO, vRD, MAX_STEPS);
    float dist = ray.x;
    float id = ray.y;

    vec3 p = vRO + vRD * dist;
    vec3 n = Norm(p, id);

    float light = DiffuseLight(n, vRD, vec3(.5, .3, .2));
    light *= HardShadow(p, n, vec3(.5, .3, .2));
    vec3 col = Material(id, p, light, n);

    fragColor = vec4(col, 1.);
}
`;

const shader = ctx.shader(
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
        // -1 -> 1
        vec2 vwPos = aPos - 1.;
        gl_Position = vec4(vwPos, 0., 1.);

        vec3 offsets = vec3(vec2(vwPos.x * aspect, vwPos.y) * tan(radians(FOV) / 2.), 1.);
        vec3 rFront = uLookDir;
        vec3 rRight = normalize(cross(rFront, UP));
        vec3 rUp    = cross(rRight, rFront);
        vec3 rDir = rFront + rRight * offsets.x + rUp * offsets.y;

        vRD = normalize(rDir);
        vRO = uCamPos;
        vUV = vwPos;
    }`,
    frag,
).use();
shader.use().uniform`aspect`.u1f(400 / 300);

const { draw } = ctx.createMesh(
    Plane(2),
    [[0, 2]]
);

const cam = FPSCam3D();

export const update = (dt: number) => {
    cam.update(dt);
};

//let iTime = 0;
export const render = () => {
    ctx.clear();
    //shader.uniform`iTime`.u1f(iTime+=.01);
    shader.uniform`uCamPos`.u3f(cam.eye[0], cam.eye[1], cam.eye[2]);
    shader.uniform`uLookDir`.u3f(cam.lookDir[0], cam.lookDir[1], cam.lookDir[2]);
    draw();
};
