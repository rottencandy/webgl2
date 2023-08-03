import { $ } from '../core/ui';
import { GL, setTextureFilter, setTextureImage, setTextureWrap, texture } from './webgl2-stateless';
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

// offscreen canvas for making textures
const offCanvas = $('canvas') as HTMLCanvasElement;
const oCtx = offCanvas.getContext('2d') as CTX;

// Draw a pixel to raw canvas data
const drawPixel = (imgData: ImageData, width: number, x: number, y: number, r: number, g: number, b: number, a: number) => {
    const index = (x + y * width) * 4;

    imgData.data[index + 0] = r;
    imgData.data[index + 1] = g;
    imgData.data[index + 2] = b;
    imgData.data[index + 3] = a;
};

export const makeCanvasTexture = (width: number, height: number) => {
    offCanvas.width = width;
    offCanvas.height = height;
    clear2d(oCtx, width, height);
    const imgData = oCtx.getImageData(0, 0, width, height);
    drawPixel(imgData, width, 0, 0, 255, 0, 0, 255);
    drawPixel(imgData, width, 1, 0, 0, 255, 0, 255);
    drawPixel(imgData, width, 0, 1, 0, 0, 255, 255);
    oCtx.putImageData(imgData, 0, 0);
    return offCanvas;
};
