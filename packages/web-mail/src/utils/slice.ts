import {
  CustomerTreeData,
  loadEdmMailListParam,
  MailBoxReducerState,
  CustomerBoxModel,
  CustomerTreeChildData,
  RootMailBoxReducerState,
  EdmMailKeys,
} from '@web-mail/types';
import { AppDispatch, MailActions } from '@web-common/state/createStore';
import {
  CustomerBaseInfo,
  EntityContact,
  ICustomerManagerModel,
  inWindow,
  ISimpleCustomerConatctModel,
  MailAttrQuery,
  MailAttrQueryFilter,
  MailEntryModel,
  queryMailBoxParam,
} from 'api';
import { getMainAccount, reduxMessage } from '@web-mail/util';
import { getIsSearchingMailByState } from '@web-mail/state/customize';
import CustomerIcon from '@web-common/components/UI/Icons/svgs/edm/CustomerIcon';
import CustomerContactIcon from '@web-common/components/UI/Icons/svgs/edm/CustomerContactIcon';
import { MailTabModel, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import { doGetCustomersByIds } from '@web-common/state/reducer/contactReducer';

export const sliceStateCheck = (state: RootMailBoxReducerState, sliceId: string | undefined, edmMailKey: EdmMailKeys) =>
  sliceId && state[edmMailKey] && state[edmMailKey][sliceId];

export const getToListAndUpdateTree = async (isSearching: boolean, dispatch: AppDispatch, state: MailBoxReducerState, sliceId: string, type: EdmMailKeys) => {
  const isSliceExist = sliceStateCheck(state, sliceId, type);
  if (isSliceExist) {
    let to: string[] = [];
    if (isSearching) {
      if (type === 'customer') {
        const customerId = state[type][sliceId].selectedSearchKeys.id;
        const newTreeList = await getCustomerContacts(customerId + '', state[type][sliceId].searchTreeList);
        console.log('[loadMailList edm] request for contacts search', newTreeList);
        if (newTreeList.updatedTreeData) {
          dispatch(
            MailActions.doUpdateCustomerTreeListById_cm({
              sliceId,
              data: { id: state[type][sliceId].selectedKeys.id, data: newTreeList.updatedTreeData, isSearching },
            })
          );
        }
        dispatch(MailActions.doUpdateSelectedSearchContacts_cm({ data: { list: newTreeList.contactEmails }, sliceId }));
        to = newTreeList.contactEmails;
      }
    } else {
      const customerId = state[type][sliceId].selectedKeys.id;
      const newTreeList = await getCustomerContacts(customerId + '', state[type][sliceId].customerTreeList);
      console.log('[loadMailList edm] request for contacts', newTreeList);
      if (newTreeList.updatedTreeData) {
        dispatch(
          MailActions.doUpdateCustomerTreeListById_cm({
            data: { id: state[type][sliceId].selectedKeys.id, data: newTreeList.updatedTreeData, isSearching },
            sliceId,
          })
        );
      }
      dispatch(MailActions.doUpdateSelectedContacts_cm({ data: { list: newTreeList.contactEmails }, sliceId }));
      to = newTreeList.contactEmails;
    }
    return to;
  }
  return [];
};

export const getCustomerContacts = async (
  customerId: string,
  treeList: CustomerTreeData[]
): Promise<{ treeList: CustomerTreeData[]; contactEmails: string[]; updatedTreeData: CustomerTreeData | undefined }> => {
  const customerDetail = await doGetCustomersByIds([customerId]);
  if (!customerDetail?.length) {
    console.warn('getCustomerContacts error no customerDetail');
    return {
      treeList: treeList,
      contactEmails: [],
      updatedTreeData: undefined,
    };
  }
  const { contactList, managerList } = customerDetail[0];
  console.log('[load customer contact]', customerDetail);
  const treeChildData = formatCustomerTreeChild(contactList, managerList);
  const newTreeList: CustomerTreeData[] = treeList.map((v: CustomerTreeData) => {
    if (v.key === customerId) {
      return {
        ...v,
        children: treeChildData || [],
        isLeaf: contactList.length === 0,
        managerList,
      };
    }
    return v;
  });
  return {
    treeList: newTreeList,
    contactEmails: contactList.map(v => v.email),
    updatedTreeData: newTreeList.find(v => v.key === customerId),
  };
};

export const getLastMailInSlice = (state: MailBoxReducerState, startIndex = 0, sliceId: string, type: EdmMailKeys): MailEntryModel | null => {
  if (startIndex === 0) {
    return null;
  }
  const { mailEntities } = state;
  const isSearching = getIsSearchingMailByState(state, sliceId, type);
  const list = isSearching && type === 'customer' ? state[type][sliceId].searchList : state[type][sliceId].mailDataList;
  const lastMailId = list[startIndex - 1];
  if (!lastMailId) {
    return null;
  }
  return mailEntities[lastMailId] || null;
};

// 原 getCustomerMailListReq、getSubordinateMailListReq 统一为 getEdmMailListReq
export const getEdmMailListReq = (state: MailBoxReducerState, params: loadEdmMailListParam, sliceId: string, toList?: string[]): queryMailBoxParam => {
  const isSliceExist = sliceStateCheck(state, sliceId, params.type);
  if (!isSliceExist) {
    throw new Error('Slice not Exist');
  }
  const { startIndex = 0, type } = params;
  const isSearching = getIsSearchingMailByState(state, sliceId, params.type);
  const filterState = isSearching && type === 'customer' ? state[type][sliceId].searchListStateTab : state[type][sliceId].mailListStateTab;
  const lastMail = getLastMailInSlice(state, startIndex, sliceId, params.type);
  const endDate = lastMail ? lastMail.entry.sendTime : '';

  if (type === 'customer') {
    const attrQuery: MailAttrQuery[] = [];
    const to = toList || (isSearching ? state[type][sliceId].selectedSearchContacts.list : state[type][sliceId].selectedContacts.list);
    const subMenuState = isSearching ? state[type][sliceId].mailListTabMenuSearch : state[type][sliceId].mailListTabMenu;
    const endMid = lastMail ? lastMail.id : '';
    const managerList = state[type][sliceId].selectedKeys?.managerList || [];
    // 全部标签下，需要改造，增加同事和我的邮件
    if (filterState !== 'COLLEAGUE') {
      // 非同事tab下，需要请求自己的往来邮件
      attrQuery.push({ to });
    }
    if (managerList.length) {
      if (filterState === 'COLLEAGUE') {
        managerList.forEach(item => {
          if (item.managerAccount !== getMainAccount()) {
            attrQuery.push({
              from: item.managerAccount,
              to,
            });
          }
        });
      }
      if (filterState === 'ALL') {
        managerList.forEach(item => {
          attrQuery.push({
            from: item.managerAccount,
            to,
          });
        });
      }
    }

    let attrQueryFilter;
    if (filterState == 'ME') {
      if (subMenuState === 'Send') {
        attrQueryFilter = { type: 'send' };
      } else if (subMenuState === 'Receive') {
        attrQueryFilter = { type: 'receive' };
      }
    }

    return {
      index: startIndex,
      returnModel: true,
      returnTag: true,
      checkType: 'checkCustomerMail',
      count: endDate ? 100 : 30,
      endDate,
      endMid,
      attrQuery,
      attrQueryFilter: attrQueryFilter as MailAttrQueryFilter,
      noContactRace: !!params.noContactRace,
    };
  }

  return {
    index: startIndex,
    returnModel: true,
    returnTag: true,
    checkType: 'checkSubordinateMail',
    count: endDate ? 100 : 30,
    endDate,
    attrQuery: {
      from: state.subordinate[sliceId].selectedKeys.accountName,
      to: [],
    },
    attrQueryFilter: filterState !== 'ALL' ? { type: filterState === 'SEND' ? 'send' : 'receive' } : undefined,
    noContactRace: params.noContactRace,
  };
};

export class SyncTimerFactory {
  timer = 0;

  errMessage = '';

  request: () => Promise<void>;

  constructor(req: () => Promise<any>, errMessage = '') {
    this.request = req;
    this.errMessage = errMessage;
  }

  startSyncRace(cb?: () => void): Promise<void> {
    if (inWindow()) {
      this.cancelSyncRace();
      this.timer = window.setTimeout(() => {
        cb && cb();
        if (this.errMessage) {
          reduxMessage.error({ content: this.errMessage });
        }
      }, 3 * 60 * 1000);
    }
    return this.request().catch(() => {
      console.log('11111111');
      cb && cb();
      this.cancelSyncRace();
    });
  }

  cancelSyncRace() {
    if (inWindow()) {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = 0;
      }
    }
  }
}

// 将 API 层返回的的联系人列表数据转换为联系人树需要的数据
export const formatCustomerTreeData = (inputs: CustomerBoxModel[]): CustomerTreeData[] => {
  return inputs.map(data => {
    const { contacts, orgName, id, managerList } = data;
    const children = Array.isArray(contacts) ? formatCustomerTreeChild(contacts, managerList) : undefined;
    return {
      title: orgName,
      key: id,
      icon: CustomerIcon(),
      isLeaf: false,
      nodeData: data,
      children,
      managerList,
    };
  });
};

// 将mailPlusCustomer搜索客户返回的数据整理成联系人树需要的数据
export const transCustomerBaseInfo2CustomerTreeData = (inputs: CustomerBaseInfo[]): CustomerTreeData[] => {
  return inputs.map(data => {
    const { customerId, customerName, customerCreateTime } = data;
    const nodeData = {
      orgName: customerName,
      id: customerId,
      lastMailTime: customerCreateTime,
      contacts: [],
      managerList: [],
    };
    return {
      title: customerName,
      key: customerId,
      icon: CustomerIcon(),
      isLeaf: false,
      nodeData,
      children: [
        {
          title: '',
          key: '',
          icon: null,
          email: '',
          isLeaf: true,
        },
      ], // 此处传递传入一个空对象，让客户可以点击开
      managerList: [],
    };
  });
};

export const formatCustomerTreeChild = (contacts?: ISimpleCustomerConatctModel[], managerList?: ICustomerManagerModel[]): CustomerTreeChildData[] => {
  return Array.isArray(contacts) && contacts.length > 0
    ? contacts.map(v => ({
        title: v.name || v.email,
        key: v.id,
        icon: CustomerContactIcon(),
        email: v.email,
        isLeaf: true,
        managerList: managerList,
      }))
    : [];
};

export const formatSubordinateTreeChild = (contacts?: EntityContact[], managerList?: ICustomerManagerModel[]): CustomerTreeChildData[] => {
  return Array.isArray(contacts) && contacts.length > 0
    ? contacts.map(v => ({
        title: v.contactName || v.accountName,
        key: v.accountId,
        icon: CustomerContactIcon(),
        email: v.accountName,
        isLeaf: true,
        managerList: managerList,
      }))
    : [];
};

// export const getSubordinateContacts = async (customerId: string, treeList: CustomerTreeData[]): Promise<{ treeList: CustomerTreeData[]; contactEmails: string[] }> => {
//   const res: EntityContact[] = await request.doListCustomerContactsById(customerId);
//   console.log('[load subordinate contact]', res);
//   const treeChildData = formatSubordinateTreeChild(res);
//   const newTreeList = treeList.map((v: CustomerTreeData) => {
//     if (v.key === customerId) {
//       return {
//         ...v,
//         children: treeChildData || [],
//         isLeaf: res.length === 0,
//       };
//     }
//     return v;
//   });
//   return {
//     treeList: newTreeList,
//     contactEmails: res.map(v => v.accountName),
//   };
// };

export const genEdmMailTabId = (type: EdmMailKeys) => {
  return `${type}_${Date.now()}`;
};

export const genEdmMilTabModel = ({ type, title, from, id }: { id?: string; type: EdmMailKeys; title?: string; from: tabId }): MailTabModel => {
  return {
    id: id || genEdmMailTabId(type),
    title: title || '客户邮件' + id,
    type: tabType[type],
    closeable: true,
    isActive: true,
    extra: {
      from,
    },
  };
};
