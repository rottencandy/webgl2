import {
    GL_ARRAY_BUFFER,
    GL_CLAMP_TO_EDGE,
    GL_ELEMENT_ARRAY_BUFFER,
    GL_FLOAT,
    GL_NEAREST,
    GL_R8,
    GL_RED,
    GL_RGBA,
    GL_STATIC_DRAW,
    GL_TEXTURE0,
    GL_TEXTURE_2D,
    GL_TRIANGLES,
    GL_UNSIGNED_BYTE,
} from './gl-constants';
import {
    createGLContext as createGLContextStateless,
    clear as glClear,
    shaderProgram,
    useProgram,
    getAttribLoc,
    buffer,
    bindBuffer,
    setBufferData,
    setElementBufferData,
    VAO,
    bindVAO,
    setVAOPtr,
    UBO,
    texture,
    bindTexture,
    setTextureFilter,
    setTextureWrap,
    setTextureImage,
    loadTextureImage,
    draw,
    drawElements,
    resize,
    renderTarget,
    enableRenderTarget,
    disableRenderTarget,
    setTexData,
} from './webgl2-stateless';

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

type RenderTargetState = {
    fb: WebGLFramebuffer;
    depth: WebGLTexture;
    enable: () => void;
    disable: () => void;
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
    texture: (target?: number, level?: number) => TextureState;
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
    ) => RenderTargetState;
};

export const createGLContext = (
    canvas: HTMLCanvasElement,
    width = 400,
    height = 300,
): WebglState => {
    const gl = createGLContextStateless(canvas, width, height);
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
            glClear(gl);
        },

        shader(vSource: string, fSource: string) {
            const prg = shaderProgram(gl, vSource, fSource);

            const thisObj: ShaderState = {
                prg,
                uniform: uniformSetterFns(gl, prg),
                use() {
                    useProgram(gl, prg);
                    return thisObj;
                },
                attribLoc: (name) => getAttribLoc(gl, prg, name),
            };

            return thisObj;
        },

        buffer(target = GL_ARRAY_BUFFER, mode = GL_STATIC_DRAW) {
            const buf = buffer(gl);
            const thisObj: BufferState = {
                buf,
                bind() {
                    bindBuffer(gl, buf, target);
                    return thisObj;
                },
                setData(data) {
                    setBufferData(gl, buf, data, target, mode);
                    return thisObj;
                },
            };
            return thisObj;
        },

        elementBuffer(mode = GL_STATIC_DRAW) {
            const buf = buffer(gl);
            const thisObj: EBState = {
                buf,
                bind() {
                    bindBuffer(gl, buf, GL_ELEMENT_ARRAY_BUFFER);
                    return thisObj;
                },
                setData(data) {
                    setElementBufferData(gl, buf, data, mode);
                    return thisObj;
                },
            };
            return thisObj;
        },

        VAO() {
            const vao = VAO(gl);
            const thisObj: VAOState = {
                vao,
                bind() {
                    bindVAO(gl, vao);
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
                    setVAOPtr(gl, vao, loc, size, stride, offset, type, normalize);
                    return thisObj;
                },
            };
            return thisObj;
        },

        UBO(name, prg, vars, loc = 0) {
            const ubo = UBO(gl, name, prg, vars, loc);

            const thisObj: UBOState = {
                buf: ubo.buf,
                bindPrg(p) {
                    ubo.bindPrg(p);
                    return thisObj;
                },
                bind() {
                    ubo.bind();
                    return thisObj;
                },
                set(data) {
                    ubo.set(data);
                    return thisObj;
                },
                setSub(idx: number, data: ArrayBufferView) {
                    ubo.setSub(idx, data);
                    return thisObj;
                },
            };
            return thisObj;
        },

        texture(target = GL_TEXTURE_2D, level = 0) {
            const tex = texture(gl, target);
            const thisObj: TextureState = {
                tex,
                bind() {
                    bindTexture(gl, tex, target);
                    return thisObj;
                },
                setFilter(type = GL_NEAREST) {
                    setTextureFilter(gl, target, type);
                    return thisObj;
                },
                setWrap(type = GL_CLAMP_TO_EDGE) {
                    setTextureWrap(gl, target, type);
                    return thisObj;
                },
                setTexImage2D(src) {
                    setTextureImage(gl, tex, src, level, target);
                    return thisObj;
                },
                setImage(imgSrc) {
                    loadTextureImage(gl, tex, imgSrc, level, target);
                    return thisObj;
                },
                setTexData(
                    data,
                    internalFormat = GL_R8,
                    width = 2,
                    height = 2,
                    border = 0,
                    format = GL_RED,
                    type = GL_UNSIGNED_BYTE,
                    alignment = 1,
                ) {
                    setTexData(
                        gl, tex, data,
                        target, level,
                        internalFormat,
                        width, height,
                        border,
                        format, type,
                        alignment,
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
            return thisObj;
        },

        draw: (count, mode = GL_TRIANGLES, offset = 0) =>
            draw(gl, count, mode, offset),

        drawElements: (count, mode = GL_TRIANGLES, offset = 0) =>
            drawElements(gl, count, mode, offset),

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
            resize(gl, canvas, width, height);
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
            const [fb, depth] = renderTarget(gl, target, w, h, internalFormat, format);
            const thisObj = {
                fb,
                depth,
                enable() {
                    enableRenderTarget(gl, fb, w, h);
                },
                disable() {
                    disableRenderTarget(gl);
                },
            };
            return thisObj;
        },
    };

    return thisStateObj;
};
