import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const autoMarketTracker = {
  menuClick() {
    trackerApi.track('pc_markting_automations_click');
  },

  createClick() {
    trackerApi.track('pc_markting_automations_createjob_click');
  },

  copyClick() {
    trackerApi.track('pc_markting_automations_copyjob');
  },

  taskTypeClick(type: 'festival' | 'newcustomer' | 'oldcustomer') {
    trackerApi.track('pc_markting_automations_createjob_jobtype', { type });
  },

  objectTypeSubmit(type: 'clue' | 'customer') {
    trackerApi.track('pc_markting_automations_createjob_target', { type });
  },

  conditionTypeSubmit(type: 'Unconditional' | 'Date' | 'Mail behavior') {
    trackerApi.track('pc_markting_automations_createjob_condition', { type });
  },

  actionTypeSubmit({ execAction, additionalAction }: { execAction: string; additionalAction: string[] }) {
    trackerApi.track('pc_markting_automations_createjob_actionstype', { execAction, additionalAction });
  },

  emailContentTypeSubmit(type: 'new' | 'select') {
    trackerApi.track('pc_markting_automations_createjob_mailcontent', { type });
  },

  saveClick() {
    trackerApi.track('pc_markting_automations_createjob_savebutton_click');
  },

  cancelClick() {
    trackerApi.track('pc_markting_automations_createjob_cancelbutton_click');
  },

  startClick() {
    trackerApi.track('pc_markting_automations_createjob_startbutton_click');
  },
};
