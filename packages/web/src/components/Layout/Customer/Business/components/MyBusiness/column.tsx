import React from 'react';
import { Table, Alert, Tooltip, Pagination, Modal } from 'antd';
import style from './MyBusiness.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';
const modalStatus = {
  new: 'new',
  edit: 'edit',
  examine: 'examine',
};
const getNumber = nums => {
  if (isNaN(nums) || typeof nums === 'object') {
    return nums;
  } else {
    return Number(nums).toLocaleString();
  }
};
interface nameItem {
  name: string;
}
const getOwnerList = (text: nameItem[]) => {
  if (text && text.length) {
    return (
      <EllipsisTooltip>
        <span>{text.map(item => item.name).join(',') || '-'}</span>
      </EllipsisTooltip>
    );
  } else {
    return text;
  }
};
const getColumns = (editBusiness, examineBusiness) => {
  return [
    {
      title: getIn18Text('SHANGJIMINGCHENG'),
      dataIndex: 'name',
      width: 332,
      fixed: 'left',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record, index) => (
        <EllipsisTooltip>
          <span
            className={style.companyName}
            onClick={() => {
              examineBusiness(record.id);
            }}
          >
            {' '}
            {text || '-'}
          </span>
        </EllipsisTooltip>
      ),
      // <Tooltip placement="topLeft" title={text}>
      // </Tooltip>
    },
    {
      title: getIn18Text('GUANLIANKEHU'),
      width: 304,
      dataIndex: 'company_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('GUANLIANLIANXIREN'),
      width: 148,
      dataIndex: 'contact_name_list',
      render: text => <EllipsisTooltip>{(text && text.join(',')) || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHANGJILAIYUAN'),
      width: 184,
      dataIndex: 'source_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XUQIUCHANPIN'),
      width: 140,
      dataIndex: 'product',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('BIZHONG'),
      width: 116,
      dataIndex: 'currency_name',
      render: text => text || '-',
    },
    {
      title: getIn18Text('YUGUSHANGJIJINE'),
      width: 174,
      dataIndex: 'estimate',
      render: text => <EllipsisTooltip>{getNumber(text) || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('XIAOSHOUJIEDUAN'),
      width: 110,
      dataIndex: 'stage_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHENGJIAOJINE'),
      width: 174,
      dataIndex: 'turnover',
      render: text => <EllipsisTooltip>{getNumber(text) || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('CHENGJIAORIQI'),
      dataIndex: 'deal_at',
      width: 152,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('CHENGJIAOXINXI'),
      dataIndex: 'deal_info',
      width: 188,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('BEIZHU'),
      width: 188,
      dataIndex: 'remark',
      ellipsis: {
        showTitle: false,
      },
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIJINGENJINSHIJIAN'),
      dataIndex: 'follow_at',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      dataIndex: 'create_at',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('WANGLAIYOUJIAN'),
      width: 140,
      dataIndex: 'email_cnt',
      sorter: true,
    },
    {
      title: getIn18Text('BENJIEDUANTINGLIUSHIJIAN'),
      dataIndex: 'stage_time',
      width: 166,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    // {
    //     title: '跟进人',
    //     dataIndex: 'follow_by',
    //     width: 116,
    //     render:text => text || '-',
    // },
    {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_list',
      width: 148,
      render: text => getOwnerList(text) || '-',
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'operation',
      fixed: 'right',
      width: 85,
      render: (text, record, index) => (
        <a
          onClick={() => {
            editBusiness(record.id, modalStatus.edit);
          }}
        >
          {getIn18Text('BIANJI')}
        </a>
      ),
    },
  ];
};
export { getColumns };
