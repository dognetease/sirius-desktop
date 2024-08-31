/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { CustomerDetail } from 'api';
import { message } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { ReactComponent as CopyIcon } from '@/images/mailCustomerCard/clipboard-copy.svg';
import style from './baseInfo.module.scss';
import EllipsisLabels from '../../ellipsisLabels/ellipsisLabels';
import EllipsisTooltip from '../../ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';
import moment from 'moment';

interface BaseInfoConfig<T> {
  key: string;
  label: string;
  render?: (data: T) => React.ReactNode | React.ReactDOM | string;
}
const config: BaseInfoConfig<CustomerDetail>[] = [
  {
    key: 'company_name',
    label: getIn18Text('GONGSIMINGCHENG'),
  },
  {
    key: 'short_name',
    label: getIn18Text('GONGSIJIANCHENG'),
  },
  {
    key: 'area',
    label: getIn18Text('GUOJIADEQU'),
    render(data) {
      return Array.isArray(data.area) ? data.area.filter(i => !!i).join('/') : data.area;
    },
  },
  {
    key: 'website',
    label: getIn18Text('GUANWANG'),
    render(data) {
      const href = data.website || data.company_domain;
      if (href) {
        const link = href.startsWith('https://') || href.startsWith('http://') ? href : 'http://' + href;
        return (
          <a href={link} target="_blank" rel="noreferrer">
            {href}
          </a>
        );
      }
      return '-';
    },
  },
  {
    key: 'telephone',
    label: getIn18Text('ZUOJIDIANHUA'),
    render(data) {
      if (!data.telephone) {
        return '-';
      }
      return (
        <div>
          <span>{data.telephone || '-'}</span>
          <CopyToClipboard
            onCopy={(_, result) => {
              message.success({
                icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                content: <span style={{ marginLeft: 8 }}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
              });
            }}
            text={data.telephone}
          >
            <CopyIcon className={style.rowIcon} />
          </CopyToClipboard>
        </div>
      );
    },
  },
  {
    key: 'company_level',
    label: getIn18Text('KEHUFENJI'),
  },
  {
    key: 'source',
    label: getIn18Text('KEHULAIYUAN'),
  },
  {
    key: 'label_list',
    label: getIn18Text('KEHUBIAOQIAN'),
    render(data) {
      return <EllipsisLabels className={style.labels} isMailPlus list={data.label_list} deletable={false} />;
    },
  },
  {
    key: 'manager_list',
    label: getIn18Text('FUZEREN'),
    render(data) {
      return <EllipsisTooltip>{data.manager_list?.map(item => item.name || '-').join('，')}</EllipsisTooltip>;
    },
  },
  {
    key: 'create_time',
    label: getIn18Text('CHUANGJIANSHIJIAN'),
    render(data) {
      // return data.system_info.create_time;
      return data.system_info?.create_time ? moment(+data.system_info?.create_time).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    key: 'create_user',
    label: getIn18Text('CHUANGJIANREN'),
    render(data) {
      return <EllipsisTooltip>{data?.system_info?.create_user}</EllipsisTooltip>;
    },
  },
  {
    key: 'remark',
    label: '备注',
    render(data) {
      return <EllipsisTooltip>{data.remark}</EllipsisTooltip>;
    },
  },
];
const renderFun = (data: CustomerDetail | undefined, item: BaseInfoConfig<CustomerDetail>) => {
  if (!data) {
    return '-';
  }
  if (item.render) {
    return item.render(data) || '-';
  }
  return (data as any)[item.key] || '-';
};
export const CustomerBaseInfo = ({ data }: { data?: CustomerDetail }) => (
  <div style={{ position: 'relative', height: '100%' }}>
    <div style={{ position: 'absolute', overflow: 'hidden auto', height: '100%', width: '100%' }}>
      {config.map(item => (
        <div key={item.key} className={style.infoRow}>
          <label>{item.label}</label>
          <div className={style.rowValue}>{renderFun(data, item)}</div>
        </div>
      ))}
    </div>
  </div>
);
