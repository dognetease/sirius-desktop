/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, message, Tooltip } from 'antd';
import classnames from 'classnames';
import { platform, apiHolder, NSDirContent, NSFileContent, conf, NetStorageApi, ConvertApi, ConvertTaskResponse, ConvertTaskStatus, DataTrackerApi } from 'api';
import Detail from '../Detail';
import { getFileExt } from '@web-common/utils/file';
import DownloadIcon from '@web-common/components/UI/Icons/svgs/disk/Download';
import InfoIcon from '@web-common/components/UI/Icons/svgs/disk/FileInfo';
import IconCard from '@web-common/components/UI/IconCard/index';
import BlockIcon from '@web-common/components/UI/Icons/svgs/disk/Block';
import styles from './preview.module.scss';
import { sleep } from '@web-common/components/util/async';
import { CONVERT_MAX_SIZE, getConvertFileType } from '../../utils';
import { MobileDownloadGuidePage } from './components/MobileDownloadGuidePage';
import { noPreviewReport } from './dataTracker';
import { supportFilesH5, supportFilesPC } from './constant';
// import {  } from 'api/src';
// import { conf } from 'api/src';
import { getIn18Text } from 'api';
const forElectron = conf('build_for') === 'electron';
const systemApi = apiHolder.api.getSystemApi();
const isElectron = systemApi.isElectron();
const trackerApi = apiHolder.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const CONVERT_EVENT_ID = 'pcDisk_previewAttachment_convert';
enum ConvertOperaType {
  ButtonShow = 'buttonshow',
  Convert = 'convert',
  ConvertSuccess = 'convertsuccess',
}
interface PrivewProps {
  // authority?: string
  hasAuthority?: boolean;
  item?: NSDirContent | NSFileContent;
  type: string;
  previewLink: string;
  dlFileAble: boolean;
  dlFileAction: () => void;
  hashData: string;
  typeOrg: 'personal' | 'ent';
  // 无法预览时的错误提示
  errorMsg?: string;
}
const ALLOW_CONVERT_FILE_TYPE_SET = new Set(['xls', 'xlsx', 'docx']);
const LOADING_MESSAGE_KEY = 'edisk_convert_loading';
const CONVERT_TIMEOUT = 12e4; // 后端转换未做超时限制，120s 后仍不成功直接报超时失败
const ProgressContext = React.createContext({ percent: 0 });
function Progress({ percent }: { percent: number }) {
  return (
    <div className={styles.loading}>
      <div className={styles.grey}>{getIn18Text('ZHUANCUNZHONG')}</div>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: percent }} />
      </div>
      <div className={styles.white}>{percent}%</div>
    </div>
  );
}
const MANAGEMENT_ROLE_ID = 100;
const DOWNLOAD_PRIVILEGE_ID = 104;
function checkCanConvert(item?: NSDirContent | NSFileContent): boolean {
  if (!item) return false;
  // 有管理权限 或 同时有查看和下载权限
  if (
    !(item.authorityDetail.roleInfos.some(r => r.roleId === MANAGEMENT_ROLE_ID) || item.authorityDetail.privilegeInfos.some(p => p.privilegeId === DOWNLOAD_PRIVILEGE_ID))
  ) {
    return false;
  }
  return ALLOW_CONVERT_FILE_TYPE_SET.has(item?.extensionType || '') || ALLOW_CONVERT_FILE_TYPE_SET.has(getFileExt(item?.name || ''));
}
function getFileTypeName(type: string): string {
  if (['xls', 'xlsx'].includes(type)) {
    return getIn18Text('BIAOGE');
  }
  // docx
  return getIn18Text('WENDANG');
}
function isNSFileContent(item: NSDirContent | NSFileContent): item is NSFileContent {
  return !!(item as NSFileContent).size;
}
const convertApi = apiHolder.api.requireLogicalApi('convertApiImpl') as ConvertApi;
const netStorageApi = apiHolder.api.requireLogicalApi('netStorageImpl') as NetStorageApi;
export const PreviewPage: React.FC<PrivewProps> = props => {
  const { item, type, hasAuthority, previewLink, dlFileAble, dlFileAction, hashData, typeOrg, errorMsg } = props;
  const isMobile = platform.isMobile();
  const isSiriusMobile = platform.isSiriusMobile();
  const supportFiles = isMobile ? supportFilesH5 : supportFilesPC;
  const supportPreview = supportFiles.includes(item?.extensionType || '') || supportFiles.includes(getFileExt(item?.name || ''));
  const canConvert = checkCanConvert(item);
  const fileType = item?.extensionType || getFileExt(item?.name || '');
  const fileTypeEN = getConvertFileType(fileType);
  useEffect(() => {
    if (!canConvert) {
      return;
    }
    trackerApi.track(CONVERT_EVENT_ID, {
      operatype: ConvertOperaType.ButtonShow,
      type: fileTypeEN,
    });
  }, [canConvert, item]);
  // 内部分享查看文件
  useEffect(() => {
    item?.fileType &&
      trackerApi.track('pc_disk_view', {
        viewWay: 'innerShareView',
        fileType: item.fileType,
        fileId: item.id,
      });
  }, [item]);
  const fileTypeName = getFileTypeName(fileType);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);
  // FIX: QIYE163-13309
  // 转换完成后的文档地址,当window.open被拦截后设置该参数打开Modal提示用户设置
  const [openUrl, setOpenUrl] = useState('');
  function onModalOk() {
    openNewWindow(openUrl);
  }
  function onModalCancel() {
    setOpenUrl('');
  }
  function openNewWindow(url: string) {
    const openRes = systemApi.openNewWindow(url);
    if (openRes === 'fail') {
      setOpenUrl(url);
    } else {
      setOpenUrl('');
    }
  }
  const convertToOnlineDoc = useCallback(() => {
    if (loading || !item || !isNSFileContent(item)) return;
    if (item.size >= CONVERT_MAX_SIZE) {
      message.error(getIn18Text('JINZHICHIZHUANCUN'));
      return;
    }
    setLoading(true);
    const hide = messageApi.open({
      key: LOADING_MESSAGE_KEY,
      className: styles.message,
      type: 'loading',
      content: <ProgressContext.Consumer>{value => <Progress {...value} />}</ProgressContext.Consumer>,
      duration: 0,
    });
    // 进度条更新逻辑，最多更新到 99 ，通过 flag 控制退出逻辑
    let flag = true;
    async function startProgress() {
      let p = 0;
      /* eslint-disable no-await-in-loop */
      while (flag && p < 99) {
        p += 1;
        setPercent(p);
        const time = p < 10 ? 100 : 500;
        await sleep(time);
      }
      /* eslint-enable no-await-in-loop */
    }
    startProgress();
    // 触发转换并轮询状态
    async function startConvert() {
      if (!item) return;
      try {
        let task = { status: ConvertTaskStatus.Waiting } as ConvertTaskResponse;
        let taskId: string = '';
        try {
          const root = await netStorageApi.doGetNSFolderInfo({ type: 'personal' });
          if (typeOrg === 'ent') {
            taskId = await convertApi.convertFile2Doc(item.id, root.id);
          } else {
            taskId = await convertApi.convertPersonalFile2Doc(item.id, root.id);
          }
        } catch (err: any) {
          task.status = ConvertTaskStatus.Failed;
          task.failureReason = getIn18Text('ZHUANCUNSHIBAI');
          if (err.message === 'timeout') {
            task.failureReason = getIn18Text('QINGQIUCHAOSHI');
          } else if (err.data && !err.data.success && err.data.message) {
            task.failureReason = err.data.message;
          }
        }
        const startTime = Date.now();
        /* eslint-disable no-await-in-loop, no-empty */
        while (task.status === ConvertTaskStatus.Waiting) {
          if (Date.now() - startTime > CONVERT_TIMEOUT) {
            task.failureReason = getIn18Text('ZHUANHUANCHAOSHI');
            break;
          }
          await sleep(5000);
          try {
            if (typeOrg === 'ent') {
              task = await convertApi.checkConvertTask(taskId);
            } else {
              task = await convertApi.checkPersonalConvertTask(taskId);
            }
          } catch (err) {}
        }
        /* eslint-enable no-await-in-loop, no-empty */
        flag = false;
        if (task.status === ConvertTaskStatus.Completed) {
          trackerApi.track(CONVERT_EVENT_ID, {
            operatype: ConvertOperaType.ConvertSuccess,
            type: fileTypeEN,
          });
          messageApi.open({
            type: 'success',
            key: LOADING_MESSAGE_KEY,
            content: getIn18Text('ZHUANHUANCHENGGONG'),
            duration: 1000,
          });
          // 跳转
          const url = convertApi.getFileURL(task);
          if (systemApi.isElectron()) {
            systemApi.handleJumpUrl(-1, url);
          } else {
            openNewWindow(url);
          }
        } else {
          messageApi.open({
            type: 'error',
            key: LOADING_MESSAGE_KEY,
            content: task.failureReason || getIn18Text('ZHUANCUNSHIBAI'),
            duration: 1000,
          });
        }
      } catch (err) {
        console.error(err);
        flag = false;
        messageApi.open({
          type: 'error',
          key: LOADING_MESSAGE_KEY,
          content: getIn18Text('WEIZHICUOWU'),
          duration: 1000,
        });
      }
      setTimeout(() => hide(), 1000);
      setLoading(false);
      setPercent(0);
    }
    startConvert();
  }, [messageApi, item]);
  let content;
  if (isMobile && item?.name) {
    document.title = item.name;
  }
  if (item && hasAuthority && supportPreview) {
    content = (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      <Preview item={item} type={type} previewLink={previewLink} dlFileAble={dlFileAble} dlFileAction={dlFileAction} errorMsg={errorMsg} />
    );
  } else if (hasAuthority) {
    // 移动端访问&并且不支持在线预览，渲染引导页(灵犀办公移动端例外)
    if (isMobile && !isSiriusMobile) {
      return <MobileDownloadGuidePage fileId={item?.id!} />;
    }
    content = <NotSupport dlFileAble={dlFileAble} dlFileAction={dlFileAction} item={item} />;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    content = <NoAuthority />;
  }
  // 浏览器中打开
  const openInBrowser = () => {
    const hash = hashData && !hashData.startsWith('#') ? '#' + hashData : hashData;
    const addr = `${conf('host')}/share/${hash || ''}`;
    systemApi.openNewWindow(addr);
  };
  return (
    <div className={styles.previewPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.fileName}>{item?.name}</div>
        </div>
        <div className={styles.headerRight}>
          {canConvert && (
            <Tooltip
              overlayClassName={styles.tooltip}
              overlay={`转存为协同${fileTypeName}后可以和他人同时进行在线编辑，${fileTypeName}将自动添加在个人空间根目录下`}
              placement="bottomRight"
            >
              <div
                className={classnames(styles.button, { [styles.disabled]: loading })}
                onClick={() => {
                  if (loading) {
                    return;
                  }
                  convertToOnlineDoc();
                  trackerApi.track(CONVERT_EVENT_ID, {
                    operatype: ConvertOperaType.Convert,
                    type: fileTypeEN,
                  });
                }}
              >
                {getIn18Text('ZHUANWEIXIETONG')}
                {fileTypeName}
                <ProgressContext.Provider value={{ percent }}>{contextHolder}</ProgressContext.Provider>
              </div>
            </Tooltip>
          )}
          {forElectron && isElectron && (
            <Tooltip className={styles.toolIcon} title={getIn18Text('LIULANQIDAKAI')}>
              <div onClick={openInBrowser}>
                <IconCard type="browser" />
              </div>
            </Tooltip>
          )}
        </div>
        <Modal
          title={getIn18Text('WENJIANZHUANHUANCHENG')}
          visible={!!openUrl}
          onOk={onModalOk}
          onCancel={onModalCancel}
          okText={getIn18Text('SHEZHIHAOLE')}
          cancelText={getIn18Text('QUXIAO')}
          closable={false}
          width={400}
        >
          <ol className={styles.modalList}>
            <li>
              <span>
                {getIn18Text('DIANJIDEZHILAN')}
                <BlockIcon />”
              </span>
            </li>
            <li>
              <span>{getIn18Text('SHEZHIWEI\u201CSHI')}</span>
            </li>
          </ol>
        </Modal>
      </div>
      {content}
    </div>
  );
};
export const Preview: React.FC<any> = props => {
  const { item, type, previewLink, dlFileAble, errorMsg, dlFileAction } = props;
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  console.log('[Preview]', previewLink);
  const setVisible = val => {
    setDetailVisible(val);
  };
  const showDetail = () => {
    setDetailVisible(true);
  };
  if (!previewLink) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return <NotSupport dlFileAble={dlFileAble} dlFileAction={dlFileAction} errorMsg={errorMsg} item={item} />;
  }
  return (
    <div className={styles.previewWrapper}>
      <iframe className={styles.previewIframe} src={previewLink} title="preview" width="100%" height="100%" />
      <Detail itemOrg={item} type={type} maskStyle={{ backgroundColor: 'transparent' }} isModalVisible={detailVisible} setVisible={setVisible} />
      <div className={styles.operateBox}>
        {/* <div className={styles.iconWrapper}><DeleteIcon /></div> */}
        {!!dlFileAble && <Button icon={<DownloadIcon />} className={styles.iconWrapper} onClick={dlFileAction} />}
        <div className={styles.iconWrapper} onClick={showDetail}>
          <InfoIcon />
        </div>
      </div>
    </div>
  );
};
export const NoAuthority: React.FC<any> = props => {
  const { title, noTitle = false } = props; // '暂无查看权限，请联系相关人员开通'
  const user = systemApi.getCurrentUser();
  const showTitle = user?.id ? `当前登录用户为：${user?.id}，没有访问权限` : getIn18Text('MEIYOUFANGWENQUAN');
  return (
    <div className={`${styles.previewWrapper} no-authority-wrapper`}>
      <div className={styles.noAuthority}>
        <div className="sirius-empty sirius-empty-doc" />
        {!noTitle && <div className={styles.noAuthorityText}>{title || showTitle}</div>}
      </div>
    </div>
  );
};
export const NotSupport: React.FC<{
  item: NSFileContent;
  [key: string]: any;
}> = props => {
  const { dlFileAble, dlFileAction, errorMsg, item } = props;
  const fileExt = getFileExt(item?.name);
  useEffect(() => {
    noPreviewReport('show', fileExt);
    window.postMessage('hideSpinner');
  }, []);
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.notSupport}>
        <div className="sirius-empty sirius-empty-doc" />
        <div className={styles.notSupportText}>{errorMsg || getIn18Text('GAIGESHIZANBU')}</div>
        {!!dlFileAble && (
          <Button
            type="primary"
            className={styles.downloadBtn}
            onClick={() => {
              dlFileAction();
              noPreviewReport('download', fileExt);
            }}
          >
            {getIn18Text('XIAZAI')}
          </Button>
        )}
      </div>
    </div>
  );
};
