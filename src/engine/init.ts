import {
    GAME_WIDTH,
    GAME_HEIGHT,
    CANVAS,
    WIDTH,
    HEIGHT,
    STYLE,
    deviceScaleRatio,
    getById
} from './globals';
import { setupKeyListener } from './input';

onresize = () => {
    const ratio = deviceScaleRatio();
    CANVAS[STYLE][WIDTH] = GAME_WIDTH * ratio + 'px';
    CANVAS[STYLE][HEIGHT] = GAME_HEIGHT * ratio + 'px';
    // display note if device is in potrait
    getById('d').style.display = innerWidth < innerHeight ? 'block' : 'none';
};

CANVAS[WIDTH] = GAME_WIDTH;
CANVAS[HEIGHT] = GAME_HEIGHT;

onresize();

setupKeyListener();

console.log('INITIALIZING');

import '../debug';
