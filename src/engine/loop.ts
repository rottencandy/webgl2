import { RAF, MIN } from '../globals';

type StepFn = (delta: number) => void;

/**
 * Start the game loop
 * Inspired by:
 * https://codeincomplete.com/articles/javascript-game-foundations-the-game-loop
 *
 */
export const startLoop = (update: StepFn, render: StepFn) => {
    /* https://codeincomplete.com/articles/javascript-game-foundations-the-game-loop/ */
    let last = 0, dt = 0, step = 1 / 60;
    const loop = (now: number) => {
        // Sanity check - absorb random lag spike / frame jumps
        // (expected delta for 60FPS is 1000/60 = ~16.67ms)
        dt = dt + MIN(now - last, 1000);

        while (dt > step) {
            dt -= step;
            update(step);
        }

        render(dt);
        last = now;

        RAF(loop);
    };
    RAF(loop);
};
