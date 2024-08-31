import { DispatchTaskRequestContent } from './proxy';

// 拦截器的相关定义

export type AsyncFunc<T> = (args: T) => Promise<T>;

export interface InterceptorParams<T = unknown> {
  namespace?: string;
  type?: 'normal' | 'error';
  resolve: AsyncFunc<T>;
  reject?: AsyncFunc<any>;
}

export type InterceptorFilterCondition = (namepsace: string, type: 'normal' | 'error') => boolean;

export interface InterceptorApi<T = unknown> {
  use(params: InterceptorParams<T>, priority?: 'normal' | 'high'): string;
  eject(interceptorId: string): void;
  excute(params: unknown, filterCondition?: InterceptorFilterCondition): Promise<unknown>;
}

// 拦截器载体实例
export interface AppendInterceptorApi {
  // new (param: Interceptor, ...restArgs: unknown[]): void;
  eject(type?: 'request' | 'response'): void;
}

export interface InterceptorRequestConfig extends DispatchTaskRequestContent {
  seqNo: string;
}

export interface InterceptorResponseConfig {
  data: unknown;
  duration: number[];
  config: InterceptorRequestConfig;
}

// 拦截器载体构造器
export interface AppendInterceptorConstructor {
  new (inteceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]): AppendInterceptorApi;
}
