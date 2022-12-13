import { createGLContext } from '../engine/webgl2';
import { makeShader } from '../globals';
import { Cube } from '../vertices';
import { FPSCam3D } from './utils/views';

const ctx = createGLContext(document.getElementById('c') as any, 300, 300, true);
(onresize = ctx.resize)();

/**
* Calculates transformed vertices and provides
* normals and interpolated fragment positions.
*/
const vertexNormalFrag = makeShader`
    layout(location=0)in vec4 aPos;
    layout(location=1)in vec4 aNorm;
    uniform mat4 uMat;
    uniform vec4 uPos;
    out vec3 vNormal, vFragPos;

    void main() {
        gl_Position = uMat * (uPos + aPos);
        vFragPos = aPos.xyz;
        vNormal = aNorm.xyz;
    }`;

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

/**
* Calculates fragment lights using Phong lighting (ambient+diffuse+spectacular)
* source: learnopengl.com
*/
const fragmentPhong = makeShader`
    in vec3 vNormal, vFragPos;
    uniform vec3 uColor, uLightPos, uCam;
    out vec4 outColor;

    void main() {
        // variables
        vec3 lightColor = vec3(1.);
        vec3 ambientStr = vec3(.1);
        vec3 diffStr = vec3(1.);
        vec3 spectacularStr = vec3(.5);
        float shininess = 8.;

        // ambient
        vec3 ambient = ambientStr * lightColor;

        // diffuse
        vec3 norm = normalize(vNormal);
        vec3 lightDir = normalize(uLightPos - vFragPos);
        float diff = max(dot(norm, lightDir), 0.);
        vec3 diffuse = lightColor * (diff * diffStr);

        // spectacular
        vec3 viewDir = normalize(uCam - vFragPos);

        // For blinn-phong
        //vec3 halfwayDir = normalize(lightDir + viewDir);
        //float spec = pow(max(dot(viewDir, halfwayDir), 0.), 16.);
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.), shininess);

        vec3 spectacular = lightColor * (spec * spectacularStr);

        vec3 result = (ambient + diffuse + spectacular) * uColor;
        outColor = vec4(result, 1.);
    }`;

const shader = ctx.shader(
    vertexNormalFrag,
    fragmentPhong
).use();

const { vao, draw } = ctx.createMesh(
    Cube(10),
    [
        // aPos
        [0, 3, 24],
        // aNorm
        [1, 3, 24, 12],
    ]
);

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

const cam = FPSCam3D(.01, 0, 0, 20, 1);

export const update = (dt: number) => {
    cam.update(dt);
};

export const render = () => {
    ctx.clear();
    const mat = cam.mat();

    vao.bind();
    shader.use();

    shader.uniform`uPos`.u4f(0, 0, 0, 0);
    shader.uniform`uMat`.m4fv(mat);
    shader.uniform`uCam`.u3f(cam.eye[0], cam.eye[1], cam.eye[2]);
    shader.uniform`uLightPos`.u3f(20, 20, 20);
    shader.uniform`uColor`.u3f(.2, .7, .5);
    draw();

    lightVao.bind();
    lightSh.use();

    lightSh.uniform`uMat`.m4fv(mat);
    lightSh.uniform`uColor`.u3f(1, 1, 1);
    lightSh.uniform`uPos`.u4f(20, 20, 20, 0);
    drawLight();
};
