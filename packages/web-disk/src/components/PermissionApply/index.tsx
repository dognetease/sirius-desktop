import React from 'react';
import { NoAuthority } from '../Preview/preview';
import { ApplyStatus } from './ApplyStatus';
import { ApplyInfo, ApplyRoleCN } from './ApplyInfo';
import { platform, ResponseGetApplyInfo, ResponseGetApplyStatus } from 'api';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
export interface PermissionApplyInfo {
  applyInfo?: ResponseGetApplyInfo;
  applyStatus?: ResponseGetApplyStatus;
  errMsg?: string;
}
interface PermissionApplyProps {
  type: 'doc' | 'sheet' | string;
  info: PermissionApplyInfo;
  extheme?: boolean; // 用户开启暗黑模式后，当前组件是否要启用暗黑样式。true则不管是否开启暗黑，都展示亮色
}
const isMobile = platform.isMobile();
export const PermissionApply: React.FC<PermissionApplyProps> = ({ type, info: { applyInfo, applyStatus, errMsg }, extheme }) => {
  let content = <NoAuthority title={errMsg || getIn18Text('HUOQUSHUJUSHI')} />;
  if (applyStatus && applyInfo) {
    const { approveUserId, approveUserName } = applyInfo;
    const { applyRole } = applyStatus;
    content = <ApplyStatus info={{ approveUserId, approveUserName, applyRole: ApplyRoleCN[applyRole] }} />;
  } else if (applyInfo) {
    content = <ApplyInfo info={applyInfo} type={type} />;
  }
  // h5场景
  if (isMobile) {
    content = <NoAuthority />;
  }
  return <div className={`${extheme ? 'extheme' : ''} ${styles.permissionApplyPage}`}>{content}</div>;
};
