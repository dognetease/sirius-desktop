import { apiHolder, apis, DataTrackerApi } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const useDataTracker = () => {
  return trackerApi;
};
