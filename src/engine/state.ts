type StateObject = {
    [key: string]: (...args: any[]) => string
};

/**
 * Create linear state machine.
 * Initial state is always first function.
 *
 * @param states - Array of state functions, each optionally returning the next state.
 *
 * @example
 * const step = createSM({
 *   IDLE: () => {},
 *   MOVE: () => {}
 * });
 *
 * @returns `run_`: Step function, returns last run state.
 * Any args will be passed on to state function.
 * `reset_`: reset state to given key.
 */
export const createStateMachine = (states: StateObject, initial: string) => {
    let state = initial;
    return {
        run_: (...data: any[]) => {
            const next = states[state](...data);
            state = next === undefined ? state : next;
            return state;
        },
        reset_: (x: string) => state = x,
    };
}
