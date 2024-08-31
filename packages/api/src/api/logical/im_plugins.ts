/**
 * 拦截器逻辑
 */
export interface NimInterceptorApi {
  // request: InterceptorManagerApi<[string, Record<string, any>]>;
  request: InterceptorManagerApi<[string, any]>;
  response: InterceptorManagerApi<[string, any, any]>;
}

export type Fullfilled<T> = (config: T) => Promise<T>;
export type Ejected<U, T> = (response: { error: U; rest: T }) => Promise<T>;

export type HandlerApi<T> = {
  fullfilled: Fullfilled<T>;
  _id: string;
} | null;

export interface InterceptorManagerApi<T> {
  handlers: HandlerApi<T>[] | null[];

  //   添加拦截器
  use(fulfilled: Fullfilled<T>): string;

  //   删除拦截器
  eject(id: string): void;

  getHandlers(): HandlerApi<T>[];

  excute(promise: Promise<T>): Promise<T>;
}
