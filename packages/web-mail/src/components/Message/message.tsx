import React from 'react';
import { message } from 'antd';
import { apiHolder as api, SystemApi } from 'api';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';

interface Props {
  type: 'fail' | 'suc';
  content: string | React.ReactNode;
  key?: string | number | null;
}

const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();

const Message = (param: Props) => {
  message.warning({
    className: 'u-tips',
    content: param.content,
    duration: 2,
    prefixCls: inElectron ? 'mac ant-message' : 'ant-message',
    icon: param.type == 'fail' ? <ReadListIcons.FailSvg /> : <ReadListIcons.SucSvg />,
    key: param.key || undefined,
  });
};

export default Message;
