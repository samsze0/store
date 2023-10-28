# `store`

A zustand-like state management solution.

**Comparision with [Zustand](https://github.com/pmndrs/zustand)**:
- Safer. States are runtime immutable as they are freezed with `Object.freeze`.
- Support any state types. Zustand assumes state is an object.
- Addition of `DeriveStore` which creates a store that derives its state from any number of other stores.

## Usage

**`ObjectStore`** (similar to Zustand-store)

```typescript
const counterStore = createObjectStore<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const count = useStore(
    counterStore,
    (s) => s.count
  );
  return (
    <div>
      count: {count}
    </div>
  );
}
```

**`SimpleStore`** (similar to Jotai atom)

```typescript
const store = createSimpleStore("Hello");

store.setState("Hello");
```

**`DeriveStore`** (similar to Jotai derive atom, but work with stores too)

```typescript
const depStore1 = create<{
  value: number[];
}>(() => ({
  value: [1],
}));

const depStore2 = create<{
  value: number[];
}>(() => ({
  value: [2],
}));

const deriveStore = derive<string, [typeof depStore1, typeof depStore2]>(
  [depStore1, depStore2],
  ([dep1, dep2], prevDeps, prevState) => {
    return `${dep1} ${dep2}`;
  }
);
```

## TODO

- More tests e.g. with SSR
- Middlewares support (immer, persist)
- `MutableStore` (similar to Valtio)
