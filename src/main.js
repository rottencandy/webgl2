import { startLoop } from './engine/loop';
import { update, render } from './examples/raymarch-tex';

startLoop(update, render);
