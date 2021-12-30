import { GAME_WIDTH, GAME_HEIGHT } from './globals';
import { M4lookAt, M4create, M4multiply, M4perspective, M4clone } from '../math/mat4';
import { V3set, V3create } from '../math/vec3';

/**
 * Create webgl camera
 */
export const Camera = (fov: number, zNear: number, zFar: number, aspect = GAME_WIDTH / GAME_HEIGHT) => {
    const projectionMat = M4perspective(M4create(), fov, aspect, zNear, zFar);
    const viewMat = M4create();

    const eye = V3create();
    const target = V3create();
    const up = V3create(0, 1, 0);

    return {
        /**
         * Move camera along XYZ
         */
        move(x: number, y: number, z: number) {
            eye[0] += x;
            eye[1] += y;
            eye[2] += z;
        },
        /**
         * Move camera to absolute point XYZ
         */
        moveTo(x: number, y: number, z: number) {
            V3set(eye, x, y, z);
        },
        /**
         * Change target focus point
         */
        lookAt(x: number, y: number, z: number) {
            V3set(target, x, y, z);
        },
        /**
         * recalculate view-projection matrix
         */
        recalculate() {
            M4lookAt(viewMat, eye, target, up);
            M4multiply(this.matrix, projectionMat, viewMat);
        },
        /**
         * view-projection matrix
         */
        matrix: M4clone(projectionMat),
    };
};
