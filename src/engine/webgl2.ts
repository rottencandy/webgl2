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

const uniformSetterFns = (gl: WebGL2RenderingContext, prg: WebGLProgram) => (name: TemplateStringsArray) => {
    const loc = gl.getUniformLocation(prg, name as unknown as string);

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
    uniform: ReturnType<typeof uniformSetterFns>;
    /** @deprecated only for extreme cases, try to use `layout(location=n)` in shader */
    attribLoc: (name: string) => number;
};

const createShaderFns = (gl: WebGL2RenderingContext) => (vSource: string, fSource: string): ShaderState => {
    const prg = gl.createProgram();
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
};

type VAOState = {
    vao: WebGLVertexArrayObject;
    bind: () => VAOState;
    // binds VAO automatically
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
            this.bind_();
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, type, normalize, stride, offset);
            return thisObj;
        },
    };
    return thisObj.bind();
};

type BufferState = {
    buf: WebGLBuffer;
    bind: () => BufferState;
    // binds buffer automatically
    setData: (data: BufferSource) => BufferState;
};

const createBufferFns = (gl: WebGL2RenderingContext) => (target = GL_ARRAY_BUFFER, mode = GL_STATIC_DRAW): BufferState => {
    const buf = gl.createBuffer();
    const thisObj: BufferState = {
        buf,
        bind() { gl.bindBuffer(target, buf); return thisObj; },
        setData(data) { this.bind_(); gl.bufferData(target, data, mode); return thisObj; },
    };
    return thisObj.bind();
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
    setTexData: (data: ArrayBufferView, level?: number, internalFormat?: number, width?: number, height?: number, border?: number, format?: number, type?: number, alignment?: number) => TextureState;
    /**
     * Only needed when using multiple textures in a single program.
     * Binds texture automatically.
     * Note: Always set correct active texture before setting unit
     */
    setUnit: (loc: WebGLUniformLocation, unit: number) => TextureState;
};


const createTextureFns = (gl: WebGL2RenderingContext) => (target = GL_TEXTURE_2D) => {
    const tex = gl.createTexture();
    const setParam = (key: number, val: number) => gl.texParameteri(target, key, val);
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
            img.onload = () => {
                thisObj.setTexImage2D(img);
            };
            return thisObj;
        },
        setTexData(data: ArrayBufferView, level = 0, internalFormat = GL_R8, width = 2, height = 2, border = 0, format = GL_RED, type = GL_UNSIGNED_BYTE, alignment = 1) {
            thisObj.bind();
            gl.pixelStorei(GL_UNPACK_ALIGNMENT, alignment);
            gl.texImage2D(target, level, internalFormat, width, height, border, format, type, data);
            return thisObj;
        },
        setUnit(loc: WebGLUniformLocation, unit: number) {
            gl.uniform1i(loc, unit);
            gl.activeTexture(GL_TEXTURE0 + unit);
            thisObj.bind();
            return thisObj;
        }
    };
    // set a temporary blue texture
    thisObj.setTexData(new Uint8Array([0, 0, 255, 255]), 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE);
    return thisObj;
};

type EBState = {
    buf: WebGLBuffer;
    bind: () => EBState;
    // automatically binds EB
    setIndices: (data: number[]) => EBState;
};

const createElementBufferFns = (gl: WebGL2RenderingContext) => (mode = GL_STATIC_DRAW): EBState => {
    const buf = gl.createBuffer();
    const thisObj: EBState = {
        buf,
        bind() { gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, buf); return thisObj; },
        setIndices(data) {
            thisObj.bind();
            gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(data), mode);
            return thisObj;
        },
    };
    return thisObj.bind();
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
    * This changes the saved ratio and will be used instead of initially supplied width/height
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
    * Returns a decorator function that renders to the texture when
    * any draw calls are made inside it.
    */
    renderTargetContext: (tex: TextureState, width?: number, height?: number, internalFormat?: number, format?: number) => (fn: () => void) => void;
};

export const createGLContext = (canvas: HTMLCanvasElement, width = 400, height = 300): WebglState => {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Could not get gl context');
    };

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
    setupKeyListener(canvas);

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

        createMesh([data, indices], attribs) {
            const vao = thisObj.VAO();
            thisObj.buffer().setData(data);
            thisObj.elementBuffer().setIndices(indices);
            attribs.forEach(attr => vao.setPtr(...attr));
            return { vao: vao, draw: () => thisObj.drawElements(indices.length) };
        },
        resize() {
            const ratio = deviceScaleRatio(width, height);
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width * ratio + 'px';
            canvas.style.height = height * ratio + 'px';
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            // display note if device is in potrait
            document.getElementById('d').style.display = window.innerWidth < window.innerHeight ? 'block' : 'none';
        },
        changeSize(w, h) {
            width = w;
            height = h;
            thisObj.resize();
        },
        renderTargetContext(target, w = width, h = height, internalFormat = GL_RGBA, format = GL_RGBA) {
            const fb = gl.createFramebuffer();
            target.setTexData(null, 0, internalFormat, w, h, 0, format).setFilter();
            const bindFn = (target: WebGLFramebuffer) => gl.bindFramebuffer(GL_FRAMEBUFFER, target);
            const setViewport = (w: number, h: number) => gl.viewport(0, 0, w, h);
            const withTarget = (ctxFn: () => void) => {
                bindFn(fb);
                setViewport(w, h);
                ctxFn();

                setViewport(width, height);
                bindFn(null);
            };
            // setup depth texture
            withTarget(() => {
                gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, target.tex, 0);
                const depth = thisObj.texture()
                    .setTexData(null, 0, GL_DEPTH_COMPONENT24, w, h, 0, GL_DEPTH_COMPONENT, GL_UNSIGNED_INT)
                    .setFilter(GL_LINEAR)
                    .setWrap();
                gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depth.tex, 0);
            })
            return withTarget;
        },
    };

    return thisObj;
};
