/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:21
 * @LastEditTime: 2021-11-24 18:25:34
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/@/components/Layout/Write/components/MailFormat/format.tsx
 */
import React from 'react';
import { Tooltip } from 'antd';
import { apiHolder as api, apis, DataTrackerApi } from 'api';
import { getIn18Text } from 'api';
interface Props {
  clickMailFormat: boolean;
  setClickMailFormat: React.Dispatch<React.SetStateAction<boolean>>;
  showMfDialog: (item?: string) => void;
}
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const MailFormat: React.FC<Props> = props => {
  const { showMfDialog, clickMailFormat, setClickMailFormat } = props;
  if (clickMailFormat) {
    trackApi.track('pcMail_click_emailTemplate_writeMailPage');
    showMfDialog();
    setClickMailFormat(false);
  }
  return (
    <div className="mailformat-wrap">
      <div className="click-target">
        <Tooltip key="1" visible={false} placement="bottomLeft" title={<div className="tooltip-wrap">{getIn18Text('ZAIZHELIYEKE')}</div>}>
          <div className="tooltip-format" />
        </Tooltip>
      </div>
    </div>
  );
};
export default MailFormat;
