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

  let called = { value: false };

  store.subscribe(
    (state, prevState) => {
      called.value = true;
    },
    (state) => state.y,
    false
  );

  store.setState({ x: [3] });
  expect(called.value).toBe(false);

  store.setState({ y: "wow" });
  expect(called.value).toBe(true);

  expect(() => {
    // @ts-expect-error: should not be able to mutate state because it is readonly
    store.getState().x = 3;
  }).toThrowError(/^.*$/);
});

test("subscribeWithSelector with SimpleStore should not result in type error because SimpleStore's subscribe is same as ObjectStore's", () => {
  const store = subscribeWithSelector(createSimpleStore<string>("Hello"));
});
