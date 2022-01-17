import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_TEST,
    GL_ELEMENT_ARRAY_BUFFER,
    GL_FLOAT,
    GL_FRAGMENT_SHADER,
    GL_LEQUAL,
    GL_LINK_STATUS,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_SRC_ALPHA,
    GL_STATIC_DRAW,
    GL_TRIANGLES,
    GL_UNSIGNED_SHORT,
    GL_VERTEX_SHADER,
} from './gl-constants';
import { deviceScaleRatio, getById } from '../globals';
import { setupKeyListener } from './input';

const clearFn = (gl: WebGL2RenderingContext) => (r = .1, g = .1, b = .1, a = 1.) => {
    gl.clearColor(r, g, b, a);
    gl.clearDepth(1.);
    gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
};

const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
};

const uniformSetterFns = (gl: WebGL2RenderingContext, prg: WebGLProgram) => (name: string) => {
    const loc = gl.getUniformLocation(prg, name);

    return {
        loc,
        u1f: (x: number) => gl.uniform1f(loc, x),
        u2f: (x: number, y: number) => gl.uniform2f(loc, x, y),
        u3f: (x: number, y: number, z: number) => gl.uniform3f(loc, x, y, z),
        u4f: (x: number, y: number, z: number, w: number) => gl.uniform4f(loc, x, y, z, w),
        m3fv: (data: Float32List, transpose = false) => gl.uniformMatrix3fv(loc, transpose, data),
        m4fv: (data: Iterable<number>, transpose = false) => gl.uniformMatrix4fv(loc, transpose, data),
        u1i: (x: number) => gl.uniform1i(loc, x),
    };
};

type ShaderState = {
    prg: WebGLProgram;
    use: () => ShaderState;
    // TODO:
    uniform: ReturnType<typeof uniformSetterFns>;
    attribLoc: (name: string) => number;
};

const createShaderProgram = (gl: WebGL2RenderingContext, vShader: WebGLShader, fShader: WebGLShader): ShaderState => {
    const prg = gl.createProgram();
    gl.attachShader(prg, vShader);
    gl.attachShader(prg, fShader);
    gl.linkProgram(prg);

    if (!gl.getProgramParameter(prg, GL_LINK_STATUS)) {
        console.error('Link failed: ', gl.getProgramInfoLog(prg));
        console.error('vs info-log: ', gl.getShaderInfoLog(vShader));
        console.error('fs info-log: ', gl.getShaderInfoLog(fShader));
        throw new Error('Program link failed!');
    }

    const thisObj: ShaderState = {
        prg,
        uniform: uniformSetterFns(gl, prg),
        use() { gl.useProgram(prg); return thisObj; },
        attribLoc: (name: string) => gl.getAttribLocation(prg, name),
    };

    return thisObj;
};

const createShaderFns = (gl: WebGL2RenderingContext) => (vsSource: string, fsSource: string) => {
    const vShader = createShader(gl, GL_VERTEX_SHADER, vsSource);
    const fShader = createShader(gl, GL_FRAGMENT_SHADER, fsSource);
    return createShaderProgram(gl, vShader, fShader);
};

type VAOState = {
    vao: WebGLVertexArrayObject;
    bind: () => VAOState;
    unbind: () => VAOState;
    enable: (loc: number) => VAOState;
    setPointer: (loc: number, size: number, stride?: number, offset?: number, type?: number, normalize?: boolean) => VAOState;
};

const createVAOFns = (gl: WebGL2RenderingContext) => (): VAOState => {
    const vao = gl.createVertexArray();
    const thisObj: VAOState = {
        vao,
        bind() { gl.bindVertexArray(vao); return thisObj; },
        unbind() { gl.bindVertexArray(null); return thisObj; },
        // TODO: combine enable & set?
        enable(loc: number) { gl.enableVertexAttribArray(loc); return thisObj; },
        setPointer(loc, size, stride = 0, offset = 0, type = GL_FLOAT, normalize = false) {
            gl.vertexAttribPointer(loc, size, type, normalize, stride, offset); return thisObj;
        },
    };
    return thisObj;
};

type BufferState = {
    buf: WebGLBuffer;
    bind: () => BufferState;
    setData: (data: BufferSource) => BufferState;
};

const createBufferFns = (gl: WebGL2RenderingContext) => (target = GL_ARRAY_BUFFER, mode = GL_STATIC_DRAW): BufferState => {
    const buf = gl.createBuffer();
    const thisObj: BufferState = {
        buf,
        bind() { gl.bindBuffer(target, buf); return thisObj; },
        setData(data) { gl.bufferData(target, data, mode); return thisObj; },
    };
    return thisObj;
};

type EBState = {
    buf: WebGLBuffer;
    bind: () => EBState;
    setIndices: (data: number[]) => EBState;
};

const createElementBufferFns = (gl: WebGL2RenderingContext) => (mode = GL_STATIC_DRAW): EBState => {
    const buf = gl.createBuffer();
    const thisObj: EBState = {
        buf,
        bind() { gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, buf); return thisObj; },
        setIndices(data) { gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(data), mode); return thisObj; },
    };
    return thisObj;
};

type WebglState = {
    gl: WebGL2RenderingContext;
    clear: (r?: number, g?: number, b?: number, a?: number) => void;
    createShader: (vs: string, fs: string) => ShaderState;
    createBuffer: (target?: number, mode?: number) => BufferState;
    createElementBuffer: (mode?: number) => EBState;
    createVAO: () => VAOState;
    draw: (count: number, mode?: number, offset?: number) => void;
    drawElements: (count: number, mode?: number, offset?: number) => void;
    resize: () => void;
    /**
    * NOTE: Set up pointers immediately after creating mesh
    * since VAO is enabled and recording.
    * (Or if you use other VAOs, you might have to bind this one again)
    */
    createMesh: (data: Float32Array, indices: number[]) => { vao: VAOState, draw: () => void };
};

export const createGLContext = (canvas: HTMLCanvasElement, width = 400, height = 300): WebglState => {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        // TODO remove before release
        alert('Could not get webgl2 context!');
        throw new Error('Could not get webgl2 context!');
    };

    canvas.width = width;
    canvas.height = height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(GL_CULL_FACE);
    gl.enable(GL_DEPTH_TEST);
    gl.enable(GL_BLEND);
    gl.depthFunc(GL_LEQUAL);
    gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    setupKeyListener(canvas, width, height);

    const thisObj: WebglState = {
        gl,
        clear: clearFn(gl),
        createShader: createShaderFns(gl),
        createBuffer: createBufferFns(gl),
        createElementBuffer: createElementBufferFns(gl),
        createVAO: createVAOFns(gl),
        draw: (count, mode = GL_TRIANGLES, offset = 0) => gl.drawArrays(mode, offset, count),
        drawElements: (count, mode = GL_TRIANGLES, offset = 0) => gl.drawElements(mode, count, GL_UNSIGNED_SHORT, offset),

        createMesh(data, indices): { vao: VAOState, draw: () => void } {
            const vao = thisObj.createVAO();
            const count = indices.length;
            vao.bind();
            thisObj.createBuffer().bind().setData(data);
            thisObj.createElementBuffer().bind().setIndices(indices);
            return { vao, draw: () => thisObj.drawElements(count) };
        },
        resize() {
            const ratio = deviceScaleRatio(width, height);
            canvas.style.width = width * ratio + 'px';
            canvas.style.height = height * ratio + 'px';
            // display note if device is in potrait
            getById('d').style.display = innerWidth < innerHeight ? 'block' : 'none';
        },
    };

    return thisObj;
};
