import React from 'react';
import { GlobalSearchContactItem, GlobalSearchItem, GrubStatus, PrevScene, SourceNameType, TSource, getIn18Text, MergeCompany } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { DataSource } from '@lxunit/app-l2c-crm';
import ShowConfirm from '@/components/Layout/Customer/components/confirm/makeSureConfirm';
import { getTransText } from '@/components/util/translate';
import { asyncTaskMessage$ } from './search/GrubProcess/GrubProcess';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from './search/GrubProcess/constants';
import { globalSearchApi } from './constants';
import { IEdmEmailList } from '../Customer/components/hooks/useEdmSendCount';
import { OutPutContactItem } from '../CustomsData/customs/customsDetail/components/contactsSelectModal/contactsSelectModal';
import { ValidateResult } from '@web-edm/send/validEmailAddress';

interface GetCustomerAndLeadsTagInListProps {
  referId?: GlobalSearchItem['referId'];
  // CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户"), OPEN_SEA_CUSTOMER(6, "公海客户")
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), OPEN_SEA_LEADS(5, "公海线索"),;
  customerLabelType?: GlobalSearchItem['customerLabelType'];
}

export interface GetCustomerAndLeadsTagRes {
  type: 'leads' | 'customer';
  id: string;
  title: string;
  isOpenSea?: boolean;
}
export const getCustomerAndLeadsTagInList = (params: GetCustomerAndLeadsTagInListProps) => {
  const { referId, customerLabelType } = params;
  let res: GetCustomerAndLeadsTagRes | null = null;
  if (!customerLabelType || !referId) return res;
  switch (customerLabelType) {
    case 'CUSTOMER':
      res = {
        type: 'customer',
        id: referId,
        title: getIn18Text('WODEKEHU'),
      };
      break;
    case 'ORG_CUSTOMER':
      res = {
        type: 'customer',
        id: referId,
        title: getIn18Text('TONGSHIKEHU'),
      };
      break;
    case 'OPEN_SEA_CUSTOMER':
      res = {
        type: 'customer',
        id: referId,
        isOpenSea: true,
        title: getIn18Text('GONGHAIKEHU'),
      };
      break;
    case 'LEADS':
      res = {
        type: 'leads',
        id: referId,
        title: getIn18Text('WODEXIANSUO'),
      };
      break;
    case 'ORG_LEADS':
      res = {
        type: 'leads',
        id: referId,
        title: getIn18Text('TONGSHIXIANSUO'),
      };
      break;
    case 'OPEN_SEA_LEADS':
      res = {
        type: 'leads',
        id: referId,
        isOpenSea: true,
        title: getIn18Text('GONGHAIXIANSUO'),
      };
      break;
    default:
      break;
  }
  return res;
};

interface GetCustomerAndLeadsTagInDetailProps {
  companyId: string | null;
  status: 'ADDABLE' | 'EDITABLE' | 'NO_PERMISSION' | 'OPEN_SEA' | string | null;
  leadsId: string | null;
}

export const getCustomerAndLeadsTagInDetail = (params: GetCustomerAndLeadsTagInDetailProps) => {
  const { status, companyId, leadsId } = params;
  let res: GetCustomerAndLeadsTagRes | null = null;
  if (!status || status === 'ADDABLE') return res;
  if (!companyId && !leadsId) return res;
  if (status === 'EDITABLE') {
    if (companyId) {
      res = {
        type: 'customer',
        id: companyId,
        title: getIn18Text('WODEKEHU'),
      };
    } else if (leadsId) {
      res = {
        type: 'leads',
        id: leadsId,
        title: getIn18Text('WODEXIANSUO'),
      };
    }
  }
  if (status === 'OPEN_SEA') {
    if (companyId) {
      res = {
        type: 'customer',
        id: companyId,
        isOpenSea: true,
        title: getIn18Text('GONGHAIKEHU'),
      };
    } else if (leadsId) {
      res = {
        type: 'leads',
        id: leadsId,
        isOpenSea: true,
        title: getIn18Text('GONGHAIXIANSUO'),
      };
    }
  }
  if (status === 'NO_PERMISSION') {
    if (companyId) {
      res = {
        type: 'customer',
        id: companyId,
        title: getIn18Text('TONGSHIKEHU'),
      };
    } else if (leadsId) {
      res = {
        type: 'leads',
        id: leadsId,
        title: getIn18Text('TONGSHIXIANSUO'),
      };
    }
  }
  return res;
};

export const getListItemReferByStatus = (params: GetCustomerAndLeadsTagInDetailProps) => {
  const { status, companyId, leadsId } = params;
  let res: GetCustomerAndLeadsTagInListProps = {
    referId: null,
    customerLabelType: null,
  };
  if (!status || status === 'ADDABLE') return res;
  if (!companyId && !leadsId) return res;
  if (status === 'EDITABLE') {
    if (companyId) {
      res = {
        referId: companyId,
        customerLabelType: 'CUSTOMER',
      };
    } else if (leadsId) {
      res = {
        referId: leadsId,
        customerLabelType: 'LEADS',
      };
    }
  }
  if (status === 'OPEN_SEA') {
    if (companyId) {
      res = {
        referId: companyId,
        customerLabelType: 'OPEN_SEA_CUSTOMER',
      };
    } else if (leadsId) {
      res = {
        referId: leadsId,
        customerLabelType: 'OPEN_SEA_LEADS',
      };
    }
  }
  if (status === 'NO_PERMISSION') {
    if (companyId) {
      res = {
        referId: companyId,
        customerLabelType: 'ORG_CUSTOMER',
      };
    } else if (leadsId) {
      res = {
        referId: leadsId,
        customerLabelType: 'ORG_LEADS',
      };
    }
  }
  return res;
};

export const getDetailCustomerAddBtnShowStatus = (companyRelationState: GetCustomerAndLeadsTagInDetailProps | null) => {
  // 是线索但不是客户，不展示
  if (companyRelationState?.leadsId && !companyRelationState?.companyId) {
    return { show: false, text: '' };
  }
  // InputMoreContact
  if (companyRelationState?.status === 'ADDABLE') {
    return { show: true, text: getTransText('LURUKEHU') };
  }

  if (companyRelationState?.status === 'EDITABLE') {
    return { show: true, text: getTransText('InputMoreContact') };
  }

  return { show: false, text: '' };
};

export const getDetailLeadsAddBtnShowStatus = (companyRelationState: GetCustomerAndLeadsTagInDetailProps | null) => {
  // 已经是客户，不展示线索按钮
  if (companyRelationState?.companyId) {
    return { show: false, text: '' };
  }

  if (companyRelationState?.status === 'ADDABLE') {
    return { show: true, text: getTransText('LURUXIANSUO') };
  }

  if (companyRelationState?.status === 'EDITABLE') {
    return { show: true, text: getTransText('InputMoreContact') };
  }

  return { show: false, text: '' };
};

export const getTagResourceLabel = (type: 'leads' | 'customer', isOpenSea?: boolean) => {
  switch (type) {
    case 'customer':
      return isOpenSea ? 'CONTACT_OPEN_SEA' : 'CONTACT';
    case 'leads':
      return isOpenSea ? 'CHANNEL_OPEN_SEA' : 'CHANNEL';
    default:
      return '';
  }
};

export const getTSourceByScene = (scene: PrevScene): TSource => {
  switch (scene) {
    case 'customs':
      return 1;
    case 'smartrcmd':
      return 3;
    case 'lbs':
      return 4;
    // source提供给录入线索接口，目前只有找公司有录入线索，所以source默认用21
    case 'linkedin':
      return 21;
    case 'cantonfair':
      return 23;
    case 'br':
      return 24;
    case 'globalSearch':
    default:
      return 0;
  }
};

export const getSouceTypeFromSen = (scene?: PrevScene) => {
  let sourceNameType: SourceNameType = '全球搜索';
  switch (scene) {
    case 'aisearch':
      sourceNameType = '智能引擎搜索';
      break;
    case 'linkedin':
      sourceNameType = '领英搜索';
      break;
    case 'customs':
      sourceNameType = '海关数据';
      break;
    case 'lbs':
      sourceNameType = 'LBS搜索';
      break;
    case 'cantonfair':
      sourceNameType = '展会买家';
      break;
    case 'facebook':
      sourceNameType = 'Facebook搜索';
      break;
    case 'smartrcmd':
      sourceNameType = '智能推荐';
      break;
    case 'br':
      sourceNameType = '一带一路';
      break;
    default:
      break;
  }
  return sourceNameType;
};

export const getUniSourceTypeFromScene: (scene?: PrevScene) => keyof typeof DataSource = scene => {
  switch (scene) {
    case 'customs':
      return 'customs';
    case 'smartrcmd':
      return 'smartRcmd';
    case 'lbs':
      return 'lbsDetail';
    case 'cantonfair':
      return 'cantonFair';
    case 'br':
      return 'beltRoad';
    case 'linkedin':
      return 'snsSearch';
    default:
      return 'globalSearch';
  }
};
export const transFromSourceType = (scene?: PrevScene) => {
  // switch
  switch (scene) {
    case 'linkedin':
      return 109;
    case 'customs':
      return 104;
    case 'smartrcmd':
      return 110;
    default:
      return 103;
  }
};
export const transformStatus = (value: number | undefined) => {
  switch (value) {
    case -1: {
      return 0;
    }
    case 1: {
      return 1;
    }
    default:
      return -1;
  }
};
export const getButtonNameByGrubStatus = (grubStatus: GrubStatus) => {
  switch (grubStatus) {
    case 'NOT_GRUBBING':
      return getIn18Text('SHENWALIANXIREN');
    case 'GRUBBING':
      return getIn18Text('WAJUEZHONG...');
    case 'OFFLINE_GRUBBING':
      return '离线深挖中';
    case 'OFFLINE_GRUBBED':
      return '离线深挖完成';
    default:
      return getIn18Text('YIWAJUE');
  }
};

export const transformOrder = (order: string) => {
  switch (order) {
    case 'ascend':
      return 'asc';
    case 'descend':
      return 'desc';
    default:
      return '';
  }
};

export const handleHscodeData = (params: string): string => {
  if (params && params.length <= 2) {
    return params;
  }
  if (params && params.length % 2 === 0) {
    if (params.slice(-2) === '00') {
      return params.length === 2 ? params : handleHscodeData(params.slice(0, params.length - 2));
    }
    return params;
  }
  if (params && params.slice(-1) === '0') {
    return handleHscodeData(params.slice(0, params.length - 1));
  }
  return params;
};

export const getWmPageCurrUrl = () => window.location.hash;

export const aiHostingTaskAdd = (sourceType: TSource) => (planId: string, groupId: string, groupName: string, ids?: string[], hideToast?: boolean) => {
  if (!ids?.length) return;
  globalSearchApi
    .globalBatchAddEdm({
      edmInfoVOList: ids.map(id => ({ id })),
      planId,
      groupId,
      groupName,
      sourceType,
    })
    .then(res => {
      if (res && typeof res === 'object' && res.asyncId) {
        !hideToast && message.warning({ content: '由于数据较多，需要较长时间完成' });
        asyncTaskMessage$.next({
          eventName: 'globalSearchGrubTaskAdd',
          eventData: {
            type: GrubProcessTypeEnum.aiHosting,
            data: {
              id: res.asyncId,
              name: `共${ids?.length}家公司`,
              code: sourceType === 1 ? GrubProcessCodeEnum.customBatchAddEdm : GrubProcessCodeEnum.globalBatchAddEdm,
              grubStatus: 'GRUBBING',
            },
          },
        });
      } else {
        message.success({ content: '添加成功' });
      }
    });
};

export const doEdmExposure = (ids?: string[]) => {
  if (!ids?.length) return;
  globalSearchApi.batchEdmExposure({ edmInfoVOList: ids.map(id => ({ id })) });
};

export const showStar = (id?: string | number | null, list?: Array<any>) => {
  if (list && list.length > 1) {
    return Boolean(id) && !list?.some(item => item.collectId === null);
  } else {
    return Boolean(id);
  }
};

export const formatContactSocialPlatform = (data: GlobalSearchContactItem) => {
  if (!data) {
    return '';
  }
  return [
    [data.facebookUrl, 'Facebook'],
    [data.linkedinUrl, 'Linkedin'],
    [data.instegtramUrl, 'Instagram'],
    [data.twitterUrl, 'Twitter'],
    [data.youtubeUrl, 'Youtube'],
  ]
    .filter(kv => !!kv[0])
    .map(kv => kv.reverse().join(':'))
    .join('; ');
};

export const doValidEmailsConfirm = (onOk: () => void, onCancel: () => void, cancelText: string) => {
  ShowConfirm({
    title: (
      <div style={{ fontSize: '14px' }}>
        该企业下包含未经验证的邮箱地址，是否需要验证
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>（不扣除邮箱验证次数）</div>
      </div>
    ),
    okText: '验证邮箱',
    cancelText,
    content: '向真实邮箱地址发信会提升您的获客成功率',
    type: 'primary',
    makeSure: onOk,
    onCancel,
  });
};

export const generateHandleFilterReceivers =
  (
    emails: Array<{
      contactName: string;
      contactEmail: string;
    }>,
    onOp: (emailItems: IEdmEmailList[], type: 'filter' | 'normal') => void,
    companyId?: string | number | null,
    onEmailCheckCallback?: () => void
  ) =>
  (data: Map<string, string[]>, deleteEmails: string[], checkResult: ValidateResult) => {
    const emailCheckResult: { key: string; value: string[] }[] = [];
    data.forEach((value, key) => {
      emailCheckResult.push({
        key,
        value,
      });
    });
    // 检测结果回传全球搜
    if (companyId) {
      globalSearchApi
        .globalEmailCheckCallback({
          id: companyId,
          emailCheckResult,
        })
        .then(() => {
          onEmailCheckCallback?.();
        });
    }
    let sendEmailList: IEdmEmailList[] = [];

    // 剔除邮箱
    if (deleteEmails && deleteEmails.length) {
      sendEmailList = emails.filter(item => !deleteEmails.includes(item.contactEmail));
    } else {
      sendEmailList = emails;
    }
    if (sendEmailList.length === 0) {
      let items = [{ contactEmail: 'noEmials', contactName: '' }];
      onOp(items, 'filter');
    } else {
      sendEmailList.forEach(i => {
        let v2Result = checkResult.v2ResultKV?.get(i.contactEmail);
        if (v2Result) {
          i.contactStatusList = v2Result.contactStatusList;
        }
        let check = checkResult.checkResultKV?.get(i.contactEmail);
        if (check) {
          i.verifyStatusList = check.verifyStatusList;
        }
      });
      onOp(sendEmailList, 'filter');
    }
  };

export const formatDataContactsToOutputItem = (dataContacts: GlobalSearchContactItem[]) =>
  dataContacts.map(item => {
    const re: OutPutContactItem = {
      contactName: item.name,
      email: item.contact,
      telephones: [item.phone.replace(/\D/g, '')],
      job: item.jobTitle,
      id: item.contactId,
    };
    const platforms = [];
    if (item.linkedinUrl) {
      platforms.push(`Linkedin:${item.linkedinUrl}`);
    }
    if (item.facebookUrl) {
      platforms.push(`Facebook:${item.facebookUrl}`);
    }
    if (item.twitterUrl) {
      platforms.push(`Twitter:${item.twitterUrl}`);
    }
    if (platforms.length > 0) {
      re.social_platform_new = platforms.join('; ');
    }
    return re;
  });
