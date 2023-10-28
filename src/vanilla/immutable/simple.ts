import { SetStateError } from "../../shared";

/**
 * The type of the listener function. It is called when the state changes.
 */
export type SimpleStoreSubscribeListener<T> = (state: T, prevState: T) => void;

/**
 * The type of the subscribe handler. It unsubscribes from the store when called.
 */
export type SimpleStoreUnsubscriber = () => void;

export type ReadonlyIfIsObject<T> = T extends Object ? Readonly<T> : T;

/**
 * The type of the setState function of a `SimpleStore`.
 * It returns `void`.
 * It can accept a state as argument.
 * It can also accept a function that returns a state as the argument.
 */
export type SetStateForSimpleStore<T> = (
  state:
    | ReadonlyIfIsObject<T>
    | ((prevState: ReadonlyIfIsObject<T>) => ReadonlyIfIsObject<T>)
) => void;

/**
 * The type of the a `SimpleStore`. Use `SimpleStore` if you want a store that can stores any value.
 */
export interface SimpleStore<T> {
  readonly setState: SetStateForSimpleStore<T>;
  readonly getState: () => ReadonlyIfIsObject<T>;
  readonly subscribe: (
    listener: SimpleStoreSubscribeListener<T>
  ) => SimpleStoreUnsubscriber;
}

/**
 * The type of the argument to the `createSimpleStore` function.
 * Unlike `createObjectStore`, the argument of `createSimpleStore` can only be a state.
 * This state will be used as the initial state of the store.
 */
export type InitialStateForSimpleStore<T> = ReadonlyIfIsObject<T>;

/**
 * Creates an `SimpleStore` with the given initial state. Use `SimpleStore` if you want a store that can stores any value.
 * @param initialState A state.
 * @returns An `SimpleStore` with APIs including `setState`, `getState`, and `subscribe`.
 */
export const createSimpleStore = <T>(
  initialState: InitialStateForSimpleStore<T>
): SimpleStore<T> => {
  let state: ReadonlyIfIsObject<T>;
  /**
   * Whether the state is an Object. This includes Arrays and functions.
   */
  let stateIsObject: boolean;
  const listeners: Set<SimpleStoreSubscribeListener<T>> = new Set();

  const getState: SimpleStore<T>["getState"] = () => state;

  const setState: SimpleStore<T>["setState"] = (s) => {
    const nextState: ReadonlyIfIsObject<T> =
      typeof s === "function"
        ? // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
          (s as (state: ReadonlyIfIsObject<T>) => ReadonlyIfIsObject<T>)(state)
        : (s as ReadonlyIfIsObject<T>);

    if (stateIsObject && Object.is(nextState, state))
      throw new SetStateError(
        "The input to the setState function must return a different Object. This is to prevent accidental mutation behaviour hence is not allowed."
      );

    if (!stateIsObject && nextState === state) return;

    const previousState = state;
    state = nextState;
    try {
      Object.getPrototypeOf(initialState);
      state = Object.freeze(state) as ReadonlyIfIsObject<T>;
    } catch {}

    listeners.forEach((listener) => listener(state, previousState));
  };

  const subscribe: SimpleStore<T>["subscribe"] = (listener) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  state = initialState;
  try {
    Object.getPrototypeOf(initialState);
    state = Object.freeze(state) as ReadonlyIfIsObject<T>;
  } catch {
    stateIsObject = false;
  }

  return {
    getState,
    setState,
    subscribe,
  };
};

export type SimpleStoreCreator = typeof createSimpleStore;
