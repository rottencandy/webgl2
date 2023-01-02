import { CameraOrtho, CameraPerspective } from '../../engine/cam';
import { Keys } from '../../engine/components/input';
import { radians } from '../../globals';

export const FPSCam3D = (speed = .01, x = 0, y = 0, z = 20, aspect = 400 / 300) => {
    const cam = CameraPerspective(radians(45), .1, 500, aspect)
        .moveTo(x, y, z);

    return {
        update: (dt: number) => {
            const spd = speed * dt;
            const fd = Keys.up && spd;
            const bk = Keys.down && -spd;
            const lt = Keys.left && spd;
            const rt = Keys.right && -spd;
            // @ts-ignore
            cam.move(lt + rt, 0, fd + bk);

            if (Keys.pointerLocked) {
                cam.rotate(Keys.ptrRelativeOffsetY, Keys.ptrRelativeOffsetX);
            }
        },
        mat: () => cam.recalculate().matrix,
        eye: cam.eye,
        lookDir: cam.lookDir,
        viewMat: cam.viewMatrix,
        projectionMat: cam.projectionMatrix,
    };
};

export const OrthoCam3D = () => {
    // TODO
};

export const Cam2D = (width: number, height: number, x = 0, y = 0) => {
    const cam = CameraOrtho(x, width, height, y, -1, 1)
        .moveTo(x, y, 0);

    return {
        move: (x: number, y: number) => {
            cam.move(x, y, 0);
        },
        mat: () => cam.recalculate().matrix,
    };
};
