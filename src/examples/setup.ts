import { startLoop } from "../engine/loop";
import { CompInputRun, setupKeyListener } from "../engine/components/input";
import { CompPhysicsRun } from "../engine/components/physics";
import { CompRenderRun } from "../engine/components/render";
import { bindTexture, createGLContext, disableRenderTarget, enableRenderTarget, renderTarget, resize, texture } from "../engine/webgl2-stateless";
import { FPSCam3D } from "./utils/views";
import { setup as setupGrid, teardown as teardownGrid } from "./grid";
import { setup as setupLight, teardown as teardownLight } from "./lightning";
import { setup as setupUbo, teardown as teardownUbo } from "./ubo";
import { setup as setupFXAA, render as renderFXAA } from "./fxaa";
import { setup as setupRenderTex, teardown as teardownRenderTex } from "./texture-render";
import { addToPanel } from "../debug";
import { $ } from "../globals";

const scenes
:{ [key: string]: { setup: (gl: WebGL2RenderingContext) => void, teardown: () => void } } = {
    grid: { setup: setupGrid, teardown: teardownGrid },
    lightning: { setup: setupLight, teardown: teardownLight },
    ubo: { setup: setupUbo, teardown: teardownUbo },
    renderTex: { setup: setupRenderTex, teardown: teardownRenderTex },
};
let active = 'grid';

export const runExamples = () => {

    // Init
    const canvas = document.getElementById('c') as HTMLCanvasElement, width = 300, height = 300;
    setupKeyListener(canvas, true);
    const gl = createGLContext(canvas, width, height);
    (onresize = () => resize(gl, canvas, width, height))();
    const cam = FPSCam3D(.01, 0, 5, 20, width / height);

    // UI
    active && scenes[active].setup(gl);
    addToPanel(
        $('select', {
            name: 'scenes',
            onchange: (e: any) => {
                const next = e.target.value;
                active && scenes[active]?.teardown();
                active = next;
                scenes[active].setup(gl);
            },
        },
        ...Object.keys(scenes).map(k => $('option', { value: k }, k))),
    );

    // FXAA
    const target = texture(gl);
    const fb = renderTarget(gl, target, width, height);
    setupFXAA(gl);

    startLoop(
        (dt) => {
            cam.update(dt);
            CompInputRun(dt);
            CompPhysicsRun(dt);
        },
        (t) => {
            enableRenderTarget(gl, fb, width, height);
            CompRenderRun(gl, cam.mat(), cam.eye, width / height, t, fb);
            disableRenderTarget(gl);

            bindTexture(gl, target);
            renderFXAA(gl);
        },
    );
};
