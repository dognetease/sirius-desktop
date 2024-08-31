import React from 'react';
import { Button, Modal } from 'antd';
import classnames from 'classnames';
import { ErrMsg, MailBoxEntryContactInfoModel } from 'api';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  setVisible: (val: boolean) => void;
  visible: boolean;
  receiver: MailBoxEntryContactInfoModel[];
  errorMsg: ErrMsg;
  confirm: (errorMsg: any) => void;
  hideReSend?: boolean;
}
const SendErrorContect: React.FC<Props> = ({ visible, setVisible, receiver, errorMsg, confirm, hideReSend }) => {
  const hideDeleteButton = String(errorMsg?.code) === 'FA_MTA_RCPT_ERROR';
  const content =
    receiver.length > 1 ? (
      <div className={classnames(style.errorContect)}>
        {errorMsg?.msgItem?.map(item => (
          <div className={classnames(style.errorItem)}>
            <div className={classnames(style.email)}>{item.email}</div>
            <div className={classnames(style.desc)}>
              {getIn18Text('CUOWUYUANYIN\uFF1A')}
              {item.reason}
            </div>
          </div>
        )) || ''}
      </div>
    ) : (
      <div className={classnames(style.errorContect)}>
        {getIn18Text('CUOWUYUANYIN\uFF1A')}
        {errorMsg?.msgItem ? errorMsg?.msgItem[0].reason : getIn18Text('(WEIZHIYUANYIN')}
      </div>
    );
  return (
    <Modal
      wrapClassName="modal-dialog"
      onCancel={() => {
        setVisible(false);
      }}
      visible={visible}
      footer={null}
    >
      <div className="modal-content" style={{ marginTop: '10px' }}>
        <div className="modal-icon">
          <ErrorIcon className="error-icon" />
        </div>
        <div className="modal-text">
          <div className="title">
            {getIn18Text('YOUJIANFASONGSHI')}
            {errorMsg?.msgItem && errorMsg?.msgItem?.length > 1 ? `${errorMsg.msgItem?.length}位联系人邮箱错误` : getIn18Text('LIANXIRENYOUXIANG')}
          </div>
          {content}
          <div className="btns">
            <div />
            <div>
              <Button
                className="cancel"
                onClick={() => {
                  setVisible(false);
                }}
              >
                {getIn18Text('QUXIAO')}
              </Button>
              {!hideReSend && receiver && receiver.length > 1 && !hideDeleteButton ? (
                <Button
                  className="cancel"
                  onClick={() => {
                    confirm(errorMsg);
                    setVisible(false);
                  }}
                >
                  {getIn18Text('SHANCHUCUOWUYOU')}
                </Button>
              ) : (
                ''
              )}
              {/* <Button
    className="save"
    type="primary"
    onClick={() => {
      // todo 待确认
      setVisible(false);
    }}
  >
    查看
  </Button> */}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default SendErrorContect;
