import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_CLAMP_TO_EDGE,
    GL_COLOR_ATTACHMENT0,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_ATTACHMENT,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_COMPONENT,
    GL_DEPTH_COMPONENT24,
    GL_DEPTH_TEST,
    GL_ELEMENT_ARRAY_BUFFER,
    GL_FLOAT,
    GL_FRAGMENT_SHADER,
    GL_FRAMEBUFFER,
    GL_LEQUAL,
    GL_LINEAR,
    GL_LINK_STATUS,
    GL_NEAREST,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_R8,
    GL_RED,
    GL_RGBA,
    GL_SRC_ALPHA,
    GL_STATIC_DRAW,
    GL_TEXTURE0,
    GL_TEXTURE_2D,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
    GL_TRIANGLES,
    GL_UNPACK_ALIGNMENT,
    GL_UNSIGNED_BYTE,
    GL_UNSIGNED_INT,
    GL_UNSIGNED_SHORT,
    GL_VERTEX_SHADER,
} from './gl-constants';
import { deviceScaleRatio } from '../globals';

/** webgl2 context */
type GL = WebGL2RenderingContext;
/** webgl2 constant */
type GLConst = number;

export const createGLContext = (
    canvas: HTMLCanvasElement,
    width = 400,
    height = 300,
): GL => {
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!gl)
        alert('Could not get gl context');

    canvas.width = width;
    canvas.height = height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(GL_CULL_FACE);
    gl.enable(GL_DEPTH_TEST);
    gl.enable(GL_BLEND);
    gl.depthFunc(GL_LEQUAL);
    gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    // For pre-multiplied alpha textures
    //gl.blendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
    gl.clearDepth(1.);
    return gl;
};

/** Clear target */
export const clear = (gl: GL): GL => {
    gl.clearColor(.1, .1, .1, 1.);
    gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    return gl;
};

/** Draw to target */
export const draw = (gl: GL, count: number, mode: GLConst = GL_TRIANGLES, offset = 0): GL => {
    gl.drawArrays(mode, offset, count);
    return gl;
};

/** Draw using elements buffer */
export const drawElements = (gl: GL, count: number, mode: GLConst = GL_TRIANGLES, offset = 0): GL => {
    gl.drawElements(mode, count, GL_UNSIGNED_SHORT, offset);
    return gl;
};

const createShader = (
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
) => {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
};

/** Create shader program state */
export const shaderProgram = (gl: GL, vSource: string, fSource: string) => {
    const prg = gl.createProgram() as WebGLProgram;
    gl.attachShader(prg, createShader(gl, GL_VERTEX_SHADER, vSource));
    gl.attachShader(prg, createShader(gl, GL_FRAGMENT_SHADER, fSource));
    gl.linkProgram(prg);

    if (!gl.getProgramParameter(prg, GL_LINK_STATUS)) {
        alert('Program Link failed: ' + gl.getProgramInfoLog(prg));
        //console.error('vs log: ', gl.getShaderInfoLog(vShader));
        //console.error('fs log: ', gl.getShaderInfoLog(fShader));
        //throw new Error;
    }

    return prg;
};

/** @deprecated only for extreme cases,
* try to use `layout(location=n)` in shader */
export const getAttribLoc = (gl: GL, prg: WebGLProgram, name: string) => gl.getAttribLocation(prg, name);

export const useProgram = (gl: GL, prg: WebGLProgram) => {
    gl.useProgram(prg);
    return prg;
};

const uniformSetterFns = (
    gl: WebGL2RenderingContext,
    prg: WebGLProgram
) => (name: string) => {
    const loc = gl.getUniformLocation(prg, name) as WebGLUniformLocation;

    return {
        loc,
        u1f: (x: number) =>
            gl.uniform1f(loc, x),
        u2f: (x: number, y: number) =>
            gl.uniform2f(loc, x, y),
        u3f: (x: number, y: number, z: number) =>
            gl.uniform3f(loc, x, y, z),
        u4f: (x: number, y: number, z: number, w: number) =>
            gl.uniform4f(loc, x, y, z, w),
        m3fv: (data: Float32List, transpose = false) =>
            gl.uniformMatrix3fv(loc, transpose, data),
        m4fv: (data: Iterable<number>, transpose = false) =>
            gl.uniformMatrix4fv(loc, transpose, data),
        u1i: (x: number) =>
            gl.uniform1i(loc, x),
    };
};

export const uniformFns = (gl: GL, prg: WebGLProgram) => uniformSetterFns(gl, prg);

/** Create buffer state */
export const buffer = (gl: GL) => {
    const buf = gl.createBuffer() as WebGLBuffer;
    return buf;
};

// todo: buffer type enum
export const bindBuffer = (gl: GL, buf: WebGLBuffer, target: GLConst = GL_ARRAY_BUFFER) => {
    gl.bindBuffer(target, buf);
    return buf;
};

/* binds buffer automatically */
export const setBufferData = (gl: GL, buf: WebGLBuffer, data: BufferSource, target: GLConst = GL_ARRAY_BUFFER, mode: GLConst = GL_STATIC_DRAW) => {
    bindBuffer(gl, buf, target);
    gl.bufferData(target, data, mode);
    return buf;
};

/* automatically binds EB */
export const setElementBufferData = (gl: GL, buf: WebGLBuffer, data: number[], mode: GLConst = GL_STATIC_DRAW) => {
    bindBuffer(gl, buf, GL_ELEMENT_ARRAY_BUFFER);
    gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(data), mode);
    return buf;
};

/** Create VAO state */
export const VAO = (gl: GL) => {
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    // binding is helpful so it can be used easily after making the obj
    bindVAO(gl, vao);
    return vao;
};

export const bindVAO = (gl: GL, vao: WebGLVertexArrayObject) => {
    gl.bindVertexArray(vao);
    return vao;
};

/* binds VAO automatically */
export const setVAOPtr = (
    gl: GL,
    vao: WebGLVertexArrayObject,
    loc: number,
    size: number,
    stride = 0,
    offset = 0,
    type: GLConst = GL_FLOAT,
    normalize = false
) => {
    bindVAO(gl, vao);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, normalize, stride, offset);
    return vao;
};

/** Create texture state */
export const texture = (gl: GL, target: GLConst = GL_TEXTURE_2D) => {
    const tex = gl.createTexture() as WebGLTexture;

    // set a temporary blue texture
    setTexData(
        gl,
        tex,
        new Uint8Array([0, 0, 255, 255]),
        target,
        0, GL_RGBA,
        1, 1, 0,
        GL_RGBA,
        GL_UNSIGNED_BYTE
    );
    return tex;
};

export const bindTexture = (gl: GL, tex: WebGLTexture, target: GLConst = GL_TEXTURE_2D) => {
    gl.bindTexture(target, tex);
    return tex;
};

// TODO find out if filter is mandatory (use gl_nearest always)
export const setTextureFilter = (gl: GL, target: GLConst = GL_TEXTURE_2D, type: GLConst = GL_NEAREST): GL => {
    gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, type);
    gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, type);
    return gl;
};

export const setTextureWrap = (gl: GL, target: GLConst = GL_TEXTURE_2D, type: GLConst = GL_CLAMP_TO_EDGE): GL => {
    gl.texParameteri(target, GL_TEXTURE_WRAP_S, type);
    gl.texParameteri(target, GL_TEXTURE_WRAP_T, type);
    return gl;
};

/**
 * Binds texture automatically.
 * Use `loadTextureImage` if loading image with strings.
 */
export const setTextureImage = (gl: GL, tex: WebGLTexture, src: TexImageSource, target: GLConst = GL_TEXTURE_2D) => {
    bindTexture(gl, tex, target);
    gl.texImage2D(target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, src);
    gl.generateMipmap(target);
    return tex;
};

// TODO: Turn this into async
/**
 * Binds texture automatically.
 */
export const loadTextureImage = (gl: GL, tex: WebGLTexture, imgSrc: string, target: GLConst = GL_TEXTURE_2D) => {
    const img = new Image;
    img.src = imgSrc;
    img.onload = () => { setTextureImage(gl, tex, img, target) };
    return tex;
};

/**
 * Binds texture automatically.
 */
export const setTexData = (
    gl: GL,
    tex: WebGLTexture,
    data: ArrayBufferView | null,
    target: GLConst = GL_TEXTURE_2D,
    level = 0,
    internalFormat: GLConst = GL_R8,
    width = 2,
    height = 2,
    border = 0,
    format: GLConst = GL_RED,
    type: GLConst = GL_UNSIGNED_BYTE,
    alignment = 1,
) => {
    bindTexture(gl, tex, target);
    gl.pixelStorei(GL_UNPACK_ALIGNMENT, alignment);
    gl.texImage2D(
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        format,
        type,
        data,
    );
    return tex;
};

/**
 * Only needed when using multiple textures in a single program.
 * Binds texture automatically.
 * Note: Always set correct active texture before setting unit
 */
export const setTextureUnit = (gl: GL, tex: WebGLTexture, loc: WebGLUniformLocation, unit: number, target: GLConst = GL_TEXTURE_2D) => {
    gl.uniform1i(loc, unit);
    gl.activeTexture(GL_TEXTURE0 + unit);
    bindTexture(gl, tex, target);
    return tex;
};

type AttribPointers = [
    /* Location in which data is sent to vertex shader */
    loc: number,
    /* Points per vertex */
    size: number,
    /* Points to skip at the end of each vertex, default|0 = size * sizeof(type), tightly packed */
    stride?: number,
    /* Points to skip at the beginning of each vertex */
    offset?: number,
    /* Data type, default: GL_FLOAT */
    type?: number,
    /* Default: false */
    normalize?: boolean,
];

/**
* Takes in a set of data, indices, attribs and
* returns a ready-to-use VAO with loaded draw fn.
* Can be used with any shader prg.
*
* Internally creates Buffer, VAO, EBO
*
* @param data [dataArray, indicesArray]
* @param attribs array of attrib pointers
*/
export const mesh = (
    gl: GL,
    [data, indices]: [Float32Array, number[]],
    attribs: AttribPointers[]
): [
    /** VAO */
    vao: WebGLVertexArrayObject,
    /** Loaded draw function */
    draw: () => GL,
] => {
    const vao = VAO(gl);
    setBufferData(gl, buffer(gl), data);
    setElementBufferData(gl, buffer(gl), indices);
    attribs.forEach(attr => setVAOPtr(gl, vao, ...attr));

    return [
        vao,
        () => drawElements(gl, indices.length),
    ];
};

/**
* Rescale target canvas to match width/height scale ratio
* Uses window.innerWidth/Height to calculate updated ratio
* Should ideally be called whenever canvas is rescaled,
* or when canvas dimensions need to be changed.
*/
export const resize = (
    gl: GL,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
): GL => {
    const ratio = deviceScaleRatio(width, height);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width * ratio + 'px';
    canvas.style.height = height * ratio + 'px';
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // display note if device is in potrait
    (document.getElementById('d') as HTMLElement).style.display =
        window.innerWidth < window.innerHeight ? 'block' : 'none';
    return gl;
};

/**
* Create a new target texture to render to.
* Returns an methods that can enable or disable rendering
* to the texture.
*/
export const renderTargetContext = (
    gl: GL,
    tex: WebGLTexture,
    width?: number,
    height?: number,
    internalFormat: GLConst = GL_RGBA,
    format: GLConst = GL_RGBA,
): [enable: () => void, disable: () => void] => {
    const fb = gl.createFramebuffer() as WebGLFramebuffer;
    setTexData(gl, tex, null, GL_TEXTURE_2D, 0, internalFormat, width, height, 0, format);
    setTextureFilter(gl);

    const enableTarget = () => {
        gl.bindFramebuffer(GL_FRAMEBUFFER, fb);
        if (width && height) {
            gl.viewport(0, 0, width, height);
        }
    };
    const disableTarget = () => {
        gl.bindFramebuffer(GL_FRAMEBUFFER, null);
        if (width && height) {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    };

    // setup depth texture
    enableTarget();
    gl.framebufferTexture2D(
        GL_FRAMEBUFFER,
        GL_COLOR_ATTACHMENT0,
        GL_TEXTURE_2D,
        tex, 0,
    );
    const depth = texture(gl);
    setTexData(gl, depth, null, GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24, width, height, 0, GL_DEPTH_COMPONENT, GL_UNSIGNED_INT);
    setTextureFilter(gl, GL_TEXTURE_2D, GL_LINEAR);
    setTextureWrap(gl);
    gl.framebufferTexture2D(
        GL_FRAMEBUFFER,
        GL_DEPTH_ATTACHMENT,
        GL_TEXTURE_2D,
        depth, 0,
    );
    disableTarget();

    return [enableTarget, disableTarget];
};