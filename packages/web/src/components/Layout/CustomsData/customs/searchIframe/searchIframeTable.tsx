import React, { useState, ReactNode, useImperativeHandle } from 'react';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Button, PaginationProps, Table, TableColumnsType, message } from 'antd';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import ZnCompanyDetail from '../customsDetail/components/znCompanyDetail';
import { EmptyList } from '@web-edm/components/empty/empty';
import { renderDataTagList } from '@/components/Layout/utils';
import EntryClueModal from './entryClueModal';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import CustomsDetail from '@/components/Layout/CustomsData/customs/customsDetail/customsDetail';
import LevelDrawer from '@/components/Layout/CustomsData/components/levelDrawer/levelDrawer';
import { onDrawerClose, onDrawerOpen } from '@/components/Layout/CustomsData/utils';
import { getIn18Text, UserLogItem } from 'api';

export interface ITablePage {
  page: number;
  size: number;
}
export interface ReqRefs {
  setSelectedRowKeys(arr: any[]): void;
}
interface recData {
  visible: boolean;
  zIndex: number;
  to: 'buysers' | 'supplier';
  content: {
    country: string;
    to: 'buysers' | 'supplier';
    companyName: string;
    tabOneValue?: string;
    queryValue?: string;
    originCompanyName?: string;
  };
  children?: recData;
}
interface Props {
  tableList: UserLogItem[];
  pagination: any;
  // onChange: (pagination: PaginationProps, filter: any, sorter: any) => void;
  loading?: boolean;
  createClue: (parames: string[]) => void;
  searchType?: number;
  setPageConfig: (parames: ITablePage) => void;
  tatol: number;
  ref?: React.Ref<ReqRefs>;
  getInitListData?: () => void;
}

interface DataTagItem {
  content: ReactNode | null | undefined;
  style?: 'blue' | 'yellow' | 'green' | 'default';
  priority?: boolean;
}

const SearchIframeTable: React.FC<Props> = React.forwardRef((props, ref) => {
  const { tableList, pagination, loading, createClue, searchType, setPageConfig, tatol, getInitListData } = props;
  const [selectedRowItem, setSelectedRowItem] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [visible, changeVisible] = useState<boolean>(false);
  const [deatilVal, setDeatilVal] = useState({
    detailId: '',
    companyName: '',
    clueStatus: 0,
    logId: 0,
    bringIntoData: {},
  });
  const [recData, setRecData] = useState<recData>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
      originCompanyName: '',
    },
  });
  useImperativeHandle(ref, () => ({
    setSelectedRowKeys,
  }));
  const columns: TableColumnsType<{
    status?: string;
    contactCount?: number;
    id: string;
    chineseCompanyId: string;
    chineseName?: string;
    countryRegion?: string;
    legalPerson?: string;
    registeredCapital?: string;
    registerDate?: string;
    address?: string;
    website?: string;
    chineseNameHighlight?: string;
    logId?: number;
    customsCompanyName?: string;
    customsCompanyType?: string;
    customsCountry?: string;
  }> = [
    {
      title: getIn18Text('GONGSIXINXI'),
      dataIndex: 'chineseCompanyId',
      key: 'chineseCompanyId',
      render: (text: string, record, index) => {
        return (
          <div className={styles.itemBox}>
            {record?.chineseName && <div className={styles.itemLogo}>{record?.chineseName?.slice(0, 4)}</div>}
            {!!record.countryRegion && <div className={styles.countryRegion}>{record.countryRegion}</div>}
            <div className={styles.infoBoxleft}>
              <div className={styles.flexBox}>
                <div>
                  <span dangerouslySetInnerHTML={{ __html: record?.chineseNameHighlight || record?.chineseName || '-' }}></span> {renderStatus(record)}
                </div>
                <div className={styles.infoText}>{}</div>
              </div>
              <div className={styles.infoBox}>
                <div className={styles.infoText}>
                  <div className={styles.infoTextTop}>
                    <span>法定代表人：{record?.legalPerson || '-'}</span>
                    <span>注册资本：{record?.registeredCapital || '-'}</span>
                  </div>
                  <div>地址：{record?.address || '-'}</div>
                  <div>
                    官网：
                    {record?.website ? (
                      <span
                        className={classnames(styles.urlLink, styles.urlEllipsis)}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof window !== undefined) {
                            const url = record?.website?.indexOf('//') !== -1 ? record?.website : 'https://' + record?.website;
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        {record?.website}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div>
                    相似海关企业：
                    {record?.customsCompanyName ? (
                      <span
                        className={classnames(styles.urlLink, styles.urlEllipsis)}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCustomsDetail(record?.customsCompanyType || '', record?.customsCompanyName || '', record?.customsCountry || '');
                        }}
                      >
                        {record?.customsCompanyName}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '查询时间',
      dataIndex: 'queryTime',
      key: 'queryTime',
      width: 373,
      render: text => {
        return <span>{text ? moment(text).format('YYYY-MM-DD') : '-'}</span>;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'id',
      width: 110,
      fixed: 'right',
      render: (id, record, index) => {
        const btnText = `${record?.contactCount}个联系人`;
        return (
          <Button type="primary" ghost={true} onClick={() => handleDetailOpen(record, index)}>
            {btnText}
          </Button>
        );
      },
    },
  ];
  const renderStatus = (record: UserLogItem) => {
    const { businessStatus, recommendLabel, clueStatus } = record;
    const arr: DataTagItem[] = [
      {
        content: businessStatus,
        style: 'green',
      },
      {
        content: recommendLabel,
        style: 'blue',
      },
    ];
    if (clueStatus === 1) {
      arr.push({
        content: '线索',
        style: 'blue',
      });
    }
    return <>{renderDataTagList(arr)}</>;
  };
  const handleDetailOpen = (item: UserLogItem, index: number) => {
    setDeatilVal({
      detailId: item?.id,
      companyName: item.chineseName as string,
      bringIntoData: item,
      clueStatus: item.clueStatus as number,
      logId: item?.logId as number,
    });
    changeVisible(true);
  };

  const handleCustomsDetail = (customsCompanyType: string, companyName: string, country: string) => {
    const data = onDrawerOpen(recData, { to: customsCompanyType === 'import' ? 'buysers' : 'supplier', companyName, country }, 0);
    setRecData({ ...data });
  };
  const onDrawerOpenBefore = (content: recData, zindex: number) => {
    const data = onDrawerOpen(recData, { ...content }, zindex);
    setRecData({ ...data });
  };
  const onCustomerDrawerClose = (index: number) => {
    const data = onDrawerClose(recData, index);
    setRecData({ ...data });
  };

  return (
    <div className={styles.tableListBox}>
      <div className={styles.tableListTop}>
        <div>
          {`已为您找到`}
          <span style={{ color: '#4C6AFF' }}>{tatol}</span>
          {`条数据`}
        </div>
        <Button
          type="primary"
          disabled={searchType === 1 || !(selectedRowItem.length > 0)}
          onClick={() => {
            if (selectedRowItem.length > 1) {
              setModalVisible(true);
            } else {
              const ids = selectedRowItem.map(item => item.id);
              if (ids.length > 0) {
                createClue(ids);
              } else {
                message.error('请选择未录入线索的数据');
              }
            }
          }}
        >
          批量录入线索
        </Button>
      </div>
      <Table
        // className="edm-table"
        bordered={false}
        loading={loading}
        rowKey="chineseCompanyId"
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys: any[], selectedRowItem) => {
            setSelectedRowKeys(selectedRowKeys);
            setSelectedRowItem(selectedRowItem);
          },
          preserveSelectedRowKeys: true,
          selectedRowKeys,
        }}
        columns={columns}
        // onChange={onChange}
        // scroll={{ x: 1134, y }}
        dataSource={tableList}
        locale={{
          emptyText: (
            <EmptyList isCustoms>
              <div>{getIn18Text('ZANWUSHUJU')}</div>
            </EmptyList>
          ),
        }}
        pagination={false}
      />
      <SiriusPagination
        className={styles.pagination}
        onChange={(nPage, nPageSize) => {
          setSelectedRowKeys([]);
          setPageConfig({
            page: nPage - 1,
            size: nPageSize,
          });
        }}
        {...{
          ...{
            current: 1,
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50] as unknown as string[],
            total: tatol,
            showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
          },
          pageSize: pagination.size,
          current: pagination.page + 1,
          tatol: tatol,
        }}
      />
      {visible && (
        <ZnCompanyDetail
          detailId={deatilVal.detailId}
          visible={visible}
          refreshListData={getInitListData}
          changeVisible={changeVisible}
          companyName={deatilVal.companyName}
          logId={deatilVal.logId}
          bringIntoData={deatilVal.bringIntoData}
          sourcName={'searchIframe'}
        />
      )}
      {modalVisible && <EntryClueModal visible={modalVisible} setVisible={setModalVisible} selectedRowItem={selectedRowItem} createClue={createClue} />}
      <LevelDrawer key={'searchiFrame'} recData={recData} onClose={onCustomerDrawerClose} onOpen={onDrawerOpenBefore}>
        <CustomsDetail key={'searchiFrame'} />
      </LevelDrawer>
    </div>
  );
});
export default SearchIframeTable;
