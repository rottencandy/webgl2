// for gl-matrix types
///<reference path="../global.d.ts" />
import mat4, {
    clone as m4clone,
    create as m4create,
    lookAt as m4lookAt,
    mul as m4mul,
    ortho as m4ortho,
    perspective as m4perspective,
} from 'gl-matrix/mat4';
import vec3, {
    create as v3create,
    set as v3set,
    scale as v3scale,
    add as v3add,
    cross as v3cross,
    normalize as v3normalize,
} from 'gl-matrix/vec3';

type CamState = {
    /**
     * Move camera along XYZ
     */
    move: (x: number, y: number, z: number) => CamState;
    /**
     * Rotate camera (radians)
     */
    rotate: (pitch: number, yaw: number) => CamState;
    /**
     * Move camera to absolute point XYZ
     */
    moveTo: (x: number, y: number, z: number) => CamState;
    /**
     * Change target focus point
     * @deprecated not yet implemented
     */
    lookAt: (x: number, y: number, z: number) => CamState;
    /**
     * recalculate transform matrix.
     * Run after changing any of the above methods are used.
     */
    recalculate: () => CamState;
    /**
     * view-projection matrix
     */
    eye: vec3;
    lookDir: vec3;
    matrix: mat4;
    viewMatrix: mat4;
    projectionMatrix: mat4;
};

const MAX_PITCH = Math.PI / 2 - 0.01;

const Camera = (isOrtho: boolean, ...props: number[]): CamState => {
    const projectionMat = isOrtho ?
        // @ts-ignore
        m4ortho(m4create(), ...props) :
        // @ts-ignore
        m4perspective(m4create(), ...props);
    const viewMat = m4create();

    const pos = v3create();
    const up = v3set(v3create(), 0, 1, 0);
    const front = v3set(v3create(), 0, 0, -1);
    // make cam initially point to z=-1
    let yaw = -Math.PI / 2,
        pitch = 0;

    // temporary cached variables
    const t_move = v3create();
    const t_side = v3create();
    const t_dir = v3create();
    const t_target = v3create();

    const thisObj: CamState = {
        move(x, y, z) {
            if (z) {
                v3scale(t_move, front, z);
                // reset y dir, so we always move paralell to the ground
                // regardless of face direction
                // t_move[1] = 0;
                v3add(pos, pos, t_move);
            }
            if (y) {
                v3scale(t_move, up, y);
                v3add(pos, pos, t_move);
            }
            if (x) {
                v3cross(t_side, up, front);
                v3normalize(t_side, t_side);
                v3scale(t_move, t_side, x);
                v3add(pos, pos, t_move);
            }
            return thisObj;
        },
        rotate(ptch, yw) {
            pitch -= ptch;
            yaw += yw;
            if (pitch > MAX_PITCH)
                pitch = MAX_PITCH;
            if (pitch < -MAX_PITCH)
                pitch = -MAX_PITCH;

            const cosPitch = Math.cos(pitch);
            t_dir[0] = Math.cos(yaw) * cosPitch;
            t_dir[1] = Math.sin(pitch);
            t_dir[2] = Math.sin(yaw) * cosPitch;
            v3normalize(front, t_dir);
            return thisObj;
        },
        moveTo(x, y, z) {
            v3set(pos, x, y, z);
            return thisObj;
        },
        // TODO
        lookAt(_x, _y, _z) {
            //v3set(target, x, y, z);
            return thisObj;
        },
        recalculate() {
            m4lookAt(viewMat, pos, v3add(t_target, pos, front), up);
            m4mul(thisObj.matrix, projectionMat, viewMat);
            return thisObj;
        },
        matrix: m4clone(projectionMat),
        viewMatrix: viewMat,
        projectionMatrix: projectionMat,
        eye: pos,
        lookDir: front,
    };

    return thisObj;
};

/**
 * Create webgl perspective camera
 */
export const CameraPerspective = (
    fov: number,
    zNear: number,
    zFar: number,
    aspect: number
) => Camera(false, fov, aspect, zNear, zFar);

/**
 * Create webgl orthographic camera
 */
export const CameraOrtho = (
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
) => Camera(true, left, right, bottom, top, near, far);
