import React, { useEffect, useState } from 'react';
import { Radio } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import type { RadioChangeEvent } from 'antd';
import { apiHolder as api, apis, MailConfApi as MailConfApiType, getIn18Text } from 'api';
import classnamesBind from 'classnames/bind';
import styles from '../../index.module.scss';
import { ANCHOR_ID_MAP } from '../MailSetting/DefaultMailSettingConfig';

const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const realStyle = classnamesBind.bind(styles);

const MailAutoMarkRead: React.FC<any> = () => {
  const [mailAutoMarkRead, setMailAutoMarkRead] = useState<boolean>(true);

  // 阅读邮件是否标为已读
  const handleMailAutoMarkReadChanged = (val: RadioChangeEvent) => {
    const shouldAutoReadMail = val.target.value;
    setMailAutoMarkRead(shouldAutoReadMail);
    // 同步cache，同步服务端
    mailConfApi.setShouldAutoReadMail(shouldAutoReadMail).then(setRes => {
      if (!setRes) {
        message.error(getIn18Text('SHEZHISHIBAI'));
        setMailAutoMarkRead(!shouldAutoReadMail);
      }
    });
  };

  useEffect(() => {
    const shouldAutoReadMail = mailConfApi.getShouldAutoReadMailSync();
    setMailAutoMarkRead(shouldAutoReadMail);
  }, []);
  return (
    <>
      {/* 阅读邮件后是否标为已读 */}
      <div className={realStyle('configModuleItem')}>
        <div id={ANCHOR_ID_MAP.COMMON_READ_MARK} className={realStyle('configModuleItemTitle')}>
          {getIn18Text('MAIL_AUTO_MARKREADTITLE')}
        </div>
        <div className={styles.configContentCheckbox}>
          <Radio.Group value={mailAutoMarkRead} onChange={handleMailAutoMarkReadChanged}>
            <Radio value={true}>{getIn18Text('MAIL_AUTO_READ_LABEL')}</Radio>
            <Radio value={false}>{getIn18Text('MAIL_NOAUTO_READ_LABEL')}</Radio>
          </Radio.Group>
        </div>
      </div>
    </>
  );
};
export default MailAutoMarkRead;
