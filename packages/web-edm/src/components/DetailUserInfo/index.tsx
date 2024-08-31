import React, { FC } from 'react';
import { SubjectAnalysisRes } from 'api';

// import { UserInfoMapByRegion } from '../UserInfoMapByRegion';
import { UserInfoDetail } from '../UserInfoDetail';
/**
 * 营销详情客户信息分布入口
 */
export const DetailUserInfo: FC<{
  data: SubjectAnalysisRes['contactInfoAnalysisList'];
}> = ({ data }) => {
  console.log('render');

  return <>{data.length > 0 && <UserInfoDetail data={data} />}</>;
};
