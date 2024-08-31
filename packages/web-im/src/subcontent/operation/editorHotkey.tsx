import React from 'react';
import styles from './basicEditor.module.scss';
import classnames from 'classnames/bind';
import { Button } from 'antd';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const EnterIcon = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.65625 2.71875L9.3375 2.71875C9.66887 2.71875 9.9375 2.98738 9.9375 3.31875L9.9375 7.36875C9.9375 7.70012 9.66887 7.96875 9.3375 7.96875L6.65625 7.96875"
        stroke="#A8AAAD"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M2.0625 7.96878L1.72617 7.66981C1.57461 7.84031 1.57461 8.09724 1.72617 8.26774L2.0625 7.96878ZM7.3125 7.51875L2.0625 7.51877L2.0625 8.41878L7.3125 8.41875L7.3125 7.51875ZM1.72617 8.26774L4.05952 10.8927L4.73218 10.2948L2.39883 7.66981L1.72617 8.26774ZM2.39884 8.26774L4.73218 5.64271L4.05951 5.04479L1.72617 7.66981L2.39884 8.26774Z"
        fill="#A8AAAD"
      />
    </svg>
  );
};
const ShiftIcon = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.57088 1.62689L5.89282 1.98039V1.98039L5.57088 1.62689ZM6.42937 1.62689L6.10744 1.98039L6.42937 1.62689ZM1.03661 5.75632L1.35854 6.10982H1.35854L1.03661 5.75632ZM10.9636 5.75632L11.2856 5.40282L11.2856 5.40282L10.9636 5.75632ZM5.89282 1.98039C5.95364 1.925 6.04662 1.925 6.10744 1.98039L6.75131 1.2734C6.32557 0.885667 5.67469 0.885667 5.24894 1.27339L5.89282 1.98039ZM1.35854 6.10982L5.89282 1.98039L5.24894 1.27339L0.714671 5.40282L1.35854 6.10982ZM1.13761 5.5391C1.43738 5.5391 1.58018 5.90797 1.35854 6.10982L0.714671 5.40282C0.290395 5.78922 0.563757 6.49535 1.13761 6.49535V5.5391ZM3.45013 5.5391H1.13761V6.49535H3.45013V5.5391ZM4.08763 9.3641V6.1766H3.13138V9.3641H4.08763ZM4.247 9.52347C4.15898 9.52347 4.08763 9.45212 4.08763 9.3641H3.13138C3.13138 9.98024 3.63086 10.4797 4.247 10.4797V9.52347ZM7.75325 9.52347H4.247V10.4797H7.75325V9.52347ZM7.91263 9.3641C7.91263 9.45212 7.84127 9.52347 7.75325 9.52347V10.4797C8.36939 10.4797 8.86888 9.98024 8.86888 9.3641H7.91263ZM7.91263 6.1766V9.3641H8.86888V6.1766H7.91263ZM10.8626 5.5391H8.55013V6.49535H10.8626V5.5391ZM10.6417 6.10982C10.4201 5.90797 10.5629 5.5391 10.8626 5.5391V6.49535C11.4365 6.49535 11.7099 5.78922 11.2856 5.40282L10.6417 6.10982ZM6.10744 1.98039L10.6417 6.10982L11.2856 5.40282L6.75131 1.2734L6.10744 1.98039ZM8.86888 6.1766C8.86888 6.35264 8.72617 6.49535 8.55013 6.49535V5.5391C8.19805 5.5391 7.91263 5.82451 7.91263 6.1766H8.86888ZM3.45013 6.49535C3.27409 6.49535 3.13138 6.35264 3.13138 6.1766H4.08763C4.08763 5.82451 3.80221 5.5391 3.45013 5.5391V6.49535Z"
        fill="#A8AAAD"
      />
    </svg>
  );
};
interface SendButtonProps {
  disabled: boolean;
  onsubmit(): void;
}
export const SendButton: React.FC<SendButtonProps> = props => {
  const { disabled, onsubmit } = props;
  return (
    <div className={realStyle('operations')}>
      {!/windows/i.test(navigator.userAgent) && (
        <React.Fragment>
          <EnterIcon></EnterIcon>
          <span>{getIn18Text('FASONG')}</span>
          <span>&nbsp;/&nbsp;</span>
          <ShiftIcon></ShiftIcon>
          <EnterIcon></EnterIcon>
          <span>{getIn18Text('HUANXING')}</span>
        </React.Fragment>
      )}
      {/windows/i.test(navigator.userAgent) && (
        <React.Fragment>
          <span>
            {getIn18Text('Enter')}&nbsp; /{getIn18Text('HUANHANG')}&nbsp;
          </span>
        </React.Fragment>
      )}

      <Button
        disabled={disabled}
        onClick={e => {
          onsubmit();
        }}
        type="primary"
        className={realStyle('submitBtn', 'ant-btn-sm')}
      >
        {getIn18Text('FASONG')}
      </Button>
    </div>
  );
};
