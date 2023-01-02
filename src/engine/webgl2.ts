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
import { deviceScaleRatio } from '../globals';

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

const uniformSetterFns = (
    gl: WebGL2RenderingContext,
    prg: WebGLProgram
) => (name: TemplateStringsArray) => {
    const loc = gl.getUniformLocation(prg, name as unknown as string) as WebGLUniformLocation;

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

type ShaderState = {
    prg: WebGLProgram;
    use: () => ShaderState;
    uniform: ReturnType<typeof uniformSetterFns>;
    /** @deprecated only for extreme cases,
    * try to use `layout(location=n)` in shader */
    attribLoc: (name: string) => number;
};

type VAOState = {
    vao: WebGLVertexArrayObject;
    bind: () => VAOState;
    /* binds VAO automatically */
    setPtr: (
        loc: number,
        size: number,
        stride?: number,
        offset?: number,
        type?: number,
        normalize?: boolean,
    ) => VAOState;
};

type UBOState = {
    buf: WebGLBuffer;
    bindPrg: (p: WebGLProgram) => UBOState;
    bind: () => UBOState;
    set: (data: ArrayBufferView[]) => UBOState;
    setSub: (index: number, data: ArrayBufferView) => UBOState;
};

type BufferState = {
    buf: WebGLBuffer;
    bind: () => BufferState;
    /* binds buffer automatically */
    setData: (data: BufferSource) => BufferState;
};

type TextureState = {
    tex: WebGLTexture;
    bind: () => TextureState;
    /**
     * Binds texture automatically.
     */
    setImage: (imgSrc: string) => TextureState;
    /**
     * Binds texture automatically.
     * Use `setImage` if loading image with strings.
     */
    setTexImage2D: (imgSrc: TexImageSource) => TextureState;
    setFilter: (type?: number) => TextureState;
    setWrap: (type?: number) => TextureState;
    /**
     * Binds texture automatically.
     */
    setTexData: (
        data: ArrayBufferView | null,
        level?: number,
        internalFormat?: number,
        width?: number,
        height?: number,
        border?: number,
        format?: number,
        type?: number,
        alignment?: number,
    ) => TextureState;
    /**
     * Only needed when using multiple textures in a single program.
     * Binds texture automatically.
     * Note: Always set correct active texture before setting unit
     */
    setUnit: (loc: WebGLUniformLocation, unit: number) => TextureState;
};


type EBState = {
    buf: WebGLBuffer;
    bind: () => EBState;
    /* automatically binds EB */
    setData: (data: number[]) => EBState;
};

type AttribPointers = [
    /* Location in which data is sent to vertex shader */
    loc: number,
    /* Points per vertex */
    size: number,
    /* Points to skip at the end of each vertex, 0 = size * sizeof(type) */
    stride?: number,
    /* Points to skip at the beginning of each vertex */
    offset?: number,
    /* Data type, default: GL_FLOAT */
    type?: number,
    /* Default: false */
    normalize?: boolean,
];

type WebglState = {
    /** webgl2 context */
    gl: WebGL2RenderingContext;
    /** Clear target */
    clear: () => void;
    /** Create shader program state */
    shader: (vs: string, fs: string) => ShaderState;
    /** Create buffer state */
    buffer: (target?: number, mode?: number) => BufferState;
    /** Create texture state */
    texture: (target?: number) => TextureState;
    /** Create EBO state */
    elementBuffer: (mode?: number) => EBState;
    /** Create VAO state */
    VAO: () => VAOState;
    /** Create Uniform BUffer Object */
    UBO: (name: string, prg: WebGLProgram, vars: string[], loc?: number) => UBOState;
    /** Draw to target */
    draw: (count: number, mode?: number, offset?: number) => void;
    /** Draw using elements */
    drawElements: (count: number, mode?: number, offset?: number) => void;
    /**
    * Rescale target canvas to match width/height scale ratio
    * Uses window.innerWidth/Height to calculate updated ratio
    * Should ideally be called whenever canvas is rescaled.
    */
    resize: () => void;
    /**
    * Manually change canvas size to given width, height
    * This changes the saved ratio and will be used
    * instead of initially supplied width/height
    */
    changeSize: (width: number, height: number) => void;
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
    createMesh: (data: [Float32Array, number[]], attribs: AttribPointers[]) => {
        /** VAO state */
        vao: VAOState,
        /** Loaded draw function */
        draw: () => void,
    };
    /**
    * Create a new target texture to render to.
    * Returns an object of methods that can enable or disable rendering
    * to the texture.
    */
    renderTargetContext: (
        tex: TextureState,
        width?: number,
        height?: number,
        internalFormat?: number,
        format?: number,
    ) => { enable: () => void, disable: () => void };
};

export const createGLContext = (
    canvas: HTMLCanvasElement,
    width = 400,
    height = 300,
): WebglState => {
    const gl = canvas.getContext('webgl2', { antialias: false }) as WebGL2RenderingContext;
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

    return useExistingGLContext(gl);
};

export const useExistingGLContext = (
    gl: WebGL2RenderingContext,
): WebglState => {
    const canvas = gl.canvas as HTMLCanvasElement;
    let width = canvas.width, height = canvas.height;

    const thisStateObj: WebglState = {
        gl,

        clear() {
            gl.clearColor(.1, .1, .1, 1.);
            gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        },

        shader(vSource: string, fSource: string) {
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

            const thisObj: ShaderState = {
                prg,
                uniform: uniformSetterFns(gl, prg),
                use() { gl.useProgram(prg); return thisObj; },
                attribLoc: (name) => gl.getAttribLocation(prg, name),
            };

            return thisObj;
        },

        buffer(target = GL_ARRAY_BUFFER, mode = GL_STATIC_DRAW) {
            const buf = gl.createBuffer() as WebGLBuffer;
            const thisObj: BufferState = {
                buf,
                bind() { gl.bindBuffer(target, buf); return thisObj; },
                setData(data) {
                    thisObj.bind();
                    gl.bufferData(target, data, mode);
                    return thisObj;
                },
            };
            return thisObj;
        },

        elementBuffer(mode = GL_STATIC_DRAW) {
            const rawBuf = thisStateObj.buffer(GL_ELEMENT_ARRAY_BUFFER, mode);
            const thisObj: EBState = {
                buf: rawBuf.buf,
                bind() { rawBuf.bind(); return thisObj; },
                setData(data) {
                    rawBuf.setData(new Uint16Array(data));
                    return thisObj;
                },
            };
            return thisObj;
        },

        VAO() {
            const vao = gl.createVertexArray() as WebGLVertexArrayObject;
            const thisObj: VAOState = {
                vao,
                bind() {
                    gl.bindVertexArray(vao);
                    return thisObj;
                },
                setPtr(
                    loc,
                    size,
                    stride = 0,
                    offset = 0,
                    type = GL_FLOAT,
                    normalize = false
                ) {
                    thisObj.bind();
                    gl.enableVertexAttribArray(loc);
                    gl.vertexAttribPointer(loc, size, type, normalize, stride, offset);
                    return thisObj;
                },
            };
            // binding is helpful so it can be used easily after making the obj
            return thisObj.bind();
        },

        // https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880
        UBO(name, prg, vars, loc = 0) {
            const blockIndex = gl.getUniformBlockIndex(prg, name);
            const blockSize = gl.getActiveUniformBlockParameter(
                prg,
                blockIndex,
                GL_UNIFORM_BLOCK_DATA_SIZE,
            );
            // dynamic draw because we expect to modify the buffer contents frequently
            const buf = thisStateObj
                .buffer(GL_UNIFORM_BUFFER, GL_DYNAMIC_DRAW)
                .setData(blockSize);
            gl.bindBufferBase(GL_UNIFORM_BUFFER, loc, buf.buf);

            // this only needs to be done with one prg,
            // regardless of how many prgs will use the UBO
            const indices = gl.getUniformIndices(prg, vars) as Iterable<number>;
            const offsets = gl.getActiveUniforms(prg, indices, GL_UNIFORM_OFFSET);

            // this needs to be done for every prg that wants to use the UBO
            gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(prg, name), loc);

            const thisObj: UBOState = {
                buf: buf.buf,
                bindPrg(p) {
                    gl.uniformBlockBinding(prg, gl.getUniformBlockIndex(p, name), loc);
                    return thisObj;
                },
                bind() {
                    buf.bind();
                    return thisObj;
                },
                set(data) {
                    thisObj.bind();
                    for (let i = 0; i < offsets.length; i++) {
                        gl.bufferSubData(GL_UNIFORM_BUFFER, offsets[i], data[i], loc);
                    }
                    return thisObj;
                },
                setSub(idx: number, data: ArrayBufferView) {
                    thisObj.bind();
                    gl.bufferSubData(GL_UNIFORM_BUFFER, offsets[idx], data, loc);
                    return thisObj;
                },
            };
            return thisObj;
        },

        texture(target = GL_TEXTURE_2D) {
            const tex = gl.createTexture() as WebGLTexture;
            const setParam = (key: number, val: number) =>
                gl.texParameteri(target, key, val);
            const thisObj: TextureState = {
                tex,
                bind() { gl.bindTexture(target, tex); return thisObj; },
                // TODO find out if filter is mandatory (use gl_nearest always)
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
                setTexImage2D(src) {
                    thisObj.bind();
                    gl.texImage2D(target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, src);
                    gl.generateMipmap(target);
                    return thisObj;
                },
                // TODO: Turn this into async
                setImage(imgSrc) {
                    const img = new Image;
                    img.src = imgSrc;
                    img.onload = () => { thisObj.setTexImage2D(img) };
                    return thisObj;
                },
                setTexData(
                    data,
                    level = 0,
                    internalFormat = GL_R8,
                    width = 2,
                    height = 2,
                    border = 0,
                    format = GL_RED,
                    type = GL_UNSIGNED_BYTE,
                    alignment = 1,
                ) {
                    thisObj.bind();
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
                    return thisObj;
                },
                setUnit(loc, unit) {
                    gl.uniform1i(loc, unit);
                    gl.activeTexture(GL_TEXTURE0 + unit);
                    thisObj.bind();
                    return thisObj;
                },
            };
            // set a temporary blue texture
            thisObj.setTexData(
                new Uint8Array([0, 0, 255, 255]),
                0, GL_RGBA,
                1, 1, 0,
                GL_RGBA,
                GL_UNSIGNED_BYTE
            );
            return thisObj;
        },

        draw: (count, mode = GL_TRIANGLES, offset = 0) =>
            gl.drawArrays(mode, offset, count),

        drawElements: (count, mode = GL_TRIANGLES, offset = 0) =>
            gl.drawElements(mode, count, GL_UNSIGNED_SHORT, offset),

        createMesh([data, indices], attribs) {
            const vao = thisStateObj.VAO();
            thisStateObj.buffer().setData(data);
            thisStateObj.elementBuffer().setData(indices);
            attribs.forEach(attr => vao.setPtr(...attr));
            return {
                vao,
                draw: () => thisStateObj.drawElements(indices.length),
            };
        },

        resize() {
            const ratio = deviceScaleRatio(width, height);
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width * ratio + 'px';
            canvas.style.height = height * ratio + 'px';
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            // display note if device is in potrait
            (document.getElementById('d') as HTMLElement).style.display =
                window.innerWidth < window.innerHeight ? 'block' : 'none';
        },

        changeSize(w, h) {
            width = w;
            height = h;
            thisStateObj.resize();
        },

        renderTargetContext(
            target,
            w = width,
            h = height,
            internalFormat = GL_RGBA,
            format = GL_RGBA,
        ) {
            const fb = gl.createFramebuffer() as WebGLFramebuffer;
            target.setTexData(null, 0, internalFormat, w, h, 0, format)
                .setFilter();
            const bindFn = (target: WebGLFramebuffer | null) =>
                gl.bindFramebuffer(GL_FRAMEBUFFER, target);
            const setViewport = (w: number, h: number) =>
                gl.viewport(0, 0, w, h);
            const targetCtx = {
                enable() {
                    bindFn(fb);
                    setViewport(w, h);
                },
                disable() {
                    setViewport(width, height);
                    bindFn(null);
                },
            };
            // setup depth texture
            targetCtx.enable();
            gl.framebufferTexture2D(
                GL_FRAMEBUFFER,
                GL_COLOR_ATTACHMENT0,
                GL_TEXTURE_2D,
                target.tex,
                0,
            );
            const depth = thisStateObj.texture()
                .setTexData(
                    null, 0,
                    GL_DEPTH_COMPONENT24,
                    w, h,
                    0, GL_DEPTH_COMPONENT,
                    GL_UNSIGNED_INT,
                )
                .setFilter(GL_LINEAR)
                .setWrap();
            gl.framebufferTexture2D(
                GL_FRAMEBUFFER,
                GL_DEPTH_ATTACHMENT,
                GL_TEXTURE_2D,
                depth.tex, 0,
            );
            targetCtx.disable();
            return targetCtx;
        },
    };

    return thisStateObj;
};
