import React, { ReactElement } from 'react';
// @ts-ignore
// import { Spin } from 'antd';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
// import { useAppSelector } from '@web-common/state/createStore';
import style from './main.module.scss';
import NewSideTabBar from '@/layouts/Main/NewSideBar';
import GlobalCommonComponent from '@/layouts/Main/GlobalCommonComponent';
import { SiriusPageProps } from '../../global';
// import { apis, DataTrackerApi } from 'api/src';
// const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// const eventApi: EventApi = apiHolder.api.getEventApi();
// const hashRegex = /^#([a-zA-Z]+)\??([\w-]+)?$/;

const NewMainLayout: React.FC<SiriusPageProps> = ({ children, name, hideSideBar, pageProps }) => {
  let hash = '';
  let pathName = '/';
  if (pageProps) {
    const { location } = pageProps;
    if (location) {
      hash = location.hash;
      pathName = location.pathname;
      console.log('[mainLayout] render page :', pathName, hash);
    }
  }
  // const { loginLoading } = useAppSelector(state => state.loginReducer);
  const child = React.Children.only(children) as ReactElement;
  return (
    <>
      {/* <div className="sirius-loading" hidden={!loginLoading}/> */}
      <div className={style.mainLayoutContainer}>
        {!hideSideBar ? <NewSideTabBar /> : null}
        <ErrorBoundary name="NewMainLayout">
          <div className="main-content" style={{ display: 'flex', flex: 1 }}>
            <GlobalCommonComponent currentTabTitle={name} />
            {React.cloneElement(child, {
              active: true,
              reshow: true,
              hash,
              ...child.props,
            })}
          </div>
        </ErrorBoundary>
      </div>
    </>
  );
};

export default NewMainLayout;
