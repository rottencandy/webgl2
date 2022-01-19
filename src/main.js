import { startLoop } from './engine/loop';
import { update, render } from './examples/lightning';

startLoop(update, render);
