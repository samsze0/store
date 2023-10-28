import { useEffect } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { createObjectStore, useStore } from "../../src";

const consoleError = console.error;
afterEach(() => {
  console.error = consoleError;
});

type CounterState = {
  count: number;
  inc: () => void;
};

it("useStore", async () => {
  const counterStore = createObjectStore<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }));

  function Counter() {
    const { count, inc } = useStore(counterStore);
    useEffect(inc, [inc]);
    return <div>count: {count}</div>;
  }

  const { findByText } = render(
    <>
      <Counter />
    </>
  );

  await findByText("count: 1");
});

it("useStore with selectors", async () => {
  const counterStore = createObjectStore<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }));

  function Counter() {
    const count = useStore(counterStore, (s) => s.count);
    const inc = useStore(counterStore, (s) => s.inc);
    useEffect(inc as () => void, [inc]);
    return <div>count: {count}</div>;
  }

  const { findByText } = render(
    <>
      <Counter />
    </>
  );

  await findByText("count: 1");
});

it("useStore with selector and equality checker", async () => {
  const counterStore = createObjectStore<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }));

  let renderCount = 0;

  function Counter() {
    // Skip re-render if count === 1.
    const count = useStore(
      counterStore,
      (s) => s.count,
      function (a, b) {
        return b === 1;
      }
    );
    return (
      <div>
        renderCount: {++renderCount}, count: {count}
      </div>
    );
  }

  const { findByText } = render(
    <>
      <Counter />
    </>
  );

  await findByText("renderCount: 1, count: 0");

  // This will not cause a re-render.
  act(() => counterStore.setState({ count: 1 }));
  await findByText("renderCount: 1, count: 0");

  // This will cause a re-render.
  act(() => counterStore.setState({ count: 2 }));
  await findByText("renderCount: 2, count: 2");
});

it("component re-renders only if selected state has changed", async () => {
  const counterStore = createObjectStore<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }));

  let renderCount = 0;

  function Counter() {
    const count = useStore(counterStore, (s) => s.count);
    renderCount++;
    return <div>count: {count}</div>;
  }

  let buttonRenderCount = 0;

  function Control() {
    const inc = useStore(counterStore, (s) => s.inc);
    buttonRenderCount++;
    return <button onClick={inc}>button</button>;
  }

  const { getByText, findByText } = render(
    <>
      <Counter />
      <Control />
    </>
  );

  fireEvent.click(getByText("button"));

  await findByText("count: 1");

  expect(renderCount).toBe(2);
  expect(buttonRenderCount).toBe(1);
});
