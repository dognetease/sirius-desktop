/**
 * 带选择框的询问弹窗组件
 * ex：业务弹窗中需要勾选不再提醒之类的业务
 * 可以直接复用
 */

import React, { useEffect, useMemo, useState } from 'react';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@web-common/components/UI/SiriusModal';
import style from './CheckboxModal.module.scss';
import classnames from 'classnames/bind';
import Button from '@web-common/components/UI/Button';
import { Checkbox } from '@web-common/components/UI/Checkbox';
import { ReactComponent as InfoIcon } from '@/images/icons/mail/info_blue_icon.svg';
import { getIn18Text } from 'api';

const realStyle = classnames.bind(style);

interface CheckboxModalProps {
  onOk?: () => void;
  onCancel?: () => void;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxConfirmContent = (props: CheckboxModalProps) => {
  const { onOk, onCancel, checked, onChange } = props;

  return (
    <div className="checkbox-confirm-footer">
      <div className="left">
        <Checkbox onChange={onChange} value={checked}>
          {getIn18Text('BUZAITIXING')}
        </Checkbox>
      </div>
      <div className="right">
        <Button className="cancel" onClick={onCancel} btnType="minorLine" size="mini" inline={true}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button className="cancel" onClick={onOk} btnType="primary" size="mini" inline={true}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};

export const checkboxConfirm = config => {
  const {
    okText = getIn18Text('QUEDING'),
    cancelText = getIn18Text('QUXIAO'),
    checkBoxText = getIn18Text('BUZAITIXING'),
    autoFocusButton,
    onOk,
    onCancel,
    checked,
    onChange,
    title,
    showCheck = true,
    icon = <InfoIcon />,
  } = config;

  let local_checked = checked || false;

  return Modal.info({
    modalRender: modal => {
      return (
        <div className={realStyle('checkboxModalWrap')}>
          <div className={realStyle('titleWrap')}>
            <div className={realStyle('icon')}>{icon}</div>
            <div className={realStyle('title')}>{title}</div>
          </div>
          <div className={realStyle('checkboxConfirmFooter')}>
            <div className={realStyle('left')} style={{ pointerEvents: 'auto' }}>
              {showCheck ? (
                <Checkbox
                  className={realStyle('checkbox')}
                  value={local_checked}
                  onChange={value => {
                    local_checked = value;
                  }}
                >
                  {checkBoxText}
                </Checkbox>
              ) : (
                <></>
              )}
            </div>
            <div className={realStyle('right')} style={{ pointerEvents: 'auto' }}>
              <Button className={realStyle('cancel')} onClick={onCancel} btnType="minorLine" inline={true}>
                {cancelText}
              </Button>
              <Button autoFocus={true} className={realStyle('ok')} onClick={() => onOk(local_checked)} btnType="primary" inline={true}>
                {okText}
              </Button>
            </div>
          </div>
        </div>
      );
    },
    ...config,
  });
};

export default CheckboxConfirmContent;
