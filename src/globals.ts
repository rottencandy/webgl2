/** Create element node tree with props */
export const $ = (name: string, props: any = {}, ...children: (string | Node)[]) => {
    const ele = document.createElement(name);
    for (let k in props) {
        ele[k] = props[k];
    }
    if (props.style) {
        for (let k in props.style) {
            ele.style[k] = props.style[k];
        }
    }
    ele.append(...children);
    return ele;
};

export const deviceScaleRatio = (width: number, height: number) =>
    Math.min(window.innerWidth / width, window.innerHeight / height);

export const FLOOR = (x: number) => ~~x;

export const radians = (a: number) => a * Math.PI / 180;

export const F32 = (x: Iterable<number>) => new Float32Array(x);

// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
export const AABB = (
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
) => {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
};

export const makeShader = (content: TemplateStringsArray) => `#version 300 es
precision lowp float;
${content}`;
