import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_COLOR_BUFFER_BIT,
    GL_CULL_FACE,
    GL_DEPTH_BUFFER_BIT,
    GL_DEPTH_TEST,
    GL_FLOAT,
    GL_FRAGMENT_SHADER,
    GL_LEQUAL,
    GL_LINK_STATUS,
    GL_ONE_MINUS_SRC_ALPHA,
    GL_SRC_ALPHA,
    GL_STATIC_DRAW,
    GL_TRIANGLES,
    GL_VERTEX_SHADER,
} from './gl-constants';

const clearFn = (gl: WebGL2RenderingContext) => (r = 0., g = 0., b = 0., a = 1.) => {
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

    return {
        prg,
        uniform: uniformSetterFns(gl, prg),
        use() { gl.useProgram(prg); return this; },
        attribLoc: (name: string) => gl.getAttribLocation(prg, name),
    };
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
    enable: () => VAOState;
    setPointer: (size: number, type?: number, normalize?: boolean, stride?: number, offset?: number) => VAOState;
};

const createVAOFns = (gl: WebGL2RenderingContext) => (loc: number): VAOState => {
    const vao = gl.createVertexArray();
    return {
        vao,
        bind() { gl.bindVertexArray(vao); return this; },
        unbind() { gl.bindVertexArray(null); return this; },
        enable() { gl.enableVertexAttribArray(loc); return this; },
        setPointer(size, type = GL_FLOAT, normalize = false, stride = 0, offset = 0) {
            gl.vertexAttribPointer(loc, size, type, normalize, stride, offset); return this;
        },
    };
};

type BufferState = {
    buf: WebGLBuffer;
    bind: () => BufferState;
    setData: (data: BufferSource) => BufferState;
};

const createBufferFns = (gl: WebGL2RenderingContext) => (target = GL_ARRAY_BUFFER, mode = GL_STATIC_DRAW): BufferState => {
    const buf = gl.createBuffer();
    return {
        buf,
        bind() { gl.bindBuffer(target, buf); return this; },
        setData(data) { gl.bufferData(target, data, mode); return this; },
    };
};

export const createGLContext = (canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        // TODO remove before release
        alert('Could not get webgl2 context!');
        throw new Error('Could not get webgl2 context!');
    };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(GL_CULL_FACE);
    gl.enable(GL_DEPTH_TEST);
    gl.enable(GL_BLEND);
    gl.depthFunc(GL_LEQUAL);
    gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    return {
        gl,
        clear: clearFn(gl),
        createShader: createShaderFns(gl),
        createBuffer: createBufferFns(gl),
        createVAO: createVAOFns(gl),
        draw: (count: number, mode = GL_TRIANGLES, offset = 0) => gl.drawArrays(mode, offset, count),
    };
};
