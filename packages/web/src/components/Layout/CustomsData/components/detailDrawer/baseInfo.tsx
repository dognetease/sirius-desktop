import React from 'react';
import { companyInfoItem as companyItmeType } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import style from './baseInfo.module.scss';
import { getIn18Text } from 'api';
interface Props {
  detail: companyItmeType;
}
const BaseInfo: React.FC<Props> = ({ detail }) => {
  console.log('detail-info', detail);
  const baseInfo = [
    // {
    //   key: 'name',
    //   label: '公司名称',
    //   className: style.labelColor,
    //   content: detail?.name,
    // },
    {
      key: 'alias',
      label: getIn18Text('BIEMING'),
      className: style.labelColor,
      content: detail?.alias,
    },
    {
      key: 'foundedDate',
      label: getIn18Text('CHENGLIRIQI'),
      className: style.labelColor,
      content: detail?.foundedDate,
    },
    {
      key: 'webapp',
      label: getIn18Text('GUANWANG'),
      className: style.labelColor,
      canJump: true,
      content: detail?.webapp,
    },
    {
      key: 'companyType',
      label: getIn18Text('FENLEI'),
      className: style.labelColor,
      content: detail?.companyType,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      canJump: true,
      className: style.labelColor,
      content: detail?.facebook,
    },
    {
      key: 'phone',
      label: getIn18Text('DIANHUA'),
      className: style.labelColor,
      content: detail?.phone,
    },
    {
      key: 'industries',
      label: getIn18Text('XINGYE'),
      className: style.labelColor,
      content: detail?.industries,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      canJump: true,
      className: style.labelColor,
      content: detail?.linkedin,
    },
    {
      key: 'location',
      label: getIn18Text('DEZHI'),
      className: style.labelColor,
      content: detail?.location,
    },
    {
      key: 'operatingStatus',
      label: getIn18Text('ZHUCEZHUANGTAI'),
      className: style.labelColor,
      content: detail?.operatingStatus,
    },
    {
      key: 'shortDesc',
      label: getIn18Text('JIANDANMIAOSHU'),
      className: style.labelColor,
      content: detail?.shortDesc,
    },
    {
      key: 'staff',
      label: getIn18Text('GUIMO'),
      className: style.labelColor,
      content: detail?.staff,
    },
    {
      key: 'twitter',
      label: 'Twitter',
      canJump: true,
      className: style.labelColor,
      content: detail?.twitter,
    },
    {
      key: 'overviewDescription',
      label: getIn18Text('XIANGQINGMIAOSHU'),
      className: style.labelColor,
      content: detail?.overviewDescription,
    },
    {
      key: 'domain',
      label: getIn18Text('YUMING'),
      className: style.labelColor,
      content: detail?.domain,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      canJump: true,
      className: style.labelColor,
      content: detail?.instagram,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      canJump: true,
      className: style.labelColor,
      content: detail?.youtube,
    },
  ];
  return (
    <div className={style.baseInfo}>
      <InfoLayout
        list={baseInfo}
        // itemWidth={'100%'}
        itemWidth={376}
        itemMarginRight={30}
        itemMarginBottom={12}
      />
    </div>
  );
};
export default BaseInfo;
