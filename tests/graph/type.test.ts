import { test } from "vitest";
import { ObjectStore, StoreGraph } from "../../src";

test("graph", () => {
  let graph = new StoreGraph<
    string,
    ObjectStore<{
      x: string;
      y: number;
    }>
  >();
  graph.nodes.get("a")?.getState();
});
