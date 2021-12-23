import { CANVAS, deviceScaleRatio } from './globals';

type WatchedKeys = {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    space: boolean,
    esc: boolean,
    clicked: boolean,
    touchX: number,
    touchY: number,
};

export const Keys: WatchedKeys = {
    left: !!0,
    right: !!0,
    up: !!0,
    down: !!0,
    space: !!0,
    esc: !!0,
    clicked: !!0,
    touchX: 0,
    touchY: 0,
};

export const dirKeysPressed = (): boolean => !!(Keys.left || Keys.right || Keys.up || Keys.down);

const ARROW = 'Arrow';

/**
 * Initialize onkey listeners
*/
export const setupKeyListener = () => {
    const setKeyState = (value: boolean) => ({ key: code }) => {
        switch (code) {
            case ARROW + 'Up':
            case 'w':
            case 'z':
                Keys.up = value;
                break;
            case ARROW + 'Down':
            case 's':
                Keys.down = value;
                break;
            case ARROW + 'Left':
            case 'a':
            case 'q':
                Keys.left = value;
                break;
            case ARROW + 'Right':
            case 'd':
                Keys.right = value;
                break;
            case 'Escape':
                Keys.esc = value;
                break;
            case ' ':
                Keys.space = value;
        }
    }

    onkeydown = setKeyState(!!1);
    onkeyup = setKeyState(!!0);

    CANVAS.onpointerdown = () => Keys.clicked = !!1;
    CANVAS.onpointerup = () => Keys.clicked = !!0;
    CANVAS.onpointermove = e => {
        const ratio = deviceScaleRatio();
        Keys.touchX = e.offsetX / ratio;
        Keys.touchY = e.offsetY / ratio;
    }

    CANVAS.ontouchstart = CANVAS.ontouchmove = CANVAS.ontouchend = CANVAS.ontouchcancel = e => {
        e.preventDefault();
        Keys.clicked = e.touches.length > 0;
        if (Keys.clicked) {
            const offset = CANVAS.getBoundingClientRect();
            const ratio = deviceScaleRatio();
            Keys.touchX = (e.touches[0].clientX - offset.left) / ratio;
            // offset.top is not needed since canvas is always stuck to top
            Keys.touchY = e.touches[0].clientY / ratio;
        }
    }
}

// vim: fdm=marker:et:sw=2:
