import React, { useEffect, useState } from 'react';
import { Button, Popover, Radio } from 'antd';
import { MailApi, apiHolder, apis, SystemApi, conf } from 'api';
import classNames from 'classnames';
import styles from './detail.module.scss';
import ContactTrackerIns from '../../tracker';
import { getIn18Text } from 'api';
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
export interface SendMailPopProps {
  testId?: string;
  mailList?: string[];
  onSend?(email: string): void;
}
const SendMailPop: React.FC<SendMailPopProps> = ({ children, mailList, onSend, testId }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [value, setValue] = useState<string>(mailList && mailList[0] ? mailList[0] : '');
  useEffect(() => {
    setValue(mailList && mailList[0] ? mailList[0] : '');
  }, [mailList]);
  const handleSend = () => {
    if (apiHolder.env.forElectron) {
      mailApi.doWriteMailToContact([value]);
    } else if (systemApi.isMainPage()) {
      mailApi.doWriteMailToContact([value]);
    } else {
      const host = conf('host');
      systemApi.openNewWindow(host + '/#?writeMailToContact=' + value, false);
    }
    onSend && onSend();
    setVisible(false);
    ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'));
  };
  if (!mailList || mailList.length === 1) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        onClick: handleSend,
      });
    }
    return <>{children}</>;
  }
  return (
    <Popover
      getPopupContainer={nd => nd.parentElement || document.body}
      content={
        <div className={styles.sendMailContent}>
          <p>{getIn18Text('CILIANXIRENYOU')}</p>
          <Radio.Group className={styles.radioWrapper} value={value} onChange={e => setValue(e.target.value)}>
            {mailList.map(email => (
              <Radio value={email} key={email}>
                {email}
              </Radio>
            ))}
          </Radio.Group>
          <div
            className={classNames(styles.buttonWrapper, {
              [styles.buttonWrapperBordered]: mailList.length > 3,
            })}
          >
            <Button onClick={() => setVisible(false)} style={{ marginRight: 12 }}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button type="primary" data-test-id={testId} onClick={handleSend}>
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      }
      onVisibleChange={setVisible}
      visible={visible}
      trigger="click"
      placement="bottom"
    >
      {children}
    </Popover>
  );
};
export default SendMailPop;
