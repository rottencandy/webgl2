import Camera from '../engine/cam';
import { Keys } from '../engine/input';
import { radians } from '../globals';

export const FPSCamera = (speed = .01) => {
    const cam = Camera(radians(45), 1, 500, 400 / 300)
        .moveTo(0, 0, 20);

    return {
        update: (dt: number) => {
            const spd = speed * dt;
            const fd = Keys.up ? spd : 0;
            const bk = Keys.down ? -spd : 0;
            const lt = Keys.left ? spd : 0;
            const rt = Keys.right ? -spd : 0;
            cam.move(lt + rt, 0, fd + bk);

            if (Keys.pointerLocked) {
                cam.rotate(Keys.ptrY / 1000, Keys.ptrX / 1000);
                // TODO: do this at the end of the update step
                Keys.ptrX = 0;
                Keys.ptrY = 0;
            }
        },
        mat: () => cam.recalculate().matrix,
        eye: () => cam.eye,
    };
};
