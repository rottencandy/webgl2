type StepFn = (delta: number) => void;

const FPS = 60;

/**
 * Start the game loop
 * Inspired by:
 * https://codeincomplete.com/articles/javascript-game-foundations-the-game-loop
 *
 */
export const startLoop = (update: StepFn, render: StepFn) => {
    let last = 0, acc = 0, delta = 1e3 / FPS, step = 1 / FPS, t = 0;
    (function loop(now: number) {
        acc += now - last;
        last = now;
        // Sanity check - absorb random lag spike / frame jumps
        if (acc > 1e3) acc = 0;

        while (acc >= delta) {
            acc -= delta;
            update(step);
        };

        render(t++);

        requestAnimationFrame(loop);
    })(0);
};
