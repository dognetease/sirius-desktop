/* eslint-disable max-len */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PageProps, navigate } from 'gatsby';
import { apiHolder, ResNotice, getIn18Text } from 'api';
import { useAppDispatch, useActions } from '@web-common/state/createStore';
import { isMatchUnitableCrmHash, unitableRouteHashPrefix } from '@web-unitable-crm/api/helper';
// import Edm from '@web-edm/edmIndex';
import { KeyboardModel } from '@web-setting/Keyboard/keyboard';
import { IntelliMarketingIcon } from '@web-common/components/UI/Icons/icons';
import { NoviceTaskActions } from '@web-common/state/reducer';
// import Customer from '../components/Layout/Customer/customerIndex';
// import Sns from '../components/Layout/SNS/snsIndex';
// import '../styles/global.scss';
// import Config from '../components/Layout/MailConfig/menuIcon';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import { AntdConfig } from '@web-common/components/UI/Config/Config';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import { getMenuSettingsAsync, getPrivilegeAsync, getVersionAsync } from '@web-common/state/reducer/privilegeReducer';
import { doSharedAccountAsync } from '@web-common/state/reducer/loginReducer';
import { useLocation } from '@reach/router';
import lodashGet from 'lodash/get';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { navigateToSchedule } from '@/layouts/Main/util';
import SiriusLayout from '@/layouts';
import UpgradeApp from '@/components/Electron/Upgrade';

import { SiriusPageProps } from '@/components/Layout/model';
import { showNoviceTaskCloseTip } from '@/components/Layout/TaskCenter/utils';
import IntelliMarketing from '@/components/Layout/SceneAggregation/intelliMarketing';

console.info('---------------------from index page------------------');
// const buildFor = apiHolder.env.forElectron;
const eventApi = apiHolder.api.getEventApi();
const moduleNamePattern = /#(\/?[\w\d_-]+)((?=\?)|($))/;

const lazyEntry = (Comp: React.FunctionComponent<SiriusPageProps>, activeName: string) => {
  const WrapElement = React.memo(
    (props: SiriusPageProps) => {
      const { activeKey, name } = props;

      const [enableRender, setEnableRender] = useState(false);

      useEffect(() => {
        setEnableRender(flag => {
          if (flag) {
            return flag;
          }
          return activeKey === name;
        });
      }, [activeKey]);

      if (!enableRender) {
        return null;
      }

      return <Comp {...props} />;
    },
    (prevProps, props) => {
      if (lodashGet(props, 'activeKey', '') !== activeName) {
        return true;
      }
      return false;
    }
  );

  return WrapElement;
};

const IMarketEntry = lazyEntry(IntelliMarketing, 'edm');

const IndexPageWrapper: React.FC<any> = ({ children, visibleUpgradeApp, upgradeInfo, setVisible, activeKey }) => (
  <SiriusLayout.ContainerLayout isLogin={false} activeKey={activeKey}>
    {children}
    {process.env.BUILD_ISELECTRON && visibleUpgradeApp === 2 ? <UpgradeApp upgradeInfo={upgradeInfo} setVisibleUpgradeApp={setVisible} /> : null}
  </SiriusLayout.ContainerLayout>
);

const IndexPage: React.FC<PageProps> = () => {
  const dispatch = useAppDispatch();
  const [visibleUpgradeApp, setVisibleUpgradeApp] = useState<number>(0);
  // const [contactSyncIframeShow, setContactSyncIframeShow] = useState<boolean>(false);
  const [upgradeInfo, setUpgradeInfo] = useState();
  const [visibleKeyboardModel, setVisibleKeyboardModel] = useState<boolean>(false);

  const refVisibleUpgradeApp = useRef(visibleUpgradeApp);
  const refVisibleKeyboardModel = useRef(visibleKeyboardModel);
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  const [edmNotice, setEdmNotice] = useState<ResNotice | null>(null);

  const appDispatch = useAppDispatch();

  const setVisible = process.env.BUILD_ISWEB
    ? (bool: boolean) => {
        console.log(bool);
      }
    : useCallback((bool: boolean) => {
        setVisibleUpgradeApp(bool ? 2 : 1);
      }, []);
  useCommonErrorEvent('indexCommonErrorOb');
  useEventObserver('keyboard', {
    name: 'global-keyboard-listener',
    func: ev => {
      const { eventData } = ev;
      if (ev.eventStrData === 'global' && eventData) {
        if (eventData.action === 'visibleKeyboardModel') {
          setVisibleKeyboardModel(true);
        } else if (eventData.action === 'navigate') {
          if (eventData.module === 'schedule' && navigateToSchedule()) {
            return;
          }
          navigate(eventData.url);
        }
      }
    },
  });

  if (process.env.BUILD_ISELECTRON) {
    useEffect(() => {
      refVisibleUpgradeApp.current = visibleUpgradeApp;
    }, [visibleUpgradeApp]);
  }

  useEffect(() => {
    refVisibleKeyboardModel.current = visibleKeyboardModel;
  }, [visibleKeyboardModel]);

  useEffect(() => {
    // electron主页面 监听邮件是否发送成功
    if (process.env.BUILD_ISELECTRON) {
      eventApi.registerSysEventObserver('upgradeApp', ev => {
        console.log('visibleUpgradeApp', ev, refVisibleUpgradeApp.current);
        if (ev?.eventData?.forcePopup) {
          setVisibleUpgradeApp(2);
        } else {
          refVisibleUpgradeApp.current === 0 && setVisibleUpgradeApp(2);
        }
        if (ev && ev.eventData) {
          setUpgradeInfo(ev.eventData);
        }
      });
    }
    if (process.env.BUILD_ISEDM) {
      appDispatch(getMenuSettingsAsync());
    }
  }, []);

  useEffect(() => {
    const eventId = eventApi.registerSysEventObserver('sharedAccountLogout', {
      name: 'mainpage-sharedAccoutLogout',
      func: _ => {
        setTimeout(() => {
          dispatch(doSharedAccountAsync());
        }, 10);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('sharedAccountLogout', eventId);
    };
  }, []);

  // const [isDevEnv] = useState(environment === 'dev');

  const { hash: currentHash } = useLocation();
  const [activeKey, setActiveKey] = useState('mailbox');

  useEffect(() => {
    if (!currentHash || !currentHash.length) {
      return;
    }
    const matchedArr = currentHash.match(moduleNamePattern);
    /**
     * crm 使用的是react-router-dom hash路由，path存在多个层级，因此这里判断一下是否是以unitable-crm为前缀的路由
     * 如果是则设置当前激活的tab为 /unitable-crm
     * */
    if (isMatchUnitableCrmHash(currentHash)) {
      setActiveKey(unitableRouteHashPrefix);
      return;
    }
    if (!matchedArr) {
      return;
    }
    setActiveKey(matchedArr[1] as string);
  }, [currentHash]);

  const [visibleStyle] = useState({
    display: 'flex',
    flex: '1 1 0%',
    overflow: 'hidden',
  });

  const [hiddenStyle] = useState({
    display: 'none',
  });

  // const visibleEdm = useAppSelector(state => getIsSomeMenuVisbleSelector(
  //   state.privilegeReducer,
  //   [
  //     'EDM_SENDBOX', 'EDM_DATA_STAT', 'EDM_DRAFT_LIST', 'EDM_BLACKLIST',
  //     'ADDRESS_BOOK_LIST', 'ADDRESS_OPEN_SEA', 'MARKET_DATA_STAT',
  //   ],
  // ));
  // const visibleCustomer = useAppSelector(state => getIsSomeMenuVisbleSelector(
  //   state.privilegeReducer,
  //   ['CONTACT_COMMERCIAL_LIST', 'CONTACT_CHANNEL_LIST', 'CONTACT_TAG_MANAGE', 'CONTACT_LIST', 'CHANNEL_OPEN_SEA']
  // ));
  // const enalbeFastMail = useAppSelector(state => state?.privilegeReducer?.enableFastMail);
  if (process.env.BUILD_ISEDM) {
    useEffect(() => {
      const id = eventApi.registerSysEventObserver('edmGlobalNotice', {
        func: ev => {
          if (ev.eventData) {
            setEdmNotice(ev.eventData);
          }
        },
      });
      return () => {
        eventApi.unregisterSysEventObserver('edmGlobalNotice', id);
      };
    }, []);
  }

  useEffect(() => {
    if (!process.env.BUILD_ISEDM) {
      return;
    }
    if (activeKey === 'edm' || activeKey === 'worktable' || activeKey === 'wmData') {
      appDispatch(getPrivilegeAsync());
      appDispatch(getMenuSettingsAsync());
    }

    appDispatch(getVersionAsync());
  }, [activeKey]);

  const edmEntries = process.env.BUILD_ISEDM
    ? [
        <div style={activeKey === 'edm' ? visibleStyle : hiddenStyle} name="edm" tag={getIn18Text('intelliMarketing')} icon={IntelliMarketingIcon} hidden={false}>
          <IMarketEntry name="edm" activeKey={activeKey} />
        </div>,
      ]
    : [];

  // console.log('cccc', enalbeFastMail, process.env.BUILD_ISEDM, edmEntries);

  const noviceTaskActions = useActions(NoviceTaskActions);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      const id = eventApi.registerSysEventObserver('NoviceTaskRegister', event => {
        noviceTaskActions.registerNoviceTask(event.eventData);
      });
      return () => {
        eventApi.unregisterSysEventObserver('NoviceTaskRegister', id);
      };
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      const id = eventApi.registerSysEventObserver('NoviceTaskFinished', event => {
        const { taskName, shouldRemind } = event.eventData;

        if (shouldRemind) {
          Modal.success({
            title: `恭喜你完成「${taskName}」，是否继续完成其他新手引导？`,
            icon: <i className="icon success-icon" />,
            cancelText: '结束',
            okText: '继续完成',
            onCancel: showNoviceTaskCloseTip,
            onOk: () => navigate('#noviceTask?page=noviceTask'),
          });
        } else {
          Modal.success({
            title: `恭喜你完成「${taskName}」！`,
            icon: <i className="icon success-icon" />,
            hideCancel: true,
            okText: '知道了',
          });
        }
      });
      return () => {
        eventApi.unregisterSysEventObserver('NoviceTaskFinished', id);
      };
    }
  }, []);

  useEffect(() => {
    if (process.env.BUILD_ISEDM) {
      appDispatch(getVersionAsync());
    }
  }, []);

  return (
    <IndexPageWrapper visibleUpgradeApp={visibleUpgradeApp} setVisible={setVisible} upgradeInfo={upgradeInfo} activeKey={activeKey}>
      <MemoizedTinymceTooltip />
      {/* 通用Antd配置 */}
      <AntdConfig />
      <SiriusLayout.MainLayout>
        {/* 内层直接引入模块 */}
        {process.env.BUILD_ISEDM ? edmEntries : null}
      </SiriusLayout.MainLayout>
      <KeyboardModel
        visible={visibleKeyboardModel}
        onCancel={() => {
          setVisibleKeyboardModel(false);
        }}
      />
    </IndexPageWrapper>
  );
};
export default IndexPage;
console.info('---------------------end index page------------------');
