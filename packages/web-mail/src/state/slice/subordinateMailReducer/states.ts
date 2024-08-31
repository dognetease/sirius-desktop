import type { SubordinateMailState } from '@web-mail/state/slice/subordinateMailReducer/types';
import { filterTabMap, LIST_MODEL } from '@web-mail/common/constant';

export const genSubordinateState: () => SubordinateMailState = () => {
  return {
    /************ loading状态 ************/
    listLoading: false,
    subordinateListLoading: false,
    refreshBtnLoading: false,
    /************ 文件夹树相关 ************/
    selectedKeys: { id: '', accountId: '' },
    selectedContacts: { list: [], accountId: '' },
    customerTreeList: [],
    expandedKeys: ['all'],
    /************ 邮件列表相关 ************/
    refreshHasNewMail: false,
    mailDataList: [],
    mailTotal: 20,
    scrollTop: 0,
    noticeNum: 0,
    activeIds: [],
    mailListMenuVisible: false,
    mailListStateTab: 'ALL',
    selectedMailId: { id: '', accountId: '' },
    mailListInitIsFailed: false,
    mailListResizeProcessing: false,
    mailTabs: filterTabMap.subordinate,
    defaultMailListSelectedModel: LIST_MODEL.INIT,
    readMailWindowActiveMailId: null,
    shouSdTabByAuth: true,
  };
};
