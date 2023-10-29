import { expect, test } from "vitest";
import {
  createObjectStore,
  createSimpleStore,
  subscribeWithSelector,
} from "../../src";

test("subscribeWithSelector with ObjectStore", () => {
  const store = subscribeWithSelector(
    createObjectStore({
      x: [1],
      y: "testing",
    })
  );

  store.setState({ x: [2] });
  expect(store.getState()).toStrictEqual({
    x: [2],
    y: "testing",
  });

  let callCount = { value: 0 };

  const unsubscriber = store.subscribe(
    (state, prevState) => {
      callCount.value++;
    },
    (state) => state.y,
    false
  );

  store.setState({ x: [3] });
  expect(callCount.value).toBe(0);

  store.setState({ y: "wow" });
  expect(callCount.value).toBe(1);

  expect(() => {
    // @ts-expect-error: should not be able to mutate state because it is readonly
    store.getState().x = 3;
  }).toThrowError(/^.*$/);

  unsubscriber();

  store.setState({ y: "wow wow" });
  expect(callCount.value).toBe(1);
});

test("subscribeWithSelector with SimpleStore should not result in type error because SimpleStore's subscribe is same as ObjectStore's", () => {
  const store = subscribeWithSelector(createSimpleStore<string>("Hello"));
});
