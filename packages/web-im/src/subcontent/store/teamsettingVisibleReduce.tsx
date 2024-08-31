import { Team } from 'api';

export interface TeamInfo extends Team {
  annoEditorVisible: boolean;
  infoEditorVisible: boolean;
}

export const reduce = (state, action) => action;

export const initState: Partial<TeamInfo> = {
  teamId: '',
  announcement: '',
  annoEditorVisible: false,
  infoEditorVisible: false,
};
