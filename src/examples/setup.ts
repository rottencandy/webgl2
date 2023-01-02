import { startLoop } from "../engine/loop";
import { CompInputRun, setupKeyListener } from "../engine/components/input";
import { CompPhysicsRun } from "../engine/components/physics";
import { CompRenderRun } from "../engine/components/render";
import { bindVAO, createGLContext, disableRenderTarget, enableRenderTarget, mesh, renderTarget, resize, texture } from "../engine/webgl2-stateless";
import { FPSCam3D } from "./utils/views";
import { setup as setupGrid, teardown as teardownGrid } from "./grid";
import { setup as setupLight, teardown as teardownLight } from "./lightning";
import { setup as setupUbo, teardown as teardownUbo } from "./ubo";
import { setup as setupFXAA } from "./fxaa";
import { setup as setupRenderTex, teardown as teardownRenderTex } from "./texture-render";
import { addToPanel } from "../debug";
import { $ } from "../globals";
import { CompPostProcessRun } from "../engine/components/post-process";
import { Plane } from "../vertices";

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

    // Post processing
    setupFXAA(gl);

    // setup post process framebuffers & attribs
    const target1 = texture(gl);
    const fb1 = renderTarget(gl, target1, width, height);
    const target2 = texture(gl);
    const fb2 = renderTarget(gl, target2, width, height);
    const [ppVAO, ppDraw] = mesh(gl, Plane(2), [[0, 2]]);

    startLoop(
        (dt) => {
            cam.update(dt);
            CompInputRun(dt);
            CompPhysicsRun(dt);
        },
        (t) => {
            enableRenderTarget(gl, fb1, width, height);
            CompRenderRun(gl, cam.mat(), cam.eye, width / height, t, fb1);
            disableRenderTarget(gl);
            bindVAO(gl, ppVAO);
            CompPostProcessRun(gl, fb1, fb2, target1, target2, ppDraw, width, height);
        },
    );
};
