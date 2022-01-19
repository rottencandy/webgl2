import { deviceScaleRatio } from '../globals';

type WatchedKeys = {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    space: boolean,
    esc: boolean,
    clicked: boolean,
    pointerLocked: boolean,
    touchX: number,
    touchY: number,
    ptrX: number,
    ptrY: number,
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

    pointerLocked: !!0,
    ptrX: 0,
    ptrY: 0,
};

export const dirKeysPressed = (): boolean => !!(Keys.left || Keys.right || Keys.up || Keys.down);

const ARROW = 'Arrow';

/**
 * Initialize onkey listeners
*/
export const setupKeyListener = (canvas: HTMLCanvasElement, width: number, height: number, lockPointer?: boolean) => {
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

    canvas.onpointerdown = () => Keys.clicked = !!1;
    canvas.onpointerup = () => Keys.clicked = !!0;
    canvas.onpointermove = e => {
        const ratio = deviceScaleRatio(width, height);
        Keys.touchX = e.offsetX / ratio;
        Keys.touchY = e.offsetY / ratio;
    };

    canvas.ontouchstart = canvas.ontouchmove = canvas.ontouchend = canvas.ontouchcancel = e => {
        e.preventDefault();
        Keys.clicked = e.touches.length > 0;
        if (Keys.clicked) {
            const offset = canvas.getBoundingClientRect();
            const ratio = deviceScaleRatio(width, height);
            Keys.touchX = (e.touches[0].clientX - offset.left) / ratio;
            // offset.top is not needed since canvas is always stuck to top
            Keys.touchY = e.touches[0].clientY / ratio;
        }
    };

    if (lockPointer) {
        canvas.onclick = () => {
            if (!Keys.pointerLocked) {
                canvas.requestPointerLock();
            }
        };
    }
    document.addEventListener('pointerlockchange', () => {
        Keys.pointerLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', (e) => {
        Keys.ptrX = e.movementX;
        Keys.ptrY = e.movementY;
    });
};
