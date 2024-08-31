import { getIn18Text } from 'api';
/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useState, useCallback } from 'react';
import { Table, Input, Button, Spin, ConfigProvider, Tooltip, Alert } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { debounce } from 'lodash';
import { TablePaginationConfig } from 'antd/lib/table';
import { EmptyList } from '@web-edm/components/empty/empty';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { navigateToProductPage } from '@web-unitable-crm/api/helper';
import style from './productSelectModal.module.scss';
import useTableDataLoader from '@web-edm/hooks/useTableDataLoader';
import { ReactComponent as CloseSvg } from '@/images/icons/edm/close.svg';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apis, MailProductApi, WaimaoProductListReq } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { ReactComponent as AddIcon } from '@/images/icons/waimao/add.svg';

const productApi = api.api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;

interface ProductSelectModalProps {
  visible: boolean;
  getContainer?: () => HTMLElement;
  defaultValue?: string[];
  defaultProductMap?: Array<{ id: string; name: string }>;
  pictureRequired?: boolean;
  onClose: () => void;
  onOk: (selectedKeys: string[], goods: Array<{ id: string; name: string }>) => void;
  container?: string;
}

const defaultPageSize = 20;

export const ProductSelectModal = (props: ProductSelectModalProps) => {
  if (process.env.BUILD_ISLINGXI) return null;
  // 这个组件在营销和普通邮件的插入商品信息中共用， 所以需要区分一个modal的container
  const { container, pictureRequired } = props;
  const [currentPage, setCurrentPage] = useState<number | undefined>(1);
  const [pagesize, setPagesize] = useState<number | undefined>(defaultPageSize);
  const [searchKey, setSearchKey] = useState('');
  const [isComposition, setIsComposition] = useState<boolean>(false);

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

  const [noEmpty, setNoEmpty] = useState(false);
  const [allTableMap, setAllTableMap] = useState<Record<string, { product_name_cn: string }>>(() => {
    const res: Record<string, { product_name_cn: string }> = {};
    if (props.defaultProductMap) {
      props.defaultProductMap.forEach(({ id, name }) => {
        res[id] = {
          product_name_cn: name,
        };
      });
    }
    return res;
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(props.defaultValue || []);
  const [columnslist, setColumnslist] = useState([]);
  const [searchParam, setSearchParam] = useState<Partial<WaimaoProductListReq>>({
    keyword: '',
    page: 1,
    pageSize: defaultPageSize,
  });

  const { loading, hasContent, tableList, tableMap, total } = useTableDataLoader(productApi, 'getWaimaoProductList', searchParam);

  useEffect(() => {
    setAllTableMap({
      ...allTableMap,
      ...tableMap,
    });
  }, [tableMap]);

  const changeSelectedKeys = (val: string[]) => {
    if (val.length > 1200) {
      toast.error({ content: getIn18Text('BUNENGCHAOGUO120') });
    } else {
      setSelectedRowKeys(val);
    }
  };

  const deleteSelectedKey = (index: number) => {
    selectedRowKeys.splice(index, 1);
    setSelectedRowKeys([...selectedRowKeys]);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    const { current, pageSize } = pagination;
    setCurrentPage(current);
    setPagesize(pageSize);
    setSearchParam({
      ...searchParam,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const onOk = async () => {
    const values = selectedRowKeys.map(key => ({
      id: key,
      name: allTableMap[key].product_name_cn,
    }));
    props.onOk(selectedRowKeys, values);
    props.onClose();
  };

  const resetData = () => {
    setSearchKey('');
    setNoEmpty(false);
    setSelectedRowKeys([]);
    setCurrentPage(1);
    setPagesize(defaultPageSize);
  };

  const destroyModal = () => {
    resetData();
    props.onClose();
  };

  const onChange = (e: any) => {
    setNoEmpty(true);
    e.persist();
    setSearchKey(e.target.value);
  };

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
          getContainer={container}
          footer={isEmpty ? null : undefined}
          zIndex={9999}
        >
          {!isEmpty ? (
            <>
              <Alert
                className={style.notice}
                message={
                  <div>
                    {!pictureRequired ? getIn18Text('SHANGPINMINGCHENG，SHANGPIN') : getIn18Text('NINXUANZELEIns')}
                    <a onClick={addProduct}>{getIn18Text('BENDISHANGPIN')}</a>
                    {getIn18Text('MOKUAI，BUCHONGXIANGGUAN')}
                  </div>
                }
                type="warning"
                showIcon
              />
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
                  placeholder={getIn18Text('QINGSOUSUOMINGCHENG/I')}
                  prefix={<SearchIcon />}
                  allowClear
                />
              </div>
              <div className={style.addWrapper}>
                <AddIcon />
                <a className={style.addEntry} onClick={addProduct}>
                  {getIn18Text('TIANJIASHANGPIN')}
                </a>
              </div>
              {selectedRowKeys.length > 0 && (
                <div className={style.chooseProductsOuter}>
                  <div className={style.title}>{getIn18Text('YIXUAN：')}</div>
                  <div className={style.chooseProducts}>
                    {selectedRowKeys.map((id, index) => {
                      if (!allTableMap[id]) {
                        console.error(`商品id: ${id}不存在`);
                        return null;
                      }
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
                <Table
                  className={style.table}
                  loading={loading}
                  columns={columnslist}
                  dataSource={tableList}
                  pagination={{
                    size: 'small',
                    total,
                    pageSize: pagesize,
                    pageSizeOptions: ['20', '50', '100'],
                    showSizeChanger: true,
                    current: currentPage,
                    defaultCurrent: 1,
                  }}
                  onChange={handleTableChange}
                  rowKey="id"
                  rowSelection={{
                    selectedRowKeys,
                    preserveSelectedRowKeys: true,
                    getCheckboxProps(record) {
                      const pictures = record.pictures || [];
                      const pictureRequiredError = pictureRequired && !pictures.length;

                      return {
                        disabled: !record.product_description_en || pictureRequiredError,
                      };
                    },
                    onChange(keys) {
                      changeSelectedKeys(keys as string[]);
                    },
                  }}
                />
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
              <Button className={style.addProduct} onClick={addProductAndCloseModal} type="primary">
                {getIn18Text('TIANJIASHANGPIN')}
              </Button>
            </EmptyList>
          )}
        </SiriusModal>
      ) : null}
    </ConfigProvider>
  );
};

const getColumns = () => {
  return [
    {
      title: getIn18Text('SHANGPINZHONGWENMINGCHENG'),
      dataIndex: 'product_name_cn',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    // {
    //   title: '商品英文名称',
    //   width: 120,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   dataIndex: 'product_name_en',
    //   render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    // },
    // {
    //   title: '商品编号',
    //   width: 120,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   dataIndex: 'product_number',
    //   render: (text: string) =>  <EllipsisTooltip>{ text || '-' }</EllipsisTooltip>,
    // },
    // {
    //   title: '颜色',
    //   width: 80,
    //   ellipsis: {
    //     showTitle: false,
    //   },
    //   dataIndex: 'color',
    //   render: (text: string) =>  <EllipsisTooltip>{ text || '-' }</EllipsisTooltip>,
    // },
    // {
    //     title: '销售币种',
    //     width: 80,
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     dataIndex: 'price_currency',
    //     render:(text: string) =>  <EllipsisTooltip>{ text || '-' }</EllipsisTooltip>,
    // },
    // {
    //     title: '销售单价',
    //     width: 80,
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     dataIndex: 'price',
    //     render:(text: string) =>  <EllipsisTooltip>{ text || '-' }</EllipsisTooltip>,
    // },
    // {
    //     title: '商品型号',
    //     width: 150,
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     dataIndex: 'length',
    //     render: (_: string, record: any) => {
    //         let str = '';
    //         if (record.length) {
    //             str += `L(${record.length})`;
    //         }
    //         if (record.width) {
    //             if (str) {
    //                 str += '*'
    //             }
    //             str += `W(${record.width})`;
    //         }
    //         if (record.height) {
    //             if (str) {
    //                 str += '*'
    //             }
    //             str += `H(${record.height})`;
    //         }
    //         return <EllipsisTooltip>{str || '-'}</EllipsisTooltip>
    //     },
    // },
    {
      title: getIn18Text('TUPIAN'),
      width: 120,
      dataIndex: 'pictures',
      render: (images: any) => {
        try {
          // console.log('productSelect', images);
          return (
            <>
              {images.slice(0, 3).map((img: any) => (
                <img src={img.url} height="20" />
              ))}
            </>
          );
        } catch (e) {
          return null;
        }
      },
    },
    {
      // title: (
      //   <span>
      //     商品介绍（英文）
      //     <Tooltip
      //       zIndex={10000}
      //       title="商品介绍（英文）样例：Our products have served many customers at home and abroad, with high quality and low price, and trustworthy"
      //     >
      //       <TongyongYiwenMian />
      //     </Tooltip>
      //   </span>
      // ),
      title: getIn18Text('SHANGPINJIESHAO（YINGWEN'),
      width: 120,
      ellipsis: {
        showTitle: true,
      },
      dataIndex: 'product_description_en',
      render: (text: string) => text || '-',
    },
  ];
};
