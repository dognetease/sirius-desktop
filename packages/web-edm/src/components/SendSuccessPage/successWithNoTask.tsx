import React, { FC, useEffect, useCallback, useState, useMemo } from 'react';
import { apiHolder, apis, EdmSendBoxApi, SendBoxConfRes, TaskChannel } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import WikiIcon from '@/images/icons/edm/send/wiki.png';
import SendSuccessIcon from '@/images/icons/edm/send/send-success.png';
import BgIcon from '@/images/icons/edm/send/background.png';
import AiHostingIcon from '@/images/icons/edm/send/ai-hosting.png';
import { navigate } from '@reach/router';
import { edmDataTracker } from '../../tracker/tracker';
import aiHostingGif from './aiHostingGuide.gif';
import styles from './successPageWithNoTask.module.scss';
import { guardString } from '../../utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();

export const SendSuccessWithNoTaskPage: FC<{
  handleRedirect: () => void;
}> = props => {
  const { handleRedirect } = props;
  const [countDown, setCountDown] = useState(6);

  const redirect = () => {
    handleRedirect();
  };

  useEffect(() => {
    systemApi.intervalEvent({
      handler() {
        setCountDown(num => {
          return num <= 1 ? 0 : num - 1;
        });
      },
      id: 'redirectInteval',
      seq: 0,
      eventPeriod: 'short',
    });
    return () => {
      systemApi.cancelEvent('short', 'redirectInteval');
    };
  }, []);

  useEffect(() => {
    if (countDown > 0) {
      return;
    }
    redirect();
  }, [countDown]);

  return (
    <div className={styles.wrap}>
      <div className={styles.sendSuccess}>
        <img src={SendSuccessIcon} className={styles.successIcon} alt="" />
        <div className={styles.successTitle}>单次任务发送成功！</div>
        <div className={styles.successSubTitle}>正在为您升级为多轮发信</div>

        <div className={styles.aihostingloading}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <img src={aiHostingGif} alt="" className={styles.aiHostingGuideGif} />

        <div className={styles.aiHostingGuideText}>
          请完成多轮发信后续设置
          <br />
          选择多轮发信方案并生成营销信
        </div>
        <div className={styles.autoRedirectCountdown}>正在跳转至营销托管新建任务 ({countDown}s)</div>
        <div className={styles.btns}>
          <Button onClick={redirect} btnType="primary">
            立即跳转
          </Button>
        </div>
      </div>
    </div>
  );
};
