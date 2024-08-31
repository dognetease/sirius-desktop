import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button, Table } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apiHolder as api, apis, CloudAtt, NetStorageApi, NetStorageType, SystemApi, PerformanceApi, DataTrackerApi, DataStoreApi } from 'api';
import FilenameCell from './../DiskTable/FilenameCell';
import IconCard from '@web-common/components/UI/IconCard';
import CloudAttOprs from './cloudAttOprs';
import { formatFileSize } from '@web-common/utils/file';
import styles from './cloudAttCont.module.scss';
import { UploadFile } from './../Upload';
import { UploadFileStatus } from './../../upload';
import { useAppSelector } from '@web-common/state/createStore';
import RowName from './../RowName/rowName';
import { getFileIcon, normalizeShareUrl } from './../../utils';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { DiskTipKeyEnum } from '@web-disk/disk';
import throttle from 'lodash/throttle';
import Empty from './../Empty/empty';
import TableSkeleton from './../TableSkeleton/tableSkeleton';
import { FormatExpiredDate } from '@web-mail/common/components/FormatExpireDate';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import Alert from '@web-common/components/UI/Alert/Alert';
import { overLimitLabel, totalOverLimitLabel } from '@web-common/utils/cloundAttLimit';
import { ExpireTimeTitle } from './ExpireTimeTitle';
import ExpiringInfo from './expiringInfo';
import { getIn18Text } from 'api';
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const dataStoreApi: DataStoreApi = api.api.getDataStoreApi() as DataStoreApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
interface Props {
  setVisibleUpload: (func) => void; // 上传model是否可见
  setUploadFileItems: (func) => void; // 上传的文件列表
  getRootInfo: () => void;
  electronDownload: (content, fileUrl) => void;
}
// 转存失败 code与提示内容映射表
const codeContMap = {
  10304: getIn18Text('ZHUANCUNSHIBAI\uFF0C'),
  10206: getIn18Text('ZHUANCUNSHIBAI\uFF0C'),
};
const DeleteFileAlert = (expireTime: number): boolean => {
  // 已过期文件提示
  if (expireTime != null && expireTime !== 0 && expireTime < Date.now()) {
    // 过期提示
    Alert.error({
      title: getIn18Text('WENJIANBUCUNZAI'),
      content: null,
    });
    return true;
  }
  return false;
};

const PageSize = 30;
const tag = 'cloudAttCont';
const day15 = 15 * 24 * 60 * 60 * 1000;
const iconStyle = { width: 15, height: 15, marginRight: 8, position: 'relative', top: 3 };

const CloudAttCont = React.forwardRef((props: Props, ref) => {
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  // 当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const { setVisibleUpload, setUploadFileItems, getRootInfo, electronDownload } = props;
  const [upable, setUpable] = useState<boolean>(true);
  const [list, setList] = useState<CloudAtt[]>([]);
  const [page, setPage] = useState<number>(1);
  const [noMoreFile, setNoMoreFile] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [renewSupportShow, setRenewSupportShow] = useState<boolean>(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [rowHoverId, setRowHoverId] = useState<string>();
  const [logMark, setLogMark] = useState<boolean>(false);
  const isDescRef = useRef<boolean>(false);
  const expiringInfoRef = useRef<any>(null);
  // 骨架屏何时展示
  const skeletonShow = useMemo(() => !!(listLoading && list.length === 0), [listLoading, list.length]);

  // 获取云附件列表
  const getList = async ({ init = false }) => {
    if (listLoading) return;
    if (!init && noMoreFile) return;
    const params = {
      pageSize: PageSize,
      page: init ? 1 : page + 1,
      isDescendingExpireOrder: isDescRef.current,
    };
    try {
      setListLoading(true);
      const res = await diskApi.getCloudAttList(params);
      const { cloudAttachments = [], totalCount } = res;
      setListLoading(false);
      if (init) {
        setList(cloudAttachments);
        setPage(1);
        setLogMark(true);
      } else if (cloudAttachments.length > 0) {
        setList([...list, ...cloudAttachments]);
        setPage(page + 1);
      }
      if (totalCount <= cloudAttachments.length) {
        setNoMoreFile(true);
      } else {
        setNoMoreFile(false);
      }
    } catch (e) {
      console.log(getIn18Text('HUOQUYUNFUJIAN'), e);
      setListLoading(false);
    }
  };

  // 切换时间排序
  const changeOrder = () => {
    isDescRef.current = !isDescRef.current;
    getList({ init: true });
  };

  useEffect(() => {
    if (logMark) {
      console.log('performanceApi', `disk_load_${curSideTab}_end`);
      performanceApi.timeEnd({
        statKey: `disk_${curSideTab}_load_time`,
      });
    }
  }, [logMark]);
  // 开始上传
  const startUploadFiles = (files: File[], dirId: number, diskType: NetStorageType) => {
    setVisibleUpload(true);
    // 上传后回调（无论成功/失败）
    const cb = (file: UploadFile) => {
      if (file.status === UploadFileStatus.DONE) {
        // 去重
        setUploadFileItems(fileItems => fileItems.filter(item => item !== file).concat(file));
        // 刷新列表
        getList({ init: true });
        // 刷新空间
        getRootInfo();
      } else if (file.status === UploadFileStatus.FAIL) {
        setUploadFileItems(fileItems => [file].concat(fileItems.filter(item => item !== file)));
      } else {
        setUploadFileItems(fileItems => fileItems.slice());
      }
    };
    const removeCb = (file: UploadFile) => {
      setUploadFileItems(fileItems => fileItems.filter(item => item !== file));
    };
    const fileItems: UploadFile[] = files.map(file => new UploadFile(file, dirId, diskType, cb, removeCb));
    setUploadFileItems(curFileItems => fileItems.concat(curFileItems));
    fileItems.forEach(item => item.startUpload());
  };

  // 校验上传文件
  const checkFiles = (files?: File[]) => {
    // 不同版本云附件大小限制
    const versionSpaceLimit = {
      free: 1,
      ultimate: 3,
      sirius: 5,
    };
    const limit = versionSpaceLimit[productVersionId as keyof typeof versionSpaceLimit] ?? 3; // 未识别版本按照旗舰版处理
    const versionalSingleSizeLimit = limit * 1024 * 1024 * 1024; // 单个文件大小限制，每个版本不同
    if (files?.length) {
      let filesTotalSize = 0;
      for (let i = 0; i < files.length; i++) {
        const curFile = files[i];
        // 版本大小限制
        if (curFile.size > versionalSingleSizeLimit) {
          return Alert.error({
            title: getIn18Text('YUNFUJIANDAODA'),
            content: overLimitLabel[productVersionId as keyof typeof overLimitLabel] ?? overLimitLabel['sirius'], // 其他版本看做旗舰版
          });
        }
        filesTotalSize += curFile.size;
      }
      const spaceInfo = curRootInfo.cloudAtt as any;
      // 空间不够
      if (spaceInfo.sizeLimit - spaceInfo.totalSize < filesTotalSize) {
        Alert.error({
          title: getIn18Text('YUNFUJIANDAODA'),
          content: totalOverLimitLabel[productVersionId as keyof typeof totalOverLimitLabel] ?? totalOverLimitLabel['sirius'], // 其他版本看做旗舰版
        });
      } else {
        if (!curDirId) {
          return;
        }
        startUploadFiles(files, curDirId, 'cloudAtt');
      }
    }
  };
  // 上传文件
  const toUploadFile = () => {
    uploadFileRef.current?.click();
  };
  const onFileClick = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    (e.target as any).value = '';
  };
  const onFileChange = () => {
    const fileUploader = uploadFileRef.current;
    if (!fileUploader) {
      return;
    }
    const { files } = fileUploader;
    if (files?.length) {
      checkFiles(Array.from(files));
    }
  };
  // 删除文件
  const afterDelFile = identity => {
    setList(list.filter(item => item.identity !== identity));
    getRootInfo();
  };
  // 删除云附件
  const delAction = async item => {
    try {
      const { identity } = item;
      const params = {
        identity,
      };
      const res = await diskApi.doDeleteCloudAtt(params);
      if (res.success) {
        // @ts-ignore
        message.success({
          content: getIn18Text('YISHANCHU'),
        });
        afterDelFile(identity);
      } else {
        message.error({ content: res.message || getIn18Text('SHANCHUSHIBAI') });
        console.log(getIn18Text('SHANCHUYUNFUJIAN'), res);
      }
    } catch (e) {
      console.log(getIn18Text('SHANCHUYUNFUJIAN'), e);
    }
  };
  // 下载
  const downloadAction = item => {
    if (DeleteFileAlert(item.expireTime)) return;
    const { identity, fileSize, downloadUrl } = item;
    if (!downloadUrl) return;
    if (!inElectron) {
      systemApi.webDownloadLink(downloadUrl);
    } else {
      const params = {
        id: identity,
        size: fileSize,
        extensionType: item.fileType,
        name: item.fileName,
      };
      electronDownload(params, downloadUrl);
    }
  };

  // 续期
  const renewalAction = async (item, index) => {
    const { identity, expireTime } = item;
    const now = new Date();
    try {
      const res = await diskApi.renewAttachments({ identities: [identity] });
      if (res === true) {
        message.success({
          icon: <IconCard type="saved" stroke="#4C6AFF" style={iconStyle} />,
          content: getIn18Text('XUQICHENGGONG'),
        });
        // 刷新数字
        expiringInfoRef.current.reFetchExpiringFileCount();
        // 提到最前面 （无需考虑永不过期，这个只有尊享版有）
        if (list?.length > 0) {
          const newList = [...list];
          newList.splice(index, 1);
          newList.unshift({ ...item, expireTime: expireTime == 0 ? 0 : now.getTime() + day15 });
          setList(newList);
        }
      } else {
        message.error({
          icon: <IconCard type="info" stroke="#FE5B4C" style={iconStyle} />,
          content: getIn18Text('XUQISHIBAIQINGCHONGSHI'),
        });
      }
    } catch (err) {
      console.log('续期失败', err);
      message.error({
        icon: <IconCard type="info" stroke="#FE5B4C" style={iconStyle} />,
        content: getIn18Text('XUQISHIBAIQINGCHONGSHI'),
      });
    }
  };

  // 云附件转存至个人空间
  const storePriSpaceAction = async item => {
    if (DeleteFileAlert(item.expireTime)) return;
    const { identity } = item;
    const params = { identity };
    try {
      await diskApi.saveCloudAttachment(params);
      message.success({
        icon: <IconCard type="saved" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: getIn18Text('YIZHUANCUN\uFF0CKE'),
        duration: 4,
      });
    } catch (e) {
      const { code } = e.data;
      console.log(getIn18Text('BAOCUNDAOGEREN'), e);
      message.error({
        icon: <IconCard type="info" stroke="white" style={{ width: 15, height: 15, marginRight: 8 }} />,
        content: codeContMap[code] || getIn18Text('WENJIANBUCUNZAIYIGUOQI'),
        duration: 4,
      });
    }
  };
  const onScrollCapture = e => {
    e.persist();
    // if (list.length < 50) return; // 一次加载50条，小于50标识 总数不足50，没有scroll加载的必要
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        getList({});
      }
    }
  };

  // 倒序查看云附件
  const checkExpiringAttsAction = () => {
    isDescRef.current = true;
    setList([]);
    getList({ init: true });
  };

  const tipShowJudge = useCallback(
    throttle(async () => {
      if (productVersionId != 'sirius') {
        const res = await dataStoreApi.get(DiskTipKeyEnum.RENEW_CLOUD_ATT_SUPPORTED_KNOWED_TIP);
        const { suc, data } = res;
        // 未存过 或 未存为true
        if (!suc || data !== 'true') {
          setRenewSupportShow(true);
          return;
        }
      }
      setRenewSupportShow(false);
    }, 700),
    [productVersionId]
  );

  useEffect(() => {
    tipShowJudge();
  }, [productVersionId]);

  useEffect(() => {
    getList({ init: true });
  }, []);

  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name, cb } = eventData;
    // 刷新
    if (name === 'refresh') {
      try {
        setList([]);
        await getList({ init: true });
        // 刷新数字
        expiringInfoRef.current.reFetchExpiringFileCount();
        cb();
      } catch (_) {
        cb();
      }
    }
  });
  // 顶栏
  const Head = (
    <div className={styles.head}>
      <div className={styles.tabTitle}>{getIn18Text('YOUJIANYUNFUJIAN11')}</div>
      <p className={styles.intro}>{getIn18Text('JINZHANSHIZAILING')}</p>
      <Button
        size="small"
        icon={
          <span className="anticon dark-svg-invert">
            <IconCard className="anticon" type="doUpload" />
          </span>
        }
        className={classnames(styles.uploadButt, { disabled: !upable })}
        onClick={toUploadFile}
      >
        {getIn18Text('SHANGCHUAN')}
      </Button>
      <input type="file" hidden multiple ref={uploadFileRef} onChange={onFileChange} onClick={onFileClick} />
    </div>
  );

  const columns = [
    {
      title: getIn18Text('WENJIAN'),
      dataIndex: 'fileName',
      ellipsis: true,
      render: (fileName: string, item: any) => {
        const openFileOrDir = () => {
          trackApi.track('pcMail_view_mailAttachmentsSpace', { spaceTab: getIn18Text('YOUJIANYUNFUJIAN') });
          // 已过期文件提示
          if (DeleteFileAlert(item.expireTime)) return;
          diskApi
            .previewCloudAtt({ identity: item.identity })
            .then(data => {
              if (data) {
                const shareUrl = normalizeShareUrl(data);
                if (systemApi.isElectron()) {
                  const ts = Date.now();
                  const downloadUrl = item.downloadUrl;
                  systemApi.createWindowWithInitData('resources', {
                    eventName: 'initPage',
                    eventData: {
                      hash: `${location.href}/resources/#identity=${item.identity}&type=attachment`,
                      type: 'attachment',
                      downloadContentId: ts,
                      downloadId: 0,
                      fileName,
                      attachments: [
                        {
                          from: tag,
                          filePreviewUrl: shareUrl,
                          fileUrl: downloadUrl,
                          id: item.identity,
                          name: fileName,
                          fileName,
                          fileSize: item.fileSize,
                          fileSourceType: 3,
                          type: 'url',
                          cloudAttachment: true,
                          fileSourceKey: item.identity,
                          downloadContentId: ts,
                          downloadId: 0,
                        },
                      ],
                    },
                  });
                } else {
                  systemApi.openNewWindow(shareUrl);
                }
              }
            })
            .catch(error => {
              message.error({ content: error?.data?.message || getIn18Text('HUOQUYULANDE') });
            });
        };
        return <RowName type={getFileIcon(item)} name={fileName} openFileOrDir={openFileOrDir} />;
      },
    },
    {
      title: getIn18Text('DAXIAO'),
      dataIndex: 'fileSize',
      ellipsis: true,
      width: 160,
      render: fileSize => formatFileSize(fileSize, 1024),
    },
    {
      title: <ExpireTimeTitle showSort={true} isDesc={!!isDescRef.current} changeOrder={changeOrder} />,
      dataIndex: 'expireTime',
      ellipsis: true,
      width: 160,
      render: expireTime => <FormatExpiredDate date={expireTime} />,
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 88,
      dataIndex: 'downloadUrl',
      render: (downloadUrl, item, index) => (
        <CloudAttOprs
          renewSupportShow={renewSupportShow}
          setRenewSupportShow={setRenewSupportShow}
          item={item}
          delAction={delAction}
          downloadAction={downloadAction}
          storePriSpaceAction={storePriSpaceAction}
          renewalAction={renewalAction}
          setRowHoverId={setRowHoverId}
          index={index}
        />
      ),
    },
  ];

  return (
    <div className={styles.cloudAttCont}>
      {Head}
      <ExpiringInfo ref={expiringInfoRef} checkExpiringAttsAction={checkExpiringAttsAction} />
      {/* 此处的spinning用于初始化 */}
      <div className={styles.contentBody} id="contentBody" onScrollCapture={onScrollCapture}>
        {/* 骨架屏 */}
        {skeletonShow && <TableSkeleton />}
        {list.length > 0 && (
          <SiriusTable
            id="cloudAttTable"
            className={'tableTy1 ' + styles.cloudAttTable}
            dataSource={list}
            components={{
              body: {
                cell: FilenameCell,
              },
            }}
            columns={columns}
            pagination={false}
            scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
            rowClassName={item => (rowHoverId === item.identity ? styles.hoverRow : '')}
            rowKey={item => item.identity}
            headerBgColor={false}
          />
        )}
        {!listLoading && list.length === 0 && <Empty />}
      </div>
    </div>
  );
});

export default CloudAttCont;
