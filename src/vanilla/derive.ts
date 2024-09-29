import { GetStoresStates, Overwrite, SetStateError, Store } from "../shared";
import {
  ObjectStore,
  ObjectStoreUnsubscriber,
  SimpleStore,
  createObjectStore,
} from "./immutable";

/**
 * A store that derives its state from other zustand stores. An internal `ObjectStore` is used to facilitate this custom store implementation.
 * @param stores The input stores. Input stores are required to have a `subscribe` function with a specific signature - `(listener: (state, prevState) => void)`
 * @param onChange A function thast takes the state of the input stores and returns the derived state.
 * `onChanged` is called whenever any of the input stores change, and when the derived store is first created.
 *
 * @returns A `Store`. Typescript can infer if the derived store is a `SimpleStore` or an `ObjectStore`. But it can always be asserted with `as`.
 */
export const derive = <
  T,
  Stores extends Overwrite<Store, Pick<ObjectStore<any>, "subscribe">>[],
  // FIX: make this type arg optional
  DepsState extends GetStoresStates<Stores> = GetStoresStates<Stores>
>(
  stores: Stores,
  onChange: (
    depsState: DepsState,
    prevDepsState: DepsState | null,
    prevState: T | null,
    set: (state: T) => void
  ) => T
): Overwrite<
  SimpleStore<T> | ObjectStore<T>,
  {
    subscribe: (
      listener: (state: T, prevState: T | null) => void
    ) => ObjectStoreUnsubscriber;
    destroy: () => void;
  }
> => {
  type Listener = (state: T, prevState: T | null) => void;

  /**
   * The initial states of the input stores
   */
  // @ts-ignore
  const initialDepsState = stores.map((store) => store.getState()) as DepsState;

  const store = createObjectStore<{
    /**
     * Set of listeners of the derived store
     */
    listeners: Set<Listener>;
    /**
     * The states of the input stores
     */
    depsState: DepsState;
    /**
     * The previous states of the input stores, as a whole, not individually.
     * i.e. The previous state of the states of the input stores.
     */
    prevDepsState: DepsState | null;
    /**
     * The derived state
     */
    state: T;
    /**
     * The previous derived state
     */
    prevState: T | null;
    /**
     * The unsubscribe handlers of the input stores
     */
    depsSubs: (() => void)[];
  }>({
    listeners: new Set(),
    depsState: initialDepsState,
    prevDepsState: null,
    // @ts-ignore
    state: null,
    prevState: null,
    depsSubs: [],
  });

  const setState = (newState: T) => {
    const prevState = store.getState().state;

    store.setState({
      state: newState,
      prevState: prevState,
    });

    store
      .getState()
      .listeners.forEach((listener) => listener(newState, prevState));
  };

  store.setState({
    state: onChange(initialDepsState, null, null, setState),
  });

  const depsSubs = stores.map((depStore, index) =>
    depStore.subscribe((depState, prevDepState) => {
      const currentDepsState = store.getState().depsState;

      // Immer's pitfall with circular trees
      // https://immerjs.github.io/immer/pitfalls/#immer-only-supports-unidirectional-trees

      const newDepsState: DepsState = [...currentDepsState];
      newDepsState[index as keyof DepsState] = depState;

      const prevState = store.getState().state;

      const newState = onChange(
        newDepsState,
        currentDepsState,
        prevState,
        setState
      );

      store.setState({
        prevDepsState: currentDepsState,
        depsState: newDepsState,
        prevState: prevState,
        state: newState,
      });

      store
        .getState()
        .listeners.forEach((listener) => listener(newState, prevState));
    })
  );

  store.setState({ depsSubs });

  return {
    getState: () => store.getState().state,
    subscribe: (listener: Listener) => {
      const newListeners = new Set([...store.getState().listeners, listener]);

      store.setState({
        listeners: newListeners,
      });

      return () => {
        const listeners = store.getState().listeners;
        listeners.delete(listener);
        store.setState({
          listeners,
        });
      };
    },
    setState: () => {
      throw new SetStateError("`setState` is not available in derived store");
    },
    destroy: () => {
      store.getState().depsSubs.forEach((unsub) => unsub());
    },
  };
};
