import { test } from "vitest";
import { createObjectStore as createStore, derive } from "../src";

test("derive", () => {
  const depStore1 = createStore<{
    value: number[];
  }>(() => ({
    value: [1],
  }));

  const depStore2 = createStore<{
    value: number[];
  }>(() => ({
    value: [2],
  }));

  type State = {
    deps: [number[], number[]];
    prevDeps: [number[], number[]] | null;
  };

  const deriveStore = derive<State, [typeof depStore1, typeof depStore2]>(
    [depStore1, depStore2],
    ([dep1, dep2], prevDeps, prevState) => {
      // @ts-expect-error: prevDeps could be null
      prevDeps[0];
      // @ts-expect-error: prevState could be null
      prevState[0];

      dep1.value["length"];
      dep2.value["length"];
      prevDeps?.[0]?.value["length"];
      prevDeps?.[1]?.value["length"];
      prevState?.deps[0]?.["length"];
      prevState?.deps[1]?.["length"];

      return {
        deps: [dep1.value, dep2.value],
        prevDeps: prevDeps ? [prevDeps[0].value, prevDeps[1].value] : null,
      };
    }
  );

  deriveStore.subscribe((state, prevState) => {
    // @ts-expect-error: prevDeps could be null
    prevState.deps[0];

    state.deps[0];
  });
});
