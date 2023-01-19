// for gl-matrix types
///<reference path="../global.d.ts" />
import mat4, {
    translate as m4translate,
    rotateX as m4rotatex,
    identity as m4identity,
} from 'gl-matrix/mat4';
import { CompRender } from '../components/render';
import { CompPhysics } from '../components/physics';
import {
    bindVAO,
    buffer,
    drawElementsInstanced,
    getUniformLoc,
    m4fset,
    makeShader,
    mesh,
    setBufferData,
    setBufferSub,
    setInstanceDivisor,
    setVAOPtr,
    shaderProgram,
    useProgram
} from '../core/webgl2-stateless';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW } from '../core/gl-constants';
import { Cube } from '../vertices';

const vert = makeShader`
    layout(location=0)in vec4 aPos;
    layout(location=1)in vec4 aNorm;
    layout(location=2)in vec3 aCol;
    layout(location=3)in mat4 aM;
    uniform mat4 uVP;
    out vec3 vNorm, vFragPos, vCol;

    void main() {
        gl_Position = uVP * aM * aPos;
        vFragPos = aPos.xyz;
        vNorm = vec3(normalize(aM * aNorm));
        vCol = aCol;
    }`;

const frag = makeShader`
    #define LIGHTPOS vec3(10., 20., 15.)
    in vec3 vNorm, vFragPos, vCol;
    out vec4 col;

    void main() {
        float ambient = .2;
        vec3 norm = normalize(vNorm);
        vec3 lightDir = normalize(LIGHTPOS - vFragPos);
        float diff = max(dot(norm, lightDir), 0.);
        col = vec4((ambient + diff) * vCol, 1.);
    }`;

const update = (dt: number) => {
    for (let i = 0; i < mats.length; i++) {
        m4rotatex(mats[i], mats[i], 1/1e4 * (i+1) * dt);
    }
};

const render = (gl: WebGL2RenderingContext, vpMat: mat4) => {
    bindVAO(gl, vao);
    setBufferSub(gl, matBuf, 0, matData);
    useProgram(gl, prg);
    m4fset(gl, uVP, vpMat);
    drawElementsInstanced(gl, 36, 0, instances);
};

let prg: WebGLProgram, vao: WebGLVertexArrayObject, matBuf: WebGLBuffer, init = false;
let uVP: WebGLUniformLocation;
const instances = 3;
const matData = new Float32Array(instances * 16);
const mats: Float32Array[] = [];
for (let i = 0; i < instances; i++) {
    const byteOffset = i * 16 * 4;
    const numFloats = 16;
    mats.push(new Float32Array(matData.buffer, byteOffset, numFloats));
}
for (let i = 0; i < mats.length; i++) {
    m4identity(mats[i]);
    m4translate(mats[i], mats[i], [i*10, 0, 0]);
}

export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    CompPhysics.push(update);
    if (init) return;
    init = true;

    prg = shaderProgram(gl, vert, frag);
    uVP = getUniformLoc(gl, prg, 'uVP');

    [ vao ] = mesh(
        gl,
        Cube(5),
        [
            // aPos
            [0, 3, 24],
            // aNorm
            [1, 3, 24, 12],
        ]
    );

    matBuf = setBufferData(gl, buffer(gl), matData, GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW);
    const bytesPerMatrix = 4 * 16;
    for (let i = 0; i < 4; i++) {
        const loc = 3 + i;
        const offset = i * 16; // 4 floats per row, 4 bytes per float
        setVAOPtr(gl, vao, loc, 4, bytesPerMatrix, offset);
        // this line says this attribute only changes for each 1 instance
        gl.vertexAttribDivisor(loc, 1);
    }

    setBufferData(gl, buffer(gl), new Float32Array([
        .3, .4, .2, 1,
        .4, .3, .2, 1,
        .4, .2, .3, 1,
    ]))
    setVAOPtr(gl, vao, 2, 4);
    gl.vertexAttribDivisor(2, 1);
};

export const teardown = () => {
    CompPhysics.splice(CompPhysics.indexOf(update));
    CompRender.splice(CompRender.indexOf(render));
};
