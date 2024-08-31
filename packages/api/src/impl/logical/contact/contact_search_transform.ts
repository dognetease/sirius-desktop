import lodashGet from 'lodash/get';
import { api } from '@/api/api';
import { ContactServerVOModel } from '@/api/logical/contactAndOrg';
import {
  // EntityContact,
  resultObject,
} from '@/api/_base/api';
import { util } from '@/api/util';

export class ContactSearchTransform {
  systemApi = api.getSystemApi();

  // 将服务端返回的通讯录数据转换成DB
  transServerContact2Search(rawData: ContactServerVOModel): resultObject {
    const { qiyeNickName = '' } = rawData;
    return {
      id: rawData.qiyeAccountId,
      contactName: qiyeNickName,
      contactPYName: util.toPinyin(qiyeNickName),
      contactPYLabelName: (qiyeNickName as string)
        .split('')
        .map(item => util.toPinyin(item).slice(0, 1))
        .join(''),
      accountName: (rawData.displayEmail || rawData.email).toLocaleLowerCase(),
      avatar: lodashGet(rawData, 'iconVO.mediumUrl', ''),
      avatarPendant: lodashGet(rawData, 'iconVO.pendantUrl', ''),
      visibleCode: 0,
      enableIM: rawData.enableIM,
      type: 'enterprise',
      position: [],
      enterpriseId: rawData.orgId,
    };
  }

  // 将服务端返回的个人通讯录数据转成内存搜索数据
  transServerPersonalContact2Search(rawData: resultObject) {
    const qiyeAccountName: string = rawData.qiyeAccountName || '';
    return {
      id: rawData.qiyeAccountId,
      contactName: qiyeAccountName,
      contactPYName: util.toPinyin(qiyeAccountName),
      contactPYLabelName: qiyeAccountName
        .split('')
        .map(item => util.toPinyin(item).slice(0, 1))
        .join(''),
      accountName: lodashGet(rawData, 'email[0]', ''),
      avatar: lodashGet(rawData, 'iconVO.mediumUrl', ''),
      avatarPendant: '',
      visibleCode: 0,
      enableIM: false,
      type: 'personal',
      position: [],
      enterpriseId: -2,
    };
  }

  // 将IM搜索数据转换成群组数据
  transServerTeam2Org() {}
}
