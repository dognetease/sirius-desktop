import React from 'react';
import { ColumnType } from 'antd/lib/table';
import { getIn18Text, CustomerLabelByEmailItem } from 'api';
import { Scenes, SiriusCustomerTagByEmail } from '@lxunit/app-l2c-crm';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './style.module.scss';
import SocailMediaLink, { autoDetect } from '../../globalSearch/component/SocialMediaLink/SocialMediaLink';
import { renderDataTagList } from '../../utils';

const baseRender = (text: string, row: any) => (
  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
    <div style={{ marginRight: '8px' }}>{text}</div>
    {renderDataTagList([
      {
        content: row?.deliveredLabel || '',
        style: 'blue',
      },
    ])}
  </div>
);

const linkRender = (link: string) => (
  <SocailMediaLink tipType={autoDetect(link)} href={link} target="_blank">
    {link}
  </SocailMediaLink>
);

export const phoneColumns = [
  {
    title: getIn18Text('WhatsAppNumber') || '',
    width: 220,
    dataIndex: 'phoneNumber',
    render: baseRender,
  },
  {
    title: getIn18Text('CountryRegion') || '',
    width: 120,
    ellipsis: true,
    dataIndex: 'countryCname',
  },
  {
    title: getIn18Text('PageTitle') || '',
    ellipsis: true,
    dataIndex: 'title',
  },
  {
    title: getIn18Text('SourceLink') || '',
    width: 300,
    ellipsis: true,
    dataIndex: 'linkUrl',
    render: linkRender,
  },
];

export const getEmailColumns = (emailMap: Record<string, CustomerLabelByEmailItem[]>): Array<ColumnType<any>> => [
  {
    title: getIn18Text('YOUXIANG'),
    width: 220,
    ellipsis: true,
    dataIndex: 'email',
    render: (text: string) => (
      <div>
        <EllipsisTooltip>{text}</EllipsisTooltip>
        {Boolean(emailMap[text]?.length) && (
          <div>
            <SiriusCustomerTagByEmail source={Scenes.intelligentSearchLabel} email={text} labelInfos={emailMap[text]} />
          </div>
        )}
      </div>
    ),
  },
  {
    title: getIn18Text('PageTitle') || '',
    ellipsis: true,
    dataIndex: 'title',
  },
  {
    title: getIn18Text('SourceLink') || '',
    width: 300,
    ellipsis: true,
    dataIndex: 'linkUrl',
    render: linkRender,
  },
];

export const getGroupColumns = (addHandler: (waGroup: string) => void): Array<ColumnType<any>> => [
  {
    title: '群组链接',
    width: 400,
    ellipsis: true,
    dataIndex: 'waGroup',
    render: (text: string, record: any) => (
      <div>
        <EllipsisTooltip>
          <a className={style.waGroupLink} href={text} target="_blank" rel="noreferrer">
            {text}
          </a>
        </EllipsisTooltip>
        <div>
          {renderDataTagList([
            {
              content: record?.deliveredLabel || '',
              style: 'blue',
            },
          ])}
        </div>
      </div>
    ),
  },
  {
    title: getIn18Text('PageTitle') || '',
    ellipsis: true,
    dataIndex: 'title',
    render: (text: string, record: any) => (
      <a className={style.waGroupLink} href={record.linkUrl} target="_blank" rel="noreferrer">
        {text}
      </a>
    ),
  },
  {
    title: getIn18Text('CAOZUO'),
    dataIndex: 'id',
    width: 88,
    fixed: 'right',
    render: (id: string, record: any) =>
      !record.delivered ? (
        <span style={{ color: '#4C6AFF', cursor: 'pointer' }} onClick={() => addHandler(record.waGroup)}>
          加入群组
        </span>
      ) : (
        <span style={{ color: '#B7C3FF', cursor: 'not-allowed' }}>已加入</span>
      ),
  },
];
