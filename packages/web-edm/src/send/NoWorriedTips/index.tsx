import React, { FC, useState, useContext, useEffect } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, DataStoreApi } from 'api';
import moment from 'moment';
import { ReactComponent as ZhanKaiIcon } from '@web-common/images/newIcon/tongyong_zhankai_xia.svg';
import { ReactComponent as GuanbiIcon } from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
import { ReactComponent as AlertIcon } from '@/images/icons/edm/yingxiao/alert-tips.svg';
import { useAppSelector } from '@web-common/state/createStore';
import TopNotification from '@web-common/components/TopNotification';
import QuotaNotifyModal from '@web-common/components/QuotaNotifyModal';

const MAX_SEND_TIPS = 'MAX_SEND_TIPS';
const data_formatter = 'YYYY-MM-DD';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

import { edmDataTracker } from '../../tracker/tracker';
import { writeContextReducer, IEdmWriteState, edmWriteContext } from '../edmWriteContext';
import styles from './NoWorriedTips.module.scss';

export const NoWorriedTips: FC<{
  /**
   * 是否从任务选择页进入，样式不同
   */
  formSelectPage?: boolean;
}> = props => {
  const { formSelectPage = false } = props;
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clickType, setClickType] = useState<string>();
  // 是否为旗舰版，旗舰版不展示
  const ultimateVersion = useAppSelector(state => state.privilegeReducer.ultimateVersion);

  const state = useContext(edmWriteContext);

  useEffect(() => {
    const data = dataStoreApi.getSync(MAX_SEND_TIPS);
    if (data.suc && data.data) {
      setShow(!(data.data === moment().format(data_formatter)));
    } else {
      setShow(true);
    }
  }, []);

  // 埋点
  useEffect(() => {
    if (show && (state.value.state?.sendCapacity?.sendCount || 0) > (state.value.state?.sendCapacity?.privilegeUpgradeSendCount || 0)) {
      edmDataTracker.anxinfaTips();
    }
  }, [show, state]);

  // 旗舰版就不展示了
  // if (appVersion !== 'FASTMAIL') {
  //   return null;
  // }

  if (ultimateVersion || !show) {
    return null;
  }

  // 没超过上限就不展示
  if ((state.value.state?.sendCapacity?.sendCount || 0) <= (state.value.state?.sendCapacity?.privilegeUpgradeSendCount || 0)) {
    return null;
  }

  return (
    <div className={classnames(styles.wrap, formSelectPage ? styles.wrap2 : '')}>
      <div className={styles.left}>
        <AlertIcon />
        <div className={styles.intro}>
          今日发件已超{state.value.state.sendCapacity?.privilegeUpgradeSendCount}封。单日大量发营销邮件会降低域名信誉、影响送达效果。建议设置定时发送，或：
        </div>
        <a
          onClick={() => {
            setShowModal(true);
            setClickType('EDM_SEND_HHB');
          }}
          className={classnames(styles.link, formSelectPage ? styles.link2 : '')}
        >
          {formSelectPage ? '添加发件地址' : '添加其他发件地址'}
        </a>
        <a
          onClick={() => {
            setShowModal(true);
            setClickType('EDM_SEND_QJB');
          }}
          className={styles.link}
        >
          {formSelectPage ? '升级旗舰版' : '升级旗舰版享受安心发'}
        </a>
      </div>
      <div
        className={styles.right}
        onClick={() => {
          setShow(false);
          dataStoreApi.putSync(MAX_SEND_TIPS, moment().format(data_formatter));
        }}
      >
        <GuanbiIcon />
      </div>
      {showModal && (
        <QuotaNotifyModal moduleType={clickType} type="click" handleCancel={() => setShowModal(false)} onVisibleChange={visible => !visible && setShowModal(false)} />
      )}
    </div>
  );
};
