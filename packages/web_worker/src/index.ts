// for test, no use
import { apiHolder, DataStoreApi } from 'api';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

dataStoreApi.put('key', 'test').then();
