import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { navigate } from 'gatsby';
import throttle from 'lodash/throttle';
import { Dropdown, Menu, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import {
  platform,
  apiHolder,
  apis,
  conf,
  ContactAndOrgApi,
  ContactModel,
  DataTrackerApi,
  DataTransApi,
  NetStorageApi,
  NSRoleInfo,
  MailApi,
  MailConfApi,
  AccountApi,
} from 'api';
import classnames from 'classnames';
import SharePage from '../SharePage/sharePage';
import { presentationManagr } from './full-screen';
import IconCard from '@web-common/components/UI/IconCard/index';
import { NoAuthority } from '../Preview/preview';
import { formatAuthority } from '../../utils';
import { Coordinator, Cursor } from '../Coordinator';
import ContactTrackerIns from '@web-contact/tracker';
import styles from './doc.module.scss';
import { getParameterByName, parseUrlObjectParams } from '@web-common/utils/utils';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { ReactComponent as FullScreenIcon } from './img/presentation.svg';
import { ReactComponent as MoreIcon } from './img/more.svg';
import { NpsArea } from '../Nps';
import CreateFileBtn from './createFileBtn';
import { UserCardMention } from '../UserCard';
import { getDocURL } from '@web-common/utils/constant';
import { useHazel } from '../../commonHooks/useHazel';
import { getIn18Text } from 'api';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const isElectron = systemApi.isElectron();
const forElectron = conf('build_for') === 'electron';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
interface DocProps {
  type: 'doc' | 'sheet';
  // item?: NSFileContent;
  item?: any;
  previewLink: string;
  authority: string;
  fileReq: any;
  errMsg?: string;
  hashData: string;
  initPage: () => void;
  onFetchDetail?: (hash: string, info: any) => void;
  extheme?: boolean; // 用户开启暗黑模式后，当前组件是否要启用暗黑样式。true则不管是否开启暗黑，都展示亮色
}
const BRIDGE_CALL_KEY = '##bridge-message$$';
const DELETE_TITLE = getIn18Text('GAIWENDANGYIBEI');
interface IBridgeRequestMessage {
  method: string;
  args: any[];
  callbackId: number;
}
interface ContactInfo {
  uid: string;
  name: string;
  photoUrl: string;
  deptNameList: string[];
  email?: string;
  tel?: string;
  avatarColor?: string;
  model: ContactModel;
}
function getMentionNoticeParamsFromHash(hash: string) {
  const ret = { position: '', notice: '' };
  const pairs = hash.replace('#', '').split('&');
  pairs.forEach(pair => {
    const index = pair.indexOf('=');
    const key = safeDecodeURIComponent(pair.slice(0, index));
    if (key === 'position' || key === 'notice') {
      ret[key] = safeDecodeURIComponent(pair.slice(index + 1));
    }
  });
  return ret;
}
export function toContactInfo(model: ContactModel): ContactInfo {
  const mobile = model.contactInfo.find(item => item.contactItemType === 'MOBILE')?.contactItemVal;
  const tel = model.contactInfo.find(item => item.contactItemType === 'TEL')?.contactItemVal;
  const email = model.contactInfo.find(item => item.contactItemType === 'EMAIL')?.contactItemVal;
  const deptNameList = model.contact.position?.map(item => item.join('/'));
  return {
    uid: model.contact.id,
    name: model.contact.contactName,
    photoUrl: model.contact.avatar || '',
    deptNameList: deptNameList || [],
    email,
    tel: mobile || tel,
    avatarColor: model.contact.color || '',
    model,
  };
}
export async function getContactList(prefix: string): Promise<ContactInfo[]> {
  if (!prefix) {
    // TODO: 填充最近联系人
    // 现在还没有这个接口，为了不落空，填充同部门的联系人
    const user = systemApi.getCurrentUser();
    if (user && user.contact && user.contact.orgs && user.contact.orgs.length > 0) {
      const orgId = user.contact.orgs[0].id;
      const res = await contactApi.doGetContactByOrgId({ orgId, _account: accountApi.getCurrentAccount().email });
      return (res || []).slice(0, 10).map(toContactInfo);
    }
    return [];
  }

  const { contactList: res } = await contactApi.doSearchAllContact({
    query: prefix,
    contactType: 'enterprise',
    showDisable: false,
    isIM: true,
    exclude: ['orgName', 'orgPYName'],
  });
  return res.map(toContactInfo);
}
async function getUserInfo(uid: string): Promise<ContactInfo | null> {
  const [res] = await contactApi.doGetContactById(uid);
  if (res) {
    return toContactInfo(res);
  }
  return null;
}
async function sendMessage(uid: string) {
  const [res] = await contactApi.doGetContactById(uid);
  if (res && res.contactInfo) {
    const toAccount = res.contactInfo.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
    if (toAccount) {
      // todo: 跳转。本期不用支持了，这个方法应该不会被调用到了
    }
  }
}
let signEnum = 1;
const Doc: React.FC<DocProps> = props => {
  const { type, item, previewLink, authority = '', fileReq, errMsg, hashData, initPage, onFetchDetail = () => {}, extheme } = props;
  console.log('type', type);
  const iframeWrapEl = useRef(null);
  /** 控制演示模式 icon 点击是否有效 */
  const [docEditorIsReady, setDocEditorIsReady] = useState(false);
  const [componentSignId] = useState('doc_component_' + signEnum++);
  const [shareVisible, setShareVisible] = useState(false);
  const [docName, setDocName] = useState('');
  // 活动中sheet 的索引下标
  const [activedSheetIndex, setActivedSheetIndex] = useState('0');
  // 获取当前用户权限
  const [roles, setRoles] = useState<NSRoleInfo[]>(item?.authorityDetail?.roleInfos || []);
  const [auth, setAuth] = useState(authority);
  const [inputWidth, setInputWidth] = useState(80);
  const [statusText, setStatusText] = useState(getIn18Text('BIANJINEIRONGHUI'));
  const [docDeleteError, setDocDeleteError] = useState(false);
  const [docPermissionError, setPermissionError] = useState(false);
  const [editable, setEditable] = useState(authority.includes('管理') || authority.includes('编辑'));
  const [downloadable, setDownloadable] = useState(authority.includes('管理') || authority.includes('下载') || authority.includes('编辑'));
  const [coordinators, setCoordinators] = useState<Cursor[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const docNameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSetCoordinators = throttle(_coordinators => {
    if (Array.isArray(_coordinators)) {
      setCoordinators([..._coordinators]);
    }
  }, 1000);
  useHazel();
  const handleBridgeMessage = useCallback(
    (data: IBridgeRequestMessage) => {
      switch (data.method) {
        case 'getContactList':
          getContactList(...(data.args as [string])).then(result => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: BRIDGE_CALL_KEY,
                callbackId: data.callbackId,
                result,
              },
              '*'
            );
          });
          break;
        case 'getUserInfo':
          getUserInfo(...(data.args as [string])).then(result => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: BRIDGE_CALL_KEY,
                callbackId: data.callbackId,
                result,
              },
              '*'
            );
          });
          break;
        case 'getMentionNoticeParams':
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: BRIDGE_CALL_KEY,
              callbackId: data.callbackId,
              result: getMentionNoticeParamsFromHash(hashData),
            },
            '*'
          );
          break;
        case 'openSession':
          sendMessage(...(data.args as [string]));
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: BRIDGE_CALL_KEY,
              callbackId: data.callbackId,
            },
            '*'
          );
          break;
        default:
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: BRIDGE_CALL_KEY,
              callbackId: data.callbackId,
              exception: 'unsupported method',
            },
            '*'
          );
          break;
      }
    },
    [hashData]
  );
  const receiveMessage = useCallback(({ data }) => {
    console.warn('receiveDocMessage', data);
    const permission = data?.data;
    const fileType = data?.data?.type;
    const fromSite = data?.fromSite ?? data?.payload?.fromSite;
    // 处理Electron多页签问题，在多页签中协同文档会通过window.addEventListener注册多次 message导致多个协同文档同步错乱。
    if (isElectron && fromSite) {
      const previewIdentity = getParameterByName('identity', previewLink);
      const fromIdentity = getParameterByName('identity', fromSite);
      if (previewIdentity !== fromIdentity) {
        return;
      }
    }
    console.warn('receiveMessage', data, previewLink);
    switch (data.type) {
      // 权限发生变化
      case 'permission':
        diskApi
          .doGetNSFileInfo(fileReq)
          .then(res => {
            if (res?.authorityDetail?.roleInfos) {
              const _authorityRes = formatAuthority(res.authorityDetail.roleInfos, '') || '';
              setRoles(res.authorityDetail.roleInfos);
              setAuth(_authorityRes);
              trackerApi.track('pc_disk_doc', { name: 'doc_auth_changed', type: 'permission_changed', data: res.authorityDetail.roleInfos });
            } else {
              setDownloadable(false);
              setEditable(false);
            }
          })
          .catch(e => {
            console.error('doc doGetNSFileInfo error', e);
            setPermissionError(true);
            trackerApi.track('pc_disk_doc', { name: 'doc_auth_error', type: 'permission_error', data: e });
            // initPage();
            // 有这个场景: 目前通过链接分享的文件, 把用户踢了之后, 权限发送变更, 获取权限时异常. 然后被踢的用户再次进入这个分享链接. 还是属于协作者. initPage 先注释了
          });
        return;
      case 'fileError':
        if (fileType === 'DELETED') {
          setDocDeleteError(true);
          onFetchDetail(hashData, { fileType: '', name: DELETE_TITLE });
        } else if (fileType === 'NO_PERMISSION') {
          setPermissionError(true);
        } else if (fileType === 'MISS_DOC_INFO') {
          eventApi.sendSimpleSysEvent('loginExpired');
        }
        trackerApi.track('pc_disk_doc', { name: 'doc_auth_error', type: data.type, data: fileType });
        return;
      case 'updateTitle':
        setDocName(data.data);
        return;
      case 'saveStatus':
        setStatusText(data.data === 0 ? getIn18Text('BAOCUNZHONG') : getIn18Text('BAOCUNWANCHENG'));
        break;
      case BRIDGE_CALL_KEY:
        handleBridgeMessage(data);
        break;
      case 'permission-changed':
        console.warn('tag: doc', data.type);
        break;
      // doc editor 退出演示模式
      case 'docEditorPresentationExited':
        console.log(getIn18Text('docEd'));
        presentationManagr.exitFullScreen();
        break;
      // doc eidtor ready 消息
      case 'docEditorPresentationReady':
        setDocEditorIsReady(true);
        break;
      case 'goodbye':
        eventApi.sendSimpleSysEvent('loginExpired');
        trackerApi.track('pc_disk_doc', { name: 'receive_message', type: data.type, data: permission });
        break;
      case 'coordinator':
        // 请求太频繁 加个截流
        debouncedSetCoordinators(data.data);
        break;
      case 'sendMail':
        if (apiHolder.env.forElectron) {
          mailApi.doWriteMailToContact(data.data);
        } else if (systemApi.isMainPage()) {
          mailApi.doWriteMailToContact(data.data);
        } else {
          const host = conf('host');
          systemApi.openNewWindow(host + '/#?writeMailToContact=' + data.data[0], false);
        }
        ContactTrackerIns.tracker_contact_detail_click(getIn18Text('FAYOUJIAN'));
        break;
      case 'openRelatedMail':
        mailConfApi.doOpenRelatedPage(data.data);
        break;
      // 表格初始化
      case 'lxSheetReady':
        eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_SHEET', eventTarget: previewLink });
        break;
      // 更新活动中sheet的索引
      case 'sheetActivedIndexChanged':
        setActivedSheetIndex(data?.data?.tabIndex);
        // web端，sheet 切换需要把索引同步到url参数上。
        if (!systemApi.isElectron()) {
          try {
            const hashParams = window.location.hash;
            const paramsString = hashParams.replace(/^#/, '');
            const urlSearch = new URLSearchParams(paramsString);
            urlSearch.set('activedSheetIndex', data?.data?.tabIndex);
            history.replaceState(null, '', location.pathname + '#' + urlSearch.toString());
          } catch (error) {
            console.log(error);
          }
        }
        break;
      // 文档初始化
      case 'lxDocReady':
        eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_DOC', eventTarget: previewLink });
        break;
      // 文档评论功能触发（创建/删除评论）
      case 'lxDocComment':
        eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'LIKE_DOC_COMMENT', eventTarget: previewLink });
        break;
      default:
        break;
    }
  }, []);
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
  useEffect(() => {
    setEditable(auth.includes('管理') || auth.includes('编辑'));
    setDownloadable(auth.includes('管理') || auth.includes('下载') || auth.includes('编辑'));
  }, [auth]);
  // 解决多页签场景打开新页签分享弹窗失去窗口焦点不隐藏，开新页签会导致浮层不消失bug
  if (isElectron) {
    useEventObserver('electronBlur', {
      name: `docPageElectronClosed_${hashData}`,
      func: () => {
        setShareVisible(false);
        iframeRef.current?.contentWindow?.postMessage({ type: 'blur' }, '*');
      },
    });
  }
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage('', '*');
    window?.addEventListener('message', receiveMessage, false);
    return () => {
      window?.removeEventListener('message', receiveMessage, false);
    };
  }, []);
  useEffect(() => {
    onFetchDetail(hashData, { fileType: item?.fileType, name: docName });
    if (docNameRef?.current?.clientWidth) {
      setInputWidth(docNameRef.current?.clientWidth + 20);
      return;
    }
    let time = 0;
    const si = setInterval(() => {
      if (time > 10) clearInterval(si);
      if (docNameRef?.current?.clientWidth) {
        setInputWidth(docNameRef.current?.clientWidth + 20);
        clearInterval(si);
      } else {
        time += 1;
      }
    }, 100);
  }, [docName]);
  // 返回网盘
  const backToDiskPage = () => {
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
  };
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocName(e.target.value);
  };
  const onInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };
  const postTitleChanged = () => {
    if (!docName) {
      setDocName(getIn18Text('WEIMINGMING'));
    }
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'titleChanged',
        data: docName || getIn18Text('WEIMINGMING'),
      },
      '*'
    );
  };
  const onInputBlur = () => {
    postTitleChanged();
  };
  const postShowHistory = () => {
    if (!editable) {
      message.info({
        duration: 2,
        content: <span>{getIn18Text('WUQUANXIAN')}</span>,
      });
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'togglePreviewHistory',
          data: true,
        },
        '*'
      );
    }
  };
  /**
   * 打开演示模式
   */
  const postPresentation = () => {
    // 文档编辑器没有准备好，直接退出
    if (!docEditorIsReady) {
      return;
    }
    trackerApi.track('pc_disk_presentation', {
      operaType: 'show',
      fileType: 'doc',
    });
    presentationManagr.invokeFullscreen(componentSignId);
  };
  useEffect(() => {
    const callback = function (event) {
      if (event.key === 'Escape') {
        presentationManagr.exitFullScreen();
      }
    };
    document.addEventListener('keydown', callback);
    return () => {
      document.removeEventListener('keydown', callback);
    };
  }, []);
  // 导出
  const postExport = () => {
    if (downloadable) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'export',
          filename: docName,
        },
        '*'
      );
      // if (type === 'doc') {
      //     message.info({
      //         duration: 2,
      //         icon: <></>,
      //         content: <span>敬请期待</span>,
      //     });
      // } else {
      //     iframeRef.current?.contentWindow?.postMessage(
      //         {
      //             type: 'export',
      //         },
      //         '*'
      //     );
      // }
    } else {
      message.info({
        duration: 2,
        content: <span>{getIn18Text('WUQUANXIAN')}</span>,
      });
    }
  };
  // 另存为模板
  const saveAsTemplate = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'lxSaveAsTemplateForm',
        docName,
      },
      '*'
    );
  };
  const getOriginHash = (hashData: string) => hashData?.replace(/\&tabTag=\d+/, '');
  // 浏览器中打开
  const openInBrowser = () => {
    // 去掉#前缀和 多页签参数
    const hashParamsString = getOriginHash(hashData?.replace(/^#/, ''));
    const nextHashData = new URLSearchParams(hashParamsString || '');
    // 拼接当前活动sheet 的索引下标
    if (type === 'sheet') {
      nextHashData.set('activedSheetIndex', activedSheetIndex);
    }
    const addr = `${conf('host')}/${type}/${hashParamsString ? `#${nextHashData.toString()}` : ''}`;
    systemApi.openNewWindow(addr);
  };
  const onMenuVisibleChange = (visible: boolean) => {
    setShareVisible(visible);
  };
  // electron 中 handleInternalUrlWebJump 处理过程中会把 hash 中 # 清除，但 web 会保留，这里防御式处理下
  const locationHash = `${hashData ? `#${hashData.replace('#', '')}` : ''}`;
  useEffect(() => {
    const data = {
      domFullscreen: false,
      editorUIFullscreen: false,
      editorPrarentEL: iframeWrapEl,
      editorParentWindowEl: iframeRef,
      docComponentID: componentSignId,
      docTitle: docName,
      hash: getOriginHash(hashData),
    };
    presentationManagr.addDocItem(data);
    return () => {
      presentationManagr.removeDocItem({
        docComponentID: componentSignId,
      });
    };
  }, []);
  // 更新文档title
  useEffect(() => {
    presentationManagr.setDocTitle(componentSignId, docName);
  }, [docName]);
  let docContent;
  if (errMsg) {
    docContent = <NoAuthority title={errMsg} />;
  } else if (docDeleteError) {
    docContent = <NoAuthority title={DELETE_TITLE} />;
  } else if (docPermissionError || !auth) {
    trackerApi.track('pc_disk_doc', { name: 'doc_auth_error', type: 'doc_error', data: { docPermissionError, auth: auth } });
    docContent = <NoAuthority />;
  } else {
    // @ts-ignore
    const sharePage = (
      <SharePage
        //  activedSheetIndex 用于表格sheet定位
        activedSheetIndex={type === 'sheet' ? activedSheetIndex : ''}
        visible
        from="navigationBar"
        item={item}
        roles={roles}
        showAsModal={false}
        hideSharePage={onMenuVisibleChange}
        className="extheme"
      />
    );
    const deskTopTitleBar = (
      <div className={styles.titleBar}>
        <div className={styles.docInfo}>
          {forElectron ? null : (
            <div className={styles.backIcon} onClick={backToDiskPage}>
              <IconCard type="backArrow" />
            </div>
          )}
          <div className={styles.docNameBox}>
            <input
              ref={inputRef}
              value={docName}
              onChange={onTitleChange}
              onBlur={onInputBlur}
              className={styles.docName}
              style={{ width: inputWidth }}
              placeholder={getIn18Text('WEIMINGMING')}
              onKeyPress={onInputKeyPress}
              disabled={!editable}
            />
            <div ref={docNameRef} className={classnames(styles.docName, styles.hidden)}>
              {docName}
            </div>
          </div>
          <div className={styles.status}>
            <IconCard type="saved" />
            <span>{statusText}</span>
          </div>
        </div>
        <div className={styles.operateBox}>
          <Coordinator cursors={coordinators} />
          <Dropdown visible={shareVisible} trigger={['click']} overlay={sharePage} onVisibleChange={onMenuVisibleChange}>
            <div className={styles.shareBtn}>{getIn18Text('FENXIANG')}</div>
          </Dropdown>
          <CreateFileBtn className={styles.iconBtn}></CreateFileBtn>
          {
            // 仅文档支持演示模式
            type === 'doc' ? (
              <Tooltip title={getIn18Text('YANSHIMOSHI')} placement="bottom">
                <div className={classnames(styles.iconBtn)} onClick={postPresentation}>
                  <FullScreenIcon />
                </div>
              </Tooltip>
            ) : null
          }
          {forElectron && isElectron && (
            // 新加placement 用于修复bug http://jira.netease.com/browse/COSPREAD-4573
            <Tooltip title={getIn18Text('LIULANQIDAKAI')} placement="bottom">
              <div className={styles.iconBtn} onClick={openInBrowser}>
                <IconCard type="browser" />
              </div>
            </Tooltip>
          )}
          <Dropdown
            overlay={
              <Menu
                onClick={({ key }) => {
                  switch (key) {
                    case 'export':
                      postExport();
                      break;
                    case 'lxSaveAsTemplateForm':
                      saveAsTemplate();
                      break;
                    case 'history':
                      postShowHistory();
                      break;
                    default:
                      break;
                  }
                }}
              >
                <Menu.Item key="lxSaveAsTemplateForm">
                  <a>{getIn18Text('LINGCUNWEIMOBAN')}</a>
                </Menu.Item>
                <Menu.Item key="export" disabled={!downloadable}>
                  <a>{item.fileType === 'doc' ? getIn18Text('DAOCHUWEIWo') : getIn18Text('DAOCHUWEIEx')}</a>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="history" disabled={!editable}>
                  <a>{getIn18Text('LISHIYUHUIFU')}</a>
                </Menu.Item>
              </Menu>
            }
            overlayClassName={`extheme ${styles.moreMenu}`}
          >
            <div
              className={classnames(styles.iconBtn, styles.more)}
              onClick={e => {
                e.preventDefault();
              }}
            >
              <MoreIcon />
            </div>
          </Dropdown>
        </div>
      </div>
    );
    const isMobile = platform.isMobile();
    docContent = (
      <>
        {isMobile ? null : deskTopTitleBar}
        <div ref={iframeWrapEl} className={styles.docsIframeWrap}>
          <iframe
            ref={iframeRef}
            className={styles.docsIframe}
            src={getDocURL(previewLink + locationHash)}
            title="docs"
            width="100%"
            height="100%"
            // fullscreen 支持全屏模式 dom.requestFullscreen api
            allow="clipboard-read; clipboard-write; fullscreen"
          />
          <NpsArea targetLink={previewLink} />
          {!isElectron && !isMobile ? <UserCardMention /> : null}
        </div>
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
export default Doc;
