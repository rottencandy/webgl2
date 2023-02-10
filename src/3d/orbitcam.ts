// for gl-matrix types
///<reference path="../global.d.ts" />
import {
    create as v3create,
    set as v3set,
    rotateX,
    rotateY,
} from 'gl-matrix/vec3';
import { CameraPerspective } from "../core/cam";
import { radians } from "../core/math";
import { CompInput } from "../components/input";

export const setupCam = (dist = 20, speed = 10, aspect = 400 / 300) => {
    const cam = CameraPerspective(radians(45), .1, 500, aspect)
        .moveTo(0, 0, dist);
    const camPos = v3create();
    const lookPos = v3create();
    const origin = v3create();
    v3set(camPos, 0, 0, dist);

    CompInput.push((k, dt) => {
        if (!k.clicked) {
            return;
        }
        const spd = speed * dt;
        const xAngle = spd * -k.ptrRelativeOffsetX;
        const yAngle = spd * -k.ptrRelativeOffsetY;

        rotateY(camPos, camPos, origin, xAngle);
        rotateX(camPos, camPos, origin, yAngle);

        cam.moveTo(camPos[0], camPos[1], camPos[2]);
        cam.lookAt(lookPos[0], lookPos[1], lookPos[2]);
    });

    return cam;
};
