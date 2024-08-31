import { EdmSendConcatInfo } from 'api';
import React from 'react';
import { message } from 'antd';
import { getIn18Text } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { EDMAPI, guardString } from '../../utils';
// public enum EmailVerifyStatus {

//   /**
//    * 邮箱有效性验证结果
//    */
//   UNCHECKED(-1, EmailVerifyOp.NOT_OPTIONAL, "未检测", ""),
//   INVALID(0, EmailVerifyOp.OPTIONAL, "无效地址", "即地址可能为空，将发送失败。"),
//   VALID(1, EmailVerifyOp.ADDED, "有效地址", ""),
//   UNKNOWN(2, EmailVerifyOp.SELECTED, "疑似不活跃地址", "经检测，此邮箱长时间未存在收发信行为。"),
//   DOMAIN_ERROR(3, EmailVerifyOp.NOT_OPTIONAL, "域名服务器错误", "域名查询后，没有找到相应的MX记录。"),
//   SEND_LIMIT(4, EmailVerifyOp.NOT_OPTIONAL, "发信受限", "来自对方服务器的安全限制，导致今日发送超限。"),
//   SAME_DOMAIN(5, EmailVerifyOp.NOT_OPTIONAL, "同域服务器冲突", "当您使用非网易企业邮箱登录系统，将无法给同域服务器邮箱地址发信。若想发送，请咨询商务同事进行升级。"),
//   PUBLIC_MAIL(6, EmailVerifyOp.OPTIONAL, "企业公共邮箱", "系统自动识别，一般为企业官网展示的公共邮箱，例如邮件名称support@xxx.com，info@xxx.com。"),
//   GOVERNMENT_MAIL(7, EmailVerifyOp.OPTIONAL, "党政机关", "邮箱地址后缀中包含gov的地址，此类地址多为政府邮箱，请谨慎选择。"),
//   EDUCATION_MAIL(8, EmailVerifyOp.OPTIONAL, "学术机构", "邮箱地址后缀中包含edu的地址，此类地址多为学校或科研机构邮箱。");

// public enum ContactStatus {

//   /**
//    * 联系人验证结果状态
//    */
//   NORMAL(0, "正常"),
//   NOT_CONTACT(1, "不是联系人"),
//   REVERT(2, "退订"),
//   INVALID(3, "无效"),
//   BLACKLIST(4, "营销黑名单"),
//   RECENT_SENT_1(5, "今日已发送"),
//   RECENT_SENT_3(6, "3日内已发送"),
//   /*SEND_LIMIT(7, "发信限制")*/
//   COLLEAGUE_CUSTOMER(8, "同事客户"),
//   COLLEAGUE_CLUE(9, "同事线索"),
//   REPLIED(10, "回复过"),
//   RECENT_SENT_1_WEEK(11, "1周内已发送"),
//   RECENT_SENT_1_MONTH(12, "1个月内已发送"),
//   DENIED(13, "曾退信"),
//   ARRIVED(14, "送达过");

export type AbnormalType =
  | 'invalid'
  | 'sendIn24h'
  | 'sendIn72h'
  | 'colleagueCustomer'
  | 'colleagueClue'
  | 'hasReply'
  | 'sendIn1Week'
  | 'sendIn1Month'
  | 'hasSend'
  | 'hasReturn'
  | 'enterpriseMailbox'
  | 'governmentOrgans'
  | 'academicInstitution';
export interface AbnormalTypeModel {
  label: string;
  value: string;
  id: number;
  type: number; // 1: 直接删除 2: 建议清除 3: 建议保留
  checked?: boolean;
  // 给业务用的
  emails?: string[];
  // 展示优先级
  priority?: number;
}

export type ReceiversMapModel = Map<string, Map<string, EdmSendConcatInfo>>;

export const TypesMap: Record<string, AbnormalTypeModel> = {
  invalid: {
    label: getIn18Text('YICHANG(WUXIAO)'),
    value: 'invalid',
    id: -1,
    type: 1,
  },
  hasReturn: {
    label: getIn18Text('CENGJUXIN'),
    value: 'hasReturn',
    id: 13,
    type: 1,
    priority: 5,
  },
  emailUnknown: {
    label: '长期不活跃',
    value: 'emailUnknown',
    id: 102,
    type: 2,
    priority: 8,
  },
  governmentOrgans: {
    label: getIn18Text('DANGZHENGJIGUAN'),
    value: 'governmentOrgans',
    id: 107,
    type: 2,
    priority: 9,
  },
  enterpriseMailbox: {
    label: getIn18Text('QIYEGONGGONGYOUXIANG'),
    value: 'enterpriseMailbox',
    id: 106,
    type: 2,
    priority: 10,
  },
  academicInstitution: {
    label: getIn18Text('XUESHUJIGOU'),
    value: 'academicInstitution',
    id: 108,
    type: 2,
    priority: 11,
  },
  sendIn24h: {
    label: '24小时内发送过',
    value: 'sendIn24h',
    id: 5,
    type: 2,
    priority: 12,
  },
  sendIn72h: {
    label: '72小时内发送过',
    value: 'sendIn72h',
    id: 6,
    type: 2,
    priority: 13,
  },
  colleagueCustomer: {
    label: getIn18Text('TONGSHIKEHU'),
    value: 'colleagueCustomer',
    id: 8,
    type: 2,
    priority: 14,
  },
  colleagueClue: {
    label: getIn18Text('TONGSHIXIANSUO'),
    value: 'colleagueClue',
    id: 9,
    type: 2,
    priority: 15,
  },
  myCustomer: {
    label: '我的客户',
    value: 'myCustomer',
    id: 15,
    type: 3,
    priority: 20,
  },
  myClue: {
    label: '我的线索',
    value: 'myClue',
    id: 16,
    type: 3,
    priority: 21,
  },
  hasReply: {
    label: getIn18Text('HUIFUGUO'),
    value: 'hasReply',
    id: 10,
    type: 2,
    priority: 16,
  },
  sendIn1Week: {
    label: '一周内发送过',
    value: 'sendIn1Week',
    id: 11,
    type: 3,
    priority: 17,
  },
  sendIn1Month: {
    label: '一个月内发送过',
    value: 'sendIn1Month',
    id: 12,
    type: 3,
    priority: 18,
  },
  hasSend: {
    label: getIn18Text('SONGDAGUO'),
    value: 'hasSend',
    id: 14,
    type: 3,
    priority: 19,
  },
};

export const InvalidStatusMap: Record<number, AbnormalTypeModel> = {
  2: {
    label: '无效地址：曾退订',
    value: 'revert',
    id: 2,
    type: 1,
    priority: 4,
  },
  3: {
    label: '无效地址：地址不存在',
    value: 'invalid',
    id: 3,
    type: 1,
    priority: 1,
  },
  4: {
    label: '无效地址：营销黑名单',
    value: 'blacklist',
    id: 4,
    type: 1,
    priority: 3,
  },
  7: {
    label: '无效地址：对方服务器发信超限',
    value: 'sendLimit',
    id: 7,
    type: 1,
  },
  100: {
    label: '无效地址：地址可能不存在',
    value: 'invalid',
    id: 100,
    type: 1,
    priority: 1,
  },
  103: {
    label: '无效地址：域名服务器错误',
    value: 'emailDomainError',
    id: 103,
    type: 1,
    priority: 2,
  },
  104: {
    label: '无效地址：对方服务器发信限制，今日超限无法发送',
    value: 'emailSendLimit',
    id: 104,
    type: 1,
    priority: 6,
  },
  105: {
    label: '无效地址：同域服务器冲突',
    value: 'emailSameDomain',
    id: 105,
    type: 1,
    priority: 7,
  },
};

export const errorContactStatusList = [
  {
    value: 1.5,
    label: getIn18Text('KENENGWUXIAO'),
  },
  {
    value: 3,
    label: getIn18Text('GESHICUOWU'),
  },
  {
    value: 4,
    label: getIn18Text('YINGXIAOHEIMINGDAN'),
  },
  {
    value: 7,
    label: getIn18Text('FAXINPINLVXIANZHI'),
  },
];

export const warningContactStatusList = [
  {
    value: 5,
    label: getIn18Text('24XIAOSHINEIYIFASONG'),
  },
  {
    value: 6,
    label: getIn18Text('72XIAOSHINEIYIFASONG'),
  },
  {
    value: 8,
    label: getIn18Text('TONGSHIKEHU'),
  },
  {
    value: 9,
    label: getIn18Text('TONGSHIXIANSUO'),
  },
  {
    value: 11,
    label: getIn18Text('YIZHOUNEICHUDAGUO'),
  },
  {
    value: 12,
    label: getIn18Text('YIYUENEICHUDAGUO'),
  },
  {
    value: 13,
    label: getIn18Text('CENGJUXIN'),
  },
  {
    value: 10,
    label: getIn18Text('HUIFUGUO'),
  },
  {
    value: 14,
    label: getIn18Text('SONGDAGUO'),
  },
];

export interface VertifyEmailModel {
  email: string;
  name: string;
  sourceName?: string;
  contactStatus?: number;
}

export const myPromiseAll = (arr: any[], limit: number = 3) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const n = arr.length;
    const res = new Array(n);
    let index = 0;
    function step(i) {
      if (count === n) {
        resolve(res);
        return;
      }
      if (arr[index]) {
        arr[index]
          .then(result => {
            res[i] = result;
            count++;
            step(index);
          })
          .catch(err => {
            reject(err);
          });
      }
      index++;
    }
    for (let i = 0; i < limit; i++) {
      step(i);
    }
  });
};

export const splitList = (arr: any[], count: number) => {
  var temp = [];
  var result = [];
  var k = 0;

  for (var i = 0; i < arr.length; ++i) {
    if (i % count == 0) {
      temp = [];
      for (var j = 0; j < count; ++j) {
        if (arr[i + j] == undefined) {
          continue;
        } else {
          temp[j] = arr[i + j];
        }
      }
      result[k] = temp;
      k++;
    }
  }
  return result;
};

export const RightIcon: React.FC<any> = (props: any) => {
  const { fillColor1, fillColor2 } = props;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3H9.33333L13 8L9.33333 13H7L10.6667 8L7 3Z" fill={fillColor1} />
      <path d="M2 3H4.33333L8 8L4.33333 13H2L5.66667 8L2 3Z" fill={fillColor2} />
    </svg>
  );
};

export const MustDeleteIcon: React.FC<any> = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z" fill="#FE5B4C" />
      <path d="M5.70044 5.7002L10.3 10.2997M10.2995 5.7002L5.69995 10.2997" stroke="white" stroke-linecap="round" />
    </svg>
  );
};

export const CanDeleteIcon: React.FC<any> = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#FFB54C" />
      <path d="M8 4.7002V9.00018" stroke="white" stroke-linecap="round" />
      <path
        d="M8.60002 11.1C8.60002 11.4314 8.3314 11.7 8.00002 11.7C7.66865 11.7 7.40002 11.4314 7.40002 11.1C7.40002 10.7686 7.66865 10.5 8.00002 10.5C8.3314 10.5 8.60002 10.7686 8.60002 11.1Z"
        fill="white"
      />
    </svg>
  );
};

export const SuggestKeepIcon: React.FC<any> = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#0FD683" />
      <path d="M5.30005 8L7.42137 10.1213C7.42137 10.1213 9.74027 7.80242 11.3105 6.23223" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export const MaximizeIcon: React.FC<any> = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3H3V7" stroke="#8D92A1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M3.5 3.5L7 7" stroke="#8D92A1" stroke-linecap="round" />
      <path d="M13 9V13H9" stroke="#8D92A1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12.5 12.5L9 9" stroke="#8D92A1" stroke-linecap="round" />
    </svg>
  );
};

export const HandleMethodsMap: Record<number, any> = {
  1: {
    label: getIn18Text('ZHIJIEQINGCHU'),
    icon: <MustDeleteIcon />,
  },
  2: {
    label: getIn18Text('JIANYIQINGCHU'),
    icon: <CanDeleteIcon />,
  },
  3: {
    label: getIn18Text('JIANYIBAOLIU'),
    icon: <SuggestKeepIcon />,
  },
};

export interface FilterStrategySection {
  name?: string;
  subTitle?: string;
  checkAll?: boolean;
  strategy?: Array<AbnormalTypeModel>;
}

export const FilterStrategy: Array<FilterStrategySection> = [
  {
    name: '无效地址',
    strategy: [TypesMap.emailUnknown, InvalidStatusMap[103], InvalidStatusMap[3], InvalidStatusMap[7], InvalidStatusMap[105]],
  },
  {
    name: '异常状态',
    strategy: [InvalidStatusMap[2], InvalidStatusMap[4], TypesMap.hasReturn],
  },
  {
    name: '特殊邮箱',
    strategy: [TypesMap.governmentOrgans, TypesMap.enterpriseMailbox, TypesMap.academicInstitution],
  },
  {
    name: '重复发信',
    strategy: [TypesMap.sendIn24h, TypesMap.sendIn72h, TypesMap.hasReply, TypesMap.sendIn1Week, TypesMap.sendIn1Month, TypesMap.hasSend],
  },
  {
    name: 'CRM客户',
    subTitle: '（收件人超过1000暂不支持匹配CRM客户）',
    strategy: [TypesMap.myCustomer, TypesMap.myClue, TypesMap.colleagueCustomer, TypesMap.colleagueClue],
  },
];

const beginAndEndTime = {
  begin: 0,
  end: 0,
  reduceTime: 0,
};

export const TrackTime: Record<string, any> = {
  totalTime: cloneDeep(beginAndEndTime), // 过滤总耗时
  v2Time: cloneDeep(beginAndEndTime), // v2接口耗时
  checkTime: cloneDeep(beginAndEndTime), // 联系人数量
};

// 4: 营销黑名单(v2)
// 4: 同域限制(check)
// 2: 退订(v2)
// 3: 域名服务器错误(check)
// 3: 地址不存在(v2)
// 3: 格式错误(local)
// 7: 发信频率限制
export const ContactInvalidStatus = [2, 3, 4, 7];

// 0 "无效地址"  3, "域名服务器错误" 4, "发信受限", 5, "同域服务器冲突"
export const AllInvalidStatusCode = ContactInvalidStatus.concat([100, 103, 104, 105]);

export const getIdToValueData = () => {
  const idToValueMap: Map<number, string> = new Map();
  const idToLabelMap: Map<number, string> = new Map();
  const idToPriorityMap: Map<number, string> = new Map();
  const idToHandleMethodMap: Map<number, number> = new Map();
  const allParentList: AbnormalTypeModel[] = [];

  for (const key in TypesMap) {
    const value = TypesMap[key] as AbnormalTypeModel;
    const valuePriority = (value.priority || '') + '';
    idToValueMap.set(value.id, key);
    idToLabelMap.set(value.id, value.label);
    idToPriorityMap.set(value.id, valuePriority);
    idToHandleMethodMap.set(value.id, value.type);
    allParentList.push(value);
  }

  for (const key in InvalidStatusMap) {
    const valuePriority = (InvalidStatusMap[key].priority || '') + '';
    idToLabelMap.set(parseInt(key), InvalidStatusMap[key].label);
    idToPriorityMap.set(parseInt(key), valuePriority);
    idToValueMap.set(parseInt(key), InvalidStatusMap[key].value);
  }

  return {
    idToValueMap,
    idToLabelMap,
    idToPriorityMap,
    idToHandleMethodMap,
    allParentList,
  };
};

export const EmailOtherStatusList = [1, 2, 6, 7, 8];

export const EmailVerifyOtherMap: Record<number, string> = {
  6: 'enterpriseMailbox',
  7: 'governmentOrgans',
  8: 'academicInstitution',
  2: 'emailUnknown',
};
