/* eslint-disable react/jsx-pascal-case */
/* eslint-disable no-nested-ternary */
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  apiHolder as api,
  MailEntryModel,
  // DataStoreApi,
  EventApi,
  DataTrackerApi,
  apis,
  SystemApi,

  // NIMApi
} from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
// import HollowOutGuide from '@web-common/components/UI/HollowOutGuide/hollowOutGuide';
// import useLayoutEffect from '@web-mail-write/components/RcSelect/src/hooks/useLayoutEffect';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
// import MailDiscuss from './component/MailDiscuss/mailDiscuss';
import { CommonMailMenuConfig } from '../../types';
import { getShowByFolder } from '@web-mail/common/components/MailMenu/util';
import PrevNextMail from './prev-next-mail';
import {
  FLOLDER,
  MAIL_MENU_ITEM,
  // MAIL_DISCUSS_EXCLUDE_FOLDERS
} from '../../common/constant';
import ReadMailIconMenuThreadConfig from '../../common/components/MailMenu/mailMenuConifg/ReadMailIconMenuThreadConfig';
import useReadMailIconMenuConfig from '../../common/components/MailMenu/mailMenuConifg/ReadMailIconMenuConfig';
import MailMenuIcon from '../../common/components/MailMenu/MailMenuIcon/MailMenuIcon';
import {
  MailStatus,
  getMailFromMails,
  // setCurrentAccount
} from '../../util';
import useState2RM from '../../hooks/useState2ReduxMock';
import Alert from '@web-common/components/UI/Alert/Alert';
import { MailTabActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { tabType, MailTabThunks, ReadTabPreNextModel } from '@web-common/state/reducer/mailTabReducer';
import { getIn18Text } from 'api';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi: SystemApi = api.api.requireLogicalApi(apis.defaultSystemApiImpl) as SystemApi;

// const storeApi: DataStoreApi = api.api.getDataStoreApi();
const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;
// const nimApi = api.api.requireLogicalApi('NIM') as NIMApi;
// 邮件讨论新手引导
// const mailDiscussGuides = nimApi.getIMAuthConfig()
//   ? [
//     {
//       id: 'toobar-mail-discuss',
//       title: getIn18Text('YOUJIANTAOLUN'),
//       intro: getIn18Text('ZHENDUIYOUJIANFA11')
//     },
//     {s
//       id: 'share-toon-btn',
//       title: getIn18Text('YOUJIANFENXIANG'),
//       intro: getIn18Text('JIANGYOUJIANFENXIANG')
//     }
//   ]
//   : [];
interface Props {
  listData?: MailStatus;
  content: MailEntryModel;
  // handleWithDraw(mid?: string, showRes?: boolean): void;
  showMailDiscuss?: boolean;
  mailList?: MailEntryModel[];
  btnTheme?: 'light' | 'dark';
  showMailHead?: boolean;
  onShowMailHeadChange?: (show: boolean) => void;
}
enum MailImportState {
  DEFAULT = 'DEFAULT',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}
// 顶部
const Toobar: React.FC<Props> = ({ listData, content, showMailDiscuss = true, mailList, btnTheme, showMailHead, onShowMailHeadChange }) => {
  const dispatch = useAppDispatch();

  // const hollowOutGuideRef = useRef<any>(null);
  const toobarbox = useRef(null);
  // 邮件列表-当前选中的邮件id
  const [, setSelectedMail] = useState2RM('selectedMailId', 'doUpdateSelectedMail');
  // 邮件-搜索-选中的邮件id
  const [, setSearchMail] = useState2RM('activeSearchMailId');
  // 是否展示邮件讨论
  // const mailDiscussIsShow = useMemo(() => {
  //   const { entry, isThread } = content;
  //   const { folder } = entry;
  //   // 非聚合
  //   // 非垃圾邮件、草稿箱、已删除
  //   return !isThread && !MAIL_DISCUSS_EXCLUDE_FOLDERS.includes(folder) && showMailDiscuss;
  // }, [showMailDiscuss, content]);
  const menuConfig = useReadMailIconMenuConfig(toobarbox.current, content, getShowByFolder(content, [FLOLDER.DRAFT]));
  // 有没有试过唤醒
  // const [triedAwakeGuide, setTriedAwakeGuide] = useState<boolean>(false);
  // todo: 现在属于全局独一份，后续有需要的话状态提升，props传入
  const [mailMenuItemState, setMailMenuItemState] = useState2RM('mailMenuItemState');
  // 当前邮件视图模式, 通栏视图展示返回按钮
  const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  // 是否是左右分栏
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);
  // 是否是上下分栏
  const isUpDown = useMemo(() => configMailLayout === '3', [configMailLayout]);
  // const isDraft = content.entry.folder === FLOLDER.DRAFT;
  const isMainPage = systemApi.isMainPage();
  // 是否展示下一封邮件切换按钮
  const shouldShowPrevNextMail = !isLeftRight && !isUpDown && isMainPage;

  const domPropsRender = useCallback((mails: MailEntryModel, menuConfig: CommonMailMenuConfig) => {
    return {
      'data-test-id': 'mail-menu-toobar-' + menuConfig?.key,
    };
  }, []);
  // 关键id
  // const keyIds = useMemo(() => {
  //   const { entry } = content;
  //   const { tid, id } = entry;
  //   return { tid, mid: id };
  // }, [content]);
  // 菜单项混合本地操作
  const menuCustomConfig: CommonMailMenuConfig[] = useMemo(
    () => [
      {
        key: MAIL_MENU_ITEM.BACK,
        show: (mail, defaultShow) => {
          if (isLeftRight) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
        show: (mail, defaultShow) => {
          if (listData?.isrcl) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
        // onClick: mails => {
        //   const mail = getMailFromMails(mails);
        //   // handleWithDraw(mail.id);
        //   eventApi.sendSysEvent({
        //     eventName: 'mailMenuOper',
        //     eventData: { mailData: mail },
        //     eventStrData: 'showMailReadState',
        //     _account: mail?._account,
        //   });
        // },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
        show: (mail, defaultShow) => !!listData?.isrcl && (defaultShow ? defaultShow(mail) : false),
        onClick: mails => {
          const mail = getMailFromMails(mails);
          if (listData?.isrcl) {
            // handleWithDraw(mail.id, true);
            eventApi.sendSysEvent({
              eventName: 'mailMenuOper',
              eventData: { mailData: mail, showRes: true },
              eventStrData: 'retractEmail',
              _account: mail?._account,
            });
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.SHARE,
        show: (mail, defaultShow) => {
          // 根据showMailDiscuss 设置决策是否展示邮件分享
          if (showMailDiscuss) {
            if (defaultShow) {
              return defaultShow(mail);
            }
            return true;
          }
          return false;
        },
      },
      {
        key: MAIL_MENU_ITEM.DELETE,
        onClick: (mails, defaultClick) => {
          const mail = getMailFromMails(mails);
          if (mail?.isThread && mailList && mailList?.length > 1) {
            Alert.error({
              title: getIn18Text('SHIFOUSHANCHUQUANYOUJIAN'),
              content: null,
              okCancel: !0,
              cancelText: getIn18Text('QUXIAO'),
              okText: getIn18Text('SHANCHU'),
              onOk: () => {
                defaultClick && defaultClick(mail);
              },
              okButtonProps: {
                style: {
                  backgroundColor: '#FE5B4C',
                },
              },
            });
          } else {
            defaultClick && defaultClick(mail);
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.EMAIL_HEADER,
        name: mail => {
          return showMailHead ? '查看邮件' : '查看信头';
        },
        onClick: mails => {
          if (onShowMailHeadChange) {
            onShowMailHeadChange(!showMailHead);
            console.log('EMAIL_HEADER');
          }
        },
      },
    ],
    [listData, showMailDiscuss, isLeftRight, mailList, showMailHead, onShowMailHeadChange]
  );
  // 邮件导入-按钮状态
  const [mailImportState, setMailImportState] = useState<MailImportState>(MailImportState.DEFAULT);

  // 邮件导入-请求
  const doLocalMailImport = (cid: unknown) => {
    if (typeof cid === 'string') {
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { cid },
        eventStrData: 'importMail',
      });
    }
    setMailImportState(MailImportState.DEFAULT);
  };

  // 点击导入
  const ckImport = (mail: MailEntryModel) => {
    const isLoading = mailImportState == MailImportState.LOADING;
    const { entry } = content;
    const { content: domCont, attachment: attachments } = entry;
    const { contentLen } = domCont;
    const totalSize = (attachments || []).reduce((total, curAtt) => {
      const { type, fileSize } = curAtt;
      // 云附件不算在内
      return total + (type === 'netfolder' ? 0 : fileSize || 0);
    }, contentLen || 0);
    // 超过100M不可导入
    if (totalSize / (1024 * 1024) > 100) {
      SiriusMessage.warn({ content: getIn18Text('YOUJIANDAORUBUYUNXU') });
      return;
    }
    if (mail.localFilePath && mail.cid && !isLoading) {
      setMailImportState(MailImportState.LOADING);
      doLocalMailImport(mail.cid as unknown);
    }
  };

  // eml格式邮件菜单操作
  const emlMenuCustomConfig: CommonMailMenuConfig[] = useMemo(
    () => [
      {
        key: MAIL_MENU_ITEM.LOCAL_MAIL_IMPORT,
        name: getIn18Text('YOUJIANDAORU'),
        show: mails => {
          const mail = getMailFromMails(mails);
          return !!mail?.localFilePath;
        },
        tooltip: '',
        icon: <ReadListIcons.MoveSvg_Cof />,
        render: mails => {
          const mail = getMailFromMails(mails);
          const isLoading = mailImportState == MailImportState.LOADING;
          return (
            <div className="mail-import-btn" onClick={() => ckImport(mail)}>
              <div className="btn-icon dark-svg-invert">{isLoading ? <LoadingOutlined /> : <ReadListIcons.MoveSvg_Cof />}</div>
              <div className="btn-name">{getIn18Text('YOUJIANDAORU')}</div>
            </div>
          );
        },
      },
    ],
    [mailImportState]
  );

  // 新手引导展示回调
  // const guideShowCallback = () => {
  //   setCurrentAccount();
  //   return storeApi.put('mailDiscussGuideHasShowed', 'true');
  // };
  // 唤起引导
  // const awakeGuide = () => {
  //   if (triedAwakeGuide) return;
  //   setTriedAwakeGuide(true);
  //   setCurrentAccount();
  //   const mailDiscussGuideHasShowedStore = storeApi.getSync('mailDiscussGuideHasShowed');
  //   const { data, suc } = mailDiscussGuideHasShowedStore;
  //   // 已展示
  //   if (suc && data === 'true') return;
  //   setTimeout(() => {
  //     // 拿到分享按钮
  //     const shareToolBtn = document.getElementById('share-container')?.parentNode;
  //     if (shareToolBtn) {
  //       shareToolBtn.id = 'share-toon-btn';
  //       setTimeout(() => {
  //         hollowOutGuideRef.current?.showSelf(guideShowCallback);
  //       });
  //     }
  //   });
  // };
  // useLayoutEffect(() => {
  //   if (mailDiscussIsShow) {
  //     awakeGuide();
  //   }
  // }, [mailDiscussIsShow]);

  // 在icon按钮之前收集打点信息
  const handelIconMenuBeforeClick = useCallback((config: CommonMailMenuConfig, data: MailEntryModel) => {
    let name = config?.name;
    if (typeof config?.name === 'function') {
      const _name = config?.name(data);
      if (typeof _name === 'string') {
        name = _name;
      }
    }
    trackApi.track('pcMail_click_topBarButton_mailDetailPage', { buttonName: name });
  }, []);

  // 菜单
  const MailMenuIconElement = useMemo(() => {
    const { isThread, localFilePath } = content;
    // 本地eml邮件的操作菜单只有导入
    const defaultMenu = localFilePath ? emlMenuCustomConfig : isThread ? ReadMailIconMenuThreadConfig : menuConfig;
    const customMenu = localFilePath ? [] : menuCustomConfig;
    return (
      <MailMenuIcon
        mail={content}
        menu={customMenu}
        domProps={domPropsRender}
        defaultMenu={defaultMenu}
        menuType="text"
        menuItemStateMap={mailMenuItemState}
        theme={btnTheme}
        onMenuItemStateChange={(menuId, data) =>
          setMailMenuItemState({
            ...mailMenuItemState,
            [content?.entry?.id]: {
              ...(mailMenuItemState[content?.entry?.id] || {}),
              [menuId]: data,
            },
          })
        }
        beforeMenuItemClick={handelIconMenuBeforeClick}
      />
    );
  }, [content, menuCustomConfig, emlMenuCustomConfig, menuConfig, mailMenuItemState, btnTheme]);

  const [prevNextMailInfo, setPrevNextMailInfo] = useState<{
    prevMid: string | undefined;
    nextMid: string | undefined;
    prevMidTitle: string;
    nextMidTitle: string;
  }>({
    prevMid: undefined,
    nextMid: undefined,
    prevMidTitle: '',
    nextMidTitle: '',
  });

  const currentTab = useAppSelector(state => state.mailTabReducer.currentTab);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');

  useEffect(() => {
    const mid = currentTab.extra?.originMid || content.entry.id;
    updatePrevNextMailInfo(mid, 0);
  }, [currentTabId]);

  const updateCurrentTabInfo = (mid: string, title: string) => {
    dispatch(
      MailTabActions.doUpdateCurrentTab({
        ...currentTab,
        title: title,
        extra: {
          ...currentTab.extra,
          originMid: mid,
        },
      })
    );
  };
  const updatePrevNextMailInfo = async (mid: string, offset: number) => {
    const midWithTs = currentTabId; //|| currentTab.extra ? currentTab.extra?.originMid : '';
    // await dispatch(MailTabActions.doSetReadTabCurrentMid({id: midWithTs, currentMid: mid}));// .then(()=>)
    dispatch(MailTabThunks.getCurrentReadMail({ originTabId: midWithTs, currentMid: mid, offset })).then((r1: ReadTabPreNextModel) => {
      let prevMailInfo, nextMailInfo;
      // if(r1.status==='fulfilled') {
      //@ts-ignore
      prevMailInfo = r1.payload?.prevMail;
      nextMailInfo = r1.payload?.nextMail;
      // }
      setPrevNextMailInfo(() => {
        return {
          prevMid: prevMailInfo ? prevMailInfo.mid : '',
          nextMid: nextMailInfo ? nextMailInfo.mid : '',
          prevMidTitle: prevMailInfo ? prevMailInfo.title : '',
          nextMidTitle: nextMailInfo ? nextMailInfo.title : '',
        };
      });
    });
  };

  const handleOnPrevMail = () => {
    const prevMid = prevNextMailInfo.prevMid;
    if (prevMid) {
      updateCurrentTabInfo(prevMid, prevNextMailInfo.prevMidTitle);
      if (mailSearching) {
        setSearchMail({ id: prevMid });
      } else {
        setSelectedMail({ id: prevMid });
      }
      updatePrevNextMailInfo(prevMid, -1);
    }
  };

  const handleOnNextMail = () => {
    const nextMid = prevNextMailInfo.nextMid;
    if (nextMid) {
      updateCurrentTabInfo(nextMid, prevNextMailInfo.nextMidTitle);
      if (mailSearching) {
        setSearchMail({ id: nextMid });
      } else {
        setSelectedMail({ id: nextMid });
      }
      updatePrevNextMailInfo(nextMid, 1);
    }
  };

  return useMemo(
    () => (
      <div className="toobar-wrap ant-allow-dark" style={{ flex: '0 0 auto' /** 兼容性todo 如果有问题，可以判断下条件 */ }}>
        <div className="toobar-left" ref={toobarbox}>
          {MailMenuIconElement}
        </div>
        <div className="toobar-right">
          {shouldShowPrevNextMail && (
            <PrevNextMail
              bgColor={content && content.isThread ? '#fff' : ''}
              onNext={() => {
                handleOnNextMail();
              }}
              onPrev={() => {
                handleOnPrevMail();
              }}
              prevDisable={!prevNextMailInfo.prevMid}
              nextDisable={!prevNextMailInfo.nextMid}
              prevTitle={prevNextMailInfo.prevMidTitle}
              nextTitle={prevNextMailInfo.nextMidTitle}
            ></PrevNextMail>
          )}
          {/* {mailDiscussIsShow && <MailDiscuss id="toobar-mail-discuss" style={{ float: 'right', marginRight: '20px' }} keyIds={keyIds} />} */}
          {/* 新手引导 */}
          {/* <HollowOutGuide ref={hollowOutGuideRef} guides={mailDiscussGuides} /> */}
        </div>
      </div>
    ),
    [content, MailMenuIconElement]
  );
};
export default Toobar;
