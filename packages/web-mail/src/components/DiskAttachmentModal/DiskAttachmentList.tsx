import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Spin, Table } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder, NetStorageApi, NSDirContent, NSFileContent, AccountApi } from 'api';
import { useAppDispatch, useAppSelector, DiskAttActions } from '@web-common/state/createStore';
import { doGetAttsAsync, tabMsgsKeys } from '@web-common/state/reducer/diskAttReducer';
import RowName from '@web-disk/components/RowName/rowName';
import BreadComp from '@web-disk/components/BreadComp';
import { formatAuthority, getFileIcon, simpleFormatTime } from '@web-disk/utils';
import { formatTimeWithHM } from '@web-mail/util';
import { formatFileSize } from '@web-common/utils/file';
import { FormatExpiredDate } from '../../common/components/FormatExpireDate';
import { ExpireTimeTitle } from '@web-disk/components/CloudAttCont/ExpireTimeTitle';
import Fetching from '@web-disk/components/Fetching/fetching';
import style from './diskAttachmentList.module.scss';
import debounce from 'lodash/debounce';
import useDebounceForEvent from '../../hooks/useDebounceForEvent';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { Bread } from '@web-disk/disk';
import { getIn18Text } from 'api';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
// 在线文档的fileType
const onlineFileTypes = ['doc', 'excel'];
export const DiskAttachmentList = () => {
  const dispatch = useAppDispatch();
  const { selectedRows, currentType, listLoading, tabMsgs, failMsgs, rootInfo, curDirId } = useAppSelector(state => state.diskAttReducer);
  const [bread, setBread] = useState<Bread[]>([]);
  const list = useMemo(() => {
    return tabMsgs[currentType as tabMsgsKeys].list || [];
  }, [tabMsgs, currentType]);
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const currentMailRef = useRef(currentMail);
  currentMailRef.current = currentMail;
  const currentMailId = useMemo(() => currentMailRef.current.cid, [currentMailRef.current]);
  const [creWithSubAccount, setCreWithSubAccount] = useState<boolean>(false); // 是否以主账号创建
  const listRef = useRef(list);
  listRef.current = list;
  const currentTypeRef = useRef(currentType);
  currentTypeRef.current = currentType;
  const normalAttReady = useMemo(() => {
    return tabMsgs['normalAtt'].normalAttReady || false;
  }, [tabMsgs]);
  // 往来附件 加载中 且 后端未准备好 且 无内容
  const fetchingShow = useMemo(
    () => !!(listLoading && !normalAttReady && list.length === 0 && currentType === 'normalAtt'),
    [currentType, listLoading, list.length, normalAttReady]
  );
  // 加载中 且 无内容
  const contLoading = useMemo(() => !!(listLoading && !fetchingShow && list.length === 0), [listLoading, list.length, fetchingShow]);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  // 面包屑导航何时出现： 个人空间、企业空间
  const breadShow = useMemo(() => {
    return ['personal', 'ent'].includes(currentType) && bread && bread?.length > 1;
  }, [currentType, bread]);
  // 点击 多选
  const handleSelectRow = (record: NSDirContent | NSFileContent) => {
    // 过期不可选中
    const expireTime = (record as NSFileContent).expireTime ?? 0; // 为0代表永不过期
    const isExpired = expireTime !== 0 && expireTime < Date.now();
    if (isExpired) {
      return;
    }
    // 文件不可选中
    const isDir = record?.extensionType === 'dir';
    // 在线文档不可选中
    const isOnlineFile = onlineFileTypes.includes((record as NSFileContent)?.fileType);
    if (isDir) return;
    if (isOnlineFile) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('ZANBUZHICHITIAN'),
        className: 'msg-custom-class',
      });
      return;
    }
    const _selectedRows = [...selectedRows];
    const _selectedRowIds = selectedRows.map(item => item.rowId);
    if (_selectedRowIds.indexOf(record.rowId) >= 0) {
      _selectedRows.splice(selectedRows.indexOf(record.rowId), 1);
    } else {
      _selectedRows.push(record);
    }
    dispatch(DiskAttActions.doSetSelectedKeys(_selectedRows));
  };
  // 加载失败 重新加载
  const toReload = () => {
    if (failMsgs?.failParams) {
      dispatch(doGetAttsAsync(failMsgs.failParams));
    }
  };
  const updateBread = () => {
    if (!curDirId) {
      setBread([]);
      return;
    }
    if (!['personal', 'ent'].includes(currentType)) return;
    // 获取目录列表
    diskApi.getDirPathInfoUsingGET({ dirId: curDirId, type: currentType }).then(({ itemList }) => {
      setBread(() => {
        const newBread = itemList.map(i => ({
          id: i.dirId,
          name: i.dirName,
        }));
        return newBread;
      });
    });
  };
  useEffect(() => {
    updateBread();
  }, [curDirId]);
  // 加载下一页
  const loadMore = useCallback(
    debounce(() => {
      dispatch(doGetAttsAsync({ type: currentTypeRef.current }));
    }, 300),
    [currentType, rootInfo]
  );
  // 滚动列表
  const onSrcoll = useCallback(
    debounce(e => {
      const target = e.target;
      if (listRef.current.length > 0) {
        // 接近触底
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
          loadMore();
        }
      }
    }, 300),
    [currentType, rootInfo, listRef.current]
  );
  // 触底处理
  useEffect(() => {
    if (tableWrapperRef.current) {
      const tBody = tableWrapperRef.current.querySelector('.ant-table-body');
      if (tBody) tBody.addEventListener('scroll', onSrcoll);
    }
    return () => {
      if (tableWrapperRef.current) {
        const tBody = tableWrapperRef.current.querySelector('.ant-table-body');
        if (tBody) tBody.removeEventListener('scroll', onSrcoll);
      }
    };
  }, []);
  useEffect(() => {
    // 正处于个人空间/企业空间
    if (['personal', 'ent'].includes(currentType)) {
      // 未进入子目录
      if (!curDirId) {
        const curRootInfo = rootInfo[currentType as 'personal' | 'ent'];
        // 将根目录设为curDirId
        curRootInfo && dispatch(DiskAttActions.doSetCurDirId(curRootInfo.id));
      }
    }
  }, [rootInfo]);

  // 切换tab时(无数据)
  // 有数据时依靠分页加载
  useEffect(() => {
    // 有数据 只是单纯切换
    if (tabMsgs[currentType].list.length > 0) return;
    // 无数据 尝试加载
    // 个人空间 企业空间
    if (['personal', 'ent'].includes(currentType)) {
      // 未获取到根目录
      const curRootInfo = rootInfo[currentType as 'personal' | 'ent'];
      if (!curRootInfo) return;
      // 没有对应curdirid
      // if (!curDirId) {
      // 将根目录设为curDirId(下面会自动触发加载)
      dispatch(DiskAttActions.doSetCurDirId(curRootInfo.id));
      return;
      // }
    }
    // 其他
    dispatch(doGetAttsAsync({ type: currentType, init: true }));
  }, [currentType]);
  useEffect(() => {
    if (!curDirId) return;
    // 未处于 个人空间/企业空间
    if (!['personal', 'ent'].includes(currentType)) return;
    // 未获取到根目录
    if (!rootInfo[currentType as 'personal' | 'ent']) return;
    dispatch(doGetAttsAsync({ type: currentType, init: true }));
  }, [curDirId]);

  // 判断是否处于子账号
  const ifSubAccount = useDebounceForEvent(async () => {
    const res = await accountApi.isSubAccount(currentMailRef.current.initSenderStr);
    setCreWithSubAccount(res);
  }, 500);

  useEffect(() => {
    ifSubAccount();
  }, [currentMailId]);

  const getColumns = () => {
    const nameColumn = {
      key: 'name',
      dataIndex: 'name',
      title: getIn18Text('WENJIAN'),
      width: 300,
      ellipsis: true,
      render: (text, record) => {
        const isDir = record.extensionType === 'dir';
        const { hasExternalShared, rowId, id, name } = record;
        const idDis = judgeRecordDisable(record);
        return (
          <span className={idDis ? style.disColumn : ''}>
            {['ent', 'personal'].includes(currentType) ? (
              <RowName
                id={id}
                type={isDir ? 'dir' : getFileIcon(record)}
                name={name}
                showExtShare={hasExternalShared}
                openFileOrDir={() => {
                  if (!isDir) return;
                  dispatch(DiskAttActions.doSetCurDirId(id));
                }}
              />
            ) : (
              <RowName id={rowId} type={isDir ? 'dir' : getFileIcon(record)} name={name} showExtShare={hasExternalShared} />
            )}
          </span>
        );
      },
    };
    const sizeColumn = {
      key: 'size',
      dataIndex: 'size',
      title: getIn18Text('DAXIAO'),
      render: (size, record) => {
        const idDis = judgeRecordDisable(record);
        return <span className={idDis ? style.disColumn : ''}>{formatFileSize(typeof size === 'number' ? size : record?.size, 1024)}</span>;
      },
    };
    const updateTimeColumn = {
      key: 'updateTime',
      dataIndex: 'updateTime',
      title: getIn18Text('XIUGAISHIJIAN'),
      render: (_, record) => {
        const date = record.updateTime || record.createTime;
        const idDis = judgeRecordDisable(record);
        if (!date) return '';
        return (
          <span className={idDis ? style.disColumn : ''}>
            {
              // simpleFormatTime(date,false, ['ent', 'personal', 'normalAtt'].includes(currentType))
              formatTimeWithHM(date)
            }
          </span>
        );
      },
    };
    // 个人空间、企业空间、往来附件
    if (['ent', 'personal', 'normalAtt'].includes(currentType)) {
      return [nameColumn, sizeColumn, updateTimeColumn];
    }
    // 云附件
    if (currentType === 'cloudAtt') {
      return [
        nameColumn,
        sizeColumn,
        {
          key: 'expireTime',
          dataIndex: 'expireTime',
          title: <ExpireTimeTitle />,
          render: (expireTime, record) => <FormatExpiredDate date={expireTime} />,
        },
        updateTimeColumn,
      ];
    }
    return [];
  };

  const judgeRecordDisable = (record: NSDirContent | NSFileContent) => {
    /// 权限问题、过期、 在线文档(doc excel)不能勾选
    const isOnlineFile = onlineFileTypes.includes((record as NSFileContent)?.fileType);
    const authText = formatAuthority(record?.authorityDetail?.roleInfos, record?.extensionType);
    // !!权限控制条件判断是中文匹配，不要翻译
    const noAuth = !authText?.includes('下载') && currentType === 'ent';
    const expireTime = (record as NSFileContent).expireTime ?? 0; // 为0代表永不过期
    const isExpired = expireTime !== 0 && expireTime < Date.now(); // 过期不能勾选
    return isExpired || isOnlineFile || noAuth ? true : false;
  };
  const getCheckBoxStatus = (record: NSDirContent | NSFileContent) => {
    /// 权限问题、过期、 在线文档(doc excel)不能勾选
    const isDir = record.extensionType === 'dir';
    return {
      disabled: judgeRecordDisable(record),
      style: { visibility: isDir ? 'hidden' : 'visible', color: 'red' },
    } as any;
  };
  const handleBreadChange = (dirId: number) => {
    dispatch(DiskAttActions.doSetCurDirId(dirId));
    dispatch(doGetAttsAsync({ type: currentType, init: true }));
  };
  const selectedKeysChange = (_, records) => {
    dispatch(DiskAttActions.doSetSelectedKeys(records as NSFileContent[]));
  };
  return (
    <Spin spinning={contLoading}>
      <div className={style.diskTable}>
        {/* 面包屑导航栏 */}
        {breadShow && (
          <div className={style.bread}>
            <BreadComp bread={bread} ellipsisIndex={[-1]} setCurrentDirId={handleBreadChange} highlightColor="#386EE7" />
          </div>
        )}

        <>
          {/* 加载进度 */}
          {fetchingShow && <Fetching />}

          {/* 特例：子账号不展示往来附件 */}
          {creWithSubAccount && currentType === 'normalAtt' ? (
            <div className={style.empty}>
              <div className="sirius-empty sirius-empty-doc" />
              <span className={style.emptyText}>{getIn18Text('BANGDINGYOUXIANGBUZHICHI')}</span>
            </div>
          ) : (
            <>
              {/* 有内容 */}
              <div ref={tableWrapperRef} hidden={!list || list.length === 0} style={{ overflow: 'hidden' }}>
                <SiriusTable
                  rowKey="rowId"
                  dataSource={list}
                  columns={getColumns()}
                  scroll={{ y: 300 }}
                  pagination={false}
                  onRow={record => ({ onClick: () => handleSelectRow(record) as any })}
                  rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys: selectedRows.map(item => item.rowId),
                    columnTitle: <></>,
                    getCheckboxProps: getCheckBoxStatus,
                    onChange: selectedKeysChange,
                  }}
                  headerBgColor={false}
                />
              </div>

              {/* 无内容 */}
              {list.length === 0 && !failMsgs && !listLoading && (
                <div className={style.empty}>
                  <div className="sirius-empty sirius-empty-doc" />
                  <span className={style.emptyText}>{getIn18Text('ZANWUWENJIAN')}</span>
                </div>
              )}

              {/* 加载失败 */}
              {list.length === 0 && failMsgs && !listLoading && (
                <div className={style.loadFail}>
                  <div className="sirius-empty sirius-empty-network" style={{ width: '160px', height: '160px', backgroundSize: '160px', margin: '0 auto' }} />
                  <p className={style.failIntro}>{failMsgs.failIntro}</p>
                  <button className={style.reloadButton} onClick={toReload}>
                    {getIn18Text('ZHONGXINJIAZAI')}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      </div>
    </Spin>
  );
};
