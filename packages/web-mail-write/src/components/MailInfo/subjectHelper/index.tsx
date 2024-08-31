import { TongyongGuanbiXian, TongyongJiantou1You } from '@sirius/icons';
import styles from './index.module.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { EdmSendBoxApi, GPTDayLeft, MailApi, api, apis, getIn18Text } from 'api';
import classnames from 'classnames';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';

interface SubjectHelperProp {
  loading?: boolean;
  onClose: () => void;
  onVisibleSubjectHelper: () => void;
  onClickAiPolish: () => Promise<void>;
}

const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const SubjectHelper = (props: SubjectHelperProp) => {
  const { onClose, loading, onVisibleSubjectHelper, onClickAiPolish } = props;
  const [aiCount, setAiCount] = useState<number>(0);

  // ai润色
  const aiPolish = useCallback(async () => {
    if (loading) {
      return;
    }
    await onClickAiPolish();
  }, [loading]);

  // 获取ai次数剩余次数
  const getAiCount = useCallback(async () => {
    try {
      let res: GPTDayLeft;
      if (process.env.BUILD_ISEDM) {
        res = await edmApi.getGPTQuota();
      } else {
        // @ts-ignore
        res = await mailApi.getGPTQuota();
      }
      setAiCount(res.dayLeft);
    } catch (error) {
      console.error('getAiCount error', error);
    }
  }, []);

  useEffect(() => {
    getAiCount();
  }, []);

  useMsgRenderCallback('aiTimesUpdate', () => {
    getAiCount();
  });

  return (
    <div className={styles.subjectHelperWrap}>
      <div className={styles.closeWrap} onClick={onClose}>
        <TongyongGuanbiXian className={styles.icon} wrapClassName={styles.iconWrap} />
      </div>
      {process.env.BUILD_ISEDM && (
        <div className={classnames(styles.textWrap, styles.helperTxtWrap)}>
          <span className={styles.txt}>{getIn18Text('XIANGYAOHUOQUGENGDYZDKLDKFXZT？DJCK')}</span>
          <span className={styles.blueTxt} onClick={onVisibleSubjectHelper}>
            <span>{getIn18Text('KAIFAXINZHUTINRZS')}</span>
            <TongyongJiantou1You className={styles.icon} wrapClassName={styles.iconWrap} />
          </span>
        </div>
      )}
      <div className={styles.textWrap}>
        <span className={styles.txt}>{getIn18Text('YOUJIANZHUTIXUYRS？SSSRZTHDJ')}</span>
        <span
          className={classnames(styles.blueTxt, {
            [styles.disable]: loading,
          })}
          onClick={aiPolish}
        >
          <span>{getIn18Text('AIRUNSEZHUT')}</span>
          <TongyongJiantou1You className={styles.icon} wrapClassName={styles.iconWrap} />
        </span>
        <span className={styles.count}>{getIn18Text('JINRIAISHENGYKYCS：', { count: aiCount })}</span>
      </div>
    </div>
  );
};

export default SubjectHelper;
