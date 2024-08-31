import React from 'react';
import { Popconfirm, PopconfirmProps } from 'antd';
import style from './popconfirm.module.scss';

const FfConfirm: React.FC<PopconfirmProps> = ({ children, ...restProps }) => {
  return <Popconfirm {...restProps}>{children}</Popconfirm>;
};

FfConfirm.defaultProps = {
  title: '确认删除 ?',
  okText: '是',
  cancelText: '否',
  okButtonProps: {
    className: style.btn,
  },
  overlayClassName: style.ffmsPopconfirm,
};

export default FfConfirm;
