import { expect, test } from "vitest";
import { createObjectStore as createStore, derive } from "../src";

test("derive", () => {
  const depStore1 = createStore({
    value: [1],
  });

  const depStore2 = createStore({
    value: [2],
  });

  type State = {
    deps: [number[], number[]];
    prevDeps: [number[], number[]] | null;
  };

  const deriveStore = derive<State, [typeof depStore1, typeof depStore2]>(
    [depStore1, depStore2],
    ([dep1, dep2], prevDeps, prevState) => {
      return {
        deps: [dep1.value, dep2.value],
        prevDeps: prevDeps ? [prevDeps[0].value, prevDeps[1].value] : null,
      };
    }
  );

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[1], [2]],
    prevDeps: null,
  });

  depStore1.setState({ value: [3] });
  expect(deriveStore.getState()).toStrictEqual({
    deps: [[3], [2]],
    prevDeps: [[1], [2]],
  });

  depStore2.setState({ value: [4] });
  expect(deriveStore.getState()).toStrictEqual({
    deps: [[3], [4]],
    prevDeps: [[3], [2]],
  });
});

test("derive async", async () => {
  const depStore1 = createStore({
    value: [1],
  });

  const depStore2 = createStore({
    value: [2],
  });

  type State = {
    deps: [number[], number[]] | null;
    prevDeps: [number[], number[]] | null;
    loading: boolean;
  };

  const deriveStore = derive<State, [typeof depStore1, typeof depStore2]>(
    [depStore1, depStore2],
    ([dep1, dep2], prevDeps, prevState, set) => {
      Promise.resolve().then(() => {
        set({
          deps: [dep1.value, dep2.value],
          prevDeps: prevDeps ? [prevDeps[0].value, prevDeps[1].value] : null,
          loading: false,
        });
      });
      return {
        deps: prevState?.deps ?? null,
        prevDeps: prevState?.prevDeps ?? null,
        loading: true,
      };
    }
  );

  expect(deriveStore.getState()).toStrictEqual({
    deps: null,
    prevDeps: null,
    loading: true,
  });

  await 1;

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[1], [2]],
    prevDeps: null,
    loading: false,
  });

  depStore1.setState({ value: [3] });

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[1], [2]],
    prevDeps: null,
    loading: true,
  });

  await 1;

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[3], [2]],
    prevDeps: [[1], [2]],
    loading: false,
  });

  depStore2.setState({ value: [4] });

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[3], [2]],
    prevDeps: [[1], [2]],
    loading: true,
  });

  await 1;

  expect(deriveStore.getState()).toStrictEqual({
    deps: [[3], [4]],
    prevDeps: [[3], [2]],
    loading: false,
  });
});
