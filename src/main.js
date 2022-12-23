import { startLoop } from './engine/loop';
import { update, render } from './examples/grid';

startLoop(update, render);
