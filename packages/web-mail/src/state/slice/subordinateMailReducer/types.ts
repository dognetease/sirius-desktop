import { CustomerTreeData, mailListStateTabs, MailSelectedKey, TreeSelectedContacts, TreeSelectedKey, CustomerMailListStateTabSelected } from '@web-mail/types';
import { LIST_MODEL } from '@web-mail/common/constant';

export interface SubordinateMailState {
  refreshBtnLoading: boolean;
  listLoading: boolean;
  subordinateListLoading: boolean;
  selectedKeys: TreeSelectedKey;
  selectedContacts: TreeSelectedContacts;
  customerTreeList: CustomerTreeData[];
  expandedKeys: (number | string)[];
  mailDataList: string[];
  mailTotal: number;
  scrollTop: number;
  noticeNum: number;
  activeIds: string[];
  mailListMenuVisible: boolean;
  mailListStateTab: CustomerMailListStateTabSelected;
  selectedMailId: MailSelectedKey;
  mailListInitIsFailed: boolean;
  mailListResizeProcessing: boolean;
  mailTabs: mailListStateTabs[];
  readMailWindowActiveMailId: string | null;
  defaultMailListSelectedModel: LIST_MODEL;
  refreshHasNewMail: boolean;
  shouSdTabByAuth: boolean;
}

export type SubordinateMailSliceState = Record<string, SubordinateMailState>;

export interface RefreshFolderSdParams {
  noCache?: boolean;
  showLoading: boolean;
}
