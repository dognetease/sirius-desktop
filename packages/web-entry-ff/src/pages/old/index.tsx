import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageProps, navigate } from 'gatsby';
import { apiHolder, environment, inWindow, MailApi, apis, NetStorageApi, NIMApi } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import Edm from '@web-edm/edmIndex';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

import { KeyboardModel } from '@web-setting/Keyboard/keyboard';
import {
  CalenderIcon,
  ContactIcon,
  AppsIcon,
  DiskTabIcon,
  IMIcon,
  MailBoxIcon,
  EdmIcon,
  CustomerIcon,
  WorktableIcon,
  CustomsDataIcon,
  GlobalSearchIcon,
  EnterpriseIcon,
  SnsIcon,
} from '@web-common/components/UI/Icons/icons';
import '../../styles/global.scss';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { navigateToSchedule } from '@/layouts/Main/util';
import SiriusLayout from '@/layouts';
import { getIsSomeMenuVisbleSelector, getMenuSettingsAsync, isEnableFastmailAsync } from '@web-common/state/reducer/privilegeReducer';
console.info('---------------------from index page------------------');
const systemApi = apiHolder.api.getSystemApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const eventApi = apiHolder.api.getEventApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;

const IndexPageWrapper: React.FC<any> = ({ children }) => <SiriusLayout.ContainerLayout isLogin={false}>{children}</SiriusLayout.ContainerLayout>;
const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
// const isEdm = systemApi.inEdm();

const IndexPage: React.FC<PageProps> = ({ location }) => {
  const dispatch = useAppDispatch();
  const [appsVisable, setAppsVisable] = useState<boolean>(false);
  // const [contactSyncIframeShow, setContactSyncIframeShow] = useState<boolean>(false);
  const [visibleKeyboardModel, setVisibleKeyboardModel] = useState<boolean>(false);
  const refVisibleKeyboardModel = useRef(visibleKeyboardModel);
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  const appDispatch = useAppDispatch();

  const visibleEdm = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['EDM_SENDBOX', 'EDM_DATA_STAT', 'EDM_DRAFT_LIST', 'EDM_BLACKLIST']));
  const visibleCustomer = useAppSelector(state =>
    getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CONTACT_COMMERCIAL_LIST', 'CONTACT_CHANNEL_LIST', 'CONTACT_TAG_MANAGE', 'CONTACT_LIST', 'CHANNEL_OPEN_SEA'])
  );
  const visibleWorktable = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WORKBENCH']));
  const visibleCustomsData = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['CUSTOMS']));
  const visilbeGlobalSearch = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['GLOBAL_SEARCH']));
  const visilbeEnterpirseSetting = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['ORG_SETTINGS']));
  const visibleSns = useAppSelector(state =>
    getIsSomeMenuVisbleSelector(state.privilegeReducer, ['WHATSAPP_SEND_TASK', 'WHATSAPP_MSG', 'WHATSAPP_MSG_TPL_SETTING', 'WHATSAPP_DATA_STAT'])
  );
  const enalbeFastMail = useAppSelector(state => state?.privilegeReducer?.enableFastMail);

  useCommonErrorEvent('indexCommonErrorOb');

  useEffect(() => {
    refVisibleKeyboardModel.current = visibleKeyboardModel;
  }, [visibleKeyboardModel]);
  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    if (inWindow() && window.location.hash && writeToPattern.test(window.location.hash)) {
      const exec = writeToPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const writeTo = safeDecodeURIComponent(exec[1]);
        mailApi.doWriteMailToContact([writeTo]);
      }
    }
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);
  useEffect(() => {
    appDispatch(getMenuSettingsAsync());
  }, []);

  useEffect(() => {
    if (enalbeFastMail === undefined && systemApi.getCurrentUser()?.prop?.enable_fastmail === undefined) {
      // 权限失败，重新获取
      appDispatch(isEnableFastmailAsync());
    }
  }, [enalbeFastMail]);

  const isDevEnv = environment === 'dev';
  const edmEntries = [<Edm name="edm" tag="营销" icon={EdmIcon} hidden={!enalbeFastMail || !visibleEdm} />];
  return (
    <>
      <IndexPageWrapper>
        <MemoizedTinymceTooltip />
        <SiriusLayout.MainLayout location={location}>
          {/* 内层直接引入模块 */}

          {systemApi.inEdm() && edmEntries}
        </SiriusLayout.MainLayout>
      </IndexPageWrapper>
    </>
  );
};
export default IndexPage;
console.info('---------------------end index page------------------');
