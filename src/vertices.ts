/** vertex data contains vertices(0) and indices(1) */
type MeshData = [Float32Array, number[]];

export const packData = (d1: Float32Array, d1Step: number, d2: Float32Array, d2Step: number) => {
    const out = new Float32Array(d1.length + d2.length);
    let d1ptr = 0, d2ptr = 0, i = 0;
    while (i < out.length) {
        for (let j = 0; j < d1Step; j++) {
            out[i + j] = d1[d1ptr++];
        }
        i += d1Step;
        for (let j = 0; j < d2Step; j++) {
            out[i + j] = d2[d2ptr++];
        }
        i += d1Step;
    }
    return out;
};

// plane {{{

export const Plane = (s: number): MeshData => [
    PlaneVerts(s),
    [0, 1, 2, 0, 2, 3,],
];

export const PlaneVerts = (s: number) =>
    new Float32Array([
        0, 0,
        s, 0,
        s, s,
        0, s,
    ]);

export const planeTexCoords = new Float32Array([
    0, 0,
    1, 0,
    1, 1,
    0, 1,
]);

// }}}

// cube {{{

/* Cube vertices include embedded vertex normals */
export const Cube = (s: number): MeshData => [
    // vertices
    packData(cubeVerts(s), 3, cubeNorms, 3),
    // indices
    cubeElements,
];

export const cubeVerts = (s: number) => new Float32Array([
    // front face
    0, s, s,
    0, 0, s,
    s, 0, s,
    s, s, s,
    // right face
    s, s, s,
    s, 0, s,
    s, 0, 0,
    s, s, 0,
    // left face
    0, s, 0,
    0, 0, 0,
    0, 0, s,
    0, s, s,
    // back face
    s, s, 0,
    s, 0, 0,
    0, 0, 0,
    0, s, 0,
    // bottom face
    0, 0, s,
    0, 0, 0,
    s, 0, 0,
    s, 0, s,
    // top face
    0, s, 0,
    0, s, s,
    s, s, s,
    s, s, 0,
]);

export const cubeNorms = new Float32Array([
    // front face
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    // right face
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    // left face
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    // back face
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    // bottom face
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    // top face
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
]);

export const cubeTexCoords = new Float32Array([
    // front face
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    // right face
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    // left face
    1, 0,
    0, 0,
    0, 1,
    1, 1,
    // back face
    1, 1,
    1, 0,
    0, 0,
    0, 1,
    // bottom face
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    // top face
    0, 0,
    0, 1,
    1, 1,
    1, 0,
]);

export const cubeElements = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
];

// }}}

// vim: fdm=marker:fdl=0
