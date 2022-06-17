import { startLoop } from './engine/loop';
import { update, render } from './examples/raymarch-full';

startLoop(update, render);
