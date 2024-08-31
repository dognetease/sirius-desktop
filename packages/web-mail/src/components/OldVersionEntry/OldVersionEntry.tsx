import React, { FC, useState, useEffect } from 'react';
import { Modal, Checkbox, Input, Form } from 'antd';
import { apiHolder, apis, DataTrackerApi, SystemApi, api, conf, inWindow, WebMailApi } from 'api';
import CloseIcon from '@/images/icons/modal-close-btn.svg';
import ActivityIcon from '@/images/icons/activity-icon.svg';
import { getShowOld } from '@web-common/components/util/webmail-util';
import style from './OldVersionEntry.module.scss';
import { OldVersionModal } from './OldVersionModal';
import { getIn18Text } from 'api';

const webmailApi = apiHolder.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;
const storeApi = apiHolder.api.getDataStoreApi();

const WEB_MAIL = 'webmail';
const SHOW_ACTIVITY = 'show_activity';
const WELCOME_GUIDE = 'welcome_guide';
const ACTIVITY_STAT = 'activity_stat'; // 记录活动状态，值为活动id。

let event: CustomEvent | null = null;

// const getStore = (key: string): boolean => {
//   const result = storeApi.getSync(key);
//   if (result.suc && result.data === 'true') {
//     return true;
//   }
//   return false;
// };
const getStore = (key: string, noValue = false) => {
  const result = storeApi.getSync(key);
  if (noValue) {
    if (result.suc && result.data != null) {
      return true;
    }
  } else {
    if (result.suc && result.data === 'true') {
      return true;
    }
  }
  return false;
};

export const OldVersionEntry: FC<{}> = props => {
  const [visible, setVisible] = useState(false);
  const [showEntry, setShowEntry] = useState(false); // 是否展示返回旧版入口
  const [showActivity, setShowActivity] = useState(false); // 是否展示活动入口
  const isWebmail = conf('profile') ? conf('profile').toString().includes(WEB_MAIL) : false;

  useEffect(() => {
    if (inWindow()) {
      event = new CustomEvent(SHOW_ACTIVITY);
      const state = webmailApi.getState();
      if (state['show_old'] != null && +(state['show_old'] as string) === 1) {
        setShowEntry(true);
      }

      const { startTime, endTime } = webmailApi.getTimeRange().yun_bi_ji;
      const time = Date.now();
      if ((getStore(ACTIVITY_STAT, true) || !getStore(WELCOME_GUIDE)) && time > startTime && time < endTime) {
        setShowActivity(true);
      }
    }
  }, []);

  if (!isWebmail) {
    return null;
  }
  return (
    <>
      <div className={style.entryWrapper}>
        {showActivity && (
          <a
            className={style.entryBtn}
            onClick={() => {
              // todo展示弹窗
              if (event != null) {
                window.dispatchEvent(event);
              }
            }}
          >
            <img src={ActivityIcon} alt="" />
            <div className={style.joinActivity}>领会员</div>
          </a>
        )}
        {showEntry && (
          <a
            className={`${style.entryBtn} ${style.entryBtn2}`}
            onClick={() => {
              setVisible(true);
            }}
          >
            {getIn18Text('HUIDAOJIUBAN')}
          </a>
        )}
      </div>
      <OldVersionModal defaultVisible={visible} closeModal={() => setVisible(false)} title="首页右上角返回旧版" />
    </>
  );
};
