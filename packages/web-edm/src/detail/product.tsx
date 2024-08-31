import React, { useMemo, useEffect, useLayoutEffect, useState, useRef, useImperativeHandle, useCallback } from 'react';
import { UserClickDataItem, ProductClickDetailDataItem, ResponseProductClickData, UserClickDetailDataItem } from 'api';
import { Tooltip, Select, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import classnames from 'classnames';
// import { navigate } from '@reach/router';
import { exportExcel } from '../utils';
import detailStyle from './detail.module.scss';
import style from '../edm.module.scss';
// import productStyle from './product.module.scss';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import throttle from 'lodash/throttle';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { showUniDrawer, UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { LeaveMessageModal } from '../components/leaveMessageModal/leaveMessageModal';
import { getIn18Text } from 'api';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';

const { Option } = Select;

type GetTableColumnsProps = {
  reverse: boolean;
  onClickClickEmail: (contactEmail: string) => void;
  onClickClickNum: (data: UserClickDataItem) => void;
  onClickClueNum: (ids: string[]) => void;
};

export const productStayTimeFormat = (value: number) => {
  if (!value) return '-';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  const fix0 = (e: number) => `${e < 10 ? '0' : ''}${e}`;
  const hoursStr = hours ? `${hours}小时` : '';
  const minutesStr = minutes ? `${hours ? fix0(minutes) : minutes}分` : '';
  const secondsStr = seconds ? `${minutes || hours ? fix0(seconds) : seconds}秒` : '';
  return `${hoursStr}${minutesStr}${secondsStr}`;
};

const getTableColumns = ({ reverse, onClickClickNum, onClickClueNum, onClickClickEmail }: GetTableColumnsProps) => {
  const tableColumns: ColumnsType<UserClickDataItem | ProductClickDetailDataItem> = [
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'contactEmail',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'contactName',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: reverse ? getIn18Text('clickTimes') : getIn18Text('DIANJISHANGPIN'),
      dataIndex: reverse ? ['userBehaviorData', 'clickNum'] : ['clickProductNum'],
      width: '130px',
      render: (value, record) => {
        if (reverse) return value ? value : '-';
        return value && 'userClickDetailData' in record ? (
          <a
            onClick={() => {
              onClickClickNum(record);
            }}
          >
            {value}
          </a>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('TINGLIUSHIJIAN'),
      dataIndex: ['userBehaviorData', 'stayTime'],
      width: '130px',
      render: productStayTimeFormat,
    },
    {
      title: (
        <div className={detailStyle.columnTitle}>
          <span>{getIn18Text('FANGWENWEIZHI')}</span>
          <Tooltip overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title={getIn18Text('ZHIKEHULIULANSHANGPIN')}>
            <ExplanationIcon />
          </Tooltip>
        </div>
      ),
      dataIndex: ['userBehaviorData', 'viewPosition'],
      width: '130px',
      render: value => (!value ? '-' : `${value}%`),
    },
    {
      title: (
        <div className={detailStyle.columnTitle}>
          <span>{getIn18Text('LIUZIKEHU')}</span>
          <Tooltip overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title={getIn18Text('KEHUZAISHANGPINXIANGQING')}>
            <ExplanationIcon />
          </Tooltip>
        </div>
      ),
      dataIndex: 'clueNum',
      width: '130px',
      render: (value, record) => {
        if (!value || !record.clueIds?.length) return '-';
        return <a onClick={() => onClickClueNum(record.clueIds)}>{value}</a>;
      },
    },
  ];
  return tableColumns;
};

type GetDetailColumnsProps = {
  onClickProductId: (productId: string) => void;
  onClickClueNum: (ids: string[]) => void;
};
const getDetailColumns = ({}: GetDetailColumnsProps) => {
  const detailColumns: ColumnsType<UserClickDetailDataItem> = [
    {
      title: getIn18Text('SHANGPINMINGCHENG'),
      dataIndex: 'productName',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHANGPINBIANHAO'),
      dataIndex: 'productCode',
      width: '175px',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
      // render: (value, { productId }) => {
      //   return <a onClick={() => onClickProductId(productId)}>{value}</a>;
      // }
    },
    {
      title: getIn18Text('clickTimes'),
      dataIndex: ['userBehaviorData', 'clickNum'],
      width: '130px',
    },
    {
      title: getIn18Text('TINGLIUSHICHANG'),
      dataIndex: ['userBehaviorData', 'stayTime'],
      width: '130px',
      render: productStayTimeFormat,
    },
    {
      title: getIn18Text('ZUIDAFANGWENSHENDU'),
      dataIndex: ['userBehaviorData', 'viewPosition'],
      width: '130px',
      render: value => (!value ? '-' : `${value}%`),
    },
    // {
    //   title: '提交线索',
    //   dataIndex: 'contactEmail',
    //   render: (value, record) => {
    //     return record.clueNum ? <a onClick={() => onClickPost(value)}>详情</a> : '-';
    //   }
    // }
  ];
  return detailColumns;
};

type ProductDataDatailProps = {
  productClickData?: ResponseProductClickData;
  showRowSelection: boolean;
  rowSelection: any;
};

export const ProductDataDatail = React.forwardRef(({ productClickData, showRowSelection, rowSelection }: ProductDataDatailProps, ref) => {
  const tableScrollParentRef = useRef<HTMLDivElement>(null);
  const productChooseRef = useRef<HTMLDivElement>(null);
  const [productList, setProductList] = useState<{ productId: string; productName: string; count: number }[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>();
  const [scrollHeight, setScrollHeight] = useState(266);
  const [reverse, setReverse] = useState(false);
  const [listData, setListData] = useState<UserClickDataItem[] | ProductClickDetailDataItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const listDataRef = useRef<UserClickDataItem[] | ProductClickDetailDataItem[]>([]);
  const [userClickDetailData, setUserClickDetailData] = useState<UserClickDataItem>();
  const [showUserClickDetail, setShowUserClickDetail] = useState(false);
  const [showProductNumber, setShowProductNumber] = useState(1000);
  const [clueIds, setClueIds] = useState<string[]>([]);
  const [leaveMessageVisible, setLeaveMessageVisible] = useState(false);
  listDataRef.current = listData;

  useEffect(() => {
    setProductList(
      productClickData?.productClickData?.map(({ productId, productName, productClickDetailData }) => ({
        productId,
        productName,
        count: productClickDetailData.length,
      })) || []
    );
    setCurrentProduct(productClickData?.productClickData?.[0]?.productId);
    setListData(productClickData?.userClickData ? [...productClickData.userClickData] : []);
  }, [productClickData]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of entries) {
        const dimensions = entry.contentRect;
        setScrollHeight(dimensions.height - 55);
      }
    });
    if (tableScrollParentRef.current) {
      setScrollHeight(tableScrollParentRef.current.clientHeight - 55);
      observer.observe(tableScrollParentRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (reverse) refreshShowProductNumber();
    });
    if (productChooseRef.current) {
      observer.observe(productChooseRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [reverse]);

  const refreshShowProductNumber = throttle(() => {
    if (!productChooseRef.current) return;
    const list = Array.from(productChooseRef.current.childNodes).filter(el => (el as Element).classList[0].includes('-item')) as Element[];
    const wrapWidth = productChooseRef.current.clientWidth - 22;
    const selectWidth = 109;
    let width = 0;
    list.some((el, index) => {
      width += el.clientWidth + 6;
      const isLast = index === list.length - 1;
      if (isLast) {
        setShowProductNumber(width < wrapWidth ? 1000 : index);
      } else if (width > wrapWidth - selectWidth) {
        setShowProductNumber(index);
        return true;
      }
      return false;
    });
  }, 200);

  useLayoutEffect(() => {
    if (reverse) {
      refreshShowProductNumber();
    }
  }, [reverse]);

  /**
   * 切换数据 收件人、产品
   * @param reversed
   * @param productId
   */
  const handleTabClick = (reversed?: boolean, productId?: string) => {
    setReverse(reversed === true);
    if (!productClickData) {
      setListData([]);
      return;
    }
    if (!reversed) {
      setListData(productClickData.userClickData ? [...productClickData.userClickData] : []);
    } else {
      if (productId) {
        setCurrentProduct(productId);
      }
      const cur = productId || currentProduct;
      const next = productClickData.productClickData?.find(el => el.productId === cur)?.productClickDetailData || [];
      setListData([...next]);
    }
  };

  /**
   * 点击 点击产品
   * @param data
   */
  const onClickClickNum = (data: UserClickDataItem) => {
    setUserClickDetailData(data);
    setShowUserClickDetail(true);
  };

  /**
   * 点击 提交意向详情
   * @param contactEmail
   */
  const onClickClickEmail = (contactEmail: string) => {
    console.log('product onClickPost', contactEmail);
    // TODO 打开「客户详情」抽屉弹窗
  };

  const showDetail = (id: string) => {
    if (!id) return;
    const list = id.split('#');
    if (isNaN(Number(list[0]))) {
      Toast.error('该数据已被修改或删除，若有疑问，请联系管理员');
      return;
    }
    if (list[2] == 'lead') {
      // 打开线索表抽屉（新留资数据提交在线索表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.LeadsView,
        moduleProps: {
          visible: true,
          leadsId: list[0] as any,
          onClose: () => {},
          source: 'websitePotentialCustomer',
        },
      });
    } else {
      // 打开客户表抽屉（老留资数据提交在客户表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerView,
        moduleProps: {
          visible: true,
          customerId: list[0] as any,
          onClose: () => {},
        },
      });
    }
  };

  /**
   * 点击 留资客户详情
   * @param contactEmail
   */
  const onClickClueNum = (ids: string[]) => {
    if (ids.length === 0) return;
    if (ids.length === 1) {
      showDetail(ids[0]);
    }
    if (ids.length > 1) {
      setClueIds(ids);
      setLeaveMessageVisible(true);
    }
    // navigate('#customer?page=clue&clueId=' + ids.join(','));
  };

  const onClickProductId = (productId: string) => {
    console.log('product onClickProductId', productId);
    // TODO 打开 产品详情
  };

  const tableColumns = useMemo(() => {
    return getTableColumns({ reverse, onClickClickNum, onClickClueNum, onClickClickEmail });
  }, [reverse]);

  const detailColumns = useMemo(() => {
    return getDetailColumns({ onClickProductId, onClickClueNum });
  }, [reverse]);

  // console.log('product listData', listData);
  // console.log('product productList', productList);
  const selectList = productList.slice(showProductNumber);

  const handleStatExport = useCallback(() => {
    if (listData?.length <= 0) {
      message.warn(getIn18Text('ZANWUKEDAOCHUSHUJU'));
      return;
    }
    const fieldLabels = [
      getIn18Text('YOUXIANG'),
      getIn18Text('LIANXIREN'),
      reverse ? getIn18Text('clickTimes') : getIn18Text('DIANJISHANGPIN'),
      getIn18Text('TINGLIUSHIJIAN'),
      getIn18Text('FANGWENWEIZHI'),
      getIn18Text('LIUZIKEHU'),
    ];
    const fieldKeys = [
      'contactEmail',
      'contactName',
      reverse ? 'userBehaviorData.clickNum' : 'clickProductNum',
      'userBehaviorData.stayTime',
      'userBehaviorData.viewPosition',
      'clueNum',
    ];
    const fileName = `${moment().format('YYYY-MM-DD')}营销任务详情数据导出.xls`;
    exportExcel(listData, fieldLabels, fieldKeys, fileName);
  }, [listData, reverse]);

  useImperativeHandle(ref, () => ({
    handleExport: () => handleStatExport(),
  }));

  const FilterLevel2Comp = () => {
    const [text1, text2] = [getIn18Text('SHOUJIANREN'), getIn18Text('SHANGPIN')];
    return (
      <div className={detailStyle.capsule}>
        <div className={classnames([detailStyle.capsuleItem, { active: !reverse }])} onClick={() => handleTabClick(false)}>
          {text1}
        </div>
        <div className={classnames([detailStyle.capsuleItem, { active: reverse }])} onClick={() => handleTabClick(true)}>
          {text2}
        </div>
      </div>
    );
  };
  const onPaginationChange = (page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
  };

  return (
    <>
      <div className={detailStyle.actionPart}>{FilterLevel2Comp()}</div>
      <div ref={productChooseRef} className={classnames(detailStyle.productChoose, { [detailStyle.productChooseHidden]: !reverse || productList.length === 0 })}>
        {showProductNumber < productList.length ? (
          <div className={detailStyle.productChooseSelect}>
            <Select<string>
              value={selectList.some(el => el.productId === currentProduct) ? currentProduct : undefined}
              onChange={value => {
                handleTabClick(true, value);
              }}
              placeholder={getIn18Text('GENGDUO')}
              dropdownMatchSelectWidth={263}
            >
              {selectList.map(el => {
                return (
                  <Option key={el.productId} value={el.productId}>
                    <Tooltip overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title={el.productName}>
                      <div className={detailStyle.productSelectItem}>
                        <span className={detailStyle.productSelectItemName}>{el.productName}</span>
                        <span className={detailStyle.productSelectItemNum}>{el.count}</span>
                      </div>
                    </Tooltip>
                  </Option>
                );
              })}
            </Select>
          </div>
        ) : null}
        {productList.map((el, i) => {
          return (
            <Tooltip key={el.productId} overlayClassName="show-arrow" arrowPointAtCenter placement="topRight" title={el.productName}>
              <div
                onClick={() => handleTabClick(true, el.productId)}
                className={classnames(detailStyle.productChooseItem, {
                  [detailStyle.productChooseItemActive]: currentProduct === el.productId,
                  [detailStyle.productChooseItemHidden]: i >= showProductNumber,
                })}
              >
                <span className={detailStyle.productChooseItemName}>{el.productName}</span>
                <span className={detailStyle.productChooseItemNum}>{el.count}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div
        className={classnames([
          style.detailTableWrapper,
          style.hasDetailTableFooter,
          detailStyle.hasToggleTab,
          { [detailStyle.productReverse]: reverse && productList.length > 0 },
        ])}
        ref={tableScrollParentRef}
      >
        <SiriusTable
          className={style.detailTable}
          columns={tableColumns}
          dataSource={listData.slice(pageSize * (page - 1), pageSize * page)}
          pagination={false}
          sortDirections={['descend', 'ascend']}
          // scroll={{ y: scrollHeight }}
          rowKey={'contactEmail'}
          rowSelection={showRowSelection ? rowSelection : undefined}
        />
        <div className={detailStyle.tablePagination}>
          <SiriusPagination
            showTotal={() => `共${listData.length}条数据`}
            showQuickJumper
            current={page}
            pageSize={pageSize}
            total={listData.length}
            onChange={onPaginationChange}
            pageSizeOptions={['20', '50', '100']}
            hideOnSinglePage={true}
          />
        </div>
      </div>
      <Modal
        title={getIn18Text('SHANGPINDIANJIXIANGQING')}
        className={detailStyle.productDetailModal}
        visible={showUserClickDetail}
        footer={null}
        width={816}
        onCancel={() => setShowUserClickDetail(false)}
      >
        <div className={detailStyle.productDetailModalContact}>
          <span>
            {getIn18Text('LIANXIREN：')}
            {userClickDetailData?.contactName}
          </span>{' '}
          <span>
            {getIn18Text('KEHUYOUXIANG：')}
            {userClickDetailData?.contactEmail}
          </span>
        </div>
        <SiriusTable
          columns={detailColumns}
          dataSource={userClickDetailData?.userClickDetailData}
          pagination={false}
          scroll={{ y: 406 }}
          rowKey="productId"
          // className={productStyle.detailTable}
        />
      </Modal>
      <LeaveMessageModal visible={leaveMessageVisible} clueIds={clueIds} onClose={() => setLeaveMessageVisible(false)} showDetail={showDetail} />
    </>
  );
});
