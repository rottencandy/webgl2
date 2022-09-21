type Callback = (arg: any) => void;

const CALLBACKS: { [event: number]: Callback[] } = {};

export const enable = (event: number, callback: Callback) => {
    CALLBACKS[event] = CALLBACKS[event] || [];
    CALLBACKS[event].push(callback);
}

export const disable = (event: number, callback: Callback) => {
    const fns = CALLBACKS[event];
    fns && fns.filter(fn => fn != callback);
}

export const emit = (event: number, arg: any) => {
    const fns = CALLBACKS[event];
    fns && fns.forEach(fn => fn(arg));
}
