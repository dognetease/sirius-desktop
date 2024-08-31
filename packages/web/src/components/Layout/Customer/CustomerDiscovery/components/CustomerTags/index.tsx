import React from 'react';
import { Space, Tag } from 'antd';
import { CustomerRow, CustomerDisDetail } from 'api';
import { GrantStatus } from '../../context';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  data: CustomerRow | CustomerDisDetail;
}
/**
    NOT_SYNC(0, "not_sync", "未同步"),
    OPEN_SEA(1, "open_sea", "线索公海"),
    CLUE(2, "clue", "线索私海"),
    COMPANY(3, "company", "客户"),
    OTHER_CLUE(4, "other_clue", "分配"),
    COMPANY_SEA(5, "company_sea", "客户公海"),
    INVALID(6, "invalid", "无效"),
    text: 同事的线索、公海的线索、同事的客户、同事标记为无效
 */
const TagTextMap: Record<string, string> = {
  invalid: getIn18Text('TONGSHIBIAOJIWEIWUXIAO'),
  open_sea: getIn18Text('GONGHAIDEXIANSUO'),
  clue: getIn18Text('TONGSHIDEXIANSUO'),
  company: getIn18Text('TONGSHIDEKEHU'),
};
export const CustomerTags: React.FC<Props> = props => {
  const { data } = props;
  const getRowTags = () => {
    const tags = [];
    if (data?.grantInfo?.status === GrantStatus.Checking) {
      tags.push(<Tag className={style.domainTag}>{getIn18Text('DAISHENPI')}</Tag>);
    } else if (data?.grantInfo?.status === GrantStatus.Unauthorized) {
      tags.push(<Tag className={style.domainTag}>{getIn18Text('XUSHOUQUAN')}</Tag>);
    }
    const { validInfo } = data;
    const syncLog = validInfo?.[0];
    if (syncLog && TagTextMap[syncLog.flag]) {
      tags.push(<Tag className={style.domainTag}>{TagTextMap[syncLog.flag]}</Tag>);
    }
    return tags;
  };
  return <Space className={style.wrapper}>{getRowTags()}</Space>;
};
