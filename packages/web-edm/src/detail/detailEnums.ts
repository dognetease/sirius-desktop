import { getIn18Text } from 'api';

export interface DetailTabConfig {
  tabIndex: number;
  configEnum?: DetailTabOption;
  title?: string;
  valueKey?: string; // 对应的 server 端的 value 字段
  subTitle?: string;
  subValueKey?: string; // 对应的 server 端的 value 字段
  hide?: boolean;
  detailValueKey?: string; // 对应的 server 端的 详情数据 字段
}

export interface DetailModalInfo {
  data?: any[];
  visible: boolean;
}

export enum ReplyTypeEnum {
  All = 'all',
  Available = 'available',
  Auto = 'auto',
}

export enum MarketingCountEnum {
  All = 'all',
  Filtered = 'filtered',
}

export enum SendedTypeEnum {
  All = 'all',
  Bounced = 'Bounced',
}

export enum DetailTabOption {
  Marketing = 'Marketing',
  Receiver = 'Receiver',
  Sended = 'Sended',
  Open = 'Open',
  Reply = 'Reply',
  Unsub = 'Unsub',
  Link = 'Link',
  Prod = 'Prod',
}

export const getTabConfig = (tab: DetailTabOption): DetailTabConfig => {
  let config: DetailTabConfig = { tabIndex: -1 };
  switch (tab) {
    case DetailTabOption.Marketing:
      config = {
        tabIndex: 0,
        title: getIn18Text('YINGXIAORENSHU'),
        valueKey: 'contactsCount',
        detailValueKey: 'contactInfoList',
      };
      break;
    case DetailTabOption.Receiver:
      config = {
        tabIndex: 1,
        title: getIn18Text('FAJIANZONGSHU'),
        valueKey: 'sendCount',
        detailValueKey: 'sendList',
      };
      break;

    case DetailTabOption.Sended:
      config = {
        tabIndex: 2,
        title: getIn18Text('SONGDAZONGSHU'),
        valueKey: 'arriveCount',
        subTitle: getIn18Text('SONGDALV'),
        subValueKey: 'arriveRatio',
        detailValueKey: 'arriveList',
      };
      break;

    case DetailTabOption.Open:
      config = {
        tabIndex: 3,
        title: getIn18Text('DAKAIRENSHU'),
        valueKey: 'readCount',
        subTitle: getIn18Text('DAKAILV'),
        subValueKey: 'readRatio',
        detailValueKey: 'readList',
      };
      break;

    case DetailTabOption.Reply:
      config = {
        tabIndex: 4,
        title: getIn18Text('HUIFUZONGSHU'),
        valueKey: 'replyCount',
        subTitle: getIn18Text('HUIFULV'),
        subValueKey: 'replyRatio',
        detailValueKey: 'replyList',
      };
      break;

    case DetailTabOption.Unsub:
      config = {
        tabIndex: 5,
        title: getIn18Text('TUIDINGZONGSHU'),
        valueKey: 'unsubscribeCount',
        detailValueKey: 'unsubscribeList',
      };
      break;

    case DetailTabOption.Link:
      config = {
        tabIndex: 6,
        title: getIn18Text('LIANJIEDIANJIRENSHU'),
        valueKey: 'traceCount',
        detailValueKey: 'traceLogList',
      };
      break;

    case DetailTabOption.Prod:
      config = {
        tabIndex: 7,
        title: getIn18Text('SHANGPINDIANJIRENSHU'),
        valueKey: 'productClickNum',
      };
      break;

    default:
      break;
  }
  config.configEnum = tab;
  return config;
};
