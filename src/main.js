import { startLoop } from './engine/loop';
import { update, render } from './examples/raymarch';

startLoop(update, render);
