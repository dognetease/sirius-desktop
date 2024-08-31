import React from 'react';
import { api, OpportunityDetail as OpportunityDetailType } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import style from './baseInfo.module.scss';
import { getIn18Text } from 'api';
interface BaseInfoProps {
  detail: OpportunityDetailType;
}
const systemApi = api.getSystemApi();
const BaseInfo: React.FC<BaseInfoProps> = ({ detail }) => {
  const baseInfo = [
    {
      key: 'company_name',
      label: getIn18Text('GUANLIANKEHU'),
      content: (
        <span
          className={style.link}
          onClick={() => {
            const previewPath = `/customerPreview/?company_id=${detail.company_id}`;
            systemApi.handleJumpUrl(Date.now(), previewPath);
          }}
        >
          {detail.company_name}
        </span>
      ),
    },
    {
      key: 'source',
      label: getIn18Text('SHANGJILAIYUAN'),
      content: detail.source_name,
    },
    {
      key: 'product',
      label: getIn18Text('XUQIUCHANPIN'),
      content: detail.product,
    },
    {
      key: 'estimate',
      label: getIn18Text('YUGUSHANGJIJINE'),
      content: () => {
        const value = detail.estimate !== null ? Number(detail.estimate).toLocaleString() : '';
        return detail.currency_code ? `${detail.currency_code} ${value}` : value;
      },
    },
    {
      key: 'deal_at',
      label: getIn18Text('CHENGJIAORIQI'),
      content: detail.deal_at,
    },
    {
      key: 'turnover',
      label: getIn18Text('CHENGJIAOJINE'),
      content: () => {
        const value = detail.turnover !== null ? Number(detail.turnover).toLocaleString() : '';
        return detail.currency_code ? `${detail.currency_code} ${value}` : value;
      },
    },
    {
      key: 'deal_info',
      label: getIn18Text('CHENGJIAOXINXI'),
      content: detail.deal_info,
    },
    {
      key: 'stage',
      label: getIn18Text('XIAOSHOUJIEDUAN'),
      content: detail.stage?.name,
    },
    {
      key: 'remark',
      label: getIn18Text('BEIZHU'),
      content: detail.remark,
    },
  ];
  const systemInfo = [
    {
      key: 'stage_time',
      label: getIn18Text('BENJIEDUANTINGLIUSHIJIAN'),
      content: detail.stage_time,
    },
    {
      key: 'create_at',
      label: getIn18Text('CHUANGJIANSHIJIAN'),
      content: detail.create_at,
    },
    {
      key: 'create_by',
      label: getIn18Text('CHUANGJIANREN'),
      content: detail.create_by,
    },
    {
      key: 'update_at',
      label: getIn18Text('ZILIAOGENGXINSHIJIAN'),
      content: detail.update_at,
    },
    {
      key: 'update_by',
      label: getIn18Text('GENGXINREN'),
      content: detail.update_by,
    },
    {
      key: 'follow_at',
      label: getIn18Text('ZUIJINGENJINSHIJIAN'),
      content: detail.follow_at,
    },
    {
      key: 'manager_list',
      label: getIn18Text('FUZEREN'),
      content: detail?.manager_list?.map(item => item.name || '-').join('，'),
    },
  ];
  return (
    <div className={style.baseInfo}>
      <InfoLayout list={baseInfo} />
      <div className={style.divider} />
      <div className={style.systemInfo}>{getIn18Text('XITONGXINXI')}</div>
      <InfoLayout list={systemInfo} />
    </div>
  );
};
export default BaseInfo;
