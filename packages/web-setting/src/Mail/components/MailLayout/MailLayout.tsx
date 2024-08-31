import React, { useCallback, useEffect } from 'react';
import { Radio, RadioChangeEvent, Divider } from 'antd';
import { apiHolder as api, apis, DataTrackerApi, MailConfApi as MailConfApiType, SystemApi, ProductTagEnum } from 'api';
import styles from './MailLayout.module.scss';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import classNames from 'classnames';
// import UpDownSettingIcon from '@/images/mail/upDownSettingIcon.png';
// import zuoyoufenlan from '@/images/mail/zuoyoufenlan.png';
// import BannerSettingIcon from '@web-common/components/UI/Icons/svgs/mail/BannerSettingIcon';
// import MulticolumnSettingIcon from '@web-common/components/UI/Icons/svgs/mail/MulticolumnSettingIcon';
import { getIn18Text } from 'api';

const inEdm = process.env.BUILD_ISEDM;

interface MailLayoutProps {
  isQuick?: boolean;
}
/**
 * 规则适用于
 */
export const MailLayout: React.FC<MailLayoutProps> = props => {
  const { isQuick = false } = props;
  const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
  // 获取布局改为同步方法
  const [value, setValue] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  const onChange = (e: RadioChangeEvent) => {
    console.log('radio checked', e.target.value);
  };
  const onRadioCardClick = useCallback(val => {
    console.log('radio onRadioCardClick', val);
    setValue(val);
    mailConfApi.setMailPageLayout(val);
  }, []);
  return (
    <Radio.Group onChange={onChange} className={classNames(styles.mailLayoutRadio, { [styles.isQuick]: isQuick })} value={value}>
      <div className={styles.radioCard} onClick={() => onRadioCardClick('2')}>
        <Radio className={styles.radioSelect} value={'2'}>
          {getIn18Text('TONGLAN')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={`${styles.layoutImg1} ${styles.radioCardDescCon}`}>
            {/* <div className={styles.radioCardDescConBlueStick}></div> */}
            {/* <div className={styles.radioCardDescConIconWrap}>
              <BannerSettingIcon width={isQuick ? 83 : 108} height={isQuick ? 55 : 72} />
            </div> */}
          </div>
        </div>
      </div>
      <div className={styles.radioCard} onClick={() => onRadioCardClick('1')}>
        <Radio className={styles.radioSelect} value={'1'}>
          {getIn18Text('ZUOYOUFENLAN')}
        </Radio>
        <div className={styles.radioCardDesc}>
          <div className={`${styles.layoutImg2} ${styles.radioCardDescCon}`}>
            {/* <img src={zuoyoufenlan} width={isQuick ? 108 : 146} height={isQuick ? 60 : 80} alt="" /> */}
          </div>
        </div>
      </div>
      {!inEdm ? (
        <div className={styles.radioCard} onClick={() => onRadioCardClick('3')}>
          <Radio className={styles.radioSelect} value={'3'}>
            {getIn18Text('SHANGXIAFENLAN')}
          </Radio>
          <div className={styles.radioCardDesc}>
            <div className={`${styles.layoutImg3} ${styles.radioCardDescCon}`}>
              {/* <img src={UpDownSettingIcon} width={isQuick ? 108 : 146} height={isQuick ? 60 : 80} alt="" /> */}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </Radio.Group>
  );
};
export default MailLayout;
