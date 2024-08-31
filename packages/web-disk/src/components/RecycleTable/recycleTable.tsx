import React, { useState, useEffect } from 'react';
import { Table, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { apis, apiHolder as api, NetStorageApi, NetStorageType, ResponseRecycleItem, CloudAtt, NSFileContent, NSFileDetail, PerformanceApi } from 'api';
// import Dialog from '../../../../UI/Dialog/dialog';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Popup from '../TableContextMenuPopup/popup';
import { RecoverModal } from '../RecoverModal/recoverModal';
import IconCard from '@web-common/components/UI/IconCard';
import { getFileIcon, simpleFormatTime, remainderDateFormat } from '../../utils';
import { formatTimeWithHM } from '@web-mail/util';
import { formatFileSize } from '@web-common/utils/file';
import style from './recycleTable.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import Empty from './../Empty/empty';
import TableSkeleton from './../TableSkeleton/tableSkeleton';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { getIn18Text } from 'api';
interface RecycleTableProps {
  type: NetStorageType; //
  contentWidth: number;
}
const tag = '[RecycleTable]';
const pageSize = 30;
const codeMessageMap: any = {
  10204: getIn18Text('YUANWENJIANJIAYI11'),
  10100: getIn18Text('YUANWENJIANJIAYI'),
};
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const RecycleTable: React.FC<RecycleTableProps> = props => {
  const { type, contentWidth } = props;
  const [tableType, setTableType] = useState(type);
  const [listLoading, setListLoading] = useState(false);
  const [mergedColumns, setColumns] = useState<any[]>([]);
  const [popup, setPopup] = useState({
    record: null,
    visible: false,
    x: 0,
    y: 0,
  });
  const [recoverRecordId, setRecoverRecordId] = useState(-1);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<ResponseRecycleItem[]>([]);
  const [logMark, setLogMark] = useState<boolean>(false);
  const getRecycleList = (init: boolean) => {
    let page = 1;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    diskApi
      .getRecycleList({ page, pageSize, type: tableType })
      .then(({ records: data, totalCount: _total }) => {
        // if (data && data.length) {
        // if (init) setContSpinning && setContSpinning(false);
        setTotal(_total);
        if (!init) {
          setList([...list, ...data]);
        } else {
          setLogMark(true);
          setList(data);
        }
        // }
        setListLoading(false);
      })
      .catch(e => {
        message.loading({
          content: e?.data?.message,
        });
        setListLoading(false);
      });
  };
  /**
   * 彻底删除
   * @param recordId
   */
  const deleteRecord = (recordId: number) => {
    diskApi
      .deleteRecyRecordCompletely({ type: tableType, recordIds: [recordId] })
      .then(({ data }) => {
        // setDeleteModal(false);
        if (data && data.code === 10202) {
          // @ts-ignore
          message.fail({
            content: getIn18Text('SHANCHUSHIBAI'),
          });
          // setCanDeleteVisible(true);
          return;
        }
        // @ts-ignore
        message.success({
          content: getIn18Text('YISHANCHU'),
        });
        setList(state => {
          const _list = [...state];
          return _list.filter(item => item.id !== recordId);
        });
      })
      .finally(() => {
        // setDeleteLoad(false);
      });
  };
  const recoverRecord = async (recordId: any) => {
    try {
      await diskApi.recoverRecords({ type: tableType, recordId });
      message.success(getIn18Text('HUIFUCHENGGONG'));
      setList(state => {
        const _list = [...state];
        return _list.filter(item => item.id !== recordId);
      });
    } catch (error) {
      console.warn(tag, 'recoverRecord failed', error);
      const { data = {} } = error as any;
      if (data?.success === false && tableType === 'ent') {
        // 特殊处理：code 10100为没有权限的情况,10204 原文件夹已失效
        if (data?.code == 10100 || data?.code == 10204) {
          // 恢复失败后 弹窗
          setRecoverRecordId(recordId);
          // 企业空间恢复失败，弹出 提示和恢复目录Modal
          Modal.confirm({
            title: codeMessageMap[data.code],
            okText: getIn18Text('JIXUHUIFU'),
            maskClosable: false,
            onOk: recoverByModal,
          });
          return;
        }
      }
      message.error(getIn18Text('HUIFUSHIBAI'));
    }
  };
  const recoverByModal = () => {
    setRecoverModalVisible(true);
  };
  const scrollFireLoading = () => {
    // 2.有下一页需要加载  3.不在加载过程中
    if (total > list.length && !listLoading) {
      getRecycleList(false);
    }
  };
  useEffect(() => {
    if (logMark) {
      console.log('performanceApi', `disk_load_recycle_end`);
      performanceApi.timeEnd({
        statKey: `disk_recycle_load_time`,
      });
    }
  }, [logMark]);
  const onScrollCapture = (e: {
    persist: () => void;
    currentTarget: {
      querySelector: (arg0: string) => any;
    };
  }) => {
    e.persist();
    if (list.length < 100) return; // 一次加载100条，小于100标识 总数不足100，没有scroll加载的必要
    if (e.currentTarget && e.currentTarget.querySelector) {
      const tableBody = e.currentTarget.querySelector('.ant-table-body');
      if (tableBody.scrollHeight - tableBody.scrollTop - tableBody.clientHeight < 300) {
        scrollFireLoading();
      }
    }
  };
  const setDeleteModal = (deleteKey: any, tipTitle: string) => {
    Modal.confirm({
      title: tipTitle,
      className: 'ant-allow-dark',
      maskClosable: false,
      okText: getIn18Text('SHANCHU'),
      content: getIn18Text('SHANCHUHOUJIANGBU'),
      okType: 'danger',
      onOk: () => {
        deleteRecord(deleteKey);
      },
    });
  };
  const onMenuClick = (record: any, value: any) => {
    console.log(tag, 'onMenuClick', record, value);
    switch (value) {
      case 'delete':
        // deleteRecord(record.id);
        // setModalVisible(true);
        setDeleteModal(record.id, getMsgTip(record));
        break;
      case 'recover':
        recoverRecord(record.id);
        break;
      default:
        break;
    }
  };
  console.log(tag, 'INIT');
  const getMsgTip = (item: any) => {
    let msg;
    if (item.resourceType === 'DIRECTORY') {
      msg = item.subResourceCount > 0 ? `要彻底删除该文件夹及包含的${item.subResourceCount}个子项吗?` : getIn18Text('YAOCHEDISHANCHU11');
    } else {
      msg = getIn18Text('YAOCHEDISHANCHU');
    }
    return msg;
  };
  // 添加网盘刷新
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name, cb } = eventData;
    if (name === 'refresh') {
      getRecycleList(true);
      cb();
    }
  });
  const onRow = (record: any) => ({
    onContextMenu: (event: { preventDefault: () => void; clientX: any; clientY: any }) => {
      event.preventDefault();
      if (!popup.visible) {
        document.addEventListener('click', function onClickOutside() {
          setPopup({ ...popup, record, visible: false });
          document.removeEventListener('click', onClickOutside);
        });
      }
      // clientX 取值不对， 应该减去左侧菜单宽度。。目前还不知道怎么取宽度，暂时写280
      setPopup({
        record,
        visible: true,
        x: event.clientX,
        y: event.clientY,
      });
    },
  });
  let columns = [
    {
      title: getIn18Text('WENJIAN'),
      dataIndex: 'resourceName',
      key: 'resourceName',
      ellipsis: true,
      render: (name: string, item: any) => {
        const frontName = name.slice(0, -8);
        const endFront = name.slice(-8);
        const isDir = item.resourceType === 'DIRECTORY';
        item.name = name;
        item.fileType = item.resourceSubType;
        return (
          <div className={style.nameColumn} title={name}>
            <div hidden={!isDir} className={style.nameIcon}>
              <IconCard type="dir" />
            </div>
            <div hidden={isDir} className={style.nameIcon}>
              <IconCard type={getFileIcon(item) as any} width="24px" height="24px" />
            </div>
            <div className={style.nameText}>
              <span className={style.frontName}>{frontName}</span>
              <span>{endFront}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: getIn18Text('DAXIAO'),
      dataIndex: 'resourceSize',
      key: 'resourceSize',
      width: 160,
      render: (
        size: number,
        item: {
          size: number;
        }
      ) => formatFileSize(typeof size === 'number' ? size : item.size, 1024),
    },
    {
      title: getIn18Text('CHUANGJIANREN'),
      dataIndex: 'createUsername',
      key: 'createUsername',
      width: 160,
    },
    {
      title: getIn18Text('SHANCHUSHIJIAN'),
      dataIndex: 'deleteTime',
      key: 'deleteTime',
      width: 160,
      render: (time: any) => {
        const date = time;
        if (!date) return '';
        // return simpleFormatTime(date);
        return formatTimeWithHM(date);
      },
    },
    {
      title: (
        <Tooltip placement="top" title={getIn18Text('YOUXIAOQIJIESHU')} overlayStyle={{ maxWidth: 'unset' }}>
          <div style={{ display: 'flex' }}>
            {getIn18Text('SHENGYUYOUXIAOQI')}
            <IconCard type="infoTips" style={{ alignSelf: 'center' }} />
          </div>
        </Tooltip>
      ),
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 160,
      render: (
        name: any,
        item: {
          expireTime: string;
        }
      ) => {
        const currentTime = Date.now();
        const expireTime = dayjs(item.expireTime);
        return <span style={{ color: expireTime.diff(currentTime, 'd') < 3 ? '#F74F4F' : '' }}>{remainderDateFormat(currentTime, item.expireTime)}</span>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'operation',
      key: 'operation',
      width: 88,
      render: (
        text: any,
        item: {
          id: any;
        },
        idx: any
      ) => (
        <div className={`${style.operationContent}`}>
          <Tooltip placement="top" title={getIn18Text('HUIFUGAIWENJIAN')}>
            <div
              className={style.item}
              data-test-id="recycle-operation-recover"
              onClick={() => {
                // trackerApi.track('pc_disk_click_share');
                // showShare(item, '1');
                recoverRecord(item.id);
              }}
            >
              <IconCard type="recover" />
            </div>
          </Tooltip>
          <Tooltip placement="top" title={getIn18Text('CHEDISHANCHU')}>
            <div
              className={style.item}
              data-test-id="recycle-operation-destroy"
              onClick={() => {
                // trackerApi.track('pc_disk_click_share');
                // setModalVisible(true);
                setDeleteModal(item.id, getMsgTip(item));
                // showShare(item, '1');
              }}
            >
              <IconCard type="recycleBin" stroke="#7D8085" />
            </div>
          </Tooltip>
        </div>
      ),
    },
  ];
  if (tableType === 'personal') {
    columns = columns.filter(item => item.dataIndex !== 'createUsername');
  }
  useEffect(() => {
    console.log(tag, tableType);
    mergeColumns(columns);
    getRecycleList(true);
  }, []);
  useEffect(() => {
    console.log(tag, contentWidth);
    mergeColumns(columns);
  }, [contentWidth]);
  const mergeColumns = (columns: any[]) => {
    if (contentWidth && contentWidth < 1020) {
      columns = columns.filter((item: { dataIndex: string }) => item.dataIndex !== 'size');
    }
    if (contentWidth && contentWidth < 920) {
      columns = columns.filter((item: { dataIndex: string }) => item.dataIndex !== 'deleteTime');
    }
    setColumns(columns);
  };
  return (
    <div className={classnames(style.container)} onScrollCapture={onScrollCapture}>
      <div style={{ height: '100%' }}>
        {listLoading && <TableSkeleton />}
        {list.length > 0 && (
          <SiriusTable
            className={style.table}
            dataSource={list}
            onRow={onRow}
            columns={mergedColumns}
            pagination={false}
            scroll={{ y: 'calc(100% - 64px)', scrollToFirstRowOnChange: true }}
            rowKey={item => item.id}
            headerBgColor={false}
          />
        )}
        {!listLoading && list.length === 0 && <Empty />}
      </div>
      <Popup onClick={onMenuClick} {...popup} />

      <RecoverModal
        type={tableType}
        recordId={recoverRecordId}
        closeModal={flag => {
          // 刷新目录
          flag && getRecycleList(true);
          setRecoverModalVisible(false);
        }}
        visible={recoverModalVisible}
      />
    </div>
  );
};
export default RecycleTable;
