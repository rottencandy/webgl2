import { Matrix, M4lookAt, M4create, M4multiply, M4perspective, M4clone } from '../math/mat4';
import { Vector, V3set, V3create } from '../math/vec3';

type CamState = {
    /**
     * Move camera along XYZ
     */
    move: (x: number, y: number, z: number) => CamState;
    /**
     * Move camera to absolute point XYZ
     */
    moveTo: (x: number, y: number, z: number) => CamState;
    /**
     * Change target focus point
     */
    lookAt: (x: number, y: number, z: number) => CamState;
    /**
     * recalculate view-projection matrix
     */
    recalculate: () => CamState;
    /**
     * view-projection matrix
     */
    eye: Vector;
    matrix: Matrix;
    viewMatrix: Matrix;
    projectionMatrix: Matrix;
};

/**
 * Create webgl camera
 */
const Camera = (fov: number, zNear: number, zFar: number, aspect: number): CamState => {
    const projectionMat = M4perspective(M4create(), fov, aspect, zNear, zFar);
    const viewMat = M4create();

    const eye = V3create();
    const target = V3create();
    const up = V3create(0, 1, 0);

    return {
        move(x, y, z) {
            eye[0] += x;
            eye[1] += y;
            eye[2] += z;
            return this;
        },
        moveTo(x, y, z) {
            V3set(eye, x, y, z);
            return this;
        },
        lookAt(x, y, z) {
            V3set(target, x, y, z);
            return this;
        },
        recalculate() {
            M4lookAt(viewMat, eye, target, up);
            M4multiply(this.matrix, projectionMat, viewMat);
            return this;
        },
        matrix: M4clone(projectionMat),
        viewMatrix: viewMat,
        projectionMatrix: projectionMat,
        eye,
    };
};

export default Camera;
