import { getIn18Text } from 'api';
/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Table, Input, Button, Spin, ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { debounce, keyBy } from 'lodash';
import { EmptyList } from '../../components/empty/empty';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { navigateToProductPage } from '@web-unitable-crm/api/helper';
import style from './style.module.scss';
import useTableDataLoader from '../../hooks/useTableDataLoader';
import { getColumns } from './column';
import { ReactComponent as CloseSvg } from '@/images/icons/edm/close.svg';
import { ProductSampleModal } from '../productSampleModal/productSampleModal';
import { ProductPreviewModal } from '../productPreviewModal/productPreviewModal';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import toast from '@web-common/components/UI/Message/SiriusMessage';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
import { apiHolder as api, apis, MailProductApi, WaimaoProductListReq, DataTrackerApi, SiteApi } from 'api';
import { useAppSelector, MailProductActions, useActions } from '@web-common/state/createStore';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { ReactComponent as AddIcon } from '@/images/icons/waimao/add.svg';
import { ProductAttrOptions } from '../productUpdateColumnModal/productUpdateColumnModal';
import { getTransText } from '@/components/util/translate';

const productApi = api.api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;
const siteApi = api.api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface ProductSettingModalProps {
  visible: boolean;
  onShow: () => void;
  onClose: () => void;
  onAdd: (tab: number, list: any[], columns: string[], fieldsMap: any, imgSize: number, siteId: string) => void;
  container?: string; // container如果不为空，则表示是在普通邮件中插入商品信息；container为空，表示营销邮件；
}

interface AllTableMap {
  [key: string]: {
    productLink: string;
  };
}

const defaultPageSize = 20;

export const ProductSettingModal = (props: ProductSettingModalProps) => {
  // 这个组件在营销和普通邮件的插入商品信息中共用， 所以需要区分一个modal的container
  if (process.env.BUILD_ISLINGXI) return null;
  const { container } = props;
  const [currentPage, setCurrentPage] = useState<number | undefined>(1);
  const [pagesize, setPagesize] = useState<number | undefined>(defaultPageSize);
  const [searchKey, setSearchKey] = useState('');
  const [isComposition, setIsComposition] = useState<boolean>(false);

  const fieldsMap = useMemo(() => {
    return keyBy(ProductAttrOptions, 'value');
  }, []);
  useEffect(() => {
    let list = getColumns() as any;
    setColumnslist(list);
  }, []);

  const onSearch = (searchKey: string) => {
    setCurrentPage(1);
    setSearchParam({
      ...searchParam,
      page: 1,
      keyword: searchKey,
    });
  };
  const debounceFn = useCallback(
    debounce(callback => {
      callback();
    }, 1000),
    []
  );
  useEffect(() => {
    if (isComposition) {
      return;
    }
    debounceFn(() => onSearch(searchKey));
  }, [searchKey, isComposition]);

  const imgColumns = useAppSelector(state => state.mailProductReducer.imgColumns);
  const tableColumns = useAppSelector(state => state.mailProductReducer.tableColumns);

  const [noEmpty, setNoEmpty] = useState(false);
  const [allTableMap, setAllTableMap] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [columnslist, setColumnslist] = useState([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchParam, setSearchParam] = useState<Partial<WaimaoProductListReq>>({
    keyword: '',
    page: 1,
    pageSize: defaultPageSize,
  });

  // 商品详情页所属站点
  const siteListRef = useRef([]);
  const [selectSite, setSelectSite] = useState(['']);
  const [imgSize, setImgSize] = useState(150); // 商品图片尺寸 120/150/200

  const { fields, loading, hasContent, tableList, tableMap, total } = useTableDataLoader(productApi, 'getWaimaoProductList', searchParam);

  useEffect(() => {
    setAllTableMap({
      ...allTableMap,
      ...tableMap,
    });
  }, [tableMap]);

  const checkSample = () => {
    setShowSampleModal(true);
  };

  const addProductInEmail = async (tab: number, imgSize: number) => {
    // 在普通邮件和营销邮件中插入商品信息，请求商品链接
    const links = await productApi.genProductLinks({
      productIds: selectedRowKeys,
      siteId: selectSite[0],
      businessType: container ? 'NORMAL' : 'MARKETING',
      domain: selectSite[1],
    });
    setAllTableMap((preAllTableMap: AllTableMap) => {
      links.forEach(({ productId, productLink }) => {
        preAllTableMap[productId].productLink = productLink;
      });
      return preAllTableMap;
    });
    props.onAdd(
      tab,
      selectedRowKeys.map(key => allTableMap[key]),
      tab === 0 ? imgColumns : tableColumns,
      fieldsMap,
      imgSize,
      selectSite[0]
    );
    setShowPreviewModal(false);
  };

  const changeSelectedKeys = (val: string[]) => {
    if (val.length > 20) {
      toast.error({ content: getIn18Text('BUNENGCHAOGUO20GE') });
    } else {
      setSelectedRowKeys(val);
    }
  };

  const deleteSelectedKey = (index: number) => {
    selectedRowKeys.splice(index, 1);
    setSelectedRowKeys([...selectedRowKeys]);
  };

  const onPaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPagesize(pageSize);
    setSearchParam({
      ...searchParam,
      page,
      pageSize,
    });
  };

  const onOk = async () => {
    const length = selectedRowKeys.length;
    if (length > 0 && length <= 20) {
      try {
        const list = await siteApi.getSiteDomainList({ isShowOuterSite: false });
        if (list.length > 0) {
          siteListRef.current = list;
          if (list[0].bindDomains[0]) {
            setSelectSite([list[0].siteId, list[0].bindDomains[0]]);
          } else {
            setSelectSite([list[0].siteId]);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setShowPreviewModal(true);
      props.onClose();
    } else {
      toast.error({ content: length > 20 ? getIn18Text('BUNENGCHAOGUO20GE') : getIn18Text('QINGXUANZESHANGPIN') });
    }
    // 选择商品点击确认
    trackApi.track('mail_add_productsucc');
  };
  const showProductList = () => {
    setShowPreviewModal(false);
    props.onShow();
  };

  const { resetImgColumns, resetTableColumns } = useActions(MailProductActions);

  const resetData = () => {
    setSearchKey('');
    setNoEmpty(false);
    setSelectedRowKeys([]);
    setCurrentPage(1);
    setPagesize(defaultPageSize);
    resetImgColumns();
    resetTableColumns();
    setImgSize(150);
    siteListRef.current = [];
    setSelectSite(['']);
  };

  const destroyModal = () => {
    resetData();
    setShowSampleModal(false);
    setShowPreviewModal(false);
    props.onClose();
  };

  const onChange = (e: any) => {
    setNoEmpty(true);
    e.persist();
    setSearchKey(e.target.value);
  };

  // const productTableLoading = useRef<boolean>(false);
  // const productTableId = useRef<string>();

  const addProduct = () => {
    navigateToProductPage();
  };

  const addProductAndCloseModal = () => {
    destroyModal();
    navigateToProductPage();
  };

  useEffect(() => {
    if (props.visible) {
      setSearchParam({
        keyword: '',
        page: 1,
        pageSize: defaultPageSize,
      });
    }
  }, [props.visible]);

  const isEmpty = !(hasContent || searchKey || noEmpty);

  return (
    <>
      <ConfigProvider locale={zhCN}>
        {props.visible ? (
          <SiriusModal
            title={getIn18Text('XUANZESHANGPIN')}
            width={916}
            visible={props.visible}
            className={style.productSettingModal}
            onOk={onOk}
            onCancel={destroyModal}
            maskClosable={false}
            getContainer={container || '#edm-write-root'}
            footer={isEmpty ? null : undefined}
            zIndex={9999}
          >
            {!isEmpty ? (
              <>
                <div className={style.searchOuter}>
                  <Input
                    className={style.search}
                    value={searchKey}
                    onChange={onChange}
                    onCompositionStart={() => {
                      setIsComposition(true);
                    }}
                    onCompositionEnd={() => {
                      setIsComposition(false);
                    }}
                    placeholder={getIn18Text('QINGSHURUSHANGPINZHONGYING')}
                    prefix={<SearchIcon />}
                    allowClear
                  />
                  <a onClick={checkSample}>{getIn18Text('CHAKANSHILI')}</a>
                </div>
                <div className={style.addWrapper}>
                  <AddIcon />
                  <a className={style.addEntry} onClick={addProduct}>
                    {getTransText('TIANJIASHANGPIN')}
                  </a>
                </div>
                {selectedRowKeys.length > 0 && (
                  <div className={style.chooseProductsOuter}>
                    <div className={style.title}>{getIn18Text('YIXUAN：')}</div>
                    <div className={style.chooseProducts}>
                      {selectedRowKeys.map((id, index) => {
                        const name = allTableMap[id]['product_name_cn'];
                        return (
                          <div className={style.productItem} key={id}>
                            <div className={style.productName}>
                              <EllipsisTooltip>{name}</EllipsisTooltip>
                            </div>
                            <CloseSvg className={style.close} onClick={() => deleteSelectedKey(index)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {hasContent ? (
                  <>
                    <SiriusTable
                      className={style.table}
                      loading={loading}
                      columns={columnslist}
                      dataSource={tableList}
                      pagination={false}
                      rowKey="id"
                      rowSelection={{
                        hideSelectAll: pagesize !== 20,
                        selectedRowKeys,
                        preserveSelectedRowKeys: true,
                        onChange(keys: any) {
                          changeSelectedKeys(keys as string[]);
                        },
                      }}
                    />
                    <div className={style.tablePagination}>
                      <SiriusPagination
                        showTotal={_total => `共${_total}条数据`}
                        showQuickJumper
                        current={currentPage}
                        pageSize={pagesize}
                        total={total}
                        onChange={onPaginationChange}
                        pageSizeOptions={['20', '50', '100']}
                      />
                    </div>
                  </>
                ) : (
                  <EmptyList isCustoms={true} className={style.emptyList}>
                    <div>{getIn18Text('ZANWEIZHAODAOSOUSUONEI')}</div>
                  </EmptyList>
                )}
              </>
            ) : loading ? (
              <Spin tip={getIn18Text('JIAZAIZHONG..')} indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />}>
                <div style={{ height: 380 }}></div>
              </Spin>
            ) : (
              <EmptyList isCustoms={true} className={style.emptyList}>
                <div>{getIn18Text('ZANWUSHANGPINXINXI')}</div>
                <a className={style.sampleLink} onClick={checkSample}>
                  {getIn18Text('CHAKANYANGSHISHILI')}
                </a>
                <Button className={style.addProduct} onClick={addProductAndCloseModal} type="primary">
                  {getTransText('TIANJIASHANGPIN')}
                </Button>
              </EmptyList>
            )}
          </SiriusModal>
        ) : null}
        <ProductSampleModal container={container} visible={showSampleModal} onClose={() => setShowSampleModal(false)} />
        <ProductPreviewModal
          container={container}
          fields={fields}
          fieldsMap={fieldsMap}
          onBack={showProductList}
          onAdd={addProductInEmail}
          selectedRowKeys={selectedRowKeys}
          tableMap={allTableMap}
          siteList={siteListRef.current}
          selectSite={selectSite}
          setSelectSite={setSelectSite}
          visible={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          afterClose={resetData}
          imgSize={imgSize}
          setImgSize={setImgSize}
        />
      </ConfigProvider>
    </>
  );
};
