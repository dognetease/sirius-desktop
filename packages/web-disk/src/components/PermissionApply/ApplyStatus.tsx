import React, { useState, useCallback, useEffect } from 'react';
import commonStyles from './index.module.scss';
import DoneIcon from '@web-common/components/UI/Icons/svgs/disk/Done';
import { UserCardPopover } from '../UserCard';
import { getIn18Text } from 'api';
export interface ApplyStatusProps {
  info: {
    approveUserId: string;
    approveUserName: string;
    applyRole: string;
  };
}
export const ApplyStatus: React.FC<ApplyStatusProps> = ({ info: { approveUserId, approveUserName, applyRole } }) => {
  return (
    <div className={commonStyles.permissionApplyComp}>
      <DoneIcon />
      <div className={commonStyles.message}>
        {getIn18Text('YISHENQING')}
        {applyRole}
      </div>
      <div className={commonStyles.hint}>
        <span>{getIn18Text('QINGDENGDAIGUANLI')}</span>
        <UserCardPopover userId={approveUserId} placement={'right'}>
          <span className={commonStyles.highlight}>{approveUserName}</span>
        </UserCardPopover>
        <span>{getIn18Text('CHULI')}</span>
      </div>
    </div>
  );
};
