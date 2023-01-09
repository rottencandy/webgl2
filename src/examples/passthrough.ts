///<reference path="../global.d.ts" />
import { CompPostProcess } from "../engine/components/post-process";
import { shaderProgram, useProgram } from "../engine/webgl2-stateless";
import { makeShader } from "../globals";

const vert = makeShader`
layout(location=0)in vec2 aTex;

out vec2 vUV;

void main() {
    vUV = aTex;
    gl_Position = vec4(aTex * 2. - 1., 1., 1.);
}`;

const frag = makeShader`
in vec2 vUV;

uniform sampler2D uTex;

out vec4 color;

void main() {
    color = texture(uTex, vUV);
}`;

let prg: WebGLProgram, init = false;
export const enablePassthrough = (gl: WebGL2RenderingContext) => {
    CompPostProcess.push(render);
    if (init) return;
    init = true;
    prg = shaderProgram(gl, vert, frag);
};

const render = (gl: WebGL2RenderingContext, draw: () => void) => {
    useProgram(gl, prg);
    draw();
};

export const disablePassthrough = () => {
    CompPostProcess.splice(CompPostProcess.indexOf(render));
};
