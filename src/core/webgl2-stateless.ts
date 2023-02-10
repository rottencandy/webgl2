import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_CLAMP_TO_EDGE,
    GL_COLOR,
    GL_COLOR_ATTACHMENT0,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_ATTACHMENT,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_COMPONENT,
    GL_DEPTH_COMPONENT24,
    GL_DEPTH_TEST,
    GL_DYNAMIC_DRAW,
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
    GL_UNIFORM_BLOCK_DATA_SIZE,
    GL_UNIFORM_BUFFER,
    GL_UNIFORM_OFFSET,
    GL_UNPACK_ALIGNMENT,
    GL_UNSIGNED_BYTE,
    GL_UNSIGNED_INT,
    GL_UNSIGNED_SHORT,
    GL_VERTEX_SHADER,
} from './gl-constants';

/** webgl2 context */
type GL = WebGL2RenderingContext;
/** webgl2 constant */
type GLConst = number;

export const createGLContext = (
    canvas: HTMLCanvasElement,
    width = 400,
    height = 300,
): GL => {
    const gl = canvas.getContext('webgl2', { antialias: false }) as GL;
    if (!gl)
        alert('Could not get gl context');

    canvas.width = width;
    canvas.height = height;

    gl.viewport(0, 0, width, height);
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
export const clear = (gl: GL) => {
    gl.clearColor(.1, .1, .1, 1.);
    gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
};

/** Clear target */
export const clearIntDepth = (gl: GL) => {
    gl.clear(GL_DEPTH_BUFFER_BIT);
    gl.clearBufferuiv(GL_COLOR, 0, new Uint32Array([0, 0, 0, 1]));
};

/** Draw to target */
export const draw = (gl: GL, count: number, mode: GLConst = GL_TRIANGLES, offset = 0) => {
    gl.drawArrays(mode, offset, count);
};

/** Draw using elements buffer */
export const drawElements = (gl: GL, count: number, mode: GLConst = GL_TRIANGLES, offset = 0) => {
    gl.drawElements(mode, count, GL_UNSIGNED_SHORT, offset);
};

/** Instanced drawing */
export const drawInstanced = (gl: GL, first: number, verts: number, instances: number, mode: GLConst = GL_TRIANGLES) => {
    gl.drawArraysInstanced(mode, first, verts, instances);
};

/** Instanced elements drawing */
export const drawElementsInstanced = (gl: GL, count: number, offset: number, instances: number, mode: GLConst = GL_TRIANGLES) => {
    gl.drawElementsInstanced(mode, count, GL_UNSIGNED_SHORT, offset, instances);
};

const createShader = (gl: GL, type: number, source: string) => {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
};

/** Create shader program state.
* Automatically sets as active program. */
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

export const useProgram = (gl: GL, prg: WebGLProgram) => {
    gl.useProgram(prg);
    return prg;
};

/** @deprecated only for extreme cases,
* try to use `layout(location=n)` in shader */
export const getAttribLoc = (gl: GL, prg: WebGLProgram, name: string) => gl.getAttribLocation(prg, name);

export const getUniformLoc = (gl: GL, prg: WebGLProgram, name: string) => gl.getUniformLocation(prg, name) as WebGLUniformLocation;

type Loc = WebGLUniformLocation;
export const v1fset = (gl: GL, loc: Loc, x: number) => gl.uniform1f(loc, x);
export const v1iset = (gl: GL, loc: Loc, x: number) => gl.uniform1i(loc, x);
export const v2fset = (gl: GL, loc: Loc, x: number, y: number) => gl.uniform2f(loc, x, y);
export const v3fset = (gl: GL, loc: Loc, x: number, y: number, z: number) => gl.uniform3f(loc, x, y, z);
export const v4fset = (gl: GL, loc: Loc, x: number, y: number, z: number, w: number) => gl.uniform4f(loc, x, y, z, w);
export const m3fset = (gl: GL, loc: Loc, data: Float32List, transpose = false) => gl.uniformMatrix3fv(loc, transpose, data);
export const m4fset = (gl: GL, loc: Loc, data: Float32List, transpose = false) => gl.uniformMatrix4fv(loc, transpose, data);

const uniformSetterFns = (
    gl: GL,
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
        m4fv: (data: Float32List, transpose = false) =>
            gl.uniformMatrix4fv(loc, transpose, data),
        u1i: (x: number) =>
            gl.uniform1i(loc, x),
    };
};

// https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880
// todo: make this stateless
export const UBO = (gl: GL, name: string, prg: WebGLProgram, vars: string[], loc = 0) => {
    const blockIndex = gl.getUniformBlockIndex(prg, name);
    const blockSize = gl.getActiveUniformBlockParameter(
        prg,
        blockIndex,
        GL_UNIFORM_BLOCK_DATA_SIZE,
    );
    const buf = buffer(gl);
    // dynamic draw because we expect to modify the buffer contents frequently
    setBufferData(gl, buf, blockSize, GL_UNIFORM_BUFFER, GL_DYNAMIC_DRAW);
    gl.bindBufferBase(GL_UNIFORM_BUFFER, loc, buf);

    // this only needs to be done with one prg,
    // regardless of how many prgs will use the UBO
    const indices = gl.getUniformIndices(prg, vars);
    const offsets = gl.getActiveUniforms(prg, indices, GL_UNIFORM_OFFSET);

    // this needs to be done for every prg that wants to use the UBO
    gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, name), loc);

    return {
        buf,
        bindPrg(p: WebGLProgram) {
            gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(p, name), loc);
        },
        bind() {
            bindBuffer(gl, buf, GL_UNIFORM_BUFFER);
        },
        set(data: ArrayBufferView[]) {
            bindBuffer(gl, buf, GL_UNIFORM_BUFFER);
            for (let i = 0; i < offsets.length; i++) {
                gl.bufferSubData(GL_UNIFORM_BUFFER, offsets[i], data[i], loc);
            }
        },
        setSub(idx: number, data: ArrayBufferView) {
            bindBuffer(gl, buf, GL_UNIFORM_BUFFER);
            gl.bufferSubData(GL_UNIFORM_BUFFER, offsets[idx], data, loc);
        },
    };
};

export const unbindUBO = (gl: GL) => {
    gl.bindBuffer(GL_UNIFORM_BUFFER, null);
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

export const unbindBuffer = (gl: GL, target: GLConst = GL_ARRAY_BUFFER) => {
    gl.bindBuffer(target, null);
};

/* binds buffer automatically */
export const setBufferData = (gl: GL, buf: WebGLBuffer, data: BufferSource, target: GLConst = GL_ARRAY_BUFFER, mode: GLConst = GL_STATIC_DRAW) => {
    bindBuffer(gl, buf, target);
    gl.bufferData(target, data, mode);
    return buf;
};

export const setBufferSub = (gl: GL, buf: WebGLBuffer, offset: number, data: BufferSource, target: GLConst = GL_ARRAY_BUFFER) => {
    bindBuffer(gl, buf, target);
    gl.bufferSubData(target, offset, data);
};

/* automatically binds EB */
export const setElementBufferData = (gl: GL, buf: WebGLBuffer, data: number[], mode: GLConst = GL_STATIC_DRAW) => {
    bindBuffer(gl, buf, GL_ELEMENT_ARRAY_BUFFER);
    gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(data), mode);
    return buf;
};

/* Used for instancing.
* Specify how many instances each attribute equates to. (default = 1) */
export const setInstanceDivisor = (gl: GL, loc: number, divisor = 1) => {
    gl.vertexAttribDivisor(loc, divisor);
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

export const unbindVAO = (gl: GL) => {
    gl.bindVertexArray(null);
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
export const setTextureFilter = (gl: GL, target: GLConst = GL_TEXTURE_2D, type: GLConst = GL_NEAREST) => {
    gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, type);
    gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, type);
};

export const setTextureWrap = (gl: GL, target: GLConst = GL_TEXTURE_2D, type: GLConst = GL_CLAMP_TO_EDGE) => {
    gl.texParameteri(target, GL_TEXTURE_WRAP_S, type);
    gl.texParameteri(target, GL_TEXTURE_WRAP_T, type);
};

/**
 * Binds texture automatically.
 * Use `loadTextureImage` if loading image with strings.
 * TODO: turn this into async?
 */
export const setTextureImage = (gl: GL, tex: WebGLTexture, src: TexImageSource, level = 0, target: GLConst = GL_TEXTURE_2D) => {
    bindTexture(gl, tex, target);
    gl.texImage2D(target, level, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, src);
    gl.generateMipmap(target);
    return tex;
};

// TODO: Turn this into async
/**
 * Binds texture automatically.
 */
export const loadTextureImage = (gl: GL, tex: WebGLTexture, imgSrc: string, level = 0, target: GLConst = GL_TEXTURE_2D) => {
    const img = new Image;
    img.src = imgSrc;
    img.onload = () => { setTextureImage(gl, tex, img, level, target) };
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
 */
export const setTextureUnit = (gl: GL, tex: WebGLTexture, loc: WebGLUniformLocation, unit: number, target: GLConst = GL_TEXTURE_2D) => {
    gl.uniform1i(loc, unit);
    gl.activeTexture(GL_TEXTURE0 + unit);
    bindTexture(gl, tex, target);
    // reset index once we're done binding
    gl.activeTexture(GL_TEXTURE0);
    return tex;
};

/**
 * Set active texture unit index (0-9) that the next bind call will bind to
*/
export const setActiveTextureUnit = (gl: GL, unit: number) => {
    gl.activeTexture(GL_TEXTURE0 + unit);
};

type AttribPointers = [
    /* Location in which data is sent to vertex shader */
    loc: number,
    /* Points per vertex */
    size: number,
    /* BYTES of one complete "set" of vertex data row,
    * default(0) = tightly packed
    * num * bytesizeof(type)
    * eg. 6 nums(3v,3n) = 6 floats = 6 * 4 = 24
    * */
    stride?: number,
    /* $type no. of BYTES to skip at the beginning of each vertex
    * default(0) = tightly packed(see above)
    * GL_FLOAT = 32 bits = 4 bytes
    * num * sizeof(type),
    * eg. 3 nums = 3 floats = 3 * 4 = 12
    * */
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
    draw: () => void,
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
) => {
    const ratio = Math.min(innerWidth / width, innerHeight / height);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width * ratio + 'px';
    canvas.style.height = height * ratio + 'px';
    gl.viewport(0, 0, width, height);
    // display note if device is in potrait
    (document.getElementById('d') as HTMLElement).style.display =
        innerWidth < innerHeight ? 'block' : 'none';
};

/**
* Create a new target texture to render to.
* Returns an methods that can enable or disable rendering
* to the texture.
*/
export const renderTarget = (
    gl: GL,
    tex: WebGLTexture,
    width = gl.canvas.width,
    height = gl.canvas.height,
    internalFormat: GLConst = GL_RGBA,
    format: GLConst = GL_RGBA,
    type: GLConst = GL_UNSIGNED_BYTE,
): [WebGLFramebuffer, WebGLTexture] => {
    const fb = gl.createFramebuffer() as WebGLFramebuffer;
    setTexData(gl, tex, null, GL_TEXTURE_2D, 0, internalFormat, width, height, 0, format, type);
    setTextureFilter(gl);

    // setup depth texture
    enableRenderTarget(gl, fb, width, height);
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
    disableRenderTarget(gl);

    return [fb, depth];
};

export const enableRenderTarget = (gl: GL, fb: WebGLFramebuffer, width = gl.canvas.width, height = gl.canvas.height) => {
    gl.bindFramebuffer(GL_FRAMEBUFFER, fb);
    gl.viewport(0, 0, width, height);
};

export const disableRenderTarget = (gl: GL) => {
    gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
};

export const makeShader = (content: TemplateStringsArray) => `#version 300 es
precision lowp float;
${content}`;
