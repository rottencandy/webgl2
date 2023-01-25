// for gl-matrix types
///<reference path="../global.d.ts" />
import mat4 from "gl-matrix/mat4";
import { clearIntDepth, getUniformLoc, makeShader, setTextureUnit, shaderProgram, useProgram } from "../core/webgl2-stateless";
import { CompPostProcess } from "./post-process";

let enabled = false, prg: WebGLProgram, velTex: WebGLTexture, uVel: WebGLUniformLocation;

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

// https://ogldev.org/www/tutorial41/tutorial41.html
// https://holko.pl/2014/07/21/motion-blur/
const frag = makeShader`
in vec2 vUV;
uniform sampler2D uCol;
uniform lowp usampler2D uVel;
out vec4 color;

vec4 motionBlur(sampler2D img, vec2 velocity, vec2 uv, int samples) {
  vec4 sum = vec4(0.0), avg = vec4(0.0);
  vec2 dc = uv, offset = -velocity;
  for (int i=0; i < (samples * 2 + 1); i++) {
      sum += texture(img, dc + offset);
      offset += velocity / float(samples);
  }
  avg = sum / float((samples * 2 + 1));
  return avg;
}

void main() {
    vec2 texelSize = 1. / vec2(textureSize(uCol, 0));
    uvec2 intVelocity = texture(uVel, vUV).rg;
    vec2 velocity = vec2(intVelocity) / 1000.;
    velocity = velocity * 2. - 1.;

    vec2 texP = vUV;
    color = vec4(0.);

    for (int i = 4; i > 0; i--) {
        color += texture(uCol, texP) * float(i) * .1;
        texP -= velocity;
    }
}`;

const applyMotionBlur = (gl: WebGL2RenderingContext, draw: () => void) => {
    useProgram(gl, prg);
    setTextureUnit(gl, velTex, uVel, 1);
    draw();
};

export const enableMotionBlur = (gl: WebGL2RenderingContext, tex: WebGLTexture) => {
    prg = shaderProgram(gl, vert, frag);
    uVel = getUniformLoc(gl, prg, 'uVel');
    velTex = tex;
    CompPostProcess.push(applyMotionBlur);
};

export const disableMotionBlur = () => {
    CompPostProcess.splice(CompPostProcess.indexOf(applyMotionBlur));
};
