import { ObjectStore, SimpleStore } from "./vanilla";

/**
 * The type of the a Store.
 */
export interface Store {
  readonly setState: AnyFunction;
  readonly getState: AnyFunction;
  readonly subscribe: AnyFunction;
  readonly destroy?: AnyFunction;
  readonly getServerSnapshot?: AnyFunction;
}

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
 * Extract type of a `Store` by retrieving return type of `getState`
 */
export type GetStoreState<T> = T extends Store
  ? ReturnType<T["getState"]>
  : never;

/**
 * Extract the types of an array of `Store`s
 */
export type GetStoresStates<T> = T extends readonly Store[]
  ? T extends [infer Head, ...infer Tail]
    ? readonly [GetStoreState<Head>, ...GetStoresStates<Tail>]
    : readonly []
  : never;

/**
 * A type function that overwrites the properties of `T` with the properties of `U`.
 */
export type Overwrite<T, U> = Omit<T, keyof U> & U;

/**
 * Function with any parameters and any return type.
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * Return true if the two objects are shallowly equal.
 */
export function shallowEqual(a: Object, b: Object): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) return false;

  return Object.entries(a).every(([key, value]) => {
    return (
      b.hasOwnProperty(key) && equalityCheck(value, b[key as keyof typeof b])
    );
  });
}

/**
 * Return true if the two objects are equal. `Object.is` is used for comparison if the input entites are `Object`s, otherwise `===` is used.
 */
export function equalityCheck<T>(a: T, b: T): boolean {
  return typeof a === "object" ? Object.is(a, b) : a === b;
}

/**
 * A type function that returns the tail of a list
 */
export type Tail<L extends any[]> = L extends [infer _, ...infer T] ? T : never;

/**
 * Add a middleware to the store.
 * @param this The store to add the middleware to.
 * @param middlewareArgs The extra arguments to supply to the middleware.
 * @returns The store with the middleware applied.
 */
export function addMiddleware<
  InputStore extends Store,
  OutputStore extends Store,
  MiddlewareArgs extends any[],
  CreateInputStoreArgs extends any[]
>(
  this: (...args: CreateInputStoreArgs) => InputStore,
  middleware: (inputStore: InputStore, ...args: MiddlewareArgs) => OutputStore,
  ...middlewareArgs: MiddlewareArgs
): (...args: CreateInputStoreArgs) => OutputStore {
  const createInputStore = this;
  return (...args: Parameters<typeof createInputStore>) => {
    return middleware(createInputStore(...args), ...middlewareArgs);
  };
}
