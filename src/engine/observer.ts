type Callback = (arg: any) => void;

const CALLBACKS: { [event: number | string]: Callback[] } = {};

export const obsInit = (event: number | string) => {
    CALLBACKS[event] = [];
    return (data: any) => CALLBACKS[event].forEach(fn => fn(data));
};

export const obsEnable = (event: number | string, callback: Callback) => {
    CALLBACKS[event] = CALLBACKS[event] || [];
    CALLBACKS[event].push(callback);
}

export const obsDisable = (event: number | string, callback: Callback) => {
    CALLBACKS[event] = CALLBACKS[event].filter(fn => fn !== callback);
    //CALLBACKS[event].splice(CALLBACKS[event].indexOf(callback));
}

export const obsEmit = (event: number | string, arg: any) => {
    CALLBACKS[event].forEach(fn => fn(arg));
}
