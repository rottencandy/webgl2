import { startLoop } from './engine/loop';
import { update, render } from './examples/shadertoy';

startLoop(update, render);
