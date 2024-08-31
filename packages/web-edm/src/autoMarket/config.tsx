import React from 'react';
import moment from 'moment';
import { Tag, Popover } from 'antd';
import { getTransText } from '@/components/util/translate';
import sendCountIcon from '@/images/icons/edm/autoMarket/sendCount.svg';
import triggerCountIcon from '@/images/icons/edm/autoMarket/triggerCount.svg';
import arriveCountIcon from '@/images/icons/edm/autoMarket/arriveCount.svg';
import readCountIcon from '@/images/icons/edm/autoMarket/readCount.svg';
import replyCountIcon from '@/images/icons/edm/autoMarket/replyCount.svg';
import unsubscribeCountIcon from '@/images/icons/edm/autoMarket/unsubscribeCount.svg';
import { CustomerCard } from '../components/CustomerCard';
import { getIn18Text } from 'api';

const renderTime = (date?: number | string) => {
  if (!date) {
    return '-';
  }
  return moment(date).format('YYYY-MM-DD HH:mm:SS');
};
export const TAB_ACTION_EDM = {
  type: 'actionEDM',
  text: getIn18Text('DONGZUO-YINGXIAOYOUJIAN'),
};
const TAB_EDM = {
  type: 'EDM',
  matchActionType: 'SEND_EDM',
  text: getTransText('FASONGYOUJIANYINGXIAO'),
};
const TAB_INFO = {
  type: 'info',
  matchActionType: 'UPDATE_CUSTOMER',
  text: getIn18Text('XINXIXIUGAI\uFF08FUJIA\uFF09'),
};

const UPDATE_ADDRESS_GROUP = {
  type: 'ADDRESS_GROUP',
  matchActionType: 'UPDATE_ADDRESS_GROUP',
  text: getIn18Text('GUANLIFENZU'),
};

export const defaultTabKey = 'actionEDM';
export const additionalTabList = [TAB_EDM, TAB_INFO, UPDATE_ADDRESS_GROUP];
export interface ITabList {
  type: 'actionEDM' | 'EDM' | 'info';
  text: string;
  key: string;
  isAdd?: boolean;
  addIndex?: number;
}

const renderEmailField = (handleExecListEmailClick: Function) => {
  return (text: string, item: any) => {
    return (
      <>
        {+item.contactAddressId ? <a onClick={() => handleExecListEmailClick(item)}>{text}</a> : <span>{text}</span>}
        {item.companyId ? (
          <Popover destroyTooltipOnHide trigger={'click'} content={<CustomerCard email={item.contactEmail} />}>
            <Tag color="success" style={{ cursor: 'pointer', marginLeft: 5 }}>
              {getTransText('KEHU')}
            </Tag>
          </Popover>
        ) : (
          ''
        )}
      </>
    );
  };
};

const getDefaultCardTabList = ({
  handleReadCountClick,
  handleReplyEmailClick,
  handleExecListEmailClick,
}: {
  handleReadCountClick: Function;
  handleReplyEmailClick: Function;
  handleExecListEmailClick: Function;
}) => [
  {
    key: 'execCount',
    icon: triggerCountIcon,
    text: getIn18Text('ExecutionRecord'),
    subTabs: [
      {
        name: getIn18Text('ExecutionRecord'),
        dataCode: 'execList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('ZHIXINGSHIJIAN'),
            dataIndex: 'execTime',
            key: 'execTime',
          },
          {
            title: getIn18Text('ExecutionRes'),
            dataIndex: 'execResult',
            key: 'execResult',
          },
        ],
      },
    ],
  },
  {
    key: 'sendCount',
    icon: sendCountIcon,
    text: getIn18Text('FAJIANZONGSHU'),
    subTabs: [
      {
        name: getIn18Text('YIFAJIAN'),
        dataCode: 'sendList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('FASONGSHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
      {
        name: getIn18Text('WEIFAJIAN'),
        dataCode: 'unSendList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('LIANXIREN'),
            dataIndex: 'contactName',
            key: 'contactName',
          },
          {
            title: getIn18Text('WEIFAJIANYUANYIN'),
            dataIndex: 'failReason',
            key: 'failReason',
          },
        ],
      },
    ],
  },
  {
    key: 'arriveCount',
    icon: arriveCountIcon,
    text: getIn18Text('SONGDAZONGSHU'),
    renderExtra(stats: any) {
      return `送达率:${stats.arriveRatio ? `${stats.arriveRatio / 100}%` : '0%'}`;
    },
    subTabs: [
      {
        name: getIn18Text('YISONGDA'),
        dataCode: 'arriveList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('SONGDASHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
      {
        name: getIn18Text('WEISONGDA'),
        dataCode: 'unArriveList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('LIANXIREN'),
            dataIndex: 'contactName',
            key: 'contactName',
          },
          {
            title: getIn18Text('WEISONGDAYUANYIN'),
            dataIndex: 'failReason',
            key: 'failReason',
          },
        ],
      },
    ],
  },
  {
    key: 'readCount',
    icon: readCountIcon,
    text: getIn18Text('DAKAIRENSHU'),
    renderExtra(stats: any) {
      return `打开率:${stats.readRatio ? `${stats.readRatio / 100}%` : '0%'}`;
    },
    subTabs: [
      {
        name: getIn18Text('YIDAKAI'),
        dataCode: 'readList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactMaskEmail',
            key: 'contactMaskEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('DAKAICISHU'),
            dataIndex: 'readCount',
            key: 'readCount',
            sorter: (a: any, b: any) => a.readCount - b.readCount,
            render: (text: string, item: any) => <a onClick={() => handleReadCountClick(item)}>{text}</a>,
          },
          {
            title: getIn18Text('ZUIXINDONGTAISHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
      {
        name: getIn18Text('WEIDAKAI'),
        dataCode: 'unreadList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactMaskEmail',
            key: 'contactMaskEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('ZUIXINDONGTAISHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
    ],
  },
  {
    key: 'replyCount',
    icon: replyCountIcon,
    text: getIn18Text('HUIFUZONGSHU'),
    renderExtra(stats: any) {
      return `回复率:${stats.replyRatio ? `${stats.replyRatio / 100}%` : '0%'}`;
    },
    subTabs: [
      {
        name: getIn18Text('YIHUIFU'),
        dataCode: 'replyList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('HUIFUYOUJIAN'),
            dataIndex: 'replyEmail',
            key: 'replyEmail',
            render: (text: string, item: any) => <a onClick={() => handleReplyEmailClick(item)}>{getIn18Text('CHAKAN')}</a>,
          },
          {
            title: getIn18Text('ZUIXINHUIFUSHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
      {
        name: getIn18Text('WEIHUIFU'),
        dataCode: 'unReplyList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          // {
          //   title: getIn18Text("ZUIXINHUIFUSHIJIAN"),
          //   dataIndex: 'date',
          //   key: 'date',
          //   render: renderTime
          // },
        ],
      },
    ],
  },
  {
    key: 'unsubscribeCount',
    icon: unsubscribeCountIcon,
    text: getIn18Text('TUIDINGZONGSHU'),
    subTabs: [
      {
        name: getIn18Text('TUIDINGZONGSHU'),
        dataCode: 'unsubscribeList',
        columns: [
          {
            title: getIn18Text('YOUXIANG'),
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: renderEmailField(handleExecListEmailClick),
          },
          {
            title: getIn18Text('TUIDINGSHIJIAN'),
            dataIndex: 'date',
            key: 'date',
            render: renderTime,
          },
        ],
      },
    ],
  },
];
export const getCardTabList = ({
  handleReadCountClick,
  handleReplyEmailClick,
  handleExecListEmailClick,
}: {
  handleReadCountClick: Function;
  handleReplyEmailClick: Function;
  handleExecListEmailClick: Function;
}) => {
  const defaultCardTabList = getDefaultCardTabList({
    handleReadCountClick,
    handleReplyEmailClick,
    handleExecListEmailClick,
  });
  return {
    actionEDM: defaultCardTabList,
    EDM: defaultCardTabList,
    info: [
      {
        key: 'execCount',
        icon: arriveCountIcon,
        text: getIn18Text('ExecutionRecord'),
        subTabs: [
          {
            name: getIn18Text('ExecutionRecord'),
            dataCode: 'updateInfoList',
            columns: [
              {
                title: getIn18Text('YOUXIANG'),
                dataIndex: 'contactEmail',
                key: 'contactEmail',
                render: renderEmailField(handleExecListEmailClick),
              },
              {
                title: getIn18Text('LIANXIREN'),
                dataIndex: 'contactName',
                key: 'contactName',
              },
            ],
          },
        ],
      },
    ],
    ADDRESS_GROUP: [
      {
        key: 'execCount',
        icon: triggerCountIcon,
        text: getIn18Text('ExecutionRecord'),
        subTabs: [
          {
            name: getIn18Text('ExecutionRecord'),
            dataCode: 'execList',
            columns: [
              {
                title: getIn18Text('YOUXIANG'),
                dataIndex: 'contactEmail',
                key: 'contactEmail',
                render: renderEmailField(handleExecListEmailClick),
              },
              {
                title: getIn18Text('ZHIXINGSHIJIAN'),
                dataIndex: 'execTime',
                key: 'execTime',
              },
              {
                title: getIn18Text('ExecutionRes'),
                dataIndex: 'execResult',
                key: 'execResult',
              },
            ],
          },
        ],
      },
    ],
  };
};
