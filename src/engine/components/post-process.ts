import { mat4 } from "gl-matrix";
import { bindTexture, disableRenderTarget, enableRenderTarget } from "../webgl2-stateless";

export const CompPostProcess: ((gl: WebGL2RenderingContext, draw: () => void, mat: mat4) => void)[] = [];

// ping-pong between framebuffers
export const CompPostProcessRun = (gl: WebGL2RenderingContext, fb1: WebGLFramebuffer, fb2: WebGLFramebuffer, target1: WebGLTexture, target2: WebGLTexture, draw: () => void, mat: mat4, width: number, height: number) => {
    let tempFB: WebGLFramebuffer, tempTex: WebGLTexture, lastItem = CompPostProcess.length - 1;
    for (let i = 0; i < lastItem; i++) {
        bindTexture(gl, target1);
        enableRenderTarget(gl, fb2, width, height);
        CompPostProcess[i](gl, draw);
        // swap fbs
        tempFB = fb1;
        fb1 = fb2;
        fb2 = tempFB;
        // swap targets
        tempTex = target1;
        target1 = target2;
        target2 = tempTex;
    }
    // last one renders to canvas
    bindTexture(gl, target1);
    disableRenderTarget(gl);
    CompPostProcess[lastItem](gl, draw, mat);
};
