import React from 'react';
import { openSeaDetail as ClueDetailType } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import style from './baseInfo.module.scss';
import { getIn18Text } from 'api';
interface BaseInfoProps {
  detail: ClueDetailType;
}
const BaseInfo: React.FC<BaseInfoProps> = ({ detail }) => {
  console.log('detail-info', detail);
  const baseInfo = [
    {
      key: 'last_return_reason',
      label: getIn18Text('ZUIJINTUIGONGHAIYUANYIN'),
      content: detail.last_return_reason,
    },
    {
      key: 'last_return_remark',
      label: getIn18Text('TUIGONGHAIBEIZHU'),
      content: detail.last_return_remark,
    },
    {
      key: 'last_return_time',
      label: getIn18Text('TUIHUISHIJIAN'),
      content: detail.last_return_time,
    },
    {
      key: 'clue_source_name',
      label: getIn18Text('XIANSUOLAIYUAN'),
      content: detail.clue_source_name,
    },
    {
      key: 'clue_remark',
      label: getIn18Text('XIANSUOBEIZHU'),
      content: detail.clue_remark,
    },
    {
      key: 'company_name',
      label: getIn18Text('GONGSIMINGCHENG'),
      content: detail.company_name,
    },
    {
      key: 'company_domain',
      label: getIn18Text('GONGSIYUMING'),
      content: detail.company_domain,
    },
    {
      key: 'area',
      label: getIn18Text('GUOJIADEQU'),
      content: (detail?.area?.filter(el => el) || []).join('-'),
    },
  ];
  const systemInfo = [
    {
      key: 'clue_create_type_name',
      label: getIn18Text('CHUANGJIANFANGSHI'),
      content: detail.clue_create_type_name,
    },
    {
      key: 'remain_time',
      label: getIn18Text('WEICHULITINGLIUSHIJIAN'),
      content: null,
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
      key: 'follow_time',
      label: getIn18Text('ZUIJINGENJINSHIJIAN'),
      content: detail.follow_time,
    },
    {
      key: 'manager_list',
      label: getIn18Text('FUZEREN'),
      content: getIn18Text('GONGHAI'),
    },
    {
      key: 'last_manager_name',
      label: getIn18Text('QIANFUZEREN'),
      content: detail.last_manager_name,
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
