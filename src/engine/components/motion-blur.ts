import mat4 from "gl-matrix/mat4";
import { makeShader } from "../../globals";
import { clearIntDepth, setTextureUnit, shaderProgram, uniformFns, useProgram } from "../webgl2-stateless";
import { CompPostProcess } from "./post-process";

let init = false, enabled = false, prg: WebGLProgram, velTex: WebGLTexture, uniform;

export const CompMotionBlur: ((gl: WebGL2RenderingContext, mat: mat4) => void)[] = [];

export const CompMotionBlurRun = (gl: WebGL2RenderingContext, mat: mat4) => {
    if (!enabled) return;
    // needs clearBuffer, gl.clear() won't work on INT textures
    clearIntDepth(gl);
    for (let i = 0; i < CompMotionBlur.length; i++) {
        CompMotionBlur[i](gl, mat);
    }
};

const vert = makeShader`
layout(location=0)in vec2 aTex;
out vec2 vUV;

void main() {
    gl_Position = vec4(aTex * 2. - 1., 1., 1.);
    vUV = aTex;
}`;

const frag = makeShader`
#define MAX_SAMPLES 8
#define INTENSITY 1.

in vec2 vUV;
uniform sampler2D uCol;
uniform lowp usampler2D uVel;
out vec4 color;

void main() {
    vec2 texelSize = 1. / vec2(textureSize(uCol, 0));
    uvec2 intVelocity = texture(uVel, vUV).rg;
    vec2 velocity = vec2(intVelocity.xy) / 700.;
    velocity *= INTENSITY;
    float speed = length(velocity / texelSize);
    int nSamples = clamp(int(speed), 1, MAX_SAMPLES);

    color = texture(uCol, vUV);
    for (int i = 1; i < nSamples; ++i) {
        vec2 offset = velocity * (float(i) / float(nSamples - 1) - 0.5);
        color += texture(uCol, vUV + offset);
    }
    color /= float(nSamples);
}`;

const applyMotionBlur = (gl: WebGL2RenderingContext, draw: () => void) => {
    useProgram(gl, prg);
    setTextureUnit(gl, velTex, uniform('uVel').loc, 1);
    draw();
};

export const enableMotionBlur = (gl: WebGL2RenderingContext, tex: WebGLTexture) => {
    enabled = true;
    if (init) return;
    init = true;
    prg = shaderProgram(gl, vert, frag);
    uniform = uniformFns(gl, prg);
    velTex = tex;
    CompPostProcess.push(applyMotionBlur);
};

export const disableMotionBlur = () => {
    enabled = false;
    CompPostProcess.splice(CompPostProcess.indexOf(applyMotionBlur));
};
