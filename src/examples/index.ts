import { startLoop } from "../core/loop";
import { CompInputRun, setupKeyListener } from "../components/input";
import { CompPhysicsRun } from "../components/physics";
import { CompRenderRun } from "../components/render";
import { bindVAO, createGLContext, disableRenderTarget, enableRenderTarget, mesh, renderTarget, resize, texture } from "../core/webgl2-stateless";
import { enableGrid, disableGrid } from "./grid";
import { setup as setupLight, teardown as teardownLight } from "./lightning";
import { setup as setupUbo, teardown as teardownUbo } from "./ubo";
import { setup as setupTex, teardown as teardownTex } from "./texture";
import { setup as setupInst, teardown as teardownInst } from "./instanced-render";
import { setup as setupRaymarch, teardown as teardownRaymarch } from "./raymarch";
import { disableFXAA, enableFXAA } from "./fxaa";
import { enablePassthrough } from "./passthrough";
import { setup as setupRenderTex, teardown as teardownRenderTex } from "./texture-render";
import { $, addToDebugPanel } from "../core/ui";
import { CompPostProcessRun } from "../components/post-process";
import { Plane } from "../vertices";
import { CompMotionBlurRun, disableMotionBlur, enableMotionBlur } from "../components/motion-blur";
import { GL_RG16UI, GL_RG_INTEGER, GL_UNSIGNED_SHORT } from "../core/gl-constants";
import { setupCam } from "../3d/orbitcam";

const scenes
:{ [key: string]: { setup: (gl: WebGL2RenderingContext) => void, teardown: () => void } } = {
    lightning: { setup: setupLight, teardown: teardownLight },
    ubo: { setup: setupUbo, teardown: teardownUbo },
    texture: { setup: setupTex, teardown: teardownTex },
    renderInst: { setup: setupInst, teardown: teardownInst },
    renderTex: { setup: setupRenderTex, teardown: teardownRenderTex },
    raymarch: { setup: setupRaymarch, teardown: teardownRaymarch },
};
let active = 'lightning';

const Checkbox = (id: string, name: string, onclick: (v: boolean) => void) => {
    return $('div', {},
        $('input', {
            type: 'checkbox',
            id,
            onchange: (e: any) => onclick(e.target.checked),
        }),
        $('label', { for: id }, name),
    );
};

export const runExamples = () => {

    // Init
    const canvas = document.getElementById('c') as HTMLCanvasElement, width = 300, height = 300;
    setupKeyListener(canvas, false);
    const gl = createGLContext(canvas, width, height);
    (onresize = () => resize(gl, canvas, width, height))();
    const cam = setupCam(30, 50, width / height);

    // Post processing
    // setup post process ping-pong framebuffers & attribs
    const target1 = texture(gl);
    const [fb1] = renderTarget(gl, target1, width, height);
    const target2 = texture(gl);
    const [fb2] = renderTarget(gl, target2, width, height);
    const [ppVAO, ppDraw] = mesh(gl, Plane(1), [[0, 2]]);
    // setup atleast one post-process comp so that there is something that uses the textures
    enablePassthrough(gl);
    // motion blur velocity texture target
    const velocityTex = texture(gl);
    // cannot write to float RG16F textures without extension
    const [vfb] = renderTarget(gl, velocityTex, width, height, GL_RG16UI, GL_RG_INTEGER, GL_UNSIGNED_SHORT);

    // UI
    active && scenes[active].setup(gl);
    addToDebugPanel(
        $('div', {},
            $('label', { for: 'scenes' }, 'Example: '),
            $('select', {
                name: 'scenes',
                id: 'scenes',
                onchange: (e: any) => {
                    const next = e.target.value;
                    active && scenes[active]?.teardown();
                    active = next;
                    scenes[active].setup(gl);
                },
            },
                ...Object.keys(scenes).map(k => $('option', { value: k }, k))),
            Checkbox('fxaa', 'FXAA', (x) => x ? enableFXAA(gl) : disableFXAA()),
            Checkbox('grid', 'Grid', (x) => x ? enableGrid(gl) : disableGrid()),
            Checkbox('motionblur', 'Motion Blur', (x) => x ? enableMotionBlur(gl, velocityTex) : disableMotionBlur()),
         ),
    );

    startLoop(
        (dt) => {
            CompInputRun(dt);
            CompPhysicsRun(dt);
        },
        (t) => {
            cam.recalculate();
            enableRenderTarget(gl, fb1);
            CompRenderRun(gl, cam.matrix, cam.eye, width / height, t, fb1);
            disableRenderTarget(gl);

            enableRenderTarget(gl, vfb);
            CompMotionBlurRun(gl, cam.matrix);

            bindVAO(gl, ppVAO);
            CompPostProcessRun(gl, fb1, fb2, target1, target2, ppDraw);
        },
    );
};
