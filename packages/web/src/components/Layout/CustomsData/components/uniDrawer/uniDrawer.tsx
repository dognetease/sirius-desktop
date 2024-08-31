/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DrawerProps } from 'antd';
import { config } from 'env_def';
import { SiriusExternalDetail, SiriusExternalView, setHttpConfig, setUpL2cConf, SiriusExternalContactDetail, SiriusExternalLeadsView } from '@lxunit/app-l2c-crm';
import { RequestBusinessaAddCompany as customerType, api, DataTrackerApi, apis } from 'api';
import { useSelector } from 'react-redux';
import { RootState } from '@/../../web-common/src/state/createStore';
import { CustomerLeadRelationProps } from './uniDrawerLeads';

const isWeb = config('build_for') === 'web';

export const host: string = isWeb ? '' : (config('host') as string);
const stage = config('stage');
setUpL2cConf({
  isProduction: stage === 'prod',
});
// 临时解决
setHttpConfig({
  httpHost: host,
} as any);

const dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props extends DrawerProps {
  visible: boolean;
  uniType?: 'editCustomer' | 'editContact' | 'editClueContact'; // 编辑类型，目前有两个值：编辑客户和编辑联系人
  contactId?: number; // 客户联系人id
  onClose: () => void;
  onSuccess: (id?: number, data?: any) => void;
  customerData?: customerType;
  source: keyof typeof DataSource;
  customerId?: number;
  leadsId?: number;
  uniRecordId?: number;
  scenario?: 'leadConvertCustomer'; // 传了就是线索转客户场景
  relationParams?: CustomerLeadRelationProps; // 主站数据透传
  // fromPageWay?: string; // 调用抽屉的页面来源，用于打点，目前只有线索有这种打点，线索碰巧能用 source（keyof typeof DataSource）+ source2TrackerModule 来处理，所以先注释掉了
}

export enum DataSource {
  assistant = 'TA_list', // 【外贸通助手】：录入客户
  customs = 'CD_detail', // 【海关数据】：录入客户
  globalSearch = 'GH_detail', // 【全球搜索】：录入客户
  smartRcmd = 'SR_detail', // 【外贸大数据 - 智能推荐】：录入客户
  mailFilterManual = 'CS_manual', // 【往来邮件筛选】——手动筛选：同步客户
  mailFilterAuto = 'CS_auto', // 【往来邮件筛选】——自动筛选：同步客户
  mailFilterOverview = 'CS_overview', // 【往来邮件筛选】——筛选记录总览：同步客户
  worktableCustomer = 'WT_customer', // 【工作台看板】——我的/全部客户动态 ：打开客户
  worktableSchedule = 'WT_schedule', // 【工作台看板】——最近日程关联数据：打开客户
  addressBook = 'AB_more', // 【地址簿】: 1. 添加客户 2. 添加至已有客户
  edmCard = 'EDM_card', // 【营销邮件】——卡片：查看客户
  edmNotification = 'EDM_noti', // 【营销邮件】——通知：打开客户
  edmLabel = 'EDM_label', // 【营销邮件】——发件任务详情 - 标签: 打开客户
  edmButton = 'EDM_button', // 【营销邮件】——发件任务详情 - 操作列: 打开客户
  mailListRead = 'E+_read', // 【邮件+】陌生人来信读信界面：1. 新建客户 2. 添加至已有客户
  mailListCustomer = 'E+_customer_card', // 【邮件+】客户卡片：查看客户
  mailListStranger = 'E+_stranger_card', // 【邮件+】陌生人/个人联系人卡片： 1. 新建客户 2. 添加至已有客户
  mailCustomerList = 'E+_customer_maillist', // 【邮件+】客户邮件列表： 新建客户
  mailListStrangerSideBar = 'E+_stranger_siderbar', // 【邮件+】陌生人侧边栏： 1.新建客户 2. 添加至已有客户
  websiteTasklist = 'WB_tasklist', // 【建站】建站营销任务列表——收件人
  websiteProduct = 'WB_proudct', // 【建站】营销统计——产品数据
  websitePotentialCustomer = 'WB_potential_customer', // 【建站】站点潜在客户 - 留资客户
  waCustomer = 'WA_customer_sidebar', // 【WA】客户侧边栏：编辑
  waStranger = 'WA_stranger_sidebar', // 【WA】陌生人侧边栏：1. 转客户 2. 添加至已有客户
  waStats = 'WA_stats', // 【WA】数据统计：查看客户
  imNotification = 'IM-noti', // 【IM】通知助手通知
}
export const source2TrackerModule: Record<keyof typeof DataSource, string> = {
  assistant: 'Trade_Assistant',
  customs: 'Customs_Data',
  globalSearch: 'Global Search',
  smartRcmd: 'Smart_Recommendation',
  mailFilterManual: 'Correspondence_Screening',
  mailFilterAuto: 'Correspondence_Screening',
  mailFilterOverview: 'Correspondence_Screening',
  worktableCustomer: 'Work_Table',
  worktableSchedule: 'Work_Table',
  addressBook: 'Address_Book',
  edmCard: 'EDM',
  edmNotification: 'EDM',
  edmLabel: 'EDM',
  edmButton: 'EDM',
  mailListRead: 'Email+',
  mailListCustomer: 'Email+',
  mailListStranger: 'Email+',
  mailCustomerList: 'Email+',
  mailListStrangerSideBar: 'Email+',
  websiteTasklist: 'Website',
  websiteProduct: 'Website',
  websitePotentialCustomer: 'Website',
  waCustomer: 'WA',
  waStranger: 'WA',
  waStats: 'WA',
  imNotification: 'IM',
};
// const source2Way = {
//   assistant: '外贸通助手',
//   customs: 'CUSTOM_HOUSE',
//   globalSearch: 'GLOBAL_SEARCH',
//   smartRcmd: '',
//   mailFilterManual: 'EMAIL_RECOMMEND',
//   mailFilterAuto: 'EMAIL_RECOMMEND',
//   mailFilterOverview: 'EMAIL_RECOMMEND',
//   worktableCustomer: 'WORKBENCH',
//   worktableSchedule: 'WORKBENCH',
//   addressBook: 'ADDRESS',
//   edmCard: 'EDM',
//   edmNotification: 'EDM',
//   mailListRead: 'EMAIL_LIST',
//   mailListCustomer: 'EMAIL_LIST',
//   mailListStranger: 'EMAIL_LIST',
//   mailListStrangerSideBar: 'EMAIL_LIST',
//   websiteTasklist: 'BUILD_WEBSITE',
//   websiteProduct: 'BUILD_WEBSITE',
//   websitePotentialCustomer: 'BUILD_WEBSITE',
//   waCustomer: 'WhatsApp',
//   waStranger: 'WhatsApp',
//   waStats: 'WhatsApp',
//   imNotification: '',
// };

export const source2CreateType = {
  assistant: 14,
  customs: 9,
  globalSearch: 10,
  mailFilterManual: 8,
  mailFilterAuto: 8,
  mailFilterOverview: 8,
  worktableCustomer: 1,
  worktableSchedule: 1,
  addressBook: 13,
  edmCard: 6,
  edmNotification: 6,
  edmLabel: 5,
  edmButton: 5,
  mailListRead: 12,
  mailListCustomer: 12,
  mailListStranger: 12,
  mailListStrangerSideBar: 12,
  websiteTasklist: 11,
  websiteProduct: 11,
  websitePotentialCustomer: 11,
  waCustomer: 15,
  waStranger: 15,
  waStats: 15,
  smartRcmd: 16,
  imNotification: '',
};

enum TrackerAction {
  View = 'view',
  SaveSucceed = 'save_ succeed',
}

enum TrackerInteract {
  Open = 'open',
  Add = 'add',
  Create = 'create',
}

export const SocialPlatformType = {
  SKYPE: '1', // Skype
  FACEBOOK: '2', // Facebook
  LINKEDIN: '3', // Linkedin
  YOUTUBE: '4', // Youtube
  TWITTER: '5', // Twitte
  INSTAGRAM: '6', // Instagram
  ZALO: '7', // Zalo
  VIBER: '8', // Viber
  WECHAT: '9', // Wechat
  QQ: '10', // QQ
  WANGWANG: '11', // 旺旺
  DINGDING: '12', // 钉钉
  WHATSAPP: '13', // WhatsApp
  OTHER: '0', // 其他
} as any;

export const getSocialPlatform = (value?: string) => {
  if (!value) return [];
  return value
    .replace(/\s/g, '')
    .split(';')
    .map((i: string) => {
      const arr = i.split(':');
      return { type: SocialPlatformType[arr[0].toLocaleUpperCase()], number: arr.slice(1).join('') };
    })
    .filter((i: any) => i.type && i.number);
};

const ensureContactData = (data?: customerType, id?: number) => {
  if (!data?.contact_list?.length) return [];
  const result =
    data?.contact_list
      ?.map((l, idx) => ({
        ...l,
        gender: undefined,
        contact_name: l.contact_name || l.email?.split('@')[0] || '',
        social_platform: getSocialPlatform((l as any).social_platform_new),
        main_contact: idx === 0 && !id,
        decision_maker: false,
        sourceName: (l as any).sourceName ?? '',
      }))
      .filter(i => i) || [];

  console.log('contact list', result);
  return result;
};

// way: "海关导入" | "地址簿" | "全球搜"
// 里面 leads 相关的兼容逻辑暂无人调用，请移步 uniDrawerLeads 组件
const UniDrawer: React.FC<Props> = ({
  customerId,
  leadsId,
  customerData,
  visible,
  source,
  onSuccess,
  onClose,
  uniRecordId,
  uniType,
  contactId,
  scenario,
  relationParams,
}) => {
  const id = useMemo(() => {
    const recordId = customerId || uniRecordId || leadsId;
    console.log('UniDrawer id:', recordId);
    return recordId;
  }, [customerId, uniRecordId, leadsId]);
  const [contactList, setContactList] = useState<any[]>([]);

  const modulePermission = useSelector((state: RootState) => state.privilegeReducer.modules);

  const detail = useMemo(
    () =>
      id
        ? undefined
        : {
            ...customerData,
            customer_follow_status: undefined,
            customer_stage: undefined,
            create_type: source2CreateType[source as keyof typeof source2CreateType] ?? 1,
            social_media: customerData?.social_media_list ? getSocialPlatform(customerData?.social_media_list) : customerData?.social_media || [],
          },
    [id, customerData]
  );

  console.log('UniDrawer', id, customerData, visible, source, relationParams);

  const recordBehavior = useCallback(
    (action: TrackerAction) => {
      // eslint-disable-next-line no-nested-ternary
      const interact = id ? (customerData?.contact_list?.length ? TrackerInteract.Add : TrackerInteract.Open) : TrackerInteract.Create;
      dataTrackerApi.track('biz_interact_external_detail_iframe', {
        action,
        interact,
        module: source2TrackerModule[source],
        scenes: DataSource[source],
      });
    },
    [id, customerData, source]
  );

  // 线索可以继续跑这个逻辑，目前也用不上
  useEffect(() => {
    if (visible) {
      setContactList(ensureContactData(customerData!) ?? []);
      // 3 个月前 0415 的老代码被我注掉了，这个 id 传歪了约等于没传，主联系人后端有排序，第一个一定是主联系人，所以先不动已有逻辑了，老代码如下：
      // setContactList(ensureContactData(customerData!) ?? [], id);
    }
  }, [visible]);

  const handleSuccess = (param: any) => {
    recordBehavior(TrackerAction.SaveSucceed);
    // 新增支持的 view 线索抽屉暂不需要成功回调
    // if (leadsId) {
    //   onSuccess(leadsId);
    //   return;
    // }
    // 老的客户相关逻辑
    if (customerId) {
      if (source === 'waCustomer') {
        onSuccess(customerId);
      } else {
        onSuccess(customerId, param);
      }
    } else if (
      [
        'mailListStrangerSideBar',
        'waStranger',
        'addressBook',
        'mailFilterManual',
        'mailFilterAuto',
        'mailFilterOverview',
        'smartRcmd',
        'customs',
        'globalSearch',
      ].includes(source)
    ) {
      onSuccess(param.company_id);
    } else {
      onSuccess();
    }
  };

  if (!modulePermission || Object.keys(modulePermission).length === 0) {
    return null;
  }

  useEffect(() => {
    recordBehavior(TrackerAction.View);
  }, []);

  // 线索
  if (leadsId) {
    return <SiriusExternalLeadsView leadsId={id} show={visible} onClose={onClose} fromPageWay={source2TrackerModule[source]} />;
  }

  // 编辑联系人直接返回
  if (uniType === 'editContact' || uniType === 'editClueContact') {
    // 类型如下
    // contactId?: number;
    // customerId: number;
    // show: boolean;
    // detail?: BusinessContactVO;
    // onClose: () => void;
    // afterSubmitHandler?: (result?: any) => void;
    const idProp = {
      [uniType === 'editContact' ? 'customerId' : 'leadsId']: id,
    };
    return <SiriusExternalContactDetail show={visible} {...idProp} detail={detail} contactId={contactId} onClose={onClose} afterSubmitHandler={handleSuccess} />;
  }

  // visible外层包裹组件已经判断，此处可以不判断了
  return customerData?.contact_list?.length || !id || uniType === 'editCustomer' ? (
    <SiriusExternalDetail
      show={visible}
      detail={detail}
      customerId={id}
      contact_list={contactList}
      onClose={onClose}
      onSuccess={handleSuccess}
      handleContactListChange={setContactList}
      scenario={scenario}
      relationParams={relationParams}
    />
  ) : (
    <SiriusExternalView customerId={id} show={visible} onClose={onClose} /> // 其实这个组件 onSuccess 根本不会调用了。。。
  );
};

/**
 * @deprecated
 * 已废弃不再维护，不要再新增引用了，新需求使用 packages/web/src/components/Layout/CustomsData/components/uniDrawer/index.ts 里面 export 的组件
 * 相关引用未全部删除。原因是当前文件下的 uniDrawer 过于通用，有些场景已经失联，不利于回归测试（举例来说：id 定义也不太稳定，无法区分是详情还是编辑场景，也找不到注释）
 */
export default (props: Props) => {
  const { visible } = props;
  if (!visible) return null;

  return <UniDrawer {...props} />;
};
