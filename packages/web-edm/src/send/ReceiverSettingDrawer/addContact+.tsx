import { CheckEmailAddressInfo, EdmSendConcatInfo, ReceiverInfoModel, ResponseFilterCount, SourceNameType, getIn18Text } from 'api';
import { AbnormalType, AbnormalTypeModel, TypesMap } from '../../send/validEmailAddress/util';
import { ValidateResult } from '../../send/validEmailAddress';

export interface AddReceiverParams {
  contactName?: string;
  contactEmail: string;
  contactStatus?: number;
  blacklist?: boolean;
  valid?: any;
  sourceName?: SourceNameType | string;
  increaseSourceName?: string;
  position?: string;
  remarks?: string;
}

export interface AddReceiverConfig {
  newReceivers: AddReceiverParams[];
  silence?: boolean;
  autoGetContactStatus?: boolean;
  isAdd?: boolean;
  fromType?: string;
}

export interface AddContactModalModel {
  visible: boolean;
  closeModal: (receiveType?: 'normal' | 'filter' | '', notDestroy?: boolean) => void; // directSend 是否直接发送， notDestroy 是否整体销毁
  hasVariable: boolean;
  containerHeight: number;
  receivers?: EdmSendConcatInfo[];
  disableReceivers?: EdmSendConcatInfo[];
  capacity: number;
  receiveType: 'normal' | 'filter';
  stepsInfo?: ReceiverInfoModel;
  isAddContactStep?: boolean;
  validateSubmit?: (autoJump?: boolean) => Promise<boolean>;
  saveDraft?: () => Promise<boolean>;
  sendFilterCapacity?: (data: ResponseFilterCount) => void;
  sendReceivers: (receivers: EdmSendConcatInfo[], directSend?: boolean, needAdd?: boolean, checkResult?: ValidateResult) => void;
  showFilterTips: boolean;
  needCheckAllLogic?: boolean; // 是否需要省略部分校验逻辑
  sourceFrom?: string;
  setCloseContactStoreClueTips?: (value: boolean) => void;
  ignoreIncreaseSourceName?: boolean;
  senderEmails?: CheckEmailAddressInfo[];
  hideDirectSendButton?: boolean;
  secondryAdd?: boolean;
  controlAddContactModal?: (_: boolean) => void;
  existEmailCount?: number;
  directCheck?: boolean;
  businessType?: string;
}

export interface TrackerMapModel {
  [key: string]: any;
}

export const EmailSourceTrackerMap: TrackerMapModel = {
  '1': {
    key: 'edmBook',
    value: getIn18Text('DEZHIBU'),
  },
  '2': {
    key: 'edmCustomer',
    value: getIn18Text('KEHUGUANLIXUANZE'),
  },
  '3': {
    key: 'edmImport',
    value: getIn18Text('CONGWENJIANDAORU'),
  },
  '4': {
    key: 'edmContacts',
    value: getIn18Text('GERENTONGXUNLU'),
  },
  '5': {
    key: 'edmEdit',
    value: getIn18Text('SHOUDONGTIANJIA'),
  },
};

// MARK: - Utils

export const getRangedValue = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const AbnormalStatusKeyMap = Object.values(TypesMap).reduce((obj, cur) => {
  const current = cur as AbnormalTypeModel;
  obj[current.id] = current.value as AbnormalType;
  return obj;
}, {} as Record<number, AbnormalType>);

export const StorageAbnormalKey = 'EDM_RECEIVERS_Abnormal_Keys';
export const defaultAbnormalKeys: AbnormalType[] = Object.keys(TypesMap) as AbnormalType[];
export const getClearFilterFromLocalStorage: () => AbnormalType[] = () => {
  const storageValue = localStorage.getItem(StorageAbnormalKey);
  return storageValue ? JSON.parse(storageValue) : [...defaultAbnormalKeys];
};
export const setClearFilterToLocalStorage = (data: AbnormalType[]) => {
  if (data) {
    localStorage.setItem(StorageAbnormalKey, JSON.stringify(data));
  }
};
