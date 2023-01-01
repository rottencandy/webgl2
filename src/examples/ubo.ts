import { mat4 } from 'gl-matrix';
import { CompRender } from '../engine/components/render';
import { bindVAO, mesh, shaderProgram, UBO, useProgram } from '../engine/webgl2-stateless';
import { makeShader } from '../globals';
import { Cube } from '../vertices';

/**
* Calculates vertices
*/
const vertex1 = makeShader`
    layout(location=0)in vec4 aPos;

    uniform Settings {
        vec3 uColor;
        vec4 uPos;
        mat4 uMat;
    };

    void main() {
        gl_Position = uMat * (uPos + aPos);
    }`;

const vertex2 = makeShader`
    layout(location=0)in vec4 aPos;

    uniform Settings {
        vec3 uColor;
        vec4 uPos;
        mat4 uMat;
    };

    void main() {
        gl_Position = uMat * (uPos + aPos + vec4(10., 0., 10., 0.));
    }`;

/**
* Static light color
*/
const fragment1 = makeShader`
    out vec4 outColor;

    uniform Settings {
        vec3 uColor;
        vec4 uPos;
        mat4 uMat;
    };

    void main() {
        outColor = vec4(uColor, 1.);
    }`;

const fragment2 = makeShader`
    out vec4 outColor;

    uniform Settings {
        vec3 uColor;
        vec4 uPos;
        mat4 uMat;
    };

    void main() {
        outColor = vec4(1. - uColor, 1.);
    }`;

const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    ubo.set([
        // uColor
        new Float32Array([.4, .5, .3]),
        // uPos
        new Float32Array([0, 0, 0, 0]),
        // uMat
        mat,
    ]);
    useProgram(gl, prg1);
    draw();
    useProgram(gl, prg2);
    draw();
};

let prg1, prg2, vao, draw, ubo, init = false;
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (init) return;
    init = true;

    [ vao, draw ] = mesh(
        gl,
        Cube(5),
        [
            // aPos
            [0, 3, 24],
            // aNorm
            [1, 3, 24, 12],
        ]
    );

    prg1 = shaderProgram(gl, vertex1, fragment1);
    prg2 = shaderProgram(gl, vertex2, fragment2);
    bindVAO(gl, vao);
    ubo = UBO(gl, 'Settings', prg1, ['uColor', 'uPos', 'uMat']);
    ubo.bindPrg(prg2);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
