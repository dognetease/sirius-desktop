import React, { useState, useCallback } from 'react';
import { Tooltip } from 'antd';
import { apiHolder as api, locationHelper, SystemApi } from 'api';
import WriteLetter from '@web-mail/components/WriteLetter/WriteLetter';
// import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import WriteLetterIcon from '@web-common/components/UI/Icons/svgs/WriteLetterSvg';
import { useAppSelector, useActions, userAppSelectorShallowEqual } from '@web-common/state/createStore';
import { MailActions } from '@web-common/state/reducer';
import { getBodyFixHeight } from '@web-common/utils/constant';
// import { useWhyDidYouUpdate } from 'ahooks';
import SideContentLayout from './sideContentLayout';
import style from './main.module.scss';
import { ExpandableSideContent } from './expandableSideContent';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  from?: 'disk' | 'mail' | 'im' | 'contact' | 'apps' | 'catalog' | 'unitable-crm' | 'coop' | 'enterpriseSetting';
  /**
   * uni页面全局样式设置为100%，会丢失高度。因此在uni页面下，不添加全局calssName
   * page-content-layout
   */
  globalClassNameDisabled?: boolean;
  // 是否支持暗黑模式
  allowDark?: boolean;
}

const systemApi = api.api.getSystemApi() as SystemApi;

const PageWritterMailToolTip = () => {
  const mails = useAppSelector(state => state.mailReducer.mails, userAppSelectorShallowEqual);
  const showWebWriteLetter = useAppSelector(state => !!state.mailReducer.showWebWriteLetter);
  const [inElectron] = useState(systemApi.isElectron());

  const mailActions = useActions(MailActions);

  const showWriteDialog = useCallback((e: any) => {
    e.stopPropagation();
    mailActions.doShowWebWrite(true);
  }, []);

  if (!mails || !mails.length) {
    return null;
  }

  return (
    <Tooltip title={`${mails.length}封邮件编辑中`} placement="left" overlayClassName={`${style.mailTooltip}`}>
      <div
        style={{
          display: mails.length && !inElectron ? '' : 'none',
        }}
        hidden={inElectron || !mails.length || showWebWriteLetter}
        className={style.letterCount}
        onClick={showWriteDialog}
      >
        <WriteLetterIcon stroke="#FFFFFF" />
        {mails.length}
      </div>
    </Tooltip>
  );
};

const PageContentLayout: React.FC<Props> = props => {
  const { children, from, allowDark, ...rest } = props;

  const [pageLayoutStyle] = useState<React.CSSProperties>(() => ({
    height: 'calc(100vh - ' + getBodyFixHeight(false, true, true) + 'px)',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: from === 'apps' ? '8px' : '',
    // backgroundColor: '#fff',
    paddingTop: from === 'disk' || from === 'mail' || from === 'apps' || from === 'coop' ? 0 : getBodyFixHeight(true, false),
    marginTop: from === 'apps' ? getBodyFixHeight(true, false) : 0,
  }));

  const renderChildren = useCallback((child: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(child)) {
      return null;
    }
    const sideComponent =
      child.type === SideContentLayout ||
      child.props.SideContentLayout ||
      child.props.SideContentLayout ||
      child.type === ExpandableSideContent ||
      child.props['data-sidecontent'] ||
      child.props.ExpandableSideContent;
    // 不支持循环嵌套
    if (child.type === React.Fragment && child.props.children) {
      return React.Children.map(child.props.children, renderChildren);
    }
    if (sideComponent) {
      return child;
    }
    return (
      <div
        style={pageLayoutStyle}
        className={`${props.globalClassNameDisabled ? '' : 'page-content-layout'} ${allowDark ? style.pageContentDarkBg : style.pageContentBg}`}
      >
        {child}
      </div>
    );
  }, []);

  // useWhyDidYouUpdate('PageContentLayout' + `${props.from}`, {
  //   ...props, from, pageLayoutStyle
  // });

  const [parentStyle] = useState<React.CSSProperties>(() => ({
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    ...rest.style,
  }));
  return (
    <div {...rest} style={parentStyle}>
      {!locationHelper.isMainPage() ? <WriteLetter /> : <></>}
      {!locationHelper.isMainPage() && <PageWritterMailToolTip />}
      {React.Children.map(children, renderChildren)}
    </div>
  );
};

export default PageContentLayout;
