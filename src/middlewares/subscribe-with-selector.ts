import { ObjectStore, ObjectStoreSubscribeListener } from "../vanilla";
import {
  GetStoreState,
  Overwrite,
  Store,
  equalityCheck,
  shallowEqual,
} from "../shared";

/**
 * The type of the `subscribe` function of the store returned/mutated by the `subscribeWithSelector` middleware.
 * - Overload1: The selector function is undefined and the `partial` field is undefined.
 * - Overload2: The selector function is defined and the `partial` field is true.
 * - Overload3: The selector function is defined and the `partial` field is false.
 * @param State The type of the state of the input store
 */
type Subscribe<State> = {
  (
    listener: ObjectStoreSubscribeListener<State>,
    selector?: undefined,
    partial?: undefined
  ): void;

  <V extends Partial<State>>(
    listener: ObjectStoreSubscribeListener<V>,
    selector: (state: State) => V,
    partial: true
  ): void;

  <V extends State[keyof State]>(
    listener: ObjectStoreSubscribeListener<V>,
    selector: (state: State) => V,
    partial: false
  ): void;
};

export type { Subscribe as SubscribeWithSelectorSubscribe };

/**
 * A middleware that modifies the `subscribe` function of a `Store` to accept a selector function and a `partial` boolean field as additional arguments.
 * The `Store` is required to have a `subscribe` function of the signature: `(listener: ObjectStoreSubscribeListener<T>) => ObjectStoreUnsubscriber`.
 * This middleware is intended for `ObjectStore` only, but any `Store` that satisfies the requirement can be used without errors too.
 * The selector function may be used to select a slice or a partial of the state to subscribe to.
 * @param store An `ObjectStore`with an unmodified `subscribe` function .
 * @returns The store with `subscribe` overwritten.
 */
export const subscribeWithSelector = <
  T extends Overwrite<Store, Pick<ObjectStore<any>, "subscribe">>
>(
  store: T
): Overwrite<
  T,
  {
    /**
     * A subscribe function with a selector function and a `partial` boolean field as additional arguments.
     * @param listener A function that will be called when the subscribed state changes.
     * @param selector A function that selects a slice or a partial of the state to subscribe to.
     * @param partial A boolean field that indicates whether the selector function selects a partial of the state or a slice of the state.
     * The field is used to determine how to equality checks should be performed, which in turn governs when the `listener` function will be triggered.
     * - If `partial` is `false` or `undefined`, `Object.is` will be used to check for equality between states.
     * - If `partial` is `true`, a 1-layer-deep `Object.is` will be used to check for equality between states.
     * @returns void
     */
    subscribe: Subscribe<GetStoreState<T>>;
  }
> => {
  return new Proxy(store, {
    get(target, prop, receiver) {
      switch (prop) {
        case "subscribe":
          // FIX: add TS typing
          return function (listener: any, selector: any, partial: any) {
            const subscribe = Reflect.get(target, prop, receiver);

            /**
             * A listener that only reacts to changes when the selection has changed.
             */
            const selectionListener: ObjectStoreSubscribeListener<
              GetStoreState<T>
            > = (state, prevState) => {
              if (!selector) {
                listener(state, prevState);
                return;
              }

              const slice = selector(state);
              const prevSlice = selector(prevState);

              const sliceHasChanged: boolean = partial
                ? !shallowEqual(slice, prevSlice)
                : !equalityCheck(slice, prevSlice);

              if (sliceHasChanged) listener(slice, prevSlice);
              return;
            };

            subscribe(selectionListener);
          };
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
  });
};
