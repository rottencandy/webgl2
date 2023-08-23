import { Keys, setupKeyListener } from "../components/input";
import { createGLContext, resize } from "../core/webgl2-stateless";
import { startLoop } from "../core/loop";
import { update, render, init } from "../core/particles";

export const runDemo = () => {
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const width = 400, height = 300;
    setupKeyListener(canvas, false);

    const gl = createGLContext(canvas, width, height);
    const state = init(
        gl,
        1000,
        0.5,
        1.01, 1.15,
        Math.PI / 2.0 - 0.5, Math.PI / 2.0 + 0.5,
        0.5, 1.0,
        [0.0, -0.8]);
    onresize = () => {
        resize(gl, canvas, width, height);
    };

    startLoop(
        (dt) => {
            state.origin = [Keys.ptrX * 2 - 1, -Keys.ptrY * 2 + 1];
            update(gl, state, dt);
        },
        () => {
            render(gl, state);
        },
    );
};
