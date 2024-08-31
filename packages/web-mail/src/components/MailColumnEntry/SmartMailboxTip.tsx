// 邮件列表顶部的tab切换效果，从index中抽离出来
import React from 'react';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close1.svg';
import { getIn18Text } from 'api';
interface SmartMailboxTipProps {
  visible: boolean;
  setVisible: (temp: boolean) => void;
}
const SmartMailboxTip: React.FC<any> = (props: SmartMailboxTipProps) => {
  const { visible, setVisible } = props;
  // 返回dom
  return visible ? (
    <div className="smart-mail-tip">
      <div className="smart-mail-tip-in">
        <div>
          <i className="icon-question"></i>
        </div>
        <div style={{ marginRight: '38px' }}>{getIn18Text('XIANGRANGYOUJIANZHAN')}</div>
        <span
          className="close"
          onClick={() => {
            setVisible(false);
          }}
        >
          <IconClose />
        </span>
      </div>
    </div>
  ) : null;
};
export default SmartMailboxTip;
