import { mat4, vec3 } from 'gl-matrix';

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
     * recalculate transform matrix
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
/**
 * Create webgl camera
 */
const Camera = (fov: number, zNear: number, zFar: number, aspect: number): CamState => {
    const projectionMat = mat4.perspective(mat4.create(), fov, aspect, zNear, zFar);
    const viewMat = mat4.create();

    const pos = vec3.create();
    const up = vec3.set(vec3.create(), 0, 1, 0);
    const front = vec3.set(vec3.create(), 0, 0, -1);
    // make cam initially point to z=-1
    let yaw = -Math.PI / 2,
        pitch = 0;

    // temporary cached variables
    const t_move = vec3.create();
    const t_side = vec3.create();
    const t_dir = vec3.create();
    const t_view = mat4.create();
    const t_target = vec3.create();

    const thisObj: CamState = {
        move(x, y, z) {
            if (z) {
                vec3.scale(t_move, front, z);
                // reset y dir, so we always move paralell to the ground
                // regardless of face direction
                // t_move[1] = 0;
                vec3.add(pos, pos, t_move);
            }
            if (y) {
                vec3.scale(t_move, up, y);
                vec3.add(pos, pos, t_move);
            }
            if (x) {
                vec3.cross(t_side, up, front);
                vec3.normalize(t_side, t_side);
                vec3.scale(t_move, t_side, x);
                vec3.add(pos, pos, t_move);
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
            vec3.normalize(front, t_dir);
            return thisObj;
        },
        moveTo(x, y, z) {
            vec3.set(pos, x, y, z);
            return thisObj;
        },
        // TODO
        lookAt(_x, _y, _z) {
            //vec3.set(target, x, y, z);
            return thisObj;
        },
        recalculate() {
            mat4.lookAt(t_view, pos, vec3.add(t_target, pos, front), up);
            mat4.mul(thisObj.matrix, projectionMat, t_view);
            return thisObj;
        },
        matrix: mat4.clone(projectionMat),
        viewMatrix: viewMat,
        projectionMatrix: projectionMat,
        eye: pos,
        lookDir: front,
    };

    return thisObj;
};

export default Camera;
