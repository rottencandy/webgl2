import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_CLAMP_TO_EDGE,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_TEST,
    GL_ELEMENT_ARRAY_BUFFER,
    GL_FLOAT,
    GL_FRAGMENT_SHADER,
    GL_LEQUAL,
    GL_LINK_STATUS,
    GL_NEAREST,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_R8,
    GL_RED,
    GL_RGBA,
    GL_SRC_ALPHA,
    GL_STATIC_DRAW,
    GL_TEXTURE_2D,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
    GL_TRIANGLES,
    GL_UNPACK_ALIGNMENT,
    GL_UNSIGNED_BYTE,
    GL_UNSIGNED_SHORT,
    GL_VERTEX_SHADER,
} from './gl-constants';
import { deviceScaleRatio, getById } from '../globals';
import { setupKeyListener } from './input';

const clearFn = (gl: WebGL2RenderingContext) => () => {
    gl.clearColor(.1, .1, .1, 1.);
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
        u1f_: (x: number) => gl.uniform1f(loc, x),
        u2f_: (x: number, y: number) => gl.uniform2f(loc, x, y),
        u3f_: (x: number, y: number, z: number) => gl.uniform3f(loc, x, y, z),
        u4f_: (x: number, y: number, z: number, w: number) => gl.uniform4f(loc, x, y, z, w),
        m3fv_: (data: Float32List, transpose = false) => gl.uniformMatrix3fv(loc, transpose, data),
        m4fv_: (data: Iterable<number>, transpose = false) => gl.uniformMatrix4fv(loc, transpose, data),
        u1i_: (x: number) => gl.uniform1i(loc, x),
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
        console.error('Program Link failed: ', gl.getProgramInfoLog(prg));
        console.error('vs log: ', gl.getShaderInfoLog(vShader));
        console.error('fs log: ', gl.getShaderInfoLog(fShader));
        throw new Error;
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
    setPtr: (loc: number, size: number, stride?: number, offset?: number, type?: number, normalize?: boolean) => VAOState;
};

const createVAOFns = (gl: WebGL2RenderingContext) => (): VAOState => {
    const vao = gl.createVertexArray();
    const thisObj: VAOState = {
        vao,
        bind() {
            gl.bindVertexArray(vao);
            return thisObj;
        },
        setPtr(loc, size, stride = 0, offset = 0, type = GL_FLOAT, normalize = false) {
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, type, normalize, stride, offset);
            return thisObj;
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

type TextureState = {
    tex: WebGLTexture;
    bind: () => TextureState;
    setImage: (imgSrc: string) => TextureState;
    setFilter: (type?: number) => TextureState;
    setWrap: (type?: number) => TextureState;
    setTexData: (data: ArrayBufferView, level?: number, internalFormat?: number, width?: number, height?: number, border?: number, format?: number, type?: number) => TextureState;
};


const createTextureFns = (gl: WebGL2RenderingContext) => (target = GL_TEXTURE_2D) => {
    const tex = gl.createTexture();
    const setParam = (key: number, val: number) => gl.texParameteri(target, key, val);
    const thisObj: TextureState = {
        tex,
        bind() { gl.bindTexture(target, tex); return thisObj; },
        setFilter(type = GL_NEAREST) {
            setParam(GL_TEXTURE_MIN_FILTER, type);
            setParam(GL_TEXTURE_MAG_FILTER, type);
            return thisObj;
        },
        setWrap(type = GL_CLAMP_TO_EDGE) {
            setParam(GL_TEXTURE_WRAP_S, type);
            setParam(GL_TEXTURE_WRAP_T, type);
            return thisObj;
        },
        // TODO: Turn this into async
        setImage(imgSrc) {
            const img = new Image;
            img.src = imgSrc;
            img.onload = () => {
                thisObj.bind();
                gl.texImage2D(target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, img);
                gl.generateMipmap(target);
            };
            return thisObj;
        },
        setTexData(data: ArrayBufferView, level = 0, internalFormat = GL_R8, width = 2, height = 2, border = 0, format = GL_RED, type = GL_UNSIGNED_BYTE) {
            thisObj.bind();
            gl.pixelStorei(GL_UNPACK_ALIGNMENT, 1);
            gl.texImage2D(target, level, internalFormat, width, height, border, format, type, data);
            return thisObj;
        },
    };
    // set a temporary blue texture
    thisObj.setTexData(new Uint8Array([0, 0, 255, 255]), 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE);
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
        setIndices(data) {
            gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(data), mode);
            return thisObj;
        },
    };
    return thisObj;
};

type AttribPointers = [
    loc: number,
    size: number,
    stride?: number,
    offset?: number,
    type?: number,
    normalize?: boolean
];

type WebglState = {
    gl: WebGL2RenderingContext;
    clear: () => void;
    shader: (vs: string, fs: string) => ShaderState;
    buffer: (target?: number, mode?: number) => BufferState;
    texture: (target?: number) => TextureState;
    elementBuffer: (mode?: number) => EBState;
    VAO: () => VAOState;
    draw: (count: number, mode?: number, offset?: number) => void;
    drawElements: (count: number, mode?: number, offset?: number) => void;
    resize: () => void;
    createMesh: (data: [Float32Array, number[]], attribs: AttribPointers[]) => {
        vao: VAOState, draw: () => void
    };
};

export const createGLContext = (canvas: HTMLCanvasElement, width = 400, height = 300): WebglState => {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Could not get gl context');
        throw new Error;
    };

    canvas.width = width;
    canvas.height = height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(GL_CULL_FACE);
    gl.enable(GL_DEPTH_TEST);
    gl.enable(GL_BLEND);
    gl.depthFunc(GL_LEQUAL);
    gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    gl.clearDepth(1.);
    setupKeyListener(canvas, width, height, true);

    const thisObj: WebglState = {
        gl,
        clear: clearFn(gl),
        shader: createShaderFns(gl),
        buffer: createBufferFns(gl),
        texture: createTextureFns(gl),
        elementBuffer: createElementBufferFns(gl),
        VAO: createVAOFns(gl),
        draw: (count, mode = GL_TRIANGLES, offset = 0) =>
            gl.drawArrays(mode, offset, count),
        drawElements: (count, mode = GL_TRIANGLES, offset = 0) =>
            gl.drawElements(mode, count, GL_UNSIGNED_SHORT, offset),

        createMesh([data, indices], attribs): { vao: VAOState, draw: () => void } {
            const vao = thisObj.VAO().bind();
            thisObj.buffer().bind().setData(data);
            thisObj.elementBuffer().bind().setIndices(indices);
            attribs.map(attr => vao.setPtr(...attr));
            return { vao, draw: () => thisObj.drawElements(indices.length) };
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
