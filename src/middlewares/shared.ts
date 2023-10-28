import { AnyFunction, Store } from "../shared";

// https://stackoverflow.com/questions/50602903/how-to-use-proxyt-with-a-different-type-than-t-as-argument
// declare global {
//   interface ProxyConstructor {
//     new <TSource extends object, TTarget extends object>(
//       target: TSource,
//       handler: ProxyHandler<TSource>
//     ): TTarget;
//   }
// }

/**
 * A type function that helps construct the type of the proxy trap
 * @param T The type of the store
 * @param Func Name of the function to trap e.g. `subscribe`
 * @param ReturnType The return type of the proxy trap
 * @deprecated
 */
export type StoreTrap<T extends Store, Func extends keyof T, ReturnType> = (
  ...params: T[Func] extends AnyFunction ? Parameters<T[Func]> : never
) => ReturnType;
