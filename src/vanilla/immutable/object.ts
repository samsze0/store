import { SetStateError, addMiddleware } from "../../shared";

/**
 * The type of the listener function. It is called when the state changes.
 */
export type ObjectStoreSubscribeListener<T> = (state: T, prevState: T) => void;

/**
 * The type of the subscribe handler. It unsubscribes from the store when called.
 */
export type ObjectStoreUnsubscriber = () => void;

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
  readonly setState: SetStateForObjectStore<T>;
  readonly getState: () => Readonly<T>;
  readonly subscribe: (
    listener: ObjectStoreSubscribeListener<T>
  ) => ObjectStoreUnsubscriber;
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
export const createObjectStore = Object.assign(
  <T = never>(initialState: InitialStateForObjectStore<T>): ObjectStore<T> => {
    let state: Readonly<T>;
    const listeners: Set<ObjectStoreSubscribeListener<T>> = new Set();

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
  },
  {
    addMiddleware,
  }
);

export type ObjectStoreCreator = typeof createObjectStore;
