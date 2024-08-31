import React from 'react';
import style from './seaClue.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';
const getColumns = (examineClue: (id: string) => void) => {
  return [
    {
      title: getIn18Text('XIANSUOMINGCHENG'),
      dataIndex: 'clue_name',
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
              examineClue(record.id);
            }}
          >
            {' '}
            {text || '-'}
          </span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('XIANSUOZHUANGTAI'),
      width: 152,
      dataIndex: 'clue_status_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XIANSUOLAIYUAN'),
      width: 184,
      dataIndex: 'clue_source_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('XIANSUOBEIZHU'),
      width: 188,
      dataIndex: 'clue_remark',
      render: text => (
        <EllipsisTooltip>
          <span> {text || '-'}</span>
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      width: 140,
      key: 'area',
      dataIndex: 'area',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('QIANFUZEREN'),
      width: 148,
      dataIndex: 'last_manager_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('ZUIJINTUIGONGHAIYUANYIN'),
      width: 162,
      dataIndex: 'last_return_reason',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('TUIGONGHAIBEIZHU'),
      width: 188,
      dataIndex: 'last_return_remark',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('TUIHUISHIJIAN'),
      width: 196,
      dataIndex: 'last_return_time',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      width: 188,
      key: 'clue_create_type_name',
      dataIndex: 'clue_create_type_name',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      key: 'clue_create_at',
      dataIndex: 'clue_create_at',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
    {
      title: getIn18Text('ZUIJINGENJINSHIJIAN'),
      dataIndex: 'last_follow_time',
      width: 196,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
      sorter: true,
    },
  ];
};
export { getColumns };
