import type { QueryCacheKey } from './core/apiState';
import type { EndpointDefinition } from './endpointDefinitions';
export declare const defaultSerializeQueryArgs: SerializeQueryArgs<any>;
export declare type SerializeQueryArgs<QueryArgs> = (_: {
    queryArgs: QueryArgs;
    endpointDefinition: EndpointDefinition<any, any, any, any>;
    endpointName: string;
}) => string;
export declare type InternalSerializeQueryArgs = (_: {
    queryArgs: any;
    endpointDefinition: EndpointDefinition<any, any, any, any>;
    endpointName: string;
}) => QueryCacheKey;
