import { F32 } from './globals';

/** vertex data contains vertices(0) and indices(1) */
type VertexData = [Float32Array, number[]];

// plane {{{

export const Plane = (s: number): VertexData => [
    F32([
        0, 0,
        0, s,
        s, s,
        s, 0,
    ]),
    [0, 1, 2, 0, 2, 3,],
];

// }}}

// cube {{{

export const Cube = (s: number): VertexData => [
    // vertices
    F32([
        // front face
        0, s, s,
        0, 0, 1,
        0, 0, s,
        0, 0, 1,
        s, 0, s,
        0, 0, 1,
        s, s, s,
        0, 0, 1,
        // right face
        s, s, s,
        1, 0, 0,
        s, 0, s,
        1, 0, 0,
        s, 0, 0,
        1, 0, 0,
        s, s, 0,
        1, 0, 0,
        // left face
        0, s, 0,
        -1, 0, 0,
        0, 0, 0,
        -1, 0, 0,
        0, 0, s,
        -1, 0, 0,
        0, s, s,
        -1, 0, 0,
        // back face
        s, s, 0,
        0, 0, -1,
        s, 0, 0,
        0, 0, -1,
        0, 0, 0,
        0, 0, -1,
        0, s, 0,
        0, 0, -1,
        // bottom face
        0, 0, s,
        0, -1, 0,
        0, 0, 0,
        0, -1, 0,
        s, 0, 0,
        0, -1, 0,
        s, 0, s,
        0, -1, 0,
        // top face
        0, s, 0,
        0, 1, 0,
        0, s, s,
        0, 1, 0,
        s, s, s,
        0, 1, 0,
        s, s, 0,
        0, 1, 0,
    ]),
    // indices
    [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
    ],
];

// }}}

// vim: fdm=marker:fdl=0
