import { useDebugValue, useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { Store } from ".";

export type StoreSelector<T, V> = (state: Readonly<T>) => V;

export function useStore<T>(api: Store<T>): Readonly<T>;
export function useStore<T, V>(
  store: Store<T>,
  selector: StoreSelector<T, V>,
  equalityFn?: (a: V, b: V) => boolean
): V;
export function useStore<T, V>(
  store: Store<T>,
  selector?: StoreSelector<T, V>,
  equalityFn?: (a: V, b: V) => boolean
): Readonly<T> | V {
  if (selector) {
    // https://react.dev/reference/react/useSyncExternalStore
    // https://github.com/facebook/react/blob/main/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
    const slice = useSyncExternalStoreWithSelector(
      store.subscribe,
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
