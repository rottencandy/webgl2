
export const
    deviceScaleRatio = (width: number, height: number) => Math.min(window.innerWidth / width, window.innerHeight / height),

    FLOOR = (x: number) => ~~x,
    radians = (a: number) => a * Math.PI / 180,
    F32 = (x: Iterable<number>) => new Float32Array(x);
