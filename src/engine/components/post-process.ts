import { bindTexture, disableRenderTarget, enableRenderTarget } from "../webgl2-stateless";

export const CompPostProcess: ((gl: WebGL2RenderingContext) => void)[] = [];

// ping-pong between framebuffers
export const CompPostProcessRun = (gl: WebGL2RenderingContext, fb1: WebGLFramebuffer, fb2: WebGLFramebuffer, target1: WebGLTexture, target2: WebGLTexture, width: number, height: number) => {
    let tempFB: WebGLFramebuffer, tempTex: WebGLTexture, lastItem = CompPostProcess.length - 1;
    for (let i = 0; i < lastItem; i++) {
        bindTexture(gl, target1);
        enableRenderTarget(gl, fb2, width, height);
        CompPostProcess[i](gl);
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
    CompPostProcess[lastItem](gl);
};
