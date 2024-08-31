import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button, Tooltip, Dropdown, Menu } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import {
  apiHolder as api,
  apis,
  CloudAtt,
  NetStorageApi,
  SystemApi,
  MailApi,
  MailAttachment,
  DataTrackerApi,
  locationHelper,
  WriteMailInitModelParams,
  MailFileAttachModel,
  MailConfApi,
  ProductAuthApi,
  FileApi,
  listAttachmentsParam,
  DownloadReminderInfo,
  StringMap,
  getIn18Text,
} from 'api';
import FilenameCell from './../DiskTable/FilenameCell';
import IconCard from '@web-common/components/UI/IconCard';
import NormalAttOprs from './normalAttOprs';
import { formatFileSize } from '@web-common/utils/file';
import RowName from './../RowName/rowName';
import { getFileIcon, normalizeShareUrl } from './../../utils';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { formatTimeWithHM } from '@web-mail/util';
import Empty from './../Empty/empty';
import classnames from 'classnames';
import TableSkeleton from './../TableSkeleton/tableSkeleton';
import Fetching from '@web-disk/components/Fetching/fetching';
import { TongyongZhankaiShang, TongyongZhankaiXia } from '@sirius/icons';
import styles from './normalAtt.module.scss';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';

const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const fileApi = api.api.getFileApi() as FileApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const { SubMenu } = Menu;
const MenuItem = Menu.Item;
interface Props {
  electronDownload: (content: any, fileUrl: string) => void;
}
// 转存失败 code与提示内容映射表
const codeContMap = {
  10304: getIn18Text('ZHUANCUNSHIBAI\uFF0C11'),
  10206: getIn18Text('ZHUANCUNSHIBAI\uFF0C'),
};
const PageSize = 30;
const tag = 'cloudAttCont'; // 临时
const MaxReqNum = 5; // 最多请求5次
let getListSt: number | null = null; // 请求邮件列表定时器

const attTypes = [
  { label: getIn18Text('QUANBU'), value: 'all' },
  { label: getIn18Text('YASUOBAO'), value: 'rars' },
  {
    label: getIn18Text('WENDANG'),
    value: 'docs',
    children: [
      { label: getIn18Text('QUANBU'), value: 'docs' },
      { label: getIn18Text('WENBEN'), value: 'txt' },
      { label: getIn18Text('BIAOGE'), value: 'xls' },
      { label: getIn18Text('HUANDENGPIAN'), value: 'ppt' },
      { label: 'PDF', value: 'pdf' },
    ],
  },
  { label: getIn18Text('TUPIAN'), value: 'pics' },
  { label: getIn18Text('DUOMEITI'), value: 'videos' },
];

const attTypeMap: StringMap = {
  rars: getIn18Text('YASUOBAO'),
  docs: getIn18Text('WENDANG'),
  txt: getIn18Text('WENBEN'),
  xls: getIn18Text('BIAOGE'),
  ppt: getIn18Text('HUANDENGPIAN'),
  pdf: 'PDF',
  pics: getIn18Text('TUPIAN'),
  videos: getIn18Text('DUOMEITI'),
};

const NormalAtt = React.forwardRef((props: Props, _) => {
  const { electronDownload } = props;
  const [list, setList] = useState<MailAttachment[]>([]);
  const [page, setPage] = useState<number>(1);
  const [noMoreFile, setNoMoreFile] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(false);
  // 有没有准备好 默认为true
  const [ready, setReady] = useState<boolean>(true);
  const [rowHoverId, setRowHoverId] = useState<string>();
  const [isDesc, setIsDesc] = useState<boolean>(true); // 是否为降序
  const [attType, setAttType] = useState<string>('all');
  const [reqNum, setReqNum] = useState<number>(0);
  const [menuVis, setMenuVis] = useState<boolean>(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<MailAttachment[]>([]);
  const [batchDownloading, setBatchDownloading] = useState<boolean>(false);
  const paidGuideModal = useNiceModal('paidGuide');

  const filterText = useMemo(() => {
    if (!attType) return getIn18Text('SHAIXUAN');
    return attTypeMap[attType] || getIn18Text('SHAIXUAN');
  }, [attType]);

  // 添加ref防止闭包
  const reqNumRef = useRef<number>(reqNum);
  reqNumRef.current = reqNum;
  // 获取往来附件列表
  const getList = async ({ init = false, loop = false, curAttType = null }) => {
    if (listLoading && !loop) return;
    if (!init && noMoreFile) return;
    try {
      setListLoading(true);
      const params: listAttachmentsParam = {
        order: 'date',
        desc: isDesc,
        start: init ? 0 : page * 30,
        limit: PageSize,
        returnTotal: true,
        skipLockedFolders: true,
      };
      if (curAttType) {
        curAttType !== 'all' && (params.filter = { attType: curAttType });
      } else if (attType) {
        attType !== 'all' && (params.filter = { attType });
      }
      const res = await mailApi.listAttachments(params);
      const { success, list: newList, notReady } = res;
      // 未成功
      if (!success) {
        message.error({ content: res?.error?.title || getIn18Text('QINGQIUSHIBAI') });
        setListLoading(false);
        setReady(true);
        return;
      }
      // 成功 第1页 未准备好
      if (success && init && notReady) {
        // 超过最大请求次数
        if (reqNumRef.current > MaxReqNum) {
          getListSt && clearTimeout(getListSt);
          message.error({ content: getIn18Text('QINGQIUSHIBAI') });
          setListLoading(false);
          setReady(false);
          return;
        }
        setReady(false);
        // 开始循环获取
        getListSt = setTimeout(() => {
          setReqNum(reqNumRef.current + 1);
          getList({ init, loop: true });
        }, 2000);
        return;
      }
      // 成功
      setListLoading(false);
      setReady(true);
      const newAttList = (newList || []).map(item => {
        return {
          ...item,
          attId: item.id + item.partId,
        };
      });
      if (init) {
        setList(newAttList);
        setPage(1);
        return;
      }
      if (newAttList.length > 0) {
        setList([...list, ...newAttList]);
        setPage(page + 1);
      }
      if (newAttList.length < PageSize) {
        setNoMoreFile(true);
      } else {
        setNoMoreFile(false);
      }
    } catch (e) {
      setListLoading(false);
      setReady(true);
    }
  };
  // 切换时间排序
  const changeOrder = () => {
    setIsDesc(!isDesc);
  };
  // 获取下载链接
  const getDownloadUrl = (item: MailAttachment) => {
    const { attn, attsize, partId, id } = item;
    const downloadUrl: string = mailApi.mailContentHandler.buildAttachmentDownloadUrl(
      {
        filename: attn,
        id: partId,
      },
      id
    );
    return downloadUrl;
  };
  // 查看邮件
  const checkMail = (mail: MailAttachment) => {
    const { id } = mail;
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData(
        { type: 'readMail', additionalParams: { account: '' } },
        { eventName: 'initPage', eventData: id, eventStrData: '', _account: '' }
      );
    } else {
      window.open(`${systemApi.getContextPath()}/readMail/?id=${id}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
    }
  };

  // 单个下载
  const singleDownload = (item: MailAttachment) => {
    const { attn, attsize, attId } = item;
    const downloadUrl = getDownloadUrl(item);
    console.log('downloadUrl', item, downloadUrl);
    if (!downloadUrl) return;
    if (!inElectron) {
      systemApi.webDownloadLink(downloadUrl);
    } else {
      const params = {
        id: attId,
        size: attsize,
        extensionType: item.fileType,
        name: attn,
      };
      electronDownload(params, downloadUrl);
    }
  };

  // 转存至个人空间
  const storePriSpaceAction = async (item: MailAttachment) => {
    const { attn, attsize, id, partId } = item;
    const params = {
      fileName: attn,
      fileSize: attsize,
      mid: id,
      part: partId,
    };
    try {
      await diskApi.saveMailAttachment(params);
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
        content: codeContMap[code] || getIn18Text('CAOZUOSHIBAI\uFF0C11'),
        duration: 4,
      });
    }
  };

  const onScrollCapture = e => {
    e.persist();
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        getList({});
      }
    }
  };
  // 骨架屏何时展示
  // 加载中 且 后端已准备好 且 无内容
  const skeletonShow = useMemo(() => !!(listLoading && ready && list.length === 0), [listLoading, list.length, ready]);
  // 加载中 且 后端未准备好 且 无内容
  const fetchingShow = useMemo(() => !!(listLoading && !ready && list.length === 0), [listLoading, list.length, ready]);
  useEffect(() => {
    setList([]);
    setPage(1);
    setSelectedRows([]);
    setSelectedRowKeys([]);
    getList({ init: true });
  }, [isDesc]);
  useEffect(() => {
    return () => {
      // 离开当前组件，清除定时器！
      getListSt && clearTimeout(getListSt);
    };
  }, []);
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name, cb } = eventData;
    // 刷新
    if (name === 'refresh') {
      try {
        // 重置请求次数
        setReqNum(0);
        setList([]);
        setTimeout(async () => await getList({ init: true }));
        cb();
      } catch (_) {
        cb();
      }
    }
  });

  // 顶栏
  const Head = (
    <div className={styles.head}>
      <div className={styles.tabTitle}>{getIn18Text('WANGLAIFUJIANGUAN')}</div>
      <p className={styles.intro}>{getIn18Text('SUOYOUFACHU/')}</p>
    </div>
  );

  // 唤起下载完成弹窗
  const revolveDownloadReminder = (reminders: DownloadReminderInfo[]) => {
    const manageReminders = reminders.map(item => {
      if (item.filePath) {
        const realFileName = window.electronLib.fsManage.getBaseName(item.filePath);
        if (realFileName) {
          return { ...item, realFileName };
        }
      }
      return item;
    });
    systemApi.createWindowWithInitData('downloadReminder', {
      eventName: 'customNotification',
      eventData: {
        eventType: 'downloadReminder',
        reminders: manageReminders,
      },
    });
  };

  // 下载
  const batchDownload = async () => {
    // 过滤掉过期的附件
    const attachments = selectedRows;
    if (!attachments?.length) return;
    // 生成包名
    const zipFileName = `往来附件${moment().format('YYYY-MM-DD')}`;
    console.log('下载zipFileName', attachments, zipFileName);
    if (inElectron) {
      try {
        const atts = attachments.map(item => {
          return {
            ...item,
            fileName: item.attn,
            fileUrl: getDownloadUrl(item),
            fileSize: item.attsize,
          };
        });
        setBatchDownloading(true);
        const zipRes = await fileApi.saveZip(atts, zipFileName, '', { removeOrginalFile: true });
        setBatchDownloading(false);
        console.log('batchDownload 打包下载', zipRes, atts, attachments);
        const { success, path } = zipRes;
        if (success && path) {
          try {
            const zipData = await window.electronLib.fsManage.stat(path);
            if (zipData) {
              revolveDownloadReminder([
                {
                  fileName: `${zipFileName}.zip`,
                  fileSize: zipData.size,
                  fileType: 'zip',
                  filePath: path,
                },
              ]);
            }
          } catch (err) {
            console.log('打包下载完成提醒失败', err);
          }
        }
      } catch (e) {
        console.error(e);
        SiriusMessage.warn({ content: getIn18Text('DABAOXIAZAISHI') });
      } finally {
      }
    } else {
      const url = mailConfApi.getFjFileUrl({
        partIds: attachments.map(item => `${item.id}/${item.partId}`),
        pack: true,
        filename: zipFileName,
      });
      console.log('下载url', url);
      if (url) {
        window.open(url);
      }
    }
  };

  // 点击下载
  const ckDownload = () => {
    if (!selectedRows?.length) return;
    if (selectedRows.length === 1) {
      singleDownload(selectedRows[0]);
    } else {
      batchDownload();
    }
  };

  // 转发
  const forwardItems = async () => {
    const payloadArr: any[] = [];
    let totalSize = 0;
    selectedRows.forEach(item => {
      const { attn, attsize, id, partId } = item;
      const downloadUrl = getDownloadUrl(item);
      const payloadObj: MailFileAttachModel = {
        expired: 0,
        fileName: attn,
        fileSize: attsize,
        type: 'fromInternalMail',
        midOfSourceMail: id,
        partOfSourceMail: partId,
        fileUrl: downloadUrl,
        isCloud: false,
      };
      payloadArr.push(payloadObj);
      totalSize += attsize;
    });

    const mailLimit = mailConfApi.getMailLimit();
    // 附件总大小超限
    if (totalSize > mailLimit.upload_total_size) {
      const curVersionId = await productAuthApi.asyncGetProductVersionId();
      // 免费版 提示升级
      if (curVersionId === 'free') {
        paidGuideModal.show({ errType: '41', origin: '往来附件转发' });
      } else {
        const totalSizeMb = Math.floor(mailLimit.upload_total_size / 1024 / 1024) + 'M';
        const errorText = `您选择的附件大小超过${totalSizeMb}的大小限制，无法转发`;
        message.error(errorText);
      }
      return;
    }

    const params: WriteMailInitModelParams = {
      mailType: 'common',
      writeType: 'common',
      extraOperate: `addNormalAtt payload:${JSON.stringify(payloadArr)}`,
    };
    mailApi.callWriteLetterFunc(params);
  };

  const onFilterSelect = (val: any) => {
    const { key } = val;
    setAttType(key);
    setSelectedRows([]);
    setSelectedRowKeys([]);
    getList({ init: true, curAttType: key });
  };

  const menuVisChange = (vis: boolean) => {
    setMenuVis(vis);
  };

  const filterMenu = (
    <Menu className={styles.attTypeMenu} onClick={onFilterSelect}>
      {attTypes.map(item => {
        return (
          <>
            {item.children ? (
              <SubMenu popupClassName={styles.attTypeSubMenu} title={item.label}>
                <>
                  {(item.children || []).map(item1 => (
                    <MenuItem key={item1.value} className={classnames(styles.attTypeSubMenuItem, attType === item1.value ? styles.itemActive : '')}>
                      {item1.label}
                    </MenuItem>
                  ))}
                </>
              </SubMenu>
            ) : (
              <MenuItem key={item.value} className={classnames(styles.attTypeMenuItem, attType === item.value ? styles.itemActive : '')}>
                {item.label}
              </MenuItem>
            )}
          </>
        );
      })}
    </Menu>
  );

  // 操作区
  const optArea = (
    <div className={styles.optArea}>
      <Button className={styles.download} onClick={ckDownload} disabled={!selectedRowKeys?.length || !!batchDownloading} loading={batchDownloading}>
        {getIn18Text('XIAZAI')}
      </Button>
      <Button className={styles.forward} onClick={forwardItems} disabled={!selectedRowKeys?.length}>
        {getIn18Text('ZHUANFA')}
      </Button>
      <Dropdown trigger={['click']} overlay={filterMenu} onVisibleChange={menuVisChange}>
        <Button className={styles.filter}>
          {filterText}
          {menuVis ? <TongyongZhankaiShang /> : <TongyongZhankaiXia />}
        </Button>
      </Dropdown>
    </div>
  );

  // 时间表头
  const TimeTitle = () => {
    return (
      <div className={styles.timeTitle}>
        {getIn18Text('SHIJIAN')}
        <span className={`dark-svg-invert ${styles.orderIcon}`} onClick={changeOrder}>
          <IconCard type={isDesc ? 'descend' : 'ascend'} />
        </span>
      </div>
    );
  };

  // 来源
  const AttSource = (props: { item: MailAttachment }) => {
    const { item } = props;
    const { subject } = item;
    return (
      <>
        {subject ? (
          <Tooltip title={subject} placement="bottom">
            <span className={styles.sourceName} onClick={() => checkMail(item)}>
              {subject}
            </span>
          </Tooltip>
        ) : (
          <span className={styles.sourceName} onClick={() => checkMail(item)}>
            {getIn18Text('WUZHUTI')}
          </span>
        )}
      </>
    );
  };

  // 行选择
  const rowSelection = {
    type: 'checkbox',
    fixed: true,
    selectedRowKeys: selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: MailAttachment[]) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    getCheckboxProps: (record: MailAttachment) => ({
      disabled: false,
      name: record.attn,
    }),
  };

  const columns = [
    {
      title: getIn18Text('WENJIAN'),
      dataIndex: 'attn',
      ellipsis: true,
      render: (_, item: MailAttachment) => {
        const { id, attn, partId, attsize } = item;
        const uniqId = id + partId; // 拼接 当做唯一id
        const fileType = attn.split('.').pop(); // 文件类型
        // 查看往来附件
        const checkAtt = () => {
          trackApi.track('pcMail_view_mailAttachmentsSpace', { spaceTab: getIn18Text('YOUJIANWANGLAIFU') });
          // web加host
          const webHost = !inElectron ? locationHelper.getHost() : '';
          const previewUrl =
            webHost +
            mailApi.mailContentHandler.buildAttachmentPreviewUrl(
              {
                // todo wanglijun 这个地方要加个_account
                _account: '',
                filename: attn,
                id: partId,
              },
              id,
              fileType || ''
            );
          if (previewUrl) {
            const shareUrl = normalizeShareUrl(previewUrl);
            if (systemApi.isElectron()) {
              const ts = Date.now();
              systemApi.createWindowWithInitData('resources', {
                eventName: 'initPage',
                eventData: {
                  hash: `${location.href}/resources/#identity=${uniqId}&type=attachment`,
                  type: 'attachment',
                  downloadContentId: ts,
                  downloadId: 0,
                  fileName: attn,
                  attachments: [
                    {
                      from: tag,
                      filePreviewUrl: shareUrl,
                      fileUrl: shareUrl,
                      id: uniqId,
                      name: attn,
                      fileName: attn,
                      fileSize: attsize,
                      fileSourceType: 3,
                      type: 'url',
                      cloudAttachment: true,
                      fileSourceKey: uniqId,
                      downloadContentId: ts,
                      downloadId: 0,
                    },
                  ],
                },
              });
            } else {
              diskApi.getFilePreviewUrl(shareUrl).then(data => {
                if (data) {
                  systemApi.openNewWindow(data);
                }
              });
            }
          }
        };
        return <RowName type={getFileIcon({ name: attn })} name={attn} openFileOrDir={checkAtt} />;
      },
    },
    {
      title: getIn18Text('DAXIAO'),
      dataIndex: 'attsize',
      ellipsis: true,
      width: 160,
      render: (attsize: number) => formatFileSize(attsize, 1024),
    },
    {
      title: <TimeTitle />,
      dataIndex: 'sentDate',
      width: 160,
      ellipsis: true,
      render: (sentDate: string) => {
        // return simpleFormatTime(sentDate,false, true);
        return formatTimeWithHM(sentDate);
      },
    },
    {
      title: getIn18Text('LAIYUAN'),
      dataIndex: 'from',
      ellipsis: true,
      width: 228,
      render: (_: unknown, item: MailAttachment) => <AttSource item={item} />,
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 88,
      dataIndex: 'downloadUrl',
      render: (_: unknown, item: CloudAtt) => (
        <NormalAttOprs
          item={item}
          downloadAction={singleDownload}
          getDownloadUrl={getDownloadUrl}
          storePriSpaceAction={storePriSpaceAction}
          setRowHoverId={setRowHoverId}
        />
      ),
    },
  ];
  return (
    <div className={styles.normalAtt}>
      {Head}
      {optArea}
      {/* 此处的spinning用于初始化 */}
      <div className={styles.contentBody} id="contentBody" onScrollCapture={onScrollCapture}>
        {/* 骨架屏 */}
        {skeletonShow && <TableSkeleton />}
        {/* 获取数据中 */}
        {fetchingShow && <Fetching />}
        {list.length > 0 && (
          <SiriusTable
            id="normalAttTable"
            className={'tableTy1 ' + styles.normalAttTable}
            dataSource={list}
            components={{ body: { cell: FilenameCell } }}
            columns={columns}
            pagination={false}
            scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
            rowClassName={item => (rowHoverId === item?.attId ? styles.hoverRow : '')}
            rowKey={item => item?.attId as string}
            headerBgColor={false}
            rowSelection={rowSelection}
          />
        )}

        {/* 无内容 */}
        {!listLoading && list.length === 0 && <Empty />}
      </div>
    </div>
  );
});
export default NormalAtt;
