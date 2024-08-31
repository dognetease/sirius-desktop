import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
type Attributes = { [key: string]: any };
export class DataTrackerHelper {
  private extraParams = {};
  setExtraParams(extraParams: Attributes) {
    this.extraParams = extraParams;
  }
  doTrack(eventId: string, attributes?: any, noPopup?: boolean) {
    const newAttrs = {
      ...(attributes ?? {}),
      ...(this.extraParams ?? {}),
    };
    trackerApi.track(eventId, newAttrs, noPopup);
  }
}
