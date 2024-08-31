import React, { useMemo } from 'react';
import { api, ClueDetail as ClueDetailType } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import style from './baseInfo.module.scss';
import { getIn18Text } from 'api';
interface BaseInfoProps {
  detail: ClueDetailType;
}
const CONVERT_TO_CUSTOMER_STATUS = 4;
const systemApi = api.getSystemApi();
const BaseInfo: React.FC<BaseInfoProps> = ({ detail }) => {
  const baseInfo = [
    {
      key: 'source_name',
      label: getIn18Text('XIANSUOLAIYUAN'),
      content: detail.source_name,
    },
    {
      key: 'clue_batch_label',
      label: getIn18Text('XIANSUOPICI'),
      content: detail.clue_batch_label,
    },
    {
      key: 'remark',
      label: getIn18Text('XIANSUOBEIZHU'),
      content: detail.remark,
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
  const systemInfo = useMemo(() => {
    const customerInfo =
      String(detail.status) == String(CONVERT_TO_CUSTOMER_STATUS)
        ? [
            {
              key: 'convertToCustomer',
              label: getIn18Text('ZHUANKEHU'),
              content: (
                <span
                  className={style.link}
                  onClick={() => {
                    const previewPath = `/customerPreview/?company_id=${detail.company_id}`;
                    systemApi.handleJumpUrl(Date.now(), previewPath);
                  }}
                >
                  {detail.customer_company_name}
                </span>
              ),
            },
          ]
        : [];
    const restInfo = [
      {
        key: 'create_type_name',
        label: getIn18Text('CHUANGJIANFANGSHI'),
        content: detail.create_type_name,
      },
      {
        key: 'remain_time',
        label: getIn18Text('WEICHULITINGLIUSHIJIAN'),
        content: detail.remain_time,
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
        content: detail?.manager_list?.map(item => item.name || '-').join('，'),
      },
      {
        key: 'enter_time',
        label: getIn18Text('JINRUSIHAISHIJIAN'),
        content: detail.enter_time,
      },
    ];
    return [...customerInfo, ...restInfo];
  }, [detail]);
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
