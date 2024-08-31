/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { message, MessageArgsProps } from 'antd';
import { MessageInstance, MessageType, ConfigOnClose } from 'antd/lib/message';
// import { apiHolder } from 'api';
import Icon from '@ant-design/icons/lib/components/Icon';
// import { ReactComponent as CloseCircleSvg } from '@/images/icons/close_circle.svg';
import { ReactComponent as CheckedCircleSvg } from '@/images/icons/checked_circle.svg';
import { ReactComponent as MessageFailIcon } from '@/images/icons/message-fail.svg';
import { ReactComponent as LoadingCircleSvg } from '@/images/icons/message_loading_blue.svg';
import { ReactComponent as NetErrorSvg } from '@/images/icons/wifi_closed.svg';
import { getIn18Text } from 'api';
import styles from './SiriusMessage.module.scss';

// const CloseCircleIcon = (props: any) => <Icon component={() => <CloseCircleSvg />} {...props} />;
const CheckedCircleIcon = (props: any) => <Icon component={() => <CheckedCircleSvg />} {...props} />;
const LoadingCircleIcon = (props: any) => <Icon component={LoadingCircleSvg} {...props} />;
const NetErrorIcon = (props: any) => <Icon component={NetErrorSvg} {...props} />;
const MessageFail = (props: any) => <Icon component={() => <MessageFailIcon />} {...props} />;

interface WarnArg {
  className: string;
  content: string;
  duration: number;
  // eslint-disable-next-line no-undef
  icon: JSX.Element;
  prefixCls?: string;
}

type MessageArg = ArgsProps | React.ReactNode | string;

// const sysApi = apiHolder.api.getSystemApi();

// message.config({
//   // top: sysApi.isElectron() ? 42 : 10,
//   duration: 1.5,
//   maxCount: 5,
//   rtl: false,
//   // prefixCls: 'my-message',
// });

/**
 * 类名融合
 */
const mergeClassNames = (localCalssName?: string, className?: string) => {
  if (className) {
    return `${localCalssName} ${className}`;
  }
  return localCalssName || '';
};

/**
 * 融合参数配置
 */
const mergeArgs = (params?: ArgsProps | React.ReactNode | string, defaultClassName?: string) => {
  let args: ArgsProps;
  if (typeof params === 'object') {
    args = params as ArgsProps;
  } else {
    args = {
      content: params,
    };
  }
  return {
    ...args,
    className: mergeClassNames(defaultClassName, args.className),
  };
};

export type ArgsProps = Partial<MessageArgsProps>;

class SiriusMessage implements MessageInstance {
  constructor() {
    this.warning = this.warn;
  }

  warning: { (arg0: WarnArg): void; (args?: Partial<MessageArgsProps> | undefined): MessageType };

  public useMessage = message.useMessage;

  public config = message.config;

  public antMessage = message;

  success(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.success(
      {
        icon: <CheckedCircleIcon />,
        ...mergeArgs(params, styles.siriusMessageSuccess),
      },
      duration,
      onClose
    );
  }

  info(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.info(mergeArgs(params, styles.siriusMessageInfo), duration, onClose);
  }

  error(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.error(mergeArgs(params, styles.siriusMessageError), duration, onClose);
  }

  fail(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.error(
      {
        icon: <MessageFail />,
        ...mergeArgs(params, styles.siriusMessageError),
      },
      duration,
      onClose
    );
  }

  warn(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.warn(mergeArgs(params, styles.siriusMessageWarn), duration, onClose);
  }

  netWorkError() {
    return this.antMessage.warn({
      icon: <NetErrorIcon fill="none" />,
      content: getIn18Text('CAOZUOSHIBAI\uFF0C'),
      duration: 1.5,
    });
  }

  loading(params?: MessageArg, duration?: number, onClose?: ConfigOnClose) {
    return this.antMessage.loading(
      {
        icon: <LoadingCircleIcon fill="none" spin size="16" />,
        ...mergeArgs(params, styles.siriusMessageInfo),
      },
      duration,
      onClose
    );
  }

  open(args: MessageArgsProps) {
    return this.antMessage.open(args);
  }

  destroy(messageKey?: React.Key | undefined) {
    return this.antMessage.destroy(messageKey);
  }
}

// const siriusMessage =

export default new SiriusMessage();
