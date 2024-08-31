import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { navigate } from 'gatsby';
import { Dropdown } from 'antd';
import { NSRoleInfo, NSFileContent, ContactModel, conf } from 'api';
import { getDocURL } from '@web-common/utils/constant';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import { parseUrlObjectParams } from '@web-common/utils/utils';
import { NoAuthority } from '../Preview/preview';
import { NpsArea } from '../Nps';
import { UserCardPopover } from '../UserCard';
import { formatAuthority } from '../../utils';
import { contactApi, diskApi, eventApi, isElectron, systemApi, trackerApi } from './siriusApi';
import SharePage from '../SharePage/sharePage';
import styles from './index.module.scss';
import { useBridge } from './useBridge';
import { HandlerType } from './bridge';
import { useCreateFile } from '../../commonHooks/useCreateFile';
import { useTemplateModal } from '../../commonHooks/useTemplateModal';
import { TemplateRecommondBar } from '../../components/TemplateRecommondBar';
import { useCheckCreateUnitableAvailable } from '../../commonHooks/useCheckCreateUnitableAvailable';
import { CreateFileMenu } from '../../components/Doc/createFileBtn';
import { trackerCreateBaseCached } from '@web-disk/components/MainPage/extra';
import { createMenu as createMenuStyle } from '../../components/Doc/createFileBtn.module.scss';
import { getUnitableCellContactList, sendEmail } from './api';
import { getIn18Text } from 'api';
interface UnitableProps {
  type: 'unitable';
  item?: NSFileContent;
  previewLink: string;
  authority: string;
  fileReq: any;
  errMsg?: string;
  hashData: string;
  initPage: () => void;
  onFetchDetail?: (hash: string, info: any) => void;
  extheme?: boolean; // 用户开启暗黑模式后，当前组件是否要启用暗黑样式。true则不管是否开启暗黑，都展示亮色
}
enum UnitableGoodByeReason {
  DELETED = 'DELETED',
  NO_LOGIN = 'NO_LOGIN',
  NO_PERMISSION = 'NO_PERMISSION',
  WS_ERROR = 'WS_ERROR',
  MISS_DOC_INFO = 'MISS_DOC_INFO',
  DB_ERROR = 'DB_ERROR',
  MAX_CONN_EXCEEDED = 'MAX_CONN_EXCEEDED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  JUMP_LOGIN = 'JUMP_LOGIN',
}
const DELETE_TITLE = getIn18Text('GAIWENDANGYIBEI');
const UNITABLE_UNAVAILABLE = getIn18Text('WENJIANBUCUNZAI');
const triggerMousedownEvent = () => {
  const ev = document.createEvent('MouseEvents');
  (ev as any)?.initMouseEvent('mousedown', true, true);
  document.body.dispatchEvent(ev);
};
const Unitable: React.FC<UnitableProps> = props => {
  const { type, item, previewLink, authority = '', fileReq, errMsg, hashData, initPage, onFetchDetail = () => {}, extheme } = props;
  const [shareVisible, setShareVisible] = useState(false);
  const [createFileMenuVisible, setCreateFileMenuVisible] = useState(false);
  const [docName, setDocName] = useState('');
  const [contactList, setContactList] = useState<ContactModel[]>([]);
  const [userCardId, setUserCardId] = useState<string>();
  const [roles, setRoles] = useState<NSRoleInfo[]>(item?.authorityDetail?.roleInfos || []);
  const [auth, setAuth] = useState(authority);
  const [docPermissionError, setPermissionError] = useState(false);
  const [docDeleteError, setDocDeleteError] = useState(false);
  const [canCreateFile, createFile, spaceInfo] = useCreateFile();
  const dirId = spaceInfo?.dirId!;
  const [templateModal, setTemplateModalVisible] = useTemplateModal(dirId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sharePageRef = useRef<HTMLDivElement>(null);
  const shareBtnRef = useRef<HTMLDivElement>(null);
  const createFileBtnRef = useRef<HTMLDivElement>(null);
  const createFileMenuRef = useRef<HTMLDivElement>(null);
  const userCardRef = useRef<HTMLDivElement>(null);
  const recommondBarRef = useRef<TemplateRecommondBar>(null);
  const { id: resourceId } = item || {};
  let identity: string = '';
  try {
    identity = new URL(previewLink).searchParams.get('identity') ?? '';
  } catch (error) {
    identity = '';
  }
  // TODO: 记得删除
  (window as any).recommondBarRef = recommondBarRef;
  const { bridge, iframeLink } = useBridge(iframeRef, previewLink);
  const [unitableAvailable] = useCheckCreateUnitableAvailable();
  const handleFileDelete = React.useCallback(() => {
    setDocDeleteError(true);
    setDocName(DELETE_TITLE);
    onFetchDetail(hashData, { fileType: '', name: DELETE_TITLE });
  }, [hashData, onFetchDetail]);
  useEffect(() => {
    bridge.on('updateTitle', ({ title }) => {
      onFetchDetail(hashData, { fileType: item?.fileType, name: title });
      setDocName(title);
    });
    bridge.on('openSharePopup', ({ rect }) => {
      const iframeEl = iframeRef.current;
      const wrapperEl = shareBtnRef.current;
      const { left, top, width, height } = rect;
      const { top: iframeTop = 0, left: iframeLeft = 0 } = iframeEl?.getBoundingClientRect() ?? {};
      const styleTop = top + height + iframeTop;
      const styleLeft = left + width + iframeLeft;
      wrapperEl?.setAttribute('style', `position:fixed;top:${styleTop}px;left:${styleLeft}px;width:${1}px;height:${1}px;z-index:10;pointer-event:none;`);
      wrapperEl?.click();
      setTimeout(() => {
        const shareEl = sharePageRef.current;
        shareEl?.focus(); // 延时一段时间
      }, 200);
    });
    bridge.on('openUserCardPopup', ({ rect, userId }) => {
      const iframeEl = iframeRef.current;
      const wrapperEl = userCardRef.current;
      const { left, top, width, height } = rect;
      const { top: iframeTop = 0, left: iframeLeft = 0 } = iframeEl?.getBoundingClientRect() ?? {};
      const styleTop = top + height + iframeTop;
      const styleLeft = left + width / 2 + iframeLeft;
      wrapperEl?.setAttribute('style', `position:fixed;top:${styleTop}px;left:${styleLeft}px;width:${1}px;height:${1}px;z-index:10;pointer-event:none;`);
      wrapperEl?.click();
      wrapperEl?.focus();
      setUserCardId(userId);
    });
    bridge.on('openCreateFilePopup', ({ rect }) => {
      const iframeEl = iframeRef.current;
      const wrapperEl = createFileBtnRef.current;
      const { left, top, width, height } = rect;
      const { top: iframeTop = 0, left: iframeLeft = 0 } = iframeEl?.getBoundingClientRect() ?? {};
      const styleTop = top + height + iframeTop;
      const styleLeft = left + width + iframeLeft;
      wrapperEl?.setAttribute('style', `position:fixed;top:${styleTop}px;left:${styleLeft}px;width:${1}px;height:${1}px;z-index:10;pointer-event:none;`);
      wrapperEl?.click();
      setTimeout(() => {
        const menuRef = createFileMenuRef.current;
        menuRef?.focus(); // 延时一段时间
      }, 200);
    });
    bridge.on('goBack', () => {
      const hash = window.location.hash || '';
      if (hash) {
        const params = parseUrlObjectParams(hash);
        const { fromUrl } = params;
        // 存在来源，返回来源
        if (fromUrl) {
          const decodedFrom = safeDecodeURIComponent(fromUrl);
          console.log('decodedFrom', decodedFrom);
          // 解码
          location.assign(decodedFrom);
        }
      }
      navigate('/#disk');
    });
    bridge.on('getContactList', async params => {
      if (resourceId) {
        const result = await getUnitableCellContactList(params, resourceId);
        return result;
      }
      return [];
    });
    bridge.on('openBrowser', () => {
      // 浏览器中打开
      const openInBrowser = () => {
        // 去掉#前缀和 多页签参数
        const hashParamsString = hashData.replace(/^#/, '')?.replace(/\&tabTag=\d+/, '');
        const nextHashData = new URLSearchParams(hashParamsString || '');
        const addr = `${conf('host')}/${type}/${hashParamsString ? `#${nextHashData.toString()}` : ''}`;
        systemApi.openNewWindow(addr);
      };
      openInBrowser();
    });
    bridge.on('showRecommondBar', ({ viewMenuBarVisible }) => {
      recommondBarRef.current?.show(viewMenuBarVisible);
    });
    bridge.on('hideRecommondBar', () => {
      recommondBarRef.current?.hide();
    });
    bridge.on('permission', () => {
      diskApi
        .doGetNSFileInfo(fileReq)
        .then(res => {
          if (res?.authorityDetail?.roleInfos) {
            const _authorityRes = formatAuthority(res.authorityDetail.roleInfos, '') || '';
            setRoles(res.authorityDetail.roleInfos);
            setAuth(_authorityRes);
          }
        })
        .catch(e => {
          console.error('doc doGetNSFileInfo error', e);
          setPermissionError(true);
          // initPage();
        });
    });
    bridge.on('openTemplatePopup', () => {
      setTemplateModalVisible(true);
    });
    bridge.on('coordinator', ({ userIds }) => {
      contactApi.doGetContactById(userIds).then(infos => {
        setContactList(infos);
      });
    });
    bridge.on('sendMail', ({ mails }) => {
      sendEmail(mails);
    });

    return () => {
      bridge.destory();
    };
  }, [bridge]);
  useEffect(() => {
    const halnder: HandlerType<'goodbye'> = payload => {
      const { reason } = payload;
      switch (reason) {
        case UnitableGoodByeReason.DELETED:
          {
            handleFileDelete();
          }
          break;
        case UnitableGoodByeReason.MISS_DOC_INFO:
        case UnitableGoodByeReason.NO_PERMISSION:
          {
            setPermissionError(true);
          }
          break;
        case UnitableGoodByeReason.JUMP_LOGIN:
        case UnitableGoodByeReason.NO_LOGIN:
          {
            eventApi.sendSimpleSysEvent('loginExpired');
          }
          break;
        default: {
          console.error('unknown goodbye reason', reason);
        }
      }
      trackerApi.track('pc_disk_doc', { name: 'receive_message', type: 'goodbye', data: payload });
    };
    bridge.on('goodbye', halnder);
    return () => {
      bridge.remove('goodbye', halnder);
    };
  }, [bridge, handleFileDelete]);
  useEffect(() => {
    const hanlder: HandlerType<'createFile'> = ({ fileType }) => {
      if (canCreateFile) {
        createFile(fileType);
      } else {
        console.warn(`[Unitable] createFile: ${fileType} failed, because of no permission`);
      }
    };
    bridge.on('createFile', hanlder);
    return () => {
      bridge.remove('createFile', hanlder);
    };
  }, [bridge, canCreateFile]);
  // useEffect(() => {
  //   const hanlder: HandlerType<'deleteFile'> = async () => {
  //     try {
  //       const { data } = await diskApi.doDeleteItems({
  //         type: 'personal',
  //         dirIds: [],
  //         fileIds: item?.id !== undefined ? [item.id] : []
  //       });
  //       if (data && data.failInfo && data.failInfo[0].code === 10202) {
  //         return false;
  //       }
  //       setDocName(DELETE_TITLE);
  //       setDocDeleteError(true);
  //       onFetchDetail(hashData, { fileType: '', name: DELETE_TITLE });
  //       return true;
  //     } catch (error) {
  //       console.log('[Unitable] delete file failed', error);
  //     }
  //     return false;
  //   };
  //   bridge.on('deleteFile', hanlder);
  //   return () => {
  //     bridge.remove('deleteFile', hanlder);
  //   };
  // }, [bridge, item]);
  // useEffect(() => {
  //   const hanlder: HandlerType<'getFileInfo'> = async () => {
  //     try {
  //       const fileId = item?.id;
  //       const data = await diskApi.doGetNSFileInfo({
  //         type: 'personal',
  //         fileId
  //       });
  //       console.log(`[Unitable] getFileInfo: ${fileId}`, data);
  //       return {
  //         createTime: new Date(data.createTime).valueOf(),
  //         updateTime: new Date(data.updateTime).valueOf(),
  //         identity: (data as any)?.identity ?? '',
  //         docType: data.fileType,
  //         title: data.name,
  //         username: data.createUserName
  //       };
  //     } catch (error) {
  //       console.log('[Unitable] get file detail failed', error);
  //     }
  //     return null;
  //   };
  //   bridge.on('getFileInfo', hanlder);
  //   return () => {
  //     bridge.remove('getFileInfo', hanlder);
  //   };
  // }, [bridge, item]);
  useEffect(() => {
    if (authority !== '') {
      setAuth(authority);
    }
  }, [authority]);
  useEffect(() => {
    if (item?.name) {
      setDocName(item.name);
    }
  }, [item?.name]);
  // 出现弹窗后默认配置焦点, 当点击到 iframe 中的元素时，会触发 blur 事件，此时关闭弹窗
  useEffect(() => {
    const windowBlur = () => {
      setShareVisible(false);
      triggerMousedownEvent();
      setCreateFileMenuVisible(false);
    };
    window.addEventListener('blur', windowBlur);
    return () => {
      window.removeEventListener('blur', windowBlur);
    };
  }, []);
  // 解决多页签场景打开新页签分享弹窗失去窗口焦点不隐藏，开新页签会导致浮层不消失bug
  if (isElectron) {
    useEventObserver('electronBlur', {
      name: `docPageElectronClosed_${hashData}`,
      func: () => {
        setShareVisible(false);
        triggerMousedownEvent();
        setCreateFileMenuVisible(false);
        bridge.emit('blur', null);
      },
    });
  }
  const handleMenuClick = React.useCallback(
    info => {
      setCreateFileMenuVisible(false);
      const { key } = info;
      trackerCreateBaseCached.creat_type = key === 'template' ? 'detail_templateClick' : 'detail_fileClick';
      if (key === 'template') {
        setTemplateModalVisible(true);
      } else {
        setTemplateModalVisible(true, key);
      }
    },
    [createFile]
  );
  const createFilemenu = React.useMemo(
    () => (
      <div ref={createFileMenuRef} tabIndex={-1}>
        <CreateFileMenu unitableAvailable={unitableAvailable} handleMenuClick={handleMenuClick} />
      </div>
    ),
    [unitableAvailable, handleMenuClick]
  );
  const onMenuVisibleChange = (visible: boolean) => {
    setShareVisible(visible);
    if (!visible) {
      triggerMousedownEvent();
    }
  };
  // electron 中 handleInternalUrlWebJump 处理过程中会把 hash 中 # 清除，但 web 会保留，这里防御式处理下
  const locationHash = `${hashData ? `#${hashData.replace('#', '')}` : ''}`;
  console.log(previewLink, 2222222);
  let docContent;
  if (errMsg) {
    docContent = <NoAuthority title={errMsg} />;
  } else if (docDeleteError) {
    docContent = <NoAuthority title={DELETE_TITLE} />;
  } else if (!unitableAvailable) {
    docContent = <NoAuthority title={UNITABLE_UNAVAILABLE} />;
  } else if (docPermissionError || !auth) {
    docContent = <NoAuthority />;
  } else {
    // @ts-ignore
    const sharePage = (
      <div ref={sharePageRef} tabIndex={-1}>
        <SharePage
          activedSheetIndex={''}
          visible={shareVisible}
          resetStatusDisabled={true}
          from="navigationBar"
          item={item}
          roles={roles}
          showAsModal={false}
          hideSharePage={onMenuVisibleChange}
          defaultTabKey={'1'}
        />
      </div>
    );
    const contactInfo = contactList.find(data => data.contact.id === userCardId);
    docContent = (
      <>
        <Dropdown visible={shareVisible} trigger={['click']} overlay={sharePage} onVisibleChange={onMenuVisibleChange}>
          <div ref={shareBtnRef}></div>
        </Dropdown>
        <Dropdown
          visible={createFileMenuVisible}
          overlay={createFilemenu}
          placement="bottomRight"
          trigger={['click']}
          overlayClassName={createMenuStyle}
          onVisibleChange={setCreateFileMenuVisible}
        >
          <div ref={createFileBtnRef}></div>
        </Dropdown>
        <iframe
          ref={iframeRef}
          className={styles.docsIframe}
          src={getDocURL(iframeLink + locationHash)}
          // src="http://localhost:2345/?identity=ff943fc140c5492b89c855c9898a9d0c&t=1655198078209&tab=&siriusVersion=1.10.3-1654703615109#id=19000000024851&from=PERSONAL&parentResourceId=19000000005314&spaceId=504685721&ref=516512093"
          title="docs"
          width="100%"
          height="100%"
          // fullscreen 支持全屏模式 dom.requestFullscreen api
          allow="clipboard-read; clipboard-write; fullscreen"
        />
        <NpsArea targetLink={iframeLink} />
        <UserCardPopover userId={userCardId} contactInfo={contactInfo}>
          <div ref={userCardRef} tabIndex={-1}></div>
        </UserCardPopover>
        {templateModal}

        <TemplateRecommondBar
          ref={recommondBarRef}
          docType="unitable"
          identity={identity ?? ''}
          onOk={(templateId, dataTrackParams) => {
            bridge.emit('coverContentByTemplate', {
              templateId: templateId,
              docType: 'unitable',
              identity: identity,
              dataTrackParams,
            });
          }}
        />
      </>
    );
  }
  return (
    <div className={`${extheme ? 'extheme' : ''} ${styles.docsPage}`}>
      {!isElectron && (
        <Helmet>
          <title>{`${docName}${docName ? ' - ' : ''}${getIn18Text('WANGYILINGXIBAN')}`}</title>
        </Helmet>
      )}
      {docContent}
    </div>
  );
};
export default Unitable;
