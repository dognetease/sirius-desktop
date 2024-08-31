import React from 'react';
import { getIn18Text } from 'api';
import { ColumnType } from 'antd/lib/table';
import style from './index.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import CustomerTag from '@/components/Layout/globalSearch/component/CustomerTag';
import { getCustomerAndLeadsTagInList } from '@/components/Layout/globalSearch/utils';
import { renderDataTagList } from '@/components/Layout/utils';
import Translate from '@/components/Layout/CustomsData/components/Translate/translate';
import NationFlag from '../NationalFlag';
import classNames from 'classnames';
interface Props {
  handler: (behavior: 'relation' | 'globalDetail' | 'customsDetail', record: any) => void;
  visitedIds?: Set<string>;
}

export const getFissionTableColumns = ({ handler, visitedIds }: Props): Array<ColumnType<any>> => [
  {
    title: getIn18Text('GONGSIMINGCHENG'),
    dataIndex: 'name',
    key: 'name',
    width: 300,
    render: (text: string, record: any) => {
      const tagProps = getCustomerAndLeadsTagInList({ referId: record?.referId, customerLabelType: record.customerLabelType });
      return (
        <div
          className={classNames(style.companyNameItem, {
            [style.isOpacity]: record.visited || visitedIds?.has(record.id),
          })}
        >
          <EllipsisTooltip>
            <span
              style={{ marginRight: '5px', cursor: 'pointer' }}
              onClick={e => {
                e.preventDefault();
                handler('customsDetail', record);
              }}
            >
              {text || '-'}
            </span>
          </EllipsisTooltip>
          {renderDataTagList([
            {
              content: tagProps ? <CustomerTag tagProps={tagProps} companyName={record.name} country={record.country} source="globalSearch" /> : null,
              priority: true,
              style: 'green',
            },
            {
              content: record.potentialCustomerLevelLabel,
              style: 'blue',
            },
            {
              content: record.viewCountDesc ? record.viewCountDesc : '',
              style: 'yellow',
            },
          ])}
        </div>
      );
    },
  },
  {
    title: getIn18Text('GUOJIA/DEQU'),
    dataIndex: 'country',
    key: 'country',
    width: 124,
    render: (text: string, record: any) => {
      return (
        <div
          className={classNames({
            [style.isOpacity]: record.visited || visitedIds?.has(record.id),
          })}
        >
          {text ? <NationFlag showLabel name={text} /> : null}
        </div>
      );
    },
  },
  {
    title: '联系人数量',
    dataIndex: 'contactCount',
    key: 'contactCount',
    width: 124,
    render: (text: string, record: any) => {
      return (
        <div
          className={classNames({
            [style.isOpacity]: record.visited || visitedIds?.has(record.id),
          })}
        >
          {text || null}
        </div>
      );
    },
  },
  {
    title: getIn18Text('companyDesc'),
    dataIndex: 'overviewDescription',
    key: 'overviewDescription',
    width: 300,
    render: (text: string, record: any) => {
      const { overviewDescription } = record;
      return (
        <div className={style.companyDescWrapper}>
          <div
            className={classNames(style.companyDesc, {
              [style.isOpacityColor]: record.visited || visitedIds?.has(record.id),
            })}
          >
            {overviewDescription}
          </div>
          <Translate getPopupContainer={triggerNode => triggerNode} classnames={style.fissionTranslate} title={overviewDescription} />
        </div>
      );
    },
  },
  {
    title: getIn18Text('CAOZUO'),
    dataIndex: 'id',
    width: 150,
    fixed: 'right',
    render: (id: string, record: any) => (
      <div
        className={classNames(style.opCell, {
          [style.isOpacity]: record.visited || visitedIds?.has(record.id),
        })}
      >
        <span style={{ color: '#4C6AFF', cursor: 'pointer' }} onClick={() => handler('relation', record)}>
          查看关系图
        </span>
      </div>
    ),
  },
];
