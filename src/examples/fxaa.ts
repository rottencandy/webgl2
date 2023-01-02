import { CompPostProcess } from "../engine/components/post-process";
import { shaderProgram, uniformFns, useProgram } from "../engine/webgl2-stateless";
import { makeShader } from "../globals";

// Source: https://github.com/mattdesl/glsl-fxaa
const vert = makeShader`
layout(location=0)in vec2 aTex;

uniform vec2 uRes;

out vec2 v_rgbNW;
out vec2 v_rgbNE;
out vec2 v_rgbSW;
out vec2 v_rgbSE;
out vec2 v_rgbM;
out vec2 vFragCoord;

void main() {
    vFragCoord = aTex * uRes;

    vec2 inverseVP = 1.0 / uRes.xy;
    v_rgbNW = (vFragCoord + vec2(-1.0, -1.0)) * inverseVP;
    v_rgbNE = (vFragCoord + vec2(1.0, -1.0)) * inverseVP;
    v_rgbSW = (vFragCoord + vec2(-1.0, 1.0)) * inverseVP;
    v_rgbSE = (vFragCoord + vec2(1.0, 1.0)) * inverseVP;
    v_rgbM = vec2(vFragCoord * inverseVP);
    gl_Position = vec4(aTex * 2. - 1., 1., 1.);
}`;

const frag = makeShader`
in vec2 vFragCoord;
in vec2 v_rgbNW;
in vec2 v_rgbNE;
in vec2 v_rgbSW;
in vec2 v_rgbSE;
in vec2 v_rgbM;

uniform sampler2D uTex;
uniform vec2 uRes;

out vec4 color;

#ifndef FXAA_REDUCE_MIN
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
    #define FXAA_SPAN_MAX     8.0
#endif

//optimized version for mobile, where dependent
//texture reads can be a bottleneck
vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,
            vec2 v_rgbNW, vec2 v_rgbNE,
            vec2 v_rgbSW, vec2 v_rgbSE,
            vec2 v_rgbM) {
    vec4 color;
    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
    vec3 rgbNW = texture(tex, v_rgbNW).xyz;
    vec3 rgbNE = texture(tex, v_rgbNE).xyz;
    vec3 rgbSW = texture(tex, v_rgbSW).xyz;
    vec3 rgbSE = texture(tex, v_rgbSE).xyz;
    vec4 texColor = texture(tex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * inverseVP;

    vec3 rgbA = 0.5 * (
        texture(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(tex, fragCoord * inverseVP + dir * -0.5).xyz +
        texture(tex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        color = vec4(rgbA, texColor.a);
    else
        color = vec4(rgbB, texColor.a);
    return color;
}

void main() {
    color = fxaa(uTex, vFragCoord, uRes, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}`;

let resU, prg, init = false;
export const setup = (gl: WebGL2RenderingContext) => {
    CompPostProcess.push(render);
    if (init) return;
    init = true;
    prg = shaderProgram(gl, vert, frag);
    resU = uniformFns(gl, prg)('uRes');
};

const render = (gl: WebGL2RenderingContext, draw: () => void) => {
    useProgram(gl, prg);
    resU.u2f(gl.canvas.width, gl.canvas.height);
    draw();
};

export const teardown = () => {
    CompPostProcess.splice(CompPostProcess.indexOf(render));
};
