import { test } from "vitest";
import { SubscribeWithSelectorSubscribe } from "../../src/middlewares/subscribe-with-selector";

test("SubscribeWithSelectorSubscribe", () => {
  let subscribe = undefined as unknown as SubscribeWithSelectorSubscribe<{
    hello: string;
  }>;

  subscribe(
    (state, prevState) => {
      // @ts-expect-error: `state` should be the type of `state.hello`
      state.hello;
      // @ts-expect-error: `prevState` should be the type of `state.hello`
      state.prevState;
    },
    (state) => state.hello,
    false
  );

  // @ts-expect-error: should not be able to select a slice when `partial` is true
  subscribe(
    (state, prevState) => {},
    (state) => state.hello,
    true
  );

  // @ts-expect-error: should not be able to select a partial when `partial` is false
  subscribe(
    (state, prevState) => {},
    (state) => ({ ...state }),
    false
  );
});
