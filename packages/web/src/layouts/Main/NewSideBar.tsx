import React, { useState } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, conf, DataTrackerApi, EventApi, MailApi, SystemApi } from 'api';
import { navigate } from 'gatsby';
import Avatar from '@web-common/components/UI/Avatar/avatar';
// eslint-disable-next-line import/no-unresolved
// @ts-ignore
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { ReadCountActions } from '@web-common/state/reducer';
import { AvatarList } from '@web-common/components/UI/AvatarList/avatar-list';
import { ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import style from '@/layouts/Main/main.module.scss';
import { PageName, tabs, tabsMap } from '../../global';
// import MailConfig from '../../components/Layout/MailConfig/configPage';
import { getIn18Text } from 'api';
// const keyEventMapToDispatchAction = {
//   'mail': UpdateModuleUnread.UPDATE_MAILBOX_UNREAD,
//   'im': UpdateModuleUnread.UPDATE_IM_UNREAD,
// };
const stage = conf('stage');
const inElectron = apiHolder.api.getSystemApi().isElectron;
const visibleAvatarList = inElectron() || stage === 'local';
// const forElectron = inElectron() || conf('stage') === 'dev';
const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
// const imApi: NIMApi = apiHolder.api.requireLogicalApi(apis.imApiImpl) as unknown as NIMApi;
const eventApi: EventApi = apiHolder.api.getEventApi();
const sysApi: SystemApi = apiHolder.api.getSystemApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const NewSideTabBar: React.FC<{
  activeKey?: string;
}> = ({ activeKey = '' }) => {
  // const keyMapToAction = {
  //     "mailbox": "mail_clear",
  //     "message": "im_clear"
  // };
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount);
  const unReadCountActions = useActions(ReadCountActions);
  const [block, setBlock] = useState(false);
  const [hoverKey, setHoverKey] = useState<PageName | undefined>();
  const handleMouseEnter = (key: PageName) => {
    setHoverKey(key);
  };
  const handleMouseLeave = () => {
    setHoverKey(undefined);
  };
  const showBlockingMsg = () => {
    SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
  };
  const handleClick = (key?: string) => () => {
    if (block) {
      showBlockingMsg();
      trackApi.track('pc_leftNavigationBarTab', { tabName: key, operate: 'blocking' });
      return;
    }
    eventApi.sendSysEvent({
      eventName: 'settingShow',
      eventData: {
        type: '',
        action: 'hide',
        activeKey: key,
      },
    });
    trackApi.track('pc_leftNavigationBarTab', { tabName: key, operate: 'click' });
    if (key === 'mailbox') {
      mailApi.doUpdateMailBoxStat();
    } else if (key === 'message') {
      // imApi.doUpdateUnreadCount();
    } else if (key === 'schedule') {
      sysApi.prepareWindow('scheduleOpPage').then();
      sysApi.prepareWindow('schedule').then();
    } else if (key === 'disk') {
      sysApi.prepareWindow('resources').then();
    }
    if (key && key in tabsMap && tabsMap[key] && tabsMap[key].url) {
      navigate(tabsMap[key].url || '/')?.then();
    }
  };
  // const pushApi: PushHandleApi = apiHolder.api.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
  useEventObserver('notificationChange', {
    name: 'navbarNotificationChangeOb',
    func: ev => {
      if (ev.eventStrData) {
        if (ev.eventStrData === 'mail') {
          unReadCountActions.updateMailboxUnreadCount(ev.eventData);
        }
        if (ev.eventStrData === 'im') {
          unReadCountActions.updateIMUnreadCount(ev.eventData);
        }
      }
    },
  });
  const blockFunc = (flag: boolean) => {
    setBlock(flag);
  };
  // const stage = inElectron() && window.electronLib.env.stage;
  const sideBarStyle = inElectron() && stage !== 'prod' ? { background: stage === 'local' ? '#802EC7' : '#569FA7' } : {};
  // console.warn('sideBarStyle', sideBarStyle);
  return (
    <>
      <div className={style.sideBarTicky}>
        <div className={style.sideBar} style={sideBarStyle}>
          <div style={{ width: '100%', height: inElectron() && isMac ? ELECTRON_TITLE_FIX_HEIGHT : 0 }} />
          <Avatar notifyBlocking={blockFunc} activeKey={activeKey} />
          {tabs.map(tab => {
            const { name, tag, icon, hidden } = tab;
            const focus = activeKey === tab.name;
            const hover = hoverKey === tab.name;
            const Icon = icon;
            const unread = unreadCount[name];
            return (
              <div
                className={classnames(
                  [style.sideBarTab],
                  {
                    [style.sideBarTabFocus]: focus,
                    [style.sideBarTabHover]: hover,
                  },
                  hidden && [style.sideBarTabHide]
                )}
                onClick={handleClick(name)}
                onMouseEnter={() => {
                  handleMouseEnter(name);
                }}
                onMouseLeave={() => {
                  handleMouseLeave();
                }}
                key={name}
              >
                {Icon && (
                  <div className={style.iconWrapper}>
                    <Icon enhance={focus || hover} />
                    {unread !== undefined && unread > 0 && (
                      <span className={style.iconTag}>
                        <span className={style.text}>{unread < 1000 ? unread : '···'}</span>
                      </span>
                    )}
                  </div>
                )}
                {Icon && <div className={style.sideBarTabLabel}>{tag}</div>}
              </div>
            );
          })}
          {visibleAvatarList && <AvatarList isBlock={block} />}
        </div>
      </div>
    </>
  );
};
export default NewSideTabBar;
