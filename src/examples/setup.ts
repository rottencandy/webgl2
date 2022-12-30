import { startLoop } from "../engine/loop";
import { CompInputRun, setupKeyListener } from "../engine/components/input";
import { CompPhysicsRun } from "../engine/components/physics";
import { CompRenderRun } from "../engine/components/render";
import { createGLContext, resize } from "../engine/webgl2-stateless";
import { FPSCam3D } from "./utils/views";
import { setup } from "./grid";

export const runExamples = () => {
    const canvas = document.getElementById('c') as HTMLCanvasElement, width = 300, height = 300;
    setupKeyListener(canvas, true);
    const gl = createGLContext(canvas, width, height);
    (onresize = () => resize(gl, canvas, width, height))();
    const cam = FPSCam3D(.001, 0, 1, 3, width / height);

    setup(gl);

    startLoop(
        (dt) => {
            cam.update(dt);
            CompInputRun(dt);
            CompPhysicsRun(dt);
        },
        (t) => {
            CompRenderRun(gl, cam.mat(), width / height, t);
        },
    );
};
