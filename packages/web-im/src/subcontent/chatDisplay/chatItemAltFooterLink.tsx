import React from 'react';
import classnames from 'classnames/bind';
import { api } from 'api';
import { Button, ConfigProvider } from 'antd';
import style from './chatItemAltFooter.module.scss';
import { FooterLink } from '../../common/customTplFooter';

const realStyle = classnames.bind(style);
const systemApi = api.getSystemApi();
// 纯文本展示
interface TextControlProps {
  align: string;
  control: FooterLink;
}
export const LinkControl: React.FC<TextControlProps> = props => {
  const { control, align } = props;
  const { 'button-size': buttonSize = 'default', 'button-type': buttonType = 'small' } = control;
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
  const openLink = () => {
    systemApi.handleJumpUrl(`${new Date().getTime()}`, control.src);
  };

  if (control.link_type !== 'button') {
    return (
      <span className={realStyle('link', 'direction-' + align)} onClick={openLink}>
        {control.text}
      </span>
    );
  }

  <ConfigProvider autoInsertSpaceInButton={false}>
    <Button
      className={realStyle('taskButton', 'direction-' + align, [
        Object.keys(typeStyles).includes(buttonType) ? typeStyles[buttonType] : typeStyles.info_plain,
        Object.keys(sizeStyles).includes(buttonSize) ? sizeStyles[buttonSize] : sizeStyles.small,
      ])}
      style={
        typeof buttonSize === 'number'
          ? {
              width: `${buttonSize}px`,
            }
          : {}
      }
      onClick={openLink}
      shape="circle"
    >
      {control.text}
    </Button>
  </ConfigProvider>;
};
