type CTX = CanvasRenderingContext2D;

export const create2dContext = (
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
): CTX => {
    const ctx = canvas.getContext('2d') as CTX;
    resize2d(canvas, width, height);

    return ctx;
};

export const resize2d = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const ratio = Math.min(innerWidth / width, innerHeight / height);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width * ratio + 'px';
    canvas.style.height = height * ratio + 'px';
};

export const clear2d = (ctx: CTX, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
};
