import React, { useState } from 'react';
import lodashGet from 'lodash/get';
import { apiHolder, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { Button, ConfigProvider } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useObservable } from 'rxjs-hooks';
import style from './chatItemAltFooter.module.scss';
import { FooterButton } from '../../common/customTplFooter';
import { getIn18Text } from 'api';
const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(style);
const requestQiyeCookie = async () => {
  const cookies = await systemApi.doGetCookies(true);
  return cookies.QIYE_TOKEN as string;
};
// 展示按钮
interface ButtonControlProps {
  control: FooterButton;
  msgId: string;
  align?: string;
}
export const ButtonControl: React.FC<ButtonControlProps> = props => {
  const { control, align = 'left', msgId } = props;
  const { 'button-type': buttonType = 'default', 'button-size': buttonSize = 'small' } = control;
  // const buttonType=ButtonTypes.has(style)?style:'primary'
  const typeStyles = {
    info_plain: realStyle('infoPlain'),
    success_plain: realStyle('successPlain'),
    danger_plain: realStyle('dangerPlain'),
    info: realStyle('info'),
    success: realStyle('success'),
    danger: realStyle('danger'),
  };
  const sizeStyles = {
    small: realStyle('small'),
    middle: realStyle('middle'),
  };
  const [requestStatus, setRequestStatus] = useState<'complete' | 'ing'>('complete');
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');
  // 点击发送请求
  const onclick = async () => {
    const methods = ['put', 'post', 'delete'];
    const reqType = control.req_type || 'post';
    if (!methods.includes(reqType)) {
      return message.info(getIn18Text('QINGQIUFANGFACUO'));
    }
    setRequestStatus('ing');
    let formData: Record<string, unknown> = {};
    try {
      formData = typeof control.form === 'string' ? JSON.parse(control.form) : control.form;
    } catch (ex) {}
    const token = await requestQiyeCookie();
    let response: Record<string, any> = {};
    try {
      const { data: res } = await httpApi[reqType](control.action, formData, {
        contentType: 'json',
        timeout: 2000,
        headers: {
          QIYE_TOKEN: token,
        },
      });
      response = res as unknown as Record<string, any>;
    } catch (ex) {
      message.info(lodashGet(ex, 'data.message', getIn18Text('QINGQIUSHIBAI\uFF0C')));
      return setRequestStatus('complete');
    }
    const taskStatus = lodashGet(response, control.status, '');
    setRequestStatus('complete');
    // 发送sysmsg 通知各端变更任务状态
    nimApi.excute('sendCustomSysMsg', {
      scene: 'p2p',
      to: myAccount,
      content: JSON.stringify({
        subType: 'changeTaskStatus',
        data: JSON.stringify({
          msgId,
          status: taskStatus,
        }),
      }),
    });
  };
  return (
    <ConfigProvider autoInsertSpaceInButton={false}>
      <Button
        className={realStyle('taskButton', 'direction-' + align, [
          Object.keys(typeStyles).includes(buttonType) ? typeStyles[buttonType] : typeStyles.info_plain,
          Object.keys(sizeStyles).includes(buttonSize) ? sizeStyles[buttonSize] : sizeStyles.small,
        ])}
        style={
          /\d+/.test(buttonSize)
            ? {
                width: `${buttonSize}px`,
              }
            : {}
        }
        onClick={onclick}
        shape="circle"
        loading={requestStatus === 'ing'}
      >
        {control.text}
      </Button>
    </ConfigProvider>
  );
};
