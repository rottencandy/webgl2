import { startLoop } from './engine/loop';
import { update, render } from './examples/texture-render';

startLoop(update, render);
