import { mat4 } from 'gl-matrix';
import { makeShader } from '../globals';
import { Cube, cubeTexCoords } from '../vertices';
import { bindTexture, bindVAO, buffer, clear, loadTextureImage, mesh, renderTargetContext, setBufferData, setVAOPtr, shaderProgram, texture, uniformFns, useProgram } from '../engine/webgl2-stateless';
import { CompRender } from '../engine/components/render';
import img from './assets/eff.png';

/**
* Texture vertex
*/
const vertexTex = makeShader`
    layout(location=0)in vec4 aPos;
    layout(location=1)in vec2 aTex;
    uniform mat4 uMat;
    out vec2 vTex;

    void main() {
        gl_Position = uMat * aPos;
        vTex = aTex;
    }`;

/**
* Texture fragment
*/
const fragmentTex = makeShader`
    in vec2 vTex;
    uniform sampler2D uTex;
    out vec4 outColor;

    void main() {
        outColor = texture(uTex, vTex) + vec4(.05);
    }`;


const render = (gl: WebGL2RenderingContext, mat: mat4) => {
    bindVAO(gl, vao);
    useProgram(gl, prg);

    uniform('uPos').u4f(0, 0, 0, 0);

    enableTarget();
        uniform('uMat').m4fv(mat);

        bindTexture(gl, tex);
        clear(gl);
        draw();
    disableTarget();

    uniform('uMat').m4fv(mat);

    bindTexture(gl, target);
    draw();
};

let init = false, vao, draw, prg, uniform, tex, target, enableTarget, disableTarget;
export const setup = (gl: WebGL2RenderingContext) => {
    CompRender.push(render);
    if (init) return;
    init = true;

    prg = shaderProgram(gl, vertexTex, fragmentTex);
    [ vao, draw ] = mesh(
        gl,
        Cube(10),
        // aPos
        [[0, 3, 24]]
    );
    uniform = uniformFns(gl, prg);

    // aTex
    setBufferData(gl, buffer(gl), cubeTexCoords);
    setVAOPtr(gl, vao, 1, 2);
    tex = loadTextureImage(gl, texture(gl), img);

    target = texture(gl);
    [enableTarget, disableTarget] = renderTargetContext(gl, target, gl.canvas.width, gl.canvas.height);
};

export const teardown = () => {
    CompRender.splice(CompRender.indexOf(render));
};
