import { ObjectStore } from "..";
import { Overwrite, Store } from "../shared";

/**
 * The type of error thrown when an error is encountered during operations of `StoreMapError`.
 */
export class StoreGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreGraphError";
  }
}

/**
 * A proxy of a store.
 */
interface Node<T extends Store> {
  /**
   * Proxied `getState` function
   */
  getState: T["getState"];
  /**
   * Proxied `setState` function
   */
  setState: T["setState"];
  /**
   * Proxied `subscribe` function
   */
  subscribe: T["subscribe"];
}

interface Nodes<K, V>
  extends Overwrite<
    Map<K, V>,
    {
      /**
       * @returns A `Node` object, which is a proxy of the store.
       */
      get(key: K): V | undefined;
      /**
       * Set a node in the graph.
       * @returns `true` if a node is overwritten, `false` otherwise.
       */
      set(key: K, store: V): boolean;
      /**
       * Remove a node in the graph.
       * @returns `true` if a node is removed, `false` otherwise.
       */
      delete(key: K): boolean;
      /**
       * Remove all nodes in the graph.
       */
      clear(): void;
    }
  > {}

/**
 * A data structure suited for describing a graph of stores.
 */
export class StoreGraph<K extends any, V extends Store> {
  /**
   * @protected The underlying data structure of the graph.
   */
  protected _nodes: Map<K, V>;
  /**
   * A proxy of the underlying data structure of the graph.
   */
  public nodes: Nodes<K, Node<V>>;

  constructor() {
    this._nodes = new Map();

    const createNodeProxy = this.createNodeProxy.bind(this);

    this.nodes = new Proxy(this._nodes, {
      get(target, prop, receiver) {
        const get = Reflect.get(target, "get", receiver);
        const del = Reflect.get(target, "del", receiver);
        const set = Reflect.get(target, "set", receiver);
        const values = Reflect.get(target, "values", receiver);
        const clear = Reflect.get(target, "clear", receiver);
        const forEach = Reflect.get(target, "forEach", receiver);
        const has = Reflect.get(target, "has", receiver);
        const keys = Reflect.get(target, "keys", receiver);
        const entries = Reflect.get(target, "entries", receiver);
        const size = () => Reflect.get(target, "size", receiver);

        switch (prop) {
          case "get":
            return function (key: K): Node<V> | undefined {
              const store = get(key);

              if (!store) return undefined;

              return createNodeProxy(store);
            };
          case "set":
            return function (key: K, store: V): boolean {
              let overwriten: boolean = false;
              const existingStore = get(key);

              if (existingStore) {
                existingStore.destroy?.();
                overwriten = true;
              }

              set(key, store);
              return overwriten;
            };
          case "delete":
            return function (key: K): boolean {
              const existingStore = get(key);

              if (existingStore) {
                existingStore.destroy?.();
                del(key);
                return true;
              }

              return false;
            };
          case "clear":
            return function (): void {
              for (const store of values()) {
                store.destroy?.();
              }

              clear();
            };
          default:
            return Reflect.get(target, prop, receiver);
        }
      },
    }) as unknown as Nodes<K, V>;
  }

  /**
   * Create a `Node` object as a proxy of the store.
   */
  private createNodeProxy(store: V): Node<V> {
    return new Proxy(store, {
      get(target, prop, receiver) {
        switch (prop) {
          case "getState":
            return function (...args: Parameters<V["getState"]>) {
              return Reflect.get(target, prop, receiver)(...args);
            };
          case "setState":
            return function (...args: Parameters<V["setState"]>) {
              return Reflect.get(target, prop, receiver)(...args);
            };
          case "subscribe":
            return function (...args: Parameters<V["subscribe"]>): V {
              return Reflect.get(target, prop, receiver)(...args);
            };
          default:
            throw new StoreGraphError(
              `Cannot access property ${String(prop)} of node object`
            );
        }
      },
    });
  }
}