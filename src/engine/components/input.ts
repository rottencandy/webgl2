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
    ptrRelativeOffsetX: number,
    ptrRelativeOffsetY: number,
};

export const Keys: WatchedKeys = {
    left: false,
    right: false,
    up: false,
    down: false,

    space: false,
    esc: false,

    clicked: false,
    justClicked: false,

    pointerLocked: false,
    ptrX: 0,
    ptrY: 0,
    ptrRelativeOffsetX: 0,
    ptrRelativeOffsetY: 0,
};

export const dirKeysPressed = (): boolean => !!(Keys.left || Keys.right || Keys.up || Keys.down);

let justClicked = false;

/**
 * Initialize onkey listeners
*/
export const setupKeyListener = (canvas: HTMLCanvasElement, lockPointer: boolean) => {
    const setKeyState = (value: boolean) => ({ key: code }) => {
        switch (code) {
            case 'ArrowUp':
            case 'w':
            case 'z':
                Keys.up = value;
                break;
            case 'ArrowDown':
            case 's':
                Keys.down = value;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'q':
                Keys.left = value;
                break;
            case 'ArrowRight':
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

    window.onkeydown = setKeyState(true);
    window.onkeyup = setKeyState(false);

    canvas.onpointerdown = () => (Keys.clicked = justClicked = true);
    canvas.onpointerup = () => Keys.clicked = false;
    canvas.onpointermove = e => {
        Keys.ptrX = e.offsetX / canvas.clientWidth;
        Keys.ptrY = e.offsetY / canvas.clientHeight;
        Keys.ptrRelativeOffsetX = e.movementX / 1e3;
        Keys.ptrRelativeOffsetY = e.movementY / 1e3;
    };

    if (lockPointer) {
        canvas.onclick = () => {
            if (!Keys.pointerLocked) {
                canvas.requestPointerLock();
            }
        };
    }

    canvas.ontouchstart = canvas.ontouchmove = canvas.ontouchend = canvas.ontouchcancel = e => {
        e.preventDefault();
        Keys.clicked = justClicked = e.touches.length > 0;
        if (Keys.clicked) {
            const offset = canvas.getBoundingClientRect();
            const ptrX = (e.touches[0].clientX - offset.left) / canvas.clientWidth;
            // offset.top is not needed since canvas is always stuck to top
            const ptrY = e.touches[0].clientY / canvas.clientHeight;

            // TODO: Fix relative offset fetching for touch events
            Keys.ptrRelativeOffsetX = (ptrX - Keys.ptrX) / 1e2;
            Keys.ptrRelativeOffsetY = (ptrY - Keys.ptrY) / 1e2;
            Keys.ptrX = ptrX;
            Keys.ptrY = ptrY;
        }
    };

    document.addEventListener('pointerlockchange', () => {
        Keys.pointerLocked = document.pointerLockElement === canvas;
    });
};

export const CompInput: ((k: WatchedKeys, dt?: number) => void)[] = [];

export const CompInputRun = (dt: number) => {
    for (let i = 0; i < CompInput.length; i++) {
        CompInput[i](Keys, dt);
    }
    Keys.ptrRelativeOffsetX = 0;
    Keys.ptrRelativeOffsetY = 0;
    if (justClicked) {
        justClicked = false;
        Keys.justClicked = true;
    } else {
        Keys.justClicked = false;
    }
};
