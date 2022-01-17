const M = Math;

/** Alias for `document.getElementById()` */
export const getById = (id: string) => document.getElementById(id) as HTMLCanvasElement;

export const
    WIDTH = 'width',
    HEIGHT = 'height',
    STYLE = 'style',

    deviceScaleRatio = (width: number, height: number) => MIN(innerWidth / width, innerHeight / height),
    RAF = requestAnimationFrame,

    // Math aliases
    MIN = M.min,
    MAX = M.max,
    FLOOR = (x: number) => ~~x,
    ABS = M.abs,
    SQRT = M.sqrt,
    PI = M.PI,
    SIN = M.sin,
    COS = M.cos,
    TAN = M.tan,
    HYPOT = M.hypot,
    isOdd = (x: number) => x % 2,
    radians = (a: number) => a * PI / 180,
    F32 = (x: Iterable<number>) => new Float32Array(x),
    /** Initialize an array with consecutive numbers for use as state enum */
    numArray = (n: number) => Array.from({ length: n }).map((_, i) => i),

    // evil bit shifting to store rgb as a single int
    // where r, g, b are in the range [0, 1]
    rgb2i = (r: number, g: number, b: number) => r + g / 100 + b / 100_00,
    //i2rgb = (i: number) => (r = (i *= 100) / 100, i %= 1, g = (i *= 100) / 100, i %= 1, b = (i *= 100) / 100, [r, g, b]),

    // FP utils
    compose = (...fns: any[]) => (...args: any[]) => fns.reduceRight((res, fn) => [fn.call(0, ...res)], args)[0],
    // identity
    Id = () => { };