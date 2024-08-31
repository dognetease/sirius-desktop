import React, { FC, useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames/bind';
import { apiHolder, apis, DataStoreApi, MailListRes, DataTrackerApi, NIMApi } from 'api';
import { MailIcon, MailSelectedIcon } from '@web-common/components/UI/Icons/svgs/MailIcon';
import styles from './TeamInternalMailBtn.module.scss';
import { TeamInternalMails } from './TeamInternalMails';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 群内邮件button，需要加外层的wrapper，防止透明穿透。
// 注意父组件必须是相对定位
export const TeamInternalMailBtn: FC<{
  total?: number; // 邮件列表数量
  list?: MailListRes['msgs']; // 邮件列表
  teamId: string;
  needDelete?: boolean; // 是否需要删除按钮
}> = props => {
  // 是否展示引导提示
  const [showTips, setShowTips] = useState<boolean>(false);
  // 是否展示群内邮件列表
  const [showMailList, setShowMailList] = useState<boolean>(false);
  const { total, list = [], teamId, needDelete = false } = props;
  let timer: number;
  // 设置按钮提示显示隐藏
  const setGuidanceTip = (show: boolean) => {
    // 需要清除掉 timer
    cleanTimer();
    setShowTips(show);
  };
  // 清除timer
  const cleanTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
    }
  };
  useEffect(() => {
    // 是否已知群内邮件功能
    dataStoreApi.get('isKnowTeamInnerMails').then(data => {
      if (data.suc) {
        setShowTips(false);
      } else {
        setShowTips(true);
        // 5s之后关闭提示
        timer = setTimeout(() => {
          setShowTips(false);
        }, 5000);
      }
    });
    return () => {
      // 需要清除掉 timer
      cleanTimer();
    };
  }, []);
  // Ctrl f 冲突
  useEffect(() => {
    nimApi.subCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setShowMailList, {});
    return () => {
      nimApi.offCustomEvent('MESSAGE_SHORTCUTS_SEARCH', setShowMailList);
    };
  }, []);
  const handleTrack = () => {
    trackApi.track('pc_click_mailChat_mailList');
  };
  if (total == null) {
    // 避免页面闪动
    return <></>;
  }
  return (
    <>
      <Tooltip
        // defaultVisible
        className={realStyle('groupedInnerMailTooltip')}
        placement="topLeft"
        visible={showTips}
        title={
          <div className={realStyle('tooltipWrapper')}>
            <div className={realStyle('tooltipInfo')}>{getIn18Text('DIANJIJIKECHA')}</div>
            <div
              className={realStyle('tooltipBtn')}
              onClick={() => {
                dataStoreApi.put('isKnowTeamInnerMails', '1');
                setGuidanceTip(false);
              }}
            >
              {getIn18Text('ZHIDAOLE')}
            </div>
          </div>
        }
        getPopupContainer={container => container}
        arrowPointAtCenter
      >
        <div
          onClick={evt => {
            setShowMailList(true); // 折叠面板显示隐藏
            dataStoreApi.put('isKnowTeamInnerMails', '1');
            setGuidanceTip(false);
            handleTrack();
          }}
          className={realStyle('groupedInnerMailBtn', {
            groupedInnerMailBtnChecked: showMailList,
          })}
        >
          <div
            className={realStyle('groupedInnerMail', {
              groupedInnerMailChecked: showMailList,
            })}
          >
            {showMailList ? <MailSelectedIcon /> : <MailIcon />}
            <span
              style={{
                marginLeft: '4px',
              }}
            >
              {getIn18Text('QUNNEIYOUJIAN ')}
              {total})
            </span>
          </div>
        </div>
      </Tooltip>
      {/* 邮件列表 */}
      <TeamInternalMails needDelete={needDelete} total={total} list={list} teamId={teamId} onClose={() => setShowMailList(false)} show={showMailList} />
    </>
  );
};
