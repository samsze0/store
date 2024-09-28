# `store`

A zustand-like state management solution.

**Comparision with [Zustand](https://github.com/pmndrs/zustand)**:

- Support any state types. Zustand assumes state is an object.
- Addition of `DeriveStore` which creates a store that derives its state from any number of other stores.
- Middlewares are implemented using JS proxy.
- No cryptic TS typings in source code.

## Usage

```shell
npm i @artizon/store
```

**`ObjectStore`** (similar to Zustand-store)

```typescript
const counterStore = createObjectStore<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

// Argument to `create*Store` function can be a plain object too
const anotherStore = createObjectStore<{ x: number }>({ x: 3 });

function Counter() {
  const count = useStore(counterStore, (s) => s.count);
  return <div>count: {count}</div>;
}
```

**`SimpleStore`** (similar to Jotai atom)

```typescript
const store = createSimpleStore("Hello");

store.setState("Hello");
```

**`DeriveStore`** (similar to Jotai derive atom, but work with stores too)

```typescript
const depStore1 = createObjectStore({
  value: [1],
});

const depStore2 = createObjecStore({
  value: [2],
});

// Working on removing the need to specify types of stores as the second type arg
const deriveStore = derive<string, [typeof depStore1, typeof depStore2]>(
  [depStore1, depStore2],
  ([dep1, dep2], prevDeps, prevState) => {
    return `${dep1} ${dep2}`;
  }
);
```

**Middleware**

```typescript
const store = subscribeWithSelector(
  createObjectStore({
    x: [1],
    y: "testing",
  })
);

// Select a slice (a property of the state)
store.subscribe(
  (state, prevState) => {
    // ...
  },
  (state) => state.y,
  false // partial?
);

// Select a partial (subset of the state)
store.subscribe(
  (state, prevState) => {
    // ...
  },
  (state) => {
    y: state.y;
  },
  true // partial?
);

// Can be used as normal `subscribe` too
store.subscribe((state, prevState) => {
  // ...
});
```

## Middleware System - Design Decision

It seems like the majority of the complexity of Zustand comes from its middleware system. The challenge of creating such a middleware system is that the `Store` (i.e. `StoreApi` in Zustand terms) interface changes dynamically as middlewares are added to the store. For instance, when the `subscribeWithSelector` middleware is added to the store, the `subscribe` function takes a "selector" as an additional argument. In order to get type support for this behaviour, a lot of TS tricks are used.

This library's middleware system is facilited by JS Proxy. Each middleware must specify what `Store` interface it can accept as the input. For instance, the `subscribeWithSelector` middleware requires the input store to extends:

```typescript
export type ObjectStoreSubscribeListener<T> = (state: T, prevState: T) => void;

export type ObjectStoreUnsubscriber = () => void;

interface Store {
  readonly setState: AnyFunction;
  readonly getState: AnyFunction;
  readonly subscribe: (
    listener: ObjectStoreSubscribeListener<T>
  ) => ObjectStoreUnsubscriber;
}
```

This is because the `subscribeWithSelector` middleware will "hijack" the `subscribe` function of the input store and hence it expects it to be in a particular form.

Middleware must also specify the type of the store after its mutation. For instance, the output type of the `subscribeWithSelector` middleware will be:

```typescript
/**
 * A type function that overwrites the properties of `T` with the properties of `U`.
 */
type Overwrite<T, U> = Omit<T, keyof U> & U;

type OutputStore = Overwrite<
  InputStore,
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
    subscribe: CustomSubscribeFunction;
  }
```

## License

MIT
