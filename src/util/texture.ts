import { Plane } from '../vertices';
import {
    GL,
    clear,
    disableRenderTarget,
    enableRenderTarget,
    makeShader,
    mesh,
    renderTarget,
    shader,
    texture,
    useProgram,
} from '../core/webgl2-stateless';

const vertexTex = makeShader`
layout(location=0)in vec2 aPos;
uniform float aspect;
out vec2 vFragCoord;

void main() {
    // -1 -> 1
    vec2 vwPos = aPos - 1.;
    gl_Position = vec4(vwPos, 0., 1.);
    // adjust UV for non-square aspect ratio
    vFragCoord = vec2(vwPos.x * aspect, vwPos.y);
}`;

const fragmentTex = makeShader`
in vec2 vFragCoord;
out vec4 fragColor;

// https://thebookofshaders.com/edit.php#11/2d-gnoise.frag
// simple noise https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

void main() {
    vec2 uv = vFragCoord * .5 + .5;
    fragColor = vec4(noise(uv * 10.));
}`;

/**
* Used only to generate noise texture for now
* Returned texture must first be binded before use.
*/
export const makeShadedTex = (gl: GL, width: number, height: number) => {
    const [_, draw] = mesh(gl, Plane(2), [[0, 2]]);
    const [prg, uniform] = shader(gl, vertexTex, fragmentTex);
    const target = texture(gl);
    const [fb] = renderTarget(gl, target, width, height);

    enableRenderTarget(gl, fb, width, height);
    useProgram(gl, prg);
    uniform('aspect').u1f(width / height);
    clear(gl);
    draw();
    disableRenderTarget(gl);

    return target;
};
