import React from 'react';
import { Tooltip, Button } from 'antd';
import { useAppSelector } from '@web-common/state/createStore';
// import Button from '@web-common/components/UI/Button';
// import Tooltip from '@web-common/components/UI/Tooltip';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import styles from './style.module.scss';
import classNames from 'classnames';
import { ModeType } from 'api';

interface Props {
  leftChannelQuota?: number;
  totalChannelQuota?: number;
  onAddAllot: () => void;
  modeAssignment: () => void;
}

const menu = 'ORG_SETTINGS_PEER_SETTING';
const resourceLabel = 'WHATSAPP_PERSONAL_MANAGE';
const accessLabel = 'ALLOT';

const PersonalChannelOperation: React.FC<Props> = ({ leftChannelQuota = 0, totalChannelQuota = 0, onAddAllot, modeAssignment }) => {
  const hasPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, resourceLabel, accessLabel));
  const menuKeys = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
  const modeType = useAppSelector(state => state.globalReducer.waModeType);
  if (hasPermission && menuKeys[menu] !== false) {
    const disabled = modeType === ModeType.free || leftChannelQuota <= 0;
    return (
      <div className={styles.operation}>
        <Button className={classNames(styles.addBtn, styles.modeBtn)} type="default" onClick={() => modeAssignment()}>
          模式分配
        </Button>
        <span className={styles.text}>剩余绑定数</span>
        <span className={styles.number}>
          {leftChannelQuota} / {totalChannelQuota}
        </span>
        <Tooltip placement="left" title={disabled ? '暂无可绑定数，请联系销售人员' : ''}>
          <Button className={styles.addBtn} type="primary" onClick={() => onAddAllot()} disabled={disabled}>
            添加成员
          </Button>
        </Tooltip>
      </div>
    );
  }

  return <></>;
};

export default PersonalChannelOperation;
