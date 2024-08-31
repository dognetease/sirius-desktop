import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Table, Menu, ConfigProvider, Button, Dropdown } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apis, apiHolder as api, SystemApi, NetStorageShareApi, ExternalShareDetail, ExternalShareModifyStatus, ExternalShareInteractType } from 'api';
import copy from 'copy-to-clipboard';
import debounce from 'lodash/debounce';
import { Props, TableOperateProps, TableSummaryProps } from './data';
import style from './index.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import PopItem from '../PopItem/popItem';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getFileIcon, getShareLink, normalizeShareUrl, sendShareLinkMail, simpleFormatTime } from './../../utils';
import ExternalShareDevice from '../ExternalShareDevice';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import TableSkeleton from '../TableSkeleton/tableSkeleton';
import styles from './../SharePage/sharePage.module.scss';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { useAppSelector, DiskActions, useAppDispatch } from '@web-common/state/createStore';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { getIn18Text } from 'api';
const nsShareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const fromSideTabMap = {
  QIYE: 'public',
  PERSONAL: 'private',
};
const TableOperate: React.FC<TableOperateProps> = props => {
  const { item, handleExternalShareLink, setRowHover } = props;
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const { shareIdentity } = item;
  const closeMenu = () => {
    setMenuVisible(false);
  };
  useEffect(() => {
    setRowHover(menuVisible ? shareIdentity : '');
  }, [menuVisible]);
  return (
    <div className={style.operate}>
      <Dropdown
        overlay={() => (
          <Menu className={`${style.popContent}`}>
            <PopItem
              name={getIn18Text('FUZHILIANJIE')}
              iconType="externalLink"
              hidden={false}
              onClick={() => {
                const link = getShareLink(item);
                const result = copy(link);
                message.success({
                  icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                  content: <span className={styles.msgContentText}>{result ? getIn18Text('FUZHILIANJIECHENG') : getIn18Text('\u201CFUZHILIANJIE')}</span>,
                });
                closeMenu();
              }}
            />
            <PopItem
              name={getIn18Text('FASONGLIANJIE')}
              iconType="sendMail"
              style={{ marginTop: 8 }}
              onClick={() => {
                sendShareLinkMail(item);
                closeMenu();
              }}
            />
            <PopItem
              name={getIn18Text('SHANCHULIANJIE')}
              iconType="recycleBin"
              style={{ marginTop: 8 }}
              onClick={() => {
                Modal.confirm({
                  title: getIn18Text('QUEDINGSHANCHUGAI13'),
                  content: <span className={style.confirmDeleteTxt}>{getIn18Text('SHANCHUHOULIANJIE')}</span>,
                  okText: getIn18Text('QUEDING'),
                  cancelText: getIn18Text('QUXIAO'),
                  onOk: () => {
                    handleExternalShareLink('DELETE', shareIdentity);
                  },
                  width: 400,
                  centered: true,
                });
                closeMenu();
              }}
            />
          </Menu>
        )}
        placement="bottomRight"
        trigger={['click']}
        overlayClassName={style.popupWrap}
        visible={menuVisible}
        onVisibleChange={visible => setMenuVisible(visible)}
      >
        <div className={`opeItem dark-invert ${menuVisible ? 'active' : ''}`}>
          <IconCard type="more" stroke="#262A33" fillOpacity={0.5} />
        </div>
      </Dropdown>
    </div>
  );
};
const TableSummary: React.FC<TableSummaryProps> = ({ totalShareUrlCounts, totalVisitCounts, totalDownloadCounts, className }) => (
  <div className={classnames(style.tableSummary, className)}>
    <span>{getIn18Text('HEJI:')}</span>
    <div className={style.summaryIcon}>
      <IconCard type="externalAccount" />
    </div>
    <span>
      {getIn18Text('FENXIANGLIANJIECI')}
      {totalShareUrlCounts + ''}
    </span>
    <div className={style.summaryIcon}>
      <IconCard type="externalVisit" />
    </div>
    <span>
      {getIn18Text('YUEDUCISHU\uFF1A')}
      {totalVisitCounts + ''}
    </span>
    <div className={style.summaryIcon}>
      <IconCard type="externalDownload" />
    </div>
    <span>
      {getIn18Text('XIAZAICISHU\uFF1A')}
      {totalDownloadCounts + ''}
    </span>
  </div>
);
// url转为对象
const parseUrlToObj = (url: string) => {
  const obj = {};
  // 正常情况下应该是？但后端返回了#
  const paramsArr: string[] = url.substring(url.indexOf('#') + 1, url.length).split('&');
  if (!paramsArr || paramsArr?.length === 0) return {};
  paramsArr?.forEach(item => {
    const keyValue = item.split('=');
    const [key, value] = keyValue;
    obj[key] = value;
  });
  return obj;
};
const StatisticTable: React.FC<Props> = props => {
  const { visible, externalShareList, visitTime, listLoading, listLoadError, loadListData } = props;
  const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
  const [list, setList] = useState<ExternalShareDetail[]>([]);
  const [externalShareDeviceVisible, setExternalShareDeviceVisible] = useState<boolean>(false);
  const [externalShareDeviceShareId, setExternalShareDeviceShareId] = useState<string>('');
  const [externalShareInteractType, setExternalShareInteractType] = useState<ExternalShareInteractType>('VIEW');
  const [rowHoverId, setRowHoverId] = useState<string>('');
  const uploadHolderRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const changeStatus = (status, data, index) => {
    const curData = data;
    setList(_list => {
      const newList = _list;
      curData.status = status;
      newList[index] = curData;
      return list.slice();
    });
  };
  const toggleExternalShareDeviceVisible = (bool?: boolean) => {
    if (bool !== undefined) {
      setExternalShareDeviceVisible(bool);
    } else {
      setExternalShareDeviceVisible(!externalShareDeviceVisible);
    }
  };
  const handleExternalShareLink = async (status: ExternalShareModifyStatus, shareIdentity: string) => {
    const res = await nsShareApi.modifyNSExternalShareLinkStatus({
      status,
      shareIdentity,
    });
    const isDel = status === 'DELETE';
    // if(isDel){
    //   setList(list => list.filter(item => item.shareIdentity !== shareIdentity));
    // }
    let content: string;
    if (res) {
      content = isDel ? getIn18Text('SHANCHUCHENGGONG1') : getIn18Text('ZHUANGTAIQIEHUANCHENG');
    } else {
      content = isDel ? getIn18Text('SHANCHUSHIBAI1') : getIn18Text('ZHUANGTAIQIEHUANSHI');
    }
    Toast.info({ content });
    loadListData && (await loadListData());
  };
  const debounceHandleExternalShareLink = useCallback(
    debounce((status: ExternalShareModifyStatus, shareIdentity: string) => {
      handleExternalShareLink(status, shareIdentity);
    }, 300),
    []
  );
  const handleJumpUrl = url => {
    if (systemApi.isElectron()) {
      systemApi.handleJumpUrl(-1, url);
    } else {
      systemApi.openNewWindow(url);
    }
  };
  let columns = [
    {
      title: getIn18Text('ZILIAOMING'),
      dataIndex: 'resourceName',
      ellipsis: true,
      width: 200,
      render: (resourceName, lineData) => {
        let name = resourceName;
        const item = lineData;
        const isDel = item.resourceDeleted;
        if (isDel) {
          name = getIn18Text('ZILIAOYISHANCHU');
        }
        const frontName = name.slice(0, -8);
        const endFront = name.slice(-8);
        item.name = name;
        const isDir = item.resourceType === 'DIRECTORY';
        const { resourceId } = item;
        const { resourceType } = item;
        const openFileOrDir = () => {
          if (isDel) {
            return;
          }
          nsShareApi.getNSShareLink({ resourceId, resourceType }).then(data => {
            if (data.shareUrl) {
              if (isDir) {
                try {
                  const params: {
                    from: string;
                    id: number;
                  } = parseUrlToObj(data.shareUrl);
                  const { from, id } = params;
                  if (!from || !id) return;
                  const fromSideTab = fromSideTabMap[from];
                  // 非来自个人/企业空间
                  if (!fromSideTab) return;
                  dispatch(DiskActions.setCurSideTab(fromSideTab));
                  dispatch(DiskActions.setCurDirId(id));
                } catch (error) {
                  console.log(getIn18Text('TIAOZHUANSHIBAI'), error);
                  handleJumpUrl(normalizeShareUrl(data.shareUrl));
                }
              } else {
                handleJumpUrl(normalizeShareUrl(data.shareUrl));
              }
            }
          });
        };
        return (
          <div className={style.nameColumn} onClick={openFileOrDir} title={name}>
            <div hidden={!isDir || isDel} className={style.nameIcon}>
              <IconCard type="dir" />
            </div>
            <div hidden={isDir && !isDel} className={style.nameIcon}>
              <IconCard type={isDel ? 'other' : (getFileIcon(item) as any)} width="24px" height="24px" />
            </div>
            <div className={classnames(style.nameText, isDel && style.nameDelete)}>
              <span className={style.frontName}>{frontName}</span>
              <span>{endFront}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: getIn18Text('ZILIAOJIESHOUREN'),
      dataIndex: 'receiver',
      ellipsis: {
        showTitle: false,
      },
      render: receiver => receiver || getIn18Text('WU'),
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      dataIndex: 'shareTime',
      ellipsis: {
        showTitle: false,
      },
      render: time => simpleFormatTime(time),
    },
    {
      title: getIn18Text('FANGWENCISHU'),
      dataIndex: 'visitCounts',
      width: 100,
      render: (count, item) => (
        <div
          className={`${count ? style.counts : style.readColor}`}
          onClick={() => {
            if (count) {
              toggleExternalShareDeviceVisible(true);
              setExternalShareInteractType('VIEW');
              setExternalShareDeviceShareId(item.shareIdentity);
            }
          }}
        >
          {count}
        </div>
      ),
    },
    {
      title: getIn18Text('XIAZAICISHU'),
      dataIndex: 'downloadCounts',
      width: 100,
      render: (count, item) => (
        <div
          className={`${count ? style.counts : style.readColor}`}
          onClick={() => {
            if (count) {
              toggleExternalShareDeviceVisible(true);
              setExternalShareInteractType('DOWNLOAD');
              setExternalShareDeviceShareId(item.shareIdentity);
            }
          }}
        >
          {count}
        </div>
      ),
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      dataIndex: 'status',
      width: 100,
      ellipsis: {
        showTitle: false,
      },
      render: (status, curData, index) =>
        status === 'EXPIRE' ? (
          <div className={style.linkExpire}>{getIn18Text('YIGUOQISHIXIAO')}</div>
        ) : (
          <div className={style.linkStatus}>
            <div
              onClick={() => {
                changeStatus('VALID', curData, index);
                debounceHandleExternalShareLink('VALID', curData.shareIdentity);
                // .then(res => {
                //
                // })
              }}
              className={classnames(style.statusBtn, {
                [style.checked]: status === 'VALID',
              })}
            >
              {getIn18Text('YOUXIAO')}
            </div>
            <div
              onClick={() => {
                changeStatus('DISABLE', curData, index);
                debounceHandleExternalShareLink('DISABLE', curData.shareIdentity);
                // .then(res => {
                //
                // })
              }}
              className={classnames(style.statusBtn, {
                [style.disabled]: status === 'DISABLE',
              })}
            >
              {getIn18Text('JINYONG')}
            </div>
          </div>
        ),
    },
    {
      title: '',
      key: 'operate',
      width: 80,
      render: (o, item) => <TableOperate item={item} handleExternalShareLink={debounceHandleExternalShareLink} setRowHover={id => setRowHoverId(id)} />,
    },
  ];
  if (curContWidth && curContWidth < 920) {
    columns = columns.filter(item => item.dataIndex !== 'shareTime');
  }
  if (curContWidth && curContWidth < 800) {
    columns = columns.filter(item => item.dataIndex !== 'receiver');
  }
  const onScrollCapture = e => {
    e.persist();
    if (list.length < 50) {
      return;
    } // 一次加载50条，小于50标识 总数不足50，没有scroll加载的必要
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        loadListData && loadListData();
      }
    }
  };
  const tableRenderEmpty = () => (
    <div className={style.tableEmptyWrap}>
      <div className="sirius-empty sirius-empty-doc" />
      <div className={style.emptyText}>{listLoadError ? getIn18Text('JIAZAISHIBAI') : getIn18Text('ZANWUSHUJU')}</div>
      <Button hidden={!listLoadError} type="primary" onClick={loadListData}>
        {getIn18Text('ZHONGSHI')}
      </Button>
    </div>
  );
  const nodata = !list.length || listLoadError;
  useEffect(() => {
    if (visible) {
      const tableDiv = uploadHolderRef.current?.querySelector('.ant-table-body');
      if (tableDiv) {
        tableDiv.scrollTop = 0;
      }
    }
  }, [visible]);
  useEffect(() => {
    const shareDetails = externalShareList?.shareDetails;
    setList(shareDetails || []);
  }, [externalShareList]);
  return (
    <div className={style.container} hidden={!visible} onScrollCapture={onScrollCapture} ref={uploadHolderRef}>
      <div className={style.tableWrap}>
        {listLoading && list.length === 0 && <TableSkeleton />}
        {list.length > 0 && (
          <ConfigProvider renderEmpty={tableRenderEmpty}>
            <SiriusTable
              className={classnames(style.diskTable, nodata && style.noData)}
              dataSource={list}
              columns={columns}
              pagination={false}
              scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
              // loading={listLoading}
              rowClassName={item => `${rowHoverId === item.shareIdentity ? style.hoverRow : ''}`}
              rowKey={item => item.shareIdentity}
              headerBgColor={false}
            />
          </ConfigProvider>
        )}

        <TableSummary
          className={nodata && style.noData}
          totalDownloadCounts={externalShareList?.totalDownloadCounts || 0}
          totalVisitCounts={externalShareList?.totalVisitCounts || 0}
          totalShareUrlCounts={externalShareList?.totalShareUrlCounts || 0}
        />
      </div>
      <ExternalShareDevice
        visible={externalShareDeviceVisible}
        toggleVisible={toggleExternalShareDeviceVisible}
        visitTime={visitTime}
        shareIdentity={externalShareDeviceShareId}
        interactType={externalShareInteractType}
      />
    </div>
  );
};
export default StatisticTable;
