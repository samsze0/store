import { useDebugValue, useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { Overwrite, Store } from "../shared";
import { ReadonlyIfIsObject } from "..";

export type StoreSelector<T, V> = (state: ReadonlyIfIsObject<T>) => V;

type ReactSyncableStore<T> = Overwrite<
  Store,
  {
    getState: () => ReadonlyIfIsObject<T>;
    subscribe: (
      listener: (state: any, prevState: any) => any,
      ...args: any[]
    ) => any;
  }
>;

/**
 * A React hook that subscribes to a `Store` and returns its state.
 * @param store A `Store` with a `subscribe` function that takes a listener as argument.
 * The listener must take the form `(state, prevState) => any`.
 */
export function useStore<T>(store: ReactSyncableStore<T>): Readonly<T>;
export function useStore<T, V>(
  store: ReactSyncableStore<T>,
  selector: StoreSelector<T, V>,
  equalityFn?: (a: V, b: V) => boolean
): V;
export function useStore<T, V>(
  store: ReactSyncableStore<T>,
  selector?: StoreSelector<T, V>,
  equalityFn?: (a: V, b: V) => boolean
): Readonly<T> | V {
  if (selector) {
    // https://react.dev/reference/react/useSyncExternalStore
    // https://github.com/facebook/react/blob/main/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
    const slice = useSyncExternalStoreWithSelector(
      store.subscribe,
      // FIX: type returned by useStore is any
      store.getState,
      store.getState, // TODO: getServerSnapshot
      selector,
      equalityFn
    );

    useDebugValue(slice);

    return slice;
  } else {
    const state = useSyncExternalStore(
      store.subscribe,
      store.getState,
      store.getState // TODO: getServerSnapshot
    );

    useDebugValue(state);

    return state;
  }
}
