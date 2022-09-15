type WatchedKeys = {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
    space: boolean,
    esc: boolean,
    clicked: boolean,
    justClicked: boolean,
    pointerLocked: boolean,
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
    justClicked: !!0,

    pointerLocked: !!0,
    ptrX: 0,
    ptrY: 0,
};

export const dirKeysPressed = (): boolean => !!(Keys.left || Keys.right || Keys.up || Keys.down);

const ARROW = 'Arrow';
let justClicked = false;

/**
 * Initialize onkey listeners
*/
export const setupKeyListener = (canvas: HTMLCanvasElement) => {
    // TODO: use keycode here?
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

    window.onkeydown = setKeyState(!!1);
    window.onkeyup = setKeyState(!!0);

    canvas.onpointerdown = () => (Keys.clicked = justClicked = true);
    canvas.onpointerup = () => Keys.clicked = false;
    canvas.onpointermove = e => {
        Keys.ptrX = e.offsetX / canvas.clientWidth;
        Keys.ptrY = e.offsetY / canvas.clientHeight;
    };

    canvas.ontouchstart = canvas.ontouchmove = canvas.ontouchend = canvas.ontouchcancel = e => {
        e.preventDefault();
        Keys.clicked = justClicked = e.touches.length > 0;
        if (Keys.clicked) {
            const offset = canvas.getBoundingClientRect();
            Keys.ptrX = (e.touches[0].clientX - offset.left) / canvas.clientWidth;
            // offset.top is not needed since canvas is always stuck to top
            Keys.ptrY = e.touches[0].clientY / canvas.clientHeight;
        }
    };

    document.addEventListener('pointerlockchange', () => {
        Keys.pointerLocked = document.pointerLockElement === canvas;
    });
    canvas.onmousemove = (e) => {
        Keys.ptrX = e.offsetX / canvas.clientWidth;
        Keys.ptrY = e.offsetY / canvas.clientHeight;
    };
};

export const inputPressCheck = () => {
    if (justClicked) {
        justClicked = false;
        Keys.justClicked = true;
    } else {
        Keys.justClicked = false;
    }
};
