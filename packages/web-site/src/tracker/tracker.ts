import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const siteDataTracker = {
  track(eventId: string, attributes?: Attributes) {
    trackerApi.track(eventId, attributes);
  },
};
