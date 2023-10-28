/**
 * The type of the listener function. It is called when the state changes.
 */
export type Listener<T> = (state: T, prevState: T) => void;

/**
 * The type of the subscribe handler. It unsubscribes from the store when called.
 */
export type Unsubscriber = () => void;

/**
 * The type of the a Store.
 */
export type Store<T> = ObjectStore<T> | SimpleStore<T>;

/**
 * The type of error thrown when an error is encountered during `setState`.
 * Possible causes:
 * - The input to the `setState` function returns the same object as the previous state.
 */
export class SetStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetStateError";
  }
}

/**
 * The type of the `setState` function of an `ObjectStore`.
 * It returns `void`.
 * It can accept a partial state or the full state as argument.
 * It can also accept a function that returns a partial state or the full state as the argument.
 */
export type SetStateForObjectStore<T> = (
  partial:
    | Readonly<T | Partial<T>>
    | ((prevState: Readonly<T>) => Readonly<T | Partial<T>>)
) => void;

/**
 * The type of the an `ObjectStore`. Use `ObjectStore` if you want a Zustand-like store.
 */
export interface ObjectStore<T> {
  setState: SetStateForObjectStore<T>;
  getState: () => Readonly<T>;
  subscribe: (listener: Listener<T>) => Unsubscriber;
}

/**
 * The type of the argument to the `createObjectStore` function.
 * It can be a state or a function that returns a state. This state will be used as the initial state of the store.
 * The function can accept the `setState` and `getState` functions as arguments.
 */
export type InitialStateForObjectStore<T> =
  | Readonly<T>
  | ((
      set: ObjectStore<T>["setState"],
      get: ObjectStore<T>["getState"]
    ) => Readonly<T>);

/**
 * Creates an `ObjectStore` with the given initial state. Use `ObjectStore` if you want a Zustand-like store.
 * @param initialState A state or a function that returns a state.
 * @returns An `ObjectStore` with APIs including `setState`, `getState`, and `subscribe`.
 */
export const createObjectStore = <T>(
  initialState: InitialStateForObjectStore<T>
): ObjectStore<T> => {
  let state: Readonly<T>;
  const listeners: Set<Listener<T>> = new Set();

  const getState: ObjectStore<T>["getState"] = () => state;

  const setState: ObjectStore<T>["setState"] = (partial) => {
    const nextState: Readonly<T | Partial<T>> =
      typeof partial === "function"
        ? // TODO: Remove type assertion once https://github.com/microsoft/TypeScript/issues/37663 is resolved
          (partial as (state: T) => Readonly<T | Partial<T>>)(state)
        : partial;

    if (Object.is(nextState, state))
      throw new SetStateError(
        "The input to the setState function must return a different Object. This is to prevent accidental mutation behaviour hence is not allowed."
      );

    const previousState = state;
    state = Object.freeze(Object.assign({}, state, nextState));

    listeners.forEach((listener) => listener(state, previousState));
  };

  const subscribe: ObjectStore<T>["subscribe"] = (listener) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  state =
    typeof initialState === "function"
      ? (
          initialState as (
            set: ObjectStore<T>["setState"],
            get: ObjectStore<T>["getState"]
          ) => Readonly<T>
        )(setState, getState)
      : (initialState as Readonly<T>);
  state = Object.freeze(state);

  return {
    getState,
    setState,
    subscribe,
  };
};

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
  setState: SetStateForSimpleStore<T>;
  getState: () => ReadonlyIfIsObject<T>;
  subscribe: (listener: Listener<T>) => Unsubscriber;
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
  const listeners: Set<Listener<T>> = new Set();

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

    const previousState = state;
    state = nextState;
    try {
      Object.getPrototypeOf(initialState);
      state = Object.freeze(state) as ReadonlyIfIsObject<T>;
    } catch {}

    listeners.forEach((listener) => listener(state, previousState));
  };

  const subscribe: ObjectStore<T>["subscribe"] = (listener) => {
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
