import React from 'react';
import { Tooltip } from 'antd';
import { apiHolder as api, locationHelper, SystemApi } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import WriteLetter from '@web-mail/components/WriteLetter/WriteLetter';
// import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import WriteLetterIcon from '@web-common/components/UI/Icons/svgs/WriteLetterSvg';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { MailActions } from '@web-common/state/reducer';
import { getBodyFixHeight } from '@web-common/utils/constant';
import SideContentLayout from './sideContentLayout';
import style from './main.module.scss';
import { ExpandableSideContent } from './expandableSideContent';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  from?: 'disk' | 'mail' | 'im' | 'contact' | 'apps' | 'catalog';
}

const PageContentLayout: React.FC<Props> = props => {
  const { children, from, ...rest } = props;
  const systemApi = api.api.getSystemApi() as SystemApi;
  const inElectron = systemApi.isElectron();

  const { mails, showWebWriteLetter } = useAppSelector(state => state.mailReducer);
  const mailActions = useActions(MailActions);

  const showWriteDialog = (e: any) => {
    e.stopPropagation();
    mailActions.doShowWebWrite(true);
  };
  console.time('mainFrame_start_rendering');
  setTimeout(() => {
    console.timeEnd('mainFrame_start_rendering');
  }, 0);

  const renderChildren = (child: React.ReactNode): React.ReactNode => {
    if (React.isValidElement(child)) {
      const sideComponent =
        child.type === SideContentLayout ||
        child.props.SideContentLayout ||
        child.props.SideContentLayout ||
        child.type === ExpandableSideContent ||
        child.props.ExpandableSideContent;
      if (child.type === React.Fragment && child.props.children) {
        return React.Children.map(child.props.children, renderChildren);
      }
      if (sideComponent) {
        return child;
      }
      return (
        <div
          style={{
            height: '100vh',
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
          className="page-content-layout"
        >
          <OverlayScrollbarsComponent
            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0 } }}
            style={{
              position: 'absolute',
              backgroundColor: '#fff',
              paddingTop: from === 'disk' || from === 'mail' || from === 'contact' ? 0 : getBodyFixHeight(true),
              marginTop: from === 'contact' ? getBodyFixHeight(true) : 0,
              top: 0,
              bottom: 0,
              right: 0,
              left: 0,
              overflow: 'auto',
            }}
          >
            {child}
          </OverlayScrollbarsComponent>
        </div>
      );
    }
    return null;
  };
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        ...rest.style,
      }}
      {...rest}
    >
      {!locationHelper.isMainPage() ? <WriteLetter /> : <></>}
      {!locationHelper.isMainPage() && mails && (
        <Tooltip title={`${mails.length}封邮件编辑中`} placement="left" overlayClassName={`${style.mailTooltip}`}>
          <div
            style={{
              display: mails.length && !inElectron ? '' : 'none',
            }}
            hidden={inElectron || !mails.length || showWebWriteLetter}
            className={style.letterCount}
            onClick={e => {
              showWriteDialog(e);
            }}
          >
            <WriteLetterIcon stroke="#FFFFFF" />
            {mails.length}
          </div>
        </Tooltip>
      )}
      {React.Children.map(children, renderChildren)}
    </div>
  );
};

export default PageContentLayout;
