import React, { useEffect, useState, useRef, Ref, RefObject } from 'react';
import cn from 'classnames';
import { Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { platform, apiHolder, apis, ResponseAnonymousFileInfo, NetStorageShareApi, DataTrackerApi, PopUpMessageInfo } from 'api';
import { supportFilesPC, supportFilesH5 } from './constant';
import { getFileExt, formatFileSize } from '@web-common/utils/file';
// import DeleteIcon from '../../../../UI/Icons/svgs/disk/Delete';
import DownloadIcon from '@web-common/components/UI/Icons/svgs/disk/Download';
import InfoIcon from '@web-common/components/UI/Icons/svgs/disk/FileInfo';
import { simpleFormatTime } from '../../utils';
// import IconCard from '../../../MailBox/components/Icon/index';
import styles from './preview.module.scss';
import { MobileDownloadGuidePage } from './components/MobileDownloadGuidePage';
import { noPreviewReport } from './dataTracker';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = apiHolder.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
interface PrivewProps {
  // authority?: string
  hasAuthority?: boolean;
  errorCode?: number;
  item?: ResponseAnonymousFileInfo;
  type: string;
  previewLink: string;
  fileId: number;
  shareIdentity: string;
}
interface PostFile {
  fileId: number;
  shareIdentity: string;
  fileName: string;
  ref: RefObject<HTMLIFrameElement>;
}
// 获取文件信息
const getFileInfo = async (fileId: any, shareIdentity: any): Promise<PopUpMessageInfo> => {
  const params = {
    fileId,
    shareIdentity,
  };
  const res: PopUpMessageInfo = await nsShareApi.downloadAnonymousFileInfo(params);
  return res;
};
// 获取文件下载链接
const reqDownloadLink = async (fileId, shareIdentity): Promise<void> => {
  try {
    const res = await getFileInfo(fileId, shareIdentity);
    if (res?.content) {
      systemApi.webDownloadLink(res.content);
    } else {
      message.error(getIn18Text('XIAZAISHIBAI'));
      console.log(res);
    }
  } catch (err) {
    console.warn(getIn18Text('XIAZAIYIBANWEN'), err);
  }
};
// 导出协同文档、表格
const postExport = async ({ fileId, shareIdentity, fileName, ref }: PostFile): Promise<void> => {
  try {
    const res = await getFileInfo(fileId, shareIdentity);
    if (res.code === 'S_OK') {
      ref?.current?.contentWindow?.postMessage(
        {
          type: 'export',
          filename: fileName,
        },
        '*'
      );
    } else {
      message.error(getIn18Text('DAOCHUSHIBAI'));
      console.log(res);
    }
  } catch (err) {
    console.warn(getIn18Text('XIAZAIWENDANGSHI'), err);
  }
};
const getFileType = (fileType: string, fileName: string): string => {
  // 一般文档
  if (fileType === 'file') {
    if (fileName) {
      const indexOf = fileName.lastIndexOf('.');
      if (indexOf > 0 && indexOf < fileName.length - 1) return fileName.substring(indexOf + 1);
    }
    return 'other';
  }
  // 协同文档
  if (['doc', 'excel'].includes(fileType as string)) return fileType as string;
  // 其他
  return 'other';
};
export const AnonymousPreviewPage: React.FC<PrivewProps> = props => {
  const { item, type, hasAuthority, errorCode, previewLink, fileId, shareIdentity } = props;
  const isMobile = platform.isMobile();
  const isSiriusMobile = platform.isSiriusMobile();
  useEffect(() => {
    // 外部分享 查看文件
    item?.fileType &&
      trackerApi.track('pc_disk_view', {
        viewWay: 'outerShareView',
        fileType: item.fileType,
        fileId: item.id,
      });
  }, [item]);
  const shareTime = item?.shareTime;
  const supportFiles = isMobile ? supportFilesH5 : supportFilesPC;
  const supportPreview =
    supportFiles.includes(item?.extensionType || '') || supportFiles.includes(getFileExt(item?.fileName || '')) || item?.fileType === 'doc' || item?.fileType === 'excel';
  let content;
  if (isMobile && item?.fileName) {
    document.title = item.fileName;
  }
  if (item && hasAuthority && supportPreview) {
    content = (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      <AnonymousPreview item={item} type={type} previewLink={previewLink} fileId={fileId} shareIdentity={shareIdentity} />
    );
  } else if (hasAuthority) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // 移动端访问&并且不支持在线预览，渲染引导页(灵犀办公移动端例外)
    if (isMobile && !isSiriusMobile) {
      return <MobileDownloadGuidePage fileId={fileId} />;
    }
    content = <AnonymousNotSupport item={item} fileId={fileId} shareIdentity={shareIdentity} />;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    content = <AnonymousNoAuthority errorCode={errorCode} />;
  }
  /**
   * 外部普通文件链接 可以分为可以预览的普通文件、不可预览的普通文件、文档。
   *
   * 这里渲染 可预览文件的page组件
   * MobileDownloadGuidePage 非灵犀办公移动端&不可预览的文件 page组件
   * AnonymousNotSupport 灵犀办公移动端访问的&不可预览文件 page组件
   *
   * 移动端 不展示 分享相关元素
   */
  if (isMobile) {
    return <div className={styles.privewMobilePage}>{content}</div>;
  }
  return (
    <div className={styles.previewPage}>
      <div className={styles.fileName}>{item?.fileName}</div>
      {shareTime && (
        <div className={styles.shareTime}>
          {getIn18Text('FENXIANGSHIJIAN:')}
          {simpleFormatTime(shareTime)}
        </div>
      )}
      {/* {forElectron?<div className={styles.toolIcon} title="浏览器打开"/>:null} */}
      {content}
    </div>
  );
};
export const AnonymousPreview: React.FC<any> = props => {
  const { item, previewLink, fileId, shareIdentity } = props;
  const { role, fileType, fileName, size } = item;
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const showDetail = e => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setDetailVisible(!detailVisible);
  };
  const setVisibleCb = () => setDetailVisible(false);
  useEffect(() => {
    document.addEventListener('click', setVisibleCb, false);
    return () => {
      document.removeEventListener('click', setVisibleCb, false);
    };
  }, []);
  const downloadFile = () => {
    // 一般文件 下载
    if (fileType === 'file') {
      reqDownloadLink(fileId, shareIdentity);
      return;
    }
    // 协同文档 导出
    if (['excel', 'doc'].includes(fileType)) {
      postExport({ fileId, shareIdentity, fileName, ref: iframeRef });
    }
  };
  if (!previewLink) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return <AnonymousNotSupport item={item} fileId={fileId} shareIdentity={shareIdentity} />;
  }
  return (
    <div className={styles.previewWrapper}>
      <iframe className={styles.previewIframe} src={previewLink} title="preview" width="100%" height="100%" ref={iframeRef} />
      {/* 文件信息 */}
      {detailVisible && (
        <>
          <div className={styles.shade} />
          <div
            className={styles.infoDetail}
            onClick={e => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
          >
            <div className={styles.detailItem}>
              {getIn18Text('LEIXING')}
              <span className={styles.itemVal}>{getFileType(fileType, fileName).toUpperCase()}</span>
            </div>
            <div className={styles.detailItem}>
              {getIn18Text('DAXIAO')}
              <span className={styles.itemVal}>{formatFileSize(size, 1024)}</span>
            </div>
          </div>
        </>
      )}
      <div className={styles.operateBox}>
        {/* <div className={styles.iconWrapper}><DeleteIcon /></div> */}
        {role === 'ROLE_USER_DOWNLOAD' && ['file', 'doc', 'excel'].includes(fileType) && (
          <Button icon={<DownloadIcon />} className={styles.iconWrapper} onClick={downloadFile} />
        )}
        <div className={styles.iconWrapper} onClick={showDetail}>
          <InfoIcon />
        </div>
      </div>
    </div>
  );
};
// 用于 没有权限 + 已失效 的情况
export const AnonymousNoAuthority: React.FC<any> = props => {
  const { title, errorCode } = props; // '暂无查看权限，请联系相关人员开通'
  const user = systemApi.getCurrentUser();
  let showTitle = '';
  switch (errorCode) {
    case 10700:
      showTitle = getIn18Text('LAIWANYIBU\uFF0C');
      break;
    case 10701:
      showTitle = getIn18Text('FENXIANGDEWENJIAN');
      break;
    default:
      showTitle = user?.id ? `当前登录用户为：${user?.id}，没有访问权限` : getIn18Text('MEIYOUFANGWENQUAN');
      break;
  }
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.noAuthority}>
        <div className="sirius-empty sirius-empty-doc" />
        <div className={styles.noAuthorityText}>{title || showTitle}</div>
      </div>
    </div>
  );
};
export const AnonymousNotSupport: React.FC<{
  item: ResponseAnonymousFileInfo;
  [key: string]: any;
}> = props => {
  const { item, fileId, shareIdentity } = props;
  const { role, fileType } = item;
  const fileExt = getFileExt(item?.fileName);
  const downloadFile = () => {
    noPreviewReport('download', fileExt);
    reqDownloadLink(fileId, shareIdentity);
  };
  useEffect(() => {
    noPreviewReport('show', fileExt);
    window.postMessage('hideSpinner');
  }, []);
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.notSupport}>
        <div className="sirius-empty sirius-empty-doc" />
        <div className={styles.notSupportText}>{getIn18Text('GAIGESHIZANBU')}</div>
        {role === 'ROLE_USER_DOWNLOAD' && fileType === 'file' && (
          <Button type="primary" className={styles.downloadBtn} onClick={downloadFile}>
            {getIn18Text('XIAZAI')}
          </Button>
        )}
      </div>
    </div>
  );
};
