import React, { useCallback, useEffect } from 'react';
import { Radio, RadioChangeEvent, Divider } from 'antd';
import { apiHolder as api, apis, DataTrackerApi, MailConfApi as MailConfApiType, SystemApi, ProductTagEnum } from 'api';
import styles from './MailReplyPrefix.module.scss';
import mailApiImpl from 'api/src/impl/logical/mail/mail_impl';
import { getIn18Text } from 'api';
interface MailReplyPrefixProps {}
/**
 * 规则适用于
 */
export const MailReplyPrefix: React.FC<MailReplyPrefixProps> = props => {
  const [value, setValue] = React.useState<string['0' | '1']>('1');
  const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
  const tag = '[MailReplyPrefix]';
  const onChange = (e: RadioChangeEvent) => {
    // e.stopPropagation();
    console.log('radio checked', e.target.value);
    // setValue(e.target.value);
  };
  const onRadioCardClick = useCallback(val => {
    console.log('radio onRadioCardClick', val);
    setValue(val);
    mailConfApi.setReplyForwardSetting(val);
  }, []);
  useEffect(() => {
    mailConfApi.getReplySetting().then(val => {
      console.log(tag, 'getReplySetting', val);
      setValue(String(val));
    });
  }, []);
  return (
    <Radio.Group onChange={onChange} className={styles.prefixRadio} value={value}>
      <div className={styles.radioCard} onClick={() => onRadioCardClick('2')}>
        <Radio className={styles.radioSelect} value={'2'}>
          {getIn18Text('SHIYONGZHONGWEN\uFF08')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={styles.radioCardDescCon}>
            <span>{getIn18Text('SHOUJIANREN\uFF1A')}</span>
            <Divider className={styles.divider} />
            <span>
              {getIn18Text('ZHU&nbs')}
              <span className={styles.blk}>{getIn18Text('ZHUANFA\uFF1A')}</span>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.radioCard} onClick={() => onRadioCardClick('0')}>
        <Radio className={styles.radioSelect} value={'0'}>
          {getIn18Text('SHIYONGYINGWEN\uFF08')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={styles.radioCardDescCon}>
            <span>{getIn18Text('SHOUJIANREN\uFF1A')}</span>
            {/* <span className={styles.divider} /> */}
            <Divider className={styles.divider} />
            <span>
              {getIn18Text('ZHU&nbs')}
              <span className={styles.blk}>Fw：</span>
            </span>
          </div>
        </div>
      </div>
    </Radio.Group>
  );
};
export default MailReplyPrefix;
