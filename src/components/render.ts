import { mat4, vec3 } from 'gl-matrix';
import { clear } from '../core/webgl2-stateless';

export const CompRender: ((gl: WebGL2RenderingContext, mat: mat4, eye: vec3, aspect: number, t: number, fb: WebGLFramebuffer) => void)[] = [];

export const CompRenderRun = (gl: WebGL2RenderingContext, mat: mat4, eye: vec3, aspect: number, t: number, fb: WebGLFramebuffer) => {
    clear(gl);
    for (let i = 0; i < CompRender.length; i++) {
        CompRender[i](gl, mat, eye, aspect, t, fb);
    }
};
