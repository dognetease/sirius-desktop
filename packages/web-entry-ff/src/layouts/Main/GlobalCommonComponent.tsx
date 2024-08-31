import React, { useMemo, useState } from 'react';
import { withPrefix } from 'gatsby';
import { Helmet } from 'react-helmet';
import { apiHolder, /* apiHolder as api, apis, DataStoreApi, DataTrackerApi, MailApi, MailEntryModel, */ SystemEvent } from 'api';
import { message, Tooltip } from 'antd';
import { config } from 'env_def';
import WriteLetter from '@web-mail/components/WriteLetter/WriteLetter';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import { /* AppActions, */ MailActions } from '@web-common/state/reducer';
// import { attachmentDownloadAction } from '@web-common/state/functionAction/attachmentFetchAction';
import { useActions, /* useAppDispatch, */ useAppSelector } from '@web-common/state/createStore';
import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
import WriteLetterIcon from '@web-common/components/UI/Icons/svgs/WriteLetterSvg';
import UpgradeApp from '@web/components/Electron/Upgrade';
// eslint-disable-next-line import/no-unresolved
// @ts-ignore
import style from '@web/layouts/Main/main.module.scss';
import { getIn18Text } from 'api';
const contextPath = config('contextPath') as string;
const { forElectron } = apiHolder.env;
// const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// const eventApi = api.api.getEventApi();
// const systemApi = api.api.getSystemApi() as SystemApi;
// const mailApi: MailApi = (
//   api.api.requireLogicalApi(apis.mailApiImpl) as unknown
// ) as MailApi;
// const dataStoreApi: DataStoreApi = api.api.getDataStoreApi() as DataStoreApi;
/**
 * 全局引入最顶层组件的地方
 * 当组件过多后会再做拆分
 * 禁止在其他定级容器内添加全局性组件
 * @param currentTabTitle
 * @constructor
 */
const GlobalCommonComponent: React.FC<{
  currentTabTitle: string;
}> = ({ currentTabTitle }) => {
  // const dispatch = useAppDispatch();
  // const [contactSyncIframeShow, setContactSyncIframeShow] = useState<boolean>(false);
  /**
   * 通用错误弹窗监听
   */
  useCommonErrorEvent('indexCommonErrorOb');
  /**
   * 通用写信调用
   */
  // useEventObserver('writeLatter2', {
  //   name: 'globalWriteLatterOb',
  //   func: (ev: SystemEvent) => {
  //     const { eventData } = ev;
  //     mailApi.initModel(eventData).then((realData: MailEntryModel) => {
  //       trackApi.track('pcMail_view_writeMailPage');
  //       let content = '';
  //       const data = cloneDeep(realData);
  //       const origContent = data?.entry?.content?.content;
  //       content += origContent;
  //       const showContact = dataStoreApi.getSync('showContact')?.data !== 'false';
  //       data.entry.content.content = content;
  //       /** @todo 待验证 cid */
  //       dispatch(AppActions.doWriteMail(
  //         {
  //           ...data,
  //           status: {
  //             cc: false,
  //             bcc: false,
  //             showContact,
  //             keyword: '',
  //             init: false,
  //             conferenceShow: false,
  //             conferenceSetting: true,
  //           },
  //           focusTitle: false,
  //         },
  //       ));
  //       dispatch(AppActions.doShowWebWrite(true));
  //       // 转发 再次编辑 邮件 处理附件
  //       if (['forward', 'editDraft', 'edit'].includes(data?.entry?.writeLetterProp || '') && data.entry.attachment
  //         && data.entry.attachment.length > 0) {
  //         // 过滤掉在正文中显示的附件
  //         const filterAttachment = data.entry.attachment.filter(item => !item.inlined);
  //         filterAttachment.forEach(attachment => {
  //           const temp = {
  //             ...attachment,
  //             mailId: data.cid,
  //             downloadContentId: data.entry.id,
  //             downloadId: attachment.fileUrl + data.entry.id,
  //             type: 'download',
  //           };
  //           dispatch(attachmentDownloadAction(temp, {
  //             forward: true,
  //             entryId: data.entry.id,
  //             cid: data.cid || 0,
  //           }));
  //         });
  //       }
  //     });
  //   },
  // });
  /**
   * 写信消息监听
   */
  useEventObserver('writePageDataExchange', {
    name: 'globalMailWriteOb',
    func: (ev: SystemEvent) => {
      if (ev.eventStrData === 'start') {
        // eslint-disable-next-line no-nested-ternary
        const content =
          ['forward', 'forwardAsAttach'].indexOf(ev.eventData?.writeType) !== -1
            ? getIn18Text('ZHUANFAYOUJIANSHENG')
            : ['reply', 'replyAll', 'replyAllWithAttach', 'replyWithAttach'].indexOf(ev.eventData?.writeType) !== -1
            ? getIn18Text('HUIFUYOUJIANSHENG')
            : '';
        content && ev.eventData?.id && message.loading({ content, duration: 35, key: ev.eventData.id });
      } else if (ev.eventStrData === 'writeTabCreated') {
        ev.eventData?.entry?.id && message.destroy(ev.eventData.entry.id);
      } else if (ev.eventStrData === 'sending') {
        message.loading({ content: getIn18Text('XINJIANFASONGZHONG'), duration: 35, key: ev.eventData });
      } else if (ev.eventStrData === 'sendSucceed') {
        message.success({ content: getIn18Text('XINJIANFASONGCHENG'), duration: 2.5, key: ev.eventData });
      } else if (ev.eventStrData === 'scheduleDateSucceed') {
        message.success({ content: getIn18Text('DINGSHIRENWUSHE'), duration: 2.5, key: ev.eventData });
      } else if (ev.eventStrData === 'sendFailed') {
        message.error({ content: getIn18Text('XINJIANFASONGSHI'), duration: 1.5, key: ev.eventData });
      }
    },
  });
  /**
   * electron应用更新监听
   */
  let upgradeEl: any = null;
  /**
   * web写信弹窗
   */
  let writeMailEl: any = null;
  const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
  /* 仅 electron 中存在的组件及逻辑 */
  if (forElectron) {
    const [visibleUpgradeApp, setVisibleUpgradeApp] = useState<number>(0);
    const [upgradeInfo, setUpgradeInfo] = useState();
    const [closed, setClosed] = useState<boolean>(false);
    upgradeEl =
      visibleUpgradeApp === 2 ? (
        <UpgradeApp
          // @ts-ignore
          upgradeInfo={upgradeInfo}
          setVisibleUpgradeApp={n => {
            setVisibleUpgradeApp(n ? 2 : 1);
            if (!n) {
              setClosed(true);
            }
          }}
        />
      ) : null;
    useEventObserver('upgradeApp', {
      name: 'globalUpgradeAppOb',
      func: ev => {
        console.log('visibleUpgradeApp', ev);
        if (ev && ev.eventData) {
          if (ev.eventData.forcePopup) {
            setVisibleUpgradeApp(2);
          } else {
            !closed && setVisibleUpgradeApp(2);
          }
          setUpgradeInfo(ev.eventData);
        }
      },
    });
  } /* 仅web中存在的逻辑及组件 */ else {
    const { mails, showWebWriteLetter } = useAppSelector(state => state.mailReducer);
    const mailActions = useActions(MailActions);
    const showWriteDialog = (e: any) => {
      e.stopPropagation();
      mailActions.doShowWebWrite(true);
    };
    writeMailEl = (
      <>
        <WriteLetter />
        {mails && (
          <Tooltip title={`${mails.length}封邮件编辑中`} placement="left" overlayClassName={`${style.mailTooltip}`}>
            <div
              style={{
                display: mails.length && !forElectron ? '' : 'none',
              }}
              hidden={forElectron || !mails.length || showWebWriteLetter}
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
      </>
    );
  }
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`网易灵犀办公${currentTabTitle ? `-${currentTabTitle}` : ''}`}</title>
        <script src={contextPath + '/NIM_Web_SDK_v8.11.3.js'} />
      </Helmet>
      {upgradeEl}
      {writeMailEl}
      {!forElectron ? <MemoizedTinymceTooltip /> : null}
    </>
  );
};
export default GlobalCommonComponent;
