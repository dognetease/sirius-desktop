import React, { useEffect, useState } from 'react';
import { apiHolder, apis, CompanyCollectItem, GlobalSearchApi, CollectLogItem, CollectLogItemTypeEnum } from 'api';
import { Table, PaginationProps, Modal } from 'antd';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import classNames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './table.module.scss';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
// import SelectRowAction from '@/components/Layout/Customer/components/MultiSelectAction/multiSelectAction';
// import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { ColumnsType } from 'antd/lib/table';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { EmptyList } from '@web-edm/components/empty/empty';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import moment, { Moment } from 'moment';
import { customsDataTracker } from '../../tracker/tracker';
import { DetailLevelStatus } from '@/components/Layout/globalSearch/search/search';
import { getIn18Text } from 'api';
import NationFlag from '../../components/NationalFlag';

// const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const globalSearchApi = apiHolder.api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface Props {
  tableList: any;
  pagination: any;
  onChange: (pagination: PaginationProps, filter: any, sorter: any) => void;
  deleteStar: (id: string | number) => void;
  changeStatus(id: string | number, status: number): void;
  onRefreshData?(): void;
  loading?: boolean;
}

const defaultPagination: PaginationProps = {
  current: 1,
  defaultPageSize: 20,
  showSizeChanger: false,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
  total: 0,
  className: 'pagination-wrap pagination-customs',
};
const detailLevels: Array<DetailLevelStatus> = new Array(3).fill({ open: false });

const BuysersTable: React.FC<Props> = ({ tableList: propTableList, pagination, onChange, deleteStar, changeStatus, onRefreshData, loading }) => {
  const { tableRef, y } = useTableHeight([], propTableList);
  const [tableList, setTableList] = useState<CompanyCollectItem[]>(propTableList);
  const [detailDrawStatus, setDetailDrawStatus] = useState<{
    visible?: boolean;
    id?: string | number;
    type?: CollectLogItemTypeEnum;
    name?: string;
  }>({});
  const [logModalStatus, setLogModalStatus] = useState<{
    visible?: boolean;
    list?: Array<{
      time: string;
      item: CollectLogItem[];
    }>;
    esid?: string | number;
    collectId?: string | number;
    companyName?: string;
  }>({});
  const [nextDetailLevels, setNextDetailLevels] = useState<DetailLevelStatus[]>(detailLevels);

  // const [companyName, setCompanyName] = useState<string>('');
  // const [country, setCuntry] = useState<string | undefined>('');
  // const [type, setType] = useState<string>('buysers');
  // const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number>>([]);

  useEffect(() => {
    setTableList(propTableList);
  }, [propTableList]);
  // const [recData, setRecData] = useState<recData>({
  //   visible: false,
  //   to: 'buysers',
  //   zIndex: 0,
  //   content: {
  //     country: '',
  //     to: 'buysers',
  //     companyName: '',
  //     tabOneValue: '',
  //     queryValue: ''
  //   }
  // });
  // const [emailList, setEmailList] = useState<{ contactName: string, contactEmail: string }[]>([]);
  // useEdmSendCount(emailList, undefined, undefined, undefined, 'customsData');

  // 查看详情
  const handleViewCompanyDetail = (esid: number | string, collectId: string | number, type?: CollectLogItemTypeEnum, name?: string) => {
    setDetailDrawStatus({
      id: esid,
      visible: true,
      type,
      name,
    });
    changeStatus(collectId, 2);
    globalSearchApi.doUpdateCollect(collectId);
  };
  // const onCustomerDrawerClose = (index: number) => {
  //   const data = onDrawerClose(recData, index);
  //   setRecData({ ...data });
  // };

  const handleViewLog = async (id: string | number, esId: string | number, companyName: string) => {
    const res = await globalSearchApi.doGetCollectLogList(id);
    if (res.length > 0) {
      setLogModalStatus({
        companyName,
        list: res,
        esid: esId,
        visible: true,
        collectId: id,
      });
    } else {
      SiriusMessage.info('暂无记录');
    }
  };

  const columns: ColumnsType<CompanyCollectItem> = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'companyName',
      key: 'companyName',
      width: 300,
      render: (text: string, record) => (
        <div className={classNames(style.companyNameItem)}>
          <EllipsisTooltip>
            <a
              href="javascript:void"
              onClick={e => {
                e.preventDefault();
                handleViewCompanyDetail(record.esId, record.id, undefined, record.originName || record.companyName);
                customsDataTracker.trackCollectionDetail({ from: 'companyName' });
              }}
            >
              {record.originName || text || '-'}
            </a>
          </EllipsisTooltip>
          {record.status === 1 && <span className={style.updateTag}>公司动态更新</span>}
        </div>
      ),
    },
    {
      title: getIn18Text('GUOJIA/DEQU'),
      dataIndex: 'country',
      key: 'country',
      width: 124,
      render: (text: string) => (text ? <NationFlag showLabel name={text} /> : null),
    },
    {
      title: '联系人数量',
      dataIndex: 'contactNum',
      key: 'contactNum',
      width: 124,
      render: (value, record) => {
        const { status, lastContactNum = value } = record;
        const increase = value - lastContactNum;
        return (
          <span>
            {status === 1 ? lastContactNum : value}
            {status === 1 && increase > 0 && <span className={style.increase}>{`+${increase}`}</span>}
          </span>
        );
      },
    },
    {
      title: '交易记录更新至',
      dataIndex: 'trsTime',
      key: 'trsTime',
      width: 153,
      render: value => {
        const text = value ? moment(value).format('YYYY-MM-DD') : '-';
        return <EllipsisTooltip>{text}</EllipsisTooltip>;
      },
    },
    {
      title: '数据更新时间',
      dataIndex: 'dataUpdateTime',
      key: 'dataUpdateTime',
      width: 156,
      render: (value, record) => {
        // const t1 = value ? moment(value).format('YYYY-MM-DD') : '-';
        const t1 = value ? moment(value) : null;
        const t2 = record.watchTime ? moment(record.watchTime) : null;
        let updateTime: Moment | null = null;
        if (t1 && t2) {
          updateTime = t1.isAfter(t2) ? t1 : t2;
        } else if (t1) {
          updateTime = t1;
        } else {
          updateTime = t2;
        }
        const text = updateTime ? updateTime.format('YYYY-MM-DD') : '-';
        return <EllipsisTooltip>{text || '-'}</EllipsisTooltip>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'id',
      width: 250,
      fixed: 'right',
      render: (id, record) => (
        <div className={style.opCell}>
          <span
            onClick={() => {
              handleViewLog(id, record.esId, record.companyName);
            }}
          >
            查看更新日志
          </span>
          <span
            onClick={() => {
              handleViewCompanyDetail(record.esId, record.id, undefined, record.originName || record.companyName);
              customsDataTracker.trackCollectionDetail({ from: 'detail' });
            }}
          >
            {getIn18Text('CHAKANXIANGQING')}
          </span>
          <span
            onClick={() => {
              deleteStar(id);
            }}
          >
            {getIn18Text('TUIDING')}
          </span>
        </div>
      ),
    },
  ];

  // const marketingFormat = (emailItems: string[]) => {
  //   const emails = emailItems.map(item => ({
  //     contactEmail: item,
  //     contactName: ''
  //   }))
  //     .filter(item => item.contactEmail);
  //   setEmailList(emails.length ? emails : [{ contactEmail: 'noEmials', contactName: '' }]);
  // };

  // const marketing = () => {
  //   edmCustomsApi.customsBatchGetEdmEmail({ starMarkIdList: selectedRowKeys }).then(res => {
  //     console.log('get-emials', res);
  //     marketingFormat(res);
  //   });
  // };
  // const triggerCustomsDetail = (listItem: ListModalType) => {
  //   const data = onDrawerOpen(recData, {
  //     to: type === 'buysers' ? 'supplier' : 'buysers',
  //     companyName: listItem.companyName,
  //     country: listItem.country
  //   },
  //   0);
  //   setRecData({ ...data });
  // };

  return (
    <div ref={tableRef} className={style.startTableBox}>
      <Table
        className="edm-table"
        bordered={false}
        loading={loading}
        rowKey="id"
        // rowSelection={{
        //   type: 'checkbox',
        //   onChange: (selectedRowKeys: any[]) => {
        //     setSelectedRowKeys(selectedRowKeys);
        //   },
        //   preserveSelectedRowKeys: true,
        //   selectedRowKeys
        // }}
        columns={columns}
        onChange={onChange}
        scroll={{ x: 1134, y }}
        dataSource={tableList}
        locale={{
          emptyText: (
            <EmptyList isCustoms>
              <div>{getIn18Text('ZANWUSHUJU')}</div>
            </EmptyList>
          ),
        }}
        pagination={{
          ...defaultPagination,
          ...pagination,
        }}
      />
      <Modal
        visible={!!logModalStatus.visible}
        destroyOnClose
        title={logModalStatus.companyName}
        onCancel={() => {
          setLogModalStatus({});
        }}
      >
        <div className={classNames(style.dataLogWrapper, 'sirius-scroll')}>
          {logModalStatus.list?.map(({ time, item: logItems }) => (
            <div className={style.dataLogItem} key={time}>
              <p className={style.dataLogItemTitle}>{time}</p>
              <ul className={style.dataLogUl}>
                {logItems.map((item, index) => (
                  <li key={index}>
                    <span>{item.logDesc}</span>
                    <span
                      className={style.dataLogLink}
                      onClick={() => {
                        logModalStatus.esid &&
                          logModalStatus.collectId &&
                          handleViewCompanyDetail(logModalStatus.esid, logModalStatus.collectId, item.type, logModalStatus.companyName);
                        customsDataTracker.trackCollectionDetail({ from: 'log' });
                        setLogModalStatus({});
                      }}
                    >
                      {getIn18Text('CHAKAN')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
      {/* <SelectRowAction
        selectedRowKeys={selectedRowKeys}
        tableLength={selectedRowKeys.length}
        subTitle={(
          <>
            {getIn18Text("YIXUAN")}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {getIn18Text("GESHUJU")}
          </>
        )}
      >
        <Button type="text" onClick={() => setSelectedRowKeys([])}>{getIn18Text("QUXIAO")}</Button>
        <Button type="primary" style={{ marginLeft: 12 }} onClick={() => marketing()}>{getIn18Text("YIJIANYINGXIAO")}</Button>
      </SelectRowAction> */}
      {/* <ListModal
        visible={visible}
        type={type as 'buysers' | 'appliers'}
        companyName={companyName}
        country={country}
        onCancel={() => { setVisible(false); }}
        setDrawer={triggerCustomsDetail}
      /> */}
      {/* <LevelDrawer
        recData={recData}
        onClose={onCustomerDrawerClose}
        onOpen={handleViewCompanyDetail}
      >
        <CustomsDetail />
      </LevelDrawer> */}
      {/* <Drawer
        width={872}
        zIndex={1000}
        visible={!!detailDrawStatus.visible}
        destroyOnClose
        onClose={() => { setDetailDrawStatus({}) }} >
        <CompanyDetail scene="customs" showSubscribe onToggleSub={onRefreshData} id={detailDrawStatus.id as string} anchorCustoms={detailDrawStatus.type === CollectLogItemTypeEnum.Customs} reloadToken={0} />
      </Drawer> */}
      <Drawer
        visible={detailDrawStatus.visible}
        onClose={() => {
          setDetailDrawStatus({});
        }}
        width={872}
        zIndex={1000}
      >
        {!!detailDrawStatus.visible ? (
          <CompanyDetail
            scene="subscription"
            showSubscribe
            onToggleSub={onRefreshData}
            onToggleMergeCompanySub={onRefreshData}
            id={detailDrawStatus.id as string}
            anchorCustoms={detailDrawStatus.type === CollectLogItemTypeEnum.Customs}
            reloadToken={0}
            recommendShowName={detailDrawStatus.name}
            showNextDetail={id => {
              setNextDetailLevels(prev => {
                const [_first, ...rest] = prev;
                return [{ open: true, id }, ...rest];
              });
            }}
          />
        ) : null}
      </Drawer>
      {nextDetailLevels.map((level, index) => (
        <Drawer
          key={index}
          visible={level.open}
          zIndex={1001 + index}
          onClose={() => {
            setNextDetailLevels(prev => {
              return prev.map((e, jndex) => {
                if (index === jndex) {
                  return {
                    open: false,
                  };
                } else {
                  return e;
                }
              });
            });
          }}
          width={872}
          destroyOnClose
        >
          {level.open && !!level.id && (
            <CompanyDetail
              showSubscribe
              id={level.id}
              reloadToken={0}
              showNextDetail={id => {
                if (index < nextDetailLevels.length - 1) {
                  setNextDetailLevels(prev => {
                    return prev.map((e, jndex) => {
                      if (index + 1 === jndex) {
                        return {
                          id,
                          open: true,
                        };
                      } else {
                        return e;
                      }
                    });
                  });
                } else {
                  SiriusMessage.warn(`最多打开${nextDetailLevels.length}层`);
                }
              }}
            />
          )}
        </Drawer>
      ))}
    </div>
  );
};

export default BuysersTable;
