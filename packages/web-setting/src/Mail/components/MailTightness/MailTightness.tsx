import React, { useState, useEffect } from 'react';
import { Radio, RadioChangeEvent } from 'antd';
import { apiHolder as api, apis, MailConfApi as MailConfApiType } from 'api';
import styles from './MailTightness.module.scss';
import classNames from 'classnames';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { getIn18Text } from 'api';

interface MailLayoutProps {
  isQuick?: boolean;
}
// 设置邮件列表密度
export const MailTightness: React.FC<MailLayoutProps> = props => {
  const { isQuick = false } = props;
  // api方法
  const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
  // 默认选中适中
  const [mailConfigListTightness, setMailConfigListTightness] = useState2RM('configMailListTightness', 'doUpdateConfigMailListTightness');
  // 附件
  const [attachmentChecked, setAttachmentChecked] = useState2RM('configMailListShowAttachment', 'doUpdateConfigMailListShowAttachment');

  // 点击单选
  const handleChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
  };
  // 点击卡片
  const onRadioCardClick = val => {
    console.log('radio onRadioCardClick', val);
    setMailConfigListTightness(+val);
    mailConfApi.setMailListTightness(String(val));
    if (+val === 3) {
      mailConfApi.setMailShowAttachment(false);
      setAttachmentChecked(false);
    }
  };
  // 进入初始化一次
  useEffect(() => {
    const res = mailConfApi.getMailListTightness();
    setMailConfigListTightness(+res);
  }, []);

  return (
    <Radio.Group value={mailConfigListTightness} onChange={handleChange} className={classNames(styles.mailLayoutRadio, { [styles.isQuick]: isQuick })}>
      <div className={classNames([styles.radioCard])} onClick={() => onRadioCardClick(1)}>
        <Radio className={styles.radioSelect} value={1}>
          {getIn18Text('mailTightness1')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={styles.radioImg1}></div>
        </div>
      </div>
      <div className={classNames([styles.radioCard])} onClick={() => onRadioCardClick(2)}>
        <Radio className={styles.radioSelect} value={2}>
          {getIn18Text('mailTightness2')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={styles.radioImg2}></div>
        </div>
      </div>
      <div className={classNames([styles.radioCard])} onClick={() => onRadioCardClick(3)}>
        <Radio className={styles.radioSelect} value={3}>
          {getIn18Text('mailTightness3')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={styles.radioImg3}></div>
        </div>
      </div>
      {/* </div> */}
    </Radio.Group>
  );
};
export default MailTightness;
