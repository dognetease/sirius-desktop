import React, { useMemo } from 'react';
import { api, CustomerDetail } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import style from './baseInfo.module.scss';
import { getIn18Text } from 'api';
interface BaseInfoProps {
  data: CustomerDetail;
}
const systemApi = api.getSystemApi();
const BaseInfo: React.FC<BaseInfoProps> = props => {
  const { data } = props;
  const baseInfo = [
    {
      key: 'country',
      label: getIn18Text('GUOJIADEQU'),
      content: (data.area || []).join('-'),
    },
    {
      key: 'company_level',
      label: getIn18Text('KEHUFENJI'),
      content: data.company_level,
    },
    {
      key: 'source',
      label: getIn18Text('KEHULAIYUAN'),
      content: data.source,
    },
    {
      key: 'short_name',
      label: getIn18Text('GONGSIJIANCHENG'),
      content: data.short_name,
    },
    {
      key: 'star_level',
      label: getIn18Text('GONGSIXINGJI'),
      content: InfoLayout.renderStar(+data.star_level),
    },
    {
      key: 'intent',
      label: getIn18Text('YIXIANGDU'),
      content: data.intent,
    },
    // {
    //   key: 'label_list',
    //   label: '客户标签',
    //   content: InfoLayout.renderLabels(data.label_list),
    // },
    {
      key: 'company_domain',
      label: getIn18Text('GONGSIYUMING'),
      content: data.company_domain,
    },
    {
      key: 'website',
      label: getIn18Text('WANGZHI'),
      content: data.website,
      canJump: true,
    },
    {
      key: 'main_industry',
      label: getIn18Text('ZHUYINGCHANPINXINGYE'),
      content: data.main_industry,
    },
    {
      key: 'require_product_type_label',
      label: getIn18Text('XUQIUCHANPINLEIXING'),
      content: data.require_product_type_label,
    },
    {
      key: 'product_require_level_label',
      label: getIn18Text('CHANPINXUQIUDU'),
      content: data.product_require_level_label,
    },
    {
      key: 'purchase_amount',
      label: getIn18Text('NIANCAIGOUE'),
      content: data.purchase_amount,
    },
    {
      key: 'zone',
      label: getIn18Text('SHIQU'),
      content: data.zone,
    },
    {
      key: 'scale',
      label: getIn18Text('GONGSIGUIMO'),
      content: data.scale,
    },
    {
      key: 'fax',
      label: getIn18Text('CHUANZHEN'),
      content: data.fax,
    },
    {
      key: 'telephone',
      label: getIn18Text('ZUOJIDIANHUA'),
      content: data.telephone,
    },
    {
      key: 'address',
      label: getIn18Text('LIANXIDEZHI'),
      content: data.address,
    },
    {
      key: 'remark',
      label: getIn18Text('BEIZHU'),
      content: data.remark,
    },
    {
      key: 'pictures',
      label: getIn18Text('TUPIAN'),
      content: InfoLayout.renderImage(data.pictures || []),
    },
    {
      key: 'last_return_reason',
      label: getIn18Text('ZUIJINTUIGONGHAIYUANYIN'),
      content: data.last_return_reason,
    },
  ];
  const systemInfo = useMemo(() => {
    const clueInfo =
      data.clue_id && data.clue_name
        ? [
            {
              key: 'clue_id',
              label: getIn18Text('ZHUANKEHUXIANSUO'),
              content: (
                <span
                  className={style.link}
                  onClick={() => {
                    const previewPath = `/cluePreview/?clue_id=${data.clue_id}`;
                    systemApi.handleJumpUrl(Date.now(), previewPath);
                  }}
                >
                  {data.clue_name}
                </span>
              ),
            },
          ]
        : [];
    const restInfo = [
      {
        key: 'create_time',
        label: getIn18Text('CHUANGJIANSHIJIAN'),
        content: data?.system_info?.create_time,
      },
      {
        key: 'create_user',
        label: getIn18Text('CHUANGJIANREN'),
        content: data?.system_info?.create_user,
      },
      {
        key: 'update_time',
        label: getIn18Text('ZILIAOGENGXINSHIJIAN'),
        content: data?.system_info?.update_time,
      },
      {
        key: 'update_user',
        label: getIn18Text('GENGXINREN'),
        content: data?.system_info?.update_user,
      },
      {
        key: 'moment_time',
        label: getIn18Text('ZUIJINGENJINSHIJIAN'),
        content: data?.system_info?.moment_time,
      },
      {
        key: 'manager_list',
        label: getIn18Text('FUZEREN'),
        content: data?.manager_list?.map(item => item.name || '-').join('，'),
      },
      {
        key: 'last_manager_name',
        label: getIn18Text('QIANFUZEREN'),
        content: data?.last_manager_name,
      },
    ];
    return [...clueInfo, ...restInfo];
  }, [data]);
  return (
    <div className={style.baseInfo}>
      <InfoLayout list={baseInfo} itemWidth={376} itemMarginRight={30} itemMarginBottom={12} />
      <div className={style.divider} />
      <div className={style.systemInfo}>{getIn18Text('XITONGXINXI')}</div>
      <InfoLayout list={systemInfo} itemWidth={376} itemMarginRight={30} itemMarginBottom={12} />
    </div>
  );
};
BaseInfo.defaultProps = {};
export default BaseInfo;
