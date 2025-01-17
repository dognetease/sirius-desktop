import type { InternalSerializeQueryArgs } from '../defaultSerializeQueryArgs';
import type { Api, ApiContext } from '../apiTypes';
import type { BaseQueryFn, BaseQueryError } from '../baseQueryTypes';
import type { RootState, QueryKeys, QuerySubstateIdentifier } from './apiState';
import { CombinedState } from './apiState';
import type { StartQueryActionCreatorOptions } from './buildInitiate';
import type { AssertTagTypes, EndpointDefinition, EndpointDefinitions, MutationDefinition, QueryArgFrom, QueryDefinition, ResultTypeFrom } from '../endpointDefinitions';
import { FullTagDescription } from '../endpointDefinitions';
import type { Draft } from '@reduxjs/toolkit';
import type { Patch } from 'immer';
import type { AnyAction, ThunkAction, AsyncThunk } from '@reduxjs/toolkit';
import type { PrefetchOptions } from './module';
import type { UnwrapPromise } from '../tsHelpers';
declare module './module' {
    interface ApiEndpointQuery<Definition extends QueryDefinition<any, any, any, any, any>, Definitions extends EndpointDefinitions> extends Matchers<QueryThunk, Definition> {
    }
    interface ApiEndpointMutation<Definition extends MutationDefinition<any, any, any, any, any>, Definitions extends EndpointDefinitions> extends Matchers<MutationThunk, Definition> {
    }
}
declare type EndpointThunk<Thunk extends QueryThunk | MutationThunk, Definition extends EndpointDefinition<any, any, any, any>> = Definition extends EndpointDefinition<infer QueryArg, infer BaseQueryFn, any, infer ResultType> ? Thunk extends AsyncThunk<unknown, infer ATArg, infer ATConfig> ? AsyncThunk<ResultType, ATArg & {
    originalArgs: QueryArg;
}, ATConfig & {
    rejectValue: BaseQueryError<BaseQueryFn>;
}> : never : never;
export declare type PendingAction<Thunk extends QueryThunk | MutationThunk, Definition extends EndpointDefinition<any, any, any, any>> = ReturnType<EndpointThunk<Thunk, Definition>['pending']>;
export declare type FulfilledAction<Thunk extends QueryThunk | MutationThunk, Definition extends EndpointDefinition<any, any, any, any>> = ReturnType<EndpointThunk<Thunk, Definition>['fulfilled']>;
export declare type RejectedAction<Thunk extends QueryThunk | MutationThunk, Definition extends EndpointDefinition<any, any, any, any>> = ReturnType<EndpointThunk<Thunk, Definition>['rejected']>;
export declare type Matcher<M> = (value: any) => value is M;
export interface Matchers<Thunk extends QueryThunk | MutationThunk, Definition extends EndpointDefinition<any, any, any, any>> {
    matchPending: Matcher<PendingAction<Thunk, Definition>>;
    matchFulfilled: Matcher<FulfilledAction<Thunk, Definition>>;
    matchRejected: Matcher<RejectedAction<Thunk, Definition>>;
}
export interface QueryThunkArg extends QuerySubstateIdentifier, StartQueryActionCreatorOptions {
    type: 'query';
    originalArgs: unknown;
    endpointName: string;
}
export interface MutationThunkArg {
    type: 'mutation';
    originalArgs: unknown;
    endpointName: string;
    track?: boolean;
    fixedCacheKey?: string;
}
export declare type ThunkResult = unknown;
export declare type ThunkApiMetaConfig = {
    pendingMeta: {
        startedTimeStamp: number;
    };
    fulfilledMeta: {
        fulfilledTimeStamp: number;
        baseQueryMeta: unknown;
    };
    rejectedMeta: {
        baseQueryMeta: unknown;
    };
};
export declare type QueryThunk = AsyncThunk<ThunkResult, QueryThunkArg, ThunkApiMetaConfig>;
export declare type MutationThunk = AsyncThunk<ThunkResult, MutationThunkArg, ThunkApiMetaConfig>;
export declare type MaybeDrafted<T> = T | Draft<T>;
export declare type Recipe<T> = (data: MaybeDrafted<T>) => void | MaybeDrafted<T>;
export declare type PatchQueryDataThunk<Definitions extends EndpointDefinitions, PartialState> = <EndpointName extends QueryKeys<Definitions>>(endpointName: EndpointName, args: QueryArgFrom<Definitions[EndpointName]>, patches: readonly Patch[]) => ThunkAction<void, PartialState, any, AnyAction>;
export declare type UpdateQueryDataThunk<Definitions extends EndpointDefinitions, PartialState> = <EndpointName extends QueryKeys<Definitions>>(endpointName: EndpointName, args: QueryArgFrom<Definitions[EndpointName]>, updateRecipe: Recipe<ResultTypeFrom<Definitions[EndpointName]>>) => ThunkAction<PatchCollection, PartialState, any, AnyAction>;
/**
 * An object returned from dispatching a `api.util.updateQueryData` call.
 */
export declare type PatchCollection = {
    /**
     * An `immer` Patch describing the cache update.
     */
    patches: Patch[];
    /**
     * An `immer` Patch to revert the cache update.
     */
    inversePatches: Patch[];
    /**
     * A function that will undo the cache update.
     */
    undo: () => void;
};
export declare function buildThunks<BaseQuery extends BaseQueryFn, ReducerPath extends string, Definitions extends EndpointDefinitions>({ reducerPath, baseQuery, context: { endpointDefinitions }, serializeQueryArgs, api, }: {
    baseQuery: BaseQuery;
    reducerPath: ReducerPath;
    context: ApiContext<Definitions>;
    serializeQueryArgs: InternalSerializeQueryArgs;
    api: Api<BaseQuery, Definitions, ReducerPath, any>;
}): {
    queryThunk: AsyncThunk<unknown, QueryThunkArg, ThunkApiMetaConfig & {
        state: RootState<any, string, ReducerPath>;
    }>;
    mutationThunk: AsyncThunk<unknown, MutationThunkArg, ThunkApiMetaConfig & {
        state: RootState<any, string, ReducerPath>;
    }>;
    prefetch: <EndpointName extends QueryKeys<Definitions>>(endpointName: EndpointName, arg: any, options: PrefetchOptions) => ThunkAction<void, any, any, AnyAction>;
    updateQueryData: UpdateQueryDataThunk<EndpointDefinitions, { [P in ReducerPath]: CombinedState<any, string, P>; }>;
    patchQueryData: PatchQueryDataThunk<EndpointDefinitions, { [P in ReducerPath]: CombinedState<any, string, P>; }>;
    buildMatchThunkActions: <Thunk extends AsyncThunk<any, QueryThunkArg, ThunkApiMetaConfig> | AsyncThunk<any, MutationThunkArg, ThunkApiMetaConfig>>(thunk: Thunk, endpointName: string) => Matchers<Thunk, any>;
};
export declare function calculateProvidedByThunk(action: UnwrapPromise<ReturnType<ReturnType<QueryThunk>> | ReturnType<ReturnType<MutationThunk>>>, type: 'providesTags' | 'invalidatesTags', endpointDefinitions: EndpointDefinitions, assertTagType: AssertTagTypes): readonly FullTagDescription<string>[];
export {};
