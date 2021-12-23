import { F32 } from './globals';

export const Plane = (s: number) => F32([
    0, 0,
    0, s,
    s, s,
    0, 0,
    s, s,
    s, 0,
]);
