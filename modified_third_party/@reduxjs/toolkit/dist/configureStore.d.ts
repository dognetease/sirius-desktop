import type { Reducer, ReducersMapObject, Middleware, Action, AnyAction, StoreEnhancer, Store, Dispatch, PreloadedState, CombinedState } from 'redux';
import type { EnhancerOptions as DevToolsOptions } from './devtoolsExtension';
import type { ThunkMiddlewareFor, CurriedGetDefaultMiddleware } from './getDefaultMiddleware';
import type { DispatchForMiddlewares, NoInfer } from './tsHelpers';
/**
 * Callback function type, to be used in `ConfigureStoreOptions.enhancers`
 *
 * @public
 */
export declare type ConfigureEnhancersCallback = (defaultEnhancers: readonly StoreEnhancer[]) => StoreEnhancer[];
/**
 * Options for `configureStore()`.
 *
 * @public
 */
export interface ConfigureStoreOptions<S = any, A extends Action = AnyAction, M extends Middlewares<S> = Middlewares<S>> {
    /**
     * A single reducer function that will be used as the root reducer, or an
     * object of slice reducers that will be passed to `combineReducers()`.
     */
    reducer: Reducer<S, A> | ReducersMapObject<S, A>;
    /**
     * An array of Redux middleware to install. If not supplied, defaults to
     * the set of middleware returned by `getDefaultMiddleware()`.
     */
    middleware?: ((getDefaultMiddleware: CurriedGetDefaultMiddleware<S>) => M) | M;
    /**
     * Whether to enable Redux DevTools integration. Defaults to `true`.
     *
     * Additional configuration can be done by passing Redux DevTools options
     */
    devTools?: boolean | DevToolsOptions;
    /**
     * The initial state, same as Redux's createStore.
     * You may optionally specify it to hydrate the state
     * from the server in universal apps, or to restore a previously serialized
     * user session. If you use `combineReducers()` to produce the root reducer
     * function (either directly or indirectly by passing an object as `reducer`),
     * this must be an object with the same shape as the reducer map keys.
     */
    preloadedState?: PreloadedState<CombinedState<NoInfer<S>>>;
    /**
     * The store enhancers to apply. See Redux's `createStore()`.
     * All enhancers will be included before the DevTools Extension enhancer.
     * If you need to customize the order of enhancers, supply a callback
     * function that will receive the original array (ie, `[applyMiddleware]`),
     * and should return a new array (such as `[applyMiddleware, offline]`).
     * If you only need to add middleware, you can use the `middleware` parameter instead.
     */
    enhancers?: StoreEnhancer[] | ConfigureEnhancersCallback;
}
declare type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>;
/**
 * A Redux store returned by `configureStore()`. Supports dispatching
 * side-effectful _thunks_ in addition to plain actions.
 *
 * @public
 */
export interface EnhancedStore<S = any, A extends Action = AnyAction, M extends Middlewares<S> = Middlewares<S>> extends Store<S, A> {
    /**
     * The `dispatch` method of your store, enhanced by all its middlewares.
     *
     * @inheritdoc
     */
    dispatch: Dispatch<A> & DispatchForMiddlewares<M>;
}
/**
 * A friendly abstraction over the standard Redux `createStore()` function.
 *
 * @param config The store configuration.
 * @returns A configured Redux store.
 *
 * @public
 */
export declare function configureStore<S = any, A extends Action = AnyAction, M extends Middlewares<S> = [ThunkMiddlewareFor<S>]>(options: ConfigureStoreOptions<S, A, M>): EnhancedStore<S, A, M>;
export {};
