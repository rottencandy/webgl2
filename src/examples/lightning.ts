import { mat4, vec3 } from 'gl-matrix';
import { CompRender } from '../components/render';
import { bindVAO, makeShader, mesh, shaderProgram, uniformFns, useProgram } from '../core/webgl2-stateless';
import { Cube } from '../vertices';

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

const render = (gl: WebGL2RenderingContext, mat: mat4, eye: vec3) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);

    uniform('uPos').u4f(0, 0, 0, 0);
    uniform('uMat').m4fv(mat);
    uniform('uCam').u3f(eye[0], eye[1], eye[2]);
    uniform('uLightPos').u3f(20, 20, 20);
    uniform('uColor').u3f(.2, .7, .5);
    draw();

    bindVAO(gl, lightVao);
    useProgram(gl, lightPrg);

    lightUniform('uMat').m4fv(mat);
    lightUniform('uColor').u3f(1, 1, 1);
    lightUniform('uPos').u4f(20, 20, 20, 0);
    drawLight();
};

let prg, lightPrg, vao, lightVao, draw, drawLight, uniform, lightUniform, init = false;
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (init) return;
    init = true;
    prg = shaderProgram(gl, vertexNormalFrag, fragmentPhong);
    [ vao, draw ] = mesh(
        gl,
        Cube(10),
        [
            // aPos
            [0, 3, 24],
            // aNorm
            [1, 3, 24, 12],
        ]
    );
    uniform = uniformFns(gl, prg);

    lightPrg = shaderProgram(gl, vertexPos, fragmentStatic);
    [lightVao, drawLight] = mesh(
        gl,
        Cube(3),
        [[0, 3, 24]],
    );
    lightUniform = uniformFns(gl, lightPrg);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
