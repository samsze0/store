import { expect, test } from "vitest";
import { createObjectStore, createSimpleStore } from "../src";

test("ObjectStore", () => {
  const store = createObjectStore<{
    x: number[];
    y: string;
  }>(() => ({
    x: [1],
    y: "testing",
  }));

  store.setState({ x: [2] });
  expect(store.getState()).toStrictEqual({
    x: [2],
    y: "testing",
  });

  let called = { value: false };
  store.subscribe((state, prevState) => {
    called.value = true;
  });

  store.setState({ x: [3] });

  expect(() => {
    // @ts-expect-error: should not be able to mutate state because it is readonly
    store.getState().x = 3;
  }).toThrowError(/^.*$/);
});

test("SimpleStore", () => {
  const store = createSimpleStore("Hello");

  store.setState("Hello");
  expect(store.getState()).toBe("Hello");

  let called = { value: false };
  store.subscribe((state, prevState) => {
    called.value = true;
  });

  store.setState("World");
});
