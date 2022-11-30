import { CameraPerspective } from '../engine/cam';
import { Keys } from '../engine/input';
import { radians } from '../globals';

export const FPSCam3D = (speed = .01, x = 0, y = 0, z = 20) => {
    const cam = CameraPerspective(radians(45), 1, 500, 400 / 300)
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
                cam.rotate(Keys.ptrY / 1e3, Keys.ptrX / 1e3);
                // TODO: do this at the end of the update step
                Keys.ptrX = Keys.ptrY = 0;
            }
        },
        mat: () => cam.recalculate().matrix,
        eye: cam.eye,
        lookDir: cam.lookDir,
    };
};
