import { startLoop } from './engine/loop';
import { update, render } from './examples/texture';

startLoop(update, render);
