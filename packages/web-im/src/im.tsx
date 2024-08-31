import React, { NamedExoticComponent, useEffect, useState, useCallback } from 'react';
import { Tooltip } from 'antd';
import debounce from 'lodash/debounce';
import classnames from 'classnames';
import { apiHolder, apis, DataTrackerApi, inWindow, NIMApi, util, isElectron } from 'api';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import ImSubmenuPannel from './submenu/imSubMenuPannel';
import ImSubContentPanel from './subcontent/imSubContentPanel';
import Provider from './store/provider';
import Search from './search';
import { SearchTeamExact } from './search/searchTeamExact';
import TeamCreator from './components/TeamCreator/teamCreator';
import styles from './im.module.scss';
import ImNetworkTips from './submenu/imNetworkTips';
import { isShowWebLayout } from '@/layouts/Main/util';
import { getValidStoreWidth } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const dataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi();
const command = inWindow() ? util.getCommonTxt(' ') : '';
const storeApi = apiHolder.api.getDataStoreApi();
const STORE_IM_LIST_WIDTH = 'STORE_IM_LIST_WIDTH';
const Message: React.FC<any> = ({ name = 'message' }) => {
  // const isClient = process.env.GATSBY_PLATFORM;
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [teamCreatorVisible, setTeamCreatorVisible] = useState(false);
  const [teamExactVisible, setTeamExactVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [defaultIMWidth, setDefaultIMWidth] = useState<number>(332);
  const openSearch = () => {
    dataTrackerApi.track('pc_im_click_search_list');
    setSearchModalVisible(true);
  };
  const openTeamCreator = () => {
    dataTrackerApi.track('pc_im_create_new_group');
    setTeamCreatorVisible(true);
  };
  // TODO 监听resize
  const debounceResize = useCallback(
    debounce((_, data) => {
      // TODO 调整左侧宽度，保存width into storage
      const {
        size: { width },
      } = data;
      storeApi.putSync(STORE_IM_LIST_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
    }, 600),
    []
  );
  // 监听外部动作触发search显示
  useEffect(() => {
    const showModal = () => {
      openTeamCreator();
    };
    nimApi.subCustomEvent('TRIGGER_CONTACT_MODAL', showModal);
    const storeListWidth = getValidStoreWidth(storeApi.getSync(STORE_IM_LIST_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storeListWidth > 0) {
      setDefaultIMWidth(storeListWidth);
    }
    return () => {
      nimApi.offCustomEvent('TRIGGER_CONTACT_MODAL', showModal);
    };
  }, []);
  const keydownAction = (e: KeyboardEvent) => {
    const commandKey = util.isMac() ? e.metaKey : e.ctrlKey;
    if (e.keyCode === 70 && commandKey && window.location.hash.indexOf('#message') === 0) {
      nimApi.emitCustomEvent('MESSAGE_SHORTCUTS_SEARCH');
      openSearch();
    }
  };
  useEffect(() => {
    document.body.addEventListener('keydown', keydownAction);
    return () => {
      document.body.removeEventListener('keydown', keydownAction);
    };
  }, []);
  const [networkVisible, setNetworkVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  return (
    <>
      <PageContentLayout allowDark className={[`${systemApi.isWebWmEntry() ? styles.pageContentWm : ''}`, styles.imEntryWrapper].join(' ')}>
        {/* 左侧菜单栏 */}
        <SideContentLayout borderRight defaultWidth={defaultIMWidth} onResize={debounceResize} minConstraints={[332, 0]} maxConstraints={[436, Infinity]}>
          <div className={classnames(styles.topWrapper, { 'web-layout-border': isShowWebLayout() })}>
            <ImNetworkTips networkChange={setNetworkVisible} />
            <div className={styles.searchBar}>
              <button type="button" data-test-id="im_left_top_search_btn" className={`${styles.searchButton} im-search-button`} onClick={openSearch}>
                <i className={`dark-invert searchIcon ${styles.searchIcon}`} />
                <span>{getIn18Text('SOUSUO')}</span>
                <span className={styles.searchTips}>{command + 'F'}</span>
              </button>
              <Tooltip visible={showTooltip} overlayClassName={styles.tooltipOverlay} title={getIn18Text('CHUANGJIANQUNZU')} placement="bottom">
                <div
                  data-test-id="im_left_top_create_team_btn"
                  className={styles.iconWrapper}
                  onClick={openTeamCreator}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <i className={styles.addMemberIcon} />
                </div>
              </Tooltip>
            </div>
          </div>
          <ImSubmenuPannel paddingMore={networkVisible} />
        </SideContentLayout>
        {/* 会话区域 */}
        <ImSubContentPanel />
      </PageContentLayout>
      <Search
        isModalVisible={searchModalVisible}
        closeModal={() => {
          setSearchModalVisible(false);
        }}
        showTeamExact={(kw: string) => {
          setKeyword(kw);
          setTeamExactVisible(true);
        }}
      />
      {teamExactVisible && (
        <SearchTeamExact
          isModalVisible={teamExactVisible}
          keyword={keyword}
          closeModal={() => {
            setTeamExactVisible(false);
          }}
        />
      )}
      {teamCreatorVisible && (
        <div className={`${styles.teamCreatorWrapper} ${systemApi.isWebWmEntry() && styles.wmEntryTeamCreatorWrapper}`}>
          <TeamCreator creatorType={0} onCancel={() => setTeamCreatorVisible(false)} />
        </div>
      )}
    </>
  );
};
const Container: React.FC<any> = () => (
  <Provider>
    <Message />
  </Provider>
);
interface Props {
  name: string;
  tag: string;
  icon: NamedExoticComponent;
  hidden?: boolean;
}
class ErrorBoundary extends React.Component<Props> {
  name = 'message';
  constructor(props: any) {
    super(props);
    console.log('====== init im props', props);
  }
  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('[renderError]', error, errorInfo);
  }
  render() {
    return <Container />;
  }
}
export default ErrorBoundary;
