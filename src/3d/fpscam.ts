import { CameraPerspective } from "../core/cam";
import { radians } from "../core/math";
import { CompInput } from "../components/input";

export const setupCam = (speed = .01, x = 0, y = 0, z = 20, aspect = 400 / 300) => {
    const cam = CameraPerspective(radians(45), .1, 500, aspect)
        .moveTo(x, y, z);

    CompInput.push((k, dt) => {
        const spd = speed * dt * (k.shift ? 3 : 1);
        const fd = k.up ? spd : 0;
        const bk = k.down ? -spd : 0;
        const lt = k.left ? spd : 0;
        const rt = k.right ? -spd : 0;
        cam.move(lt + rt, 0, fd + bk);

        if (k.pointerLocked) {
            cam.rotate(k.ptrRelativeOffsetY, k.ptrRelativeOffsetX);
        }
    });

    return cam;
};
