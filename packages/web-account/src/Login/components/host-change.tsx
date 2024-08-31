import React, { useState } from 'react';
import { apiHolder as api, SystemApi } from 'api';
import { Select, Tooltip } from 'antd';
import './host-change.scss';
const systemApi = api.api.getSystemApi() as SystemApi;
import Styles from './host-change.module.scss';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { getIn18Text } from 'api';
const HostChange: React.FC = () => {
  const [hostType, setHostType] = useState<string>(() => systemApi.getCurrentHostType());
  const handleHostTypeChanged = (value: string) => {
    setHostType(value);
    systemApi.setCurrentHostType(value as any);
    if (window.electronLib) {
      window.electronLib.windowManage.reload();
    } else {
      systemApi.jumpToWebHostLogin();
    }
  };
  return (
    <div className={Styles.hostChangeContainer}>
      <Select
        defaultValue={hostType}
        onChange={handleHostTypeChanged}
        bordered={false}
        size="small"
        virtual={false}
        dropdownClassName="host-change-dropdown"
        suffixIcon={<i className={Styles.expandIcon} />}
      >
        <Select.Option value="smartDNSHost">{getIn18Text('MORENXIANLU')}</Select.Option>
        <Select.Option value="domestic">{getIn18Text('GUONEIXIANLU')}</Select.Option>
      </Select>
      <Tooltip title={getIn18Text('LIANJIEVPN')} overlayClassName={Styles.hostChangeTooltip} placement="bottomRight">
        <span className={Styles.tooltipIcon}>
          <IconWarn style={{ cursor: 'pointer', marginLeft: '-2px', width: '13px', height: '13px' }} />
        </span>
      </Tooltip>
    </div>
  );
};
export default HostChange;
