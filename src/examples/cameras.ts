import Camera from '../engine/cam';

export const FPSCamera = () => {
    const cam = Camera(radians(45), 1, 500, 400 / 300)
        .moveTo(20, 20, 20)
        .recalculate();
};
