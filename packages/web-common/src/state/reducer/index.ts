import globalReducer, { actions as GlobalActions } from './globalReducer';
import mailReducer, { actions as MailActions } from './mailReducer';
import mailTabReducer, { actions as MailTabActions } from './mailTabReducer';
import attachmentReducer, { actions as AttachmentActions } from './attachmentReducer';
import contactReducer, { actions as ContactActions } from './contactReducer';
import tempContactReducer, { actions as TempContactActions } from './tempContactReducer';
import readCountReducer, { actions as ReadCountActions } from './readCountReducer';
import mailConfigReducer, { actions as MailConfigActions } from './mailConfigReducer';
import scheduleReducer, { actions as ScheduleActions } from './scheduleReducer';
import loginReducer, { actions as LoginActions } from './loginReducer';
import mailTemplateReducer, { actions as MailTemplateActions } from './mailTemplateReducer';
import mailProductReducer, { actions as MailProductActions } from './mailProductReducer';
import mailClassifyReducer, { actions as MailClassifyActions } from './mailClassifyReducer';
import diskReducer, { actions as DiskActions } from './diskReducer';
import diskAttReducer, { actions as DiskAttActions } from './diskAttReducer';
import strangerReducer, { actions as StrangerActions } from './strangerReducer';
import readMailReducer, { actions as ReadMailActions } from './readMailReducer';
import niceModalReducer, { actions as NiceModalActions } from './niceModalReducer';
import autoReplyReducer, { actions as AutoReplyActions } from './autoReplyReducer';
import hollowOutGuideReducer, { actions as HollowOutGuideAction } from './hollowOutGuideReducer';
import aiWriteMailReducer, { actions as AiWriteMailReducer } from './aiWriteMailReducer';

import worktableReducer, { actions as WorktableActions } from './worktableReducer';
import noviceTaskReducer, { actions as NoviceTaskActions } from './noviceTaskReducer';
import privilegeReducer, { privilegeActions as PrivilegeActions } from './privilegeReducer';
import edmUserReducer, { edmUserActions as EdmUserActions } from './edmUserReducer';
import expandMenuReducer, { actions as ExpandMenuActions } from './expandMenuReducer';
import customerReducer, { actions as CustomerAction } from './customerReducer';
import customerCardReducer, { CustomerCardActions } from './customerCard';
import webEntryWmReducer, { WebEntryWmActions } from './webEntryWmReducer';
import taskReducer, { TaskActions } from './taskReducer';
import facebookReducer, { FacebookActions } from './facebookReducer';
import salesPitchReducer, { actions as SalesPitchActions } from './salesPitchReducer';
import notificationReducer, { actions as NotificationActions } from './notificationReducer';

import snsMarketingTaskReducer, { actions as snsMarketingTaskActions } from './snsMarketingTaskReducer';
import snsAiQuotaReducer, { actions as SnsAiQuotaActions } from './snsAiQuotaReducer';
import snsImReducer, { actions as SnsImActions } from './snsImReducer';

import configReducer, { actions as ConfigActions } from './configReudcer';

const rootReducer = {
  mailProductReducer,
  globalReducer,
  mailReducer,
  attachmentReducer,
  contactReducer,
  tempContactReducer,
  readCountReducer,
  scheduleReducer,
  mailConfigReducer,
  loginReducer,
  mailTemplateReducer,
  mailClassifyReducer,
  diskReducer,
  diskAttReducer,
  strangerReducer,
  readMailReducer,
  niceModalReducer,
  autoReplyReducer,
  mailTabReducer,
  hollowOutGuideReducer,
  worktableReducer,
  noviceTaskReducer,
  notificationReducer,
  privilegeReducer,
  edmUserReducer,
  expandMenuReducer,
  customerReducer,
  customerCardReducer,
  webEntryWmReducer,
  taskReducer,
  facebookReducer,
  aiWriteMailReducer,
  salesPitchReducer,
  snsMarketingTaskReducer,
  snsAiQuotaReducer,
  snsImReducer,
  configReducer,
};

// @ts-ignore
const AppActions = {
  ...GlobalActions,
  ...MailActions,
  ...AttachmentActions,
  ...ContactActions,
  ...TempContactActions,
  ...ReadCountActions,
  ...ScheduleActions,
  ...MailConfigActions,
  ...LoginActions,
  ...MailTemplateActions,
  ...MailClassifyActions,
  ...DiskActions,
  ...DiskAttActions,
  ...StrangerActions,
  ...ReadMailActions,
  ...NiceModalActions,
  ...AutoReplyActions,
  ...MailTabActions,
  ...HollowOutGuideAction,
  ...WorktableActions,
  ...NoviceTaskActions,
  ...NotificationActions,
  ...PrivilegeActions,
  ...EdmUserActions,
  ...ExpandMenuActions,
  ...CustomerAction,
  ...CustomerCardActions,
  ...EdmUserActions,
  ...PrivilegeActions,
  ...ExpandMenuActions,
  ...CustomerAction,
  ...MailProductActions,
  ...WebEntryWmActions,
  ...FacebookActions,
  ...SalesPitchActions,
  ...snsMarketingTaskActions,
  ...SnsAiQuotaActions,
  ...SnsImActions,
  ...TaskActions,
  ...ConfigActions,
};

export {
  mailProductReducer,
  globalReducer,
  mailReducer,
  attachmentReducer,
  contactReducer,
  tempContactReducer,
  readCountReducer,
  scheduleReducer,
  mailConfigReducer,
  mailTemplateReducer,
  mailClassifyReducer,
  diskReducer,
  diskAttReducer,
  strangerReducer,
  readMailReducer,
  niceModalReducer,
  autoReplyReducer,
  mailTabReducer,
  hollowOutGuideReducer,
  customerCardReducer,
  GlobalActions,
  MailActions,
  AttachmentActions,
  ContactActions,
  TempContactActions,
  ReadCountActions,
  ScheduleActions,
  MailConfigActions,
  MailTemplateActions,
  MailClassifyActions,
  DiskActions,
  AppActions,
  DiskAttActions,
  StrangerActions,
  ReadMailActions,
  NiceModalActions,
  AutoReplyActions,
  MailTabActions,
  HollowOutGuideAction,
  WorktableActions,
  NoviceTaskActions,
  PrivilegeActions,
  EdmUserActions,
  ExpandMenuActions,
  CustomerAction,
  CustomerCardActions,
  MailProductActions,
  WebEntryWmActions,
  FacebookActions,
  AiWriteMailReducer,
  salesPitchReducer,
  SalesPitchActions,
  snsMarketingTaskReducer,
  snsMarketingTaskActions,
  SnsAiQuotaActions,
  SnsImActions,
  ConfigActions,
};

export default rootReducer;
