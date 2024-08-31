import React, { useState, useRef, useCallback, ReactNode } from 'react';
import { Form, message, Menu, Divider, Space, ConfigProvider } from 'antd';
import { navigate } from '@reach/router';
import { useAntdTable } from 'ahooks';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import Dropdown from '@web-common/components/UI/Dropdown/index';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { Empty } from '@web-entry-ff/components/empty';
import { getUnitableCrmHash } from '@web-unitable-crm/api/helper';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/btn-white-arrow-icon.svg';
import FfConfirm from '../customer/components/popconfirm';
import style from './style.module.scss';
import UploadModal from './upload/uploadModal';
import Search from './search';
import PriceTable from './priceTable';
import History from './history';
import Detail from './priceDetail/index';
import Header from './Header';
import Message from './Message';
import { QuoteModal } from './QuoteModal';
// import RouteSearch from './routeSearch';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const PriceManage: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<FFMSRate.ListItem[]>([]);
  const [totalSize, setTotal] = useState(0);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [priceId, setPriceId] = useState<string>('');
  const [detail, setDetail] = useState<FFMSRate.ListItem>();
  const [quoteInfo, setQuoteInfo] = useState<FFMSRate.ListItem[]>([]);
  const messageRef = useRef<any>(null);
  const [form] = Form.useForm();

  async function getPiceList(
    pageInfo: { pageSize: number; current: number; sorter: { field: string; order: string } },
    formParams: Omit<FFMSRate.ListReq, 'page' | 'pageSize'>
  ) {
    // ascend | descend | null
    let sort;
    if (pageInfo?.sorter && pageInfo?.sorter.field && pageInfo?.sorter.order) {
      sort = `${pageInfo?.sorter.field}:${pageInfo?.sorter.order.includes('asc') ? 'asc' : 'desc'}`;
    }
    const params = {
      pageSize: pageInfo.pageSize,
      page: pageInfo.current,
      ...formParams,
      sort,
    };
    const res = await ffmsApi.ffRateList(params);
    const total = res?.totalSize || 0;
    setTotal(total);
    return {
      list: res?.content || [],
      total,
    };
  }

  const { tableProps, search, refresh } = useAntdTable(getPiceList, { form, defaultPageSize: 20 });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;
  const { submit } = search;

  const onDelete = useCallback((id: string) => {
    ffmsApi.deleteFfRate({ freightIdList: [id] }).then(() => {
      message.success('删除成功');
      setSelectedRows([]);
      refresh();
    });
  }, []);

  const downLoad = useCallback(() => {
    ffmsApi.ffRateTemplate().then(res => {
      res?.url ? (window.location.href = res.url) : message.error('下载链接异常');
    });
  }, []);

  const batchDelete = useCallback(() => {
    ffmsApi.deleteFfRate({ freightIdList: selectedRows.map(item => item.freightId) }).then(() => {
      message.success('删除成功');
      setSelectedRows([]);
      refresh();
    });
  }, [selectedRows]);

  const showConfirm = useCallback((content: string | ReactNode, okText?: string) => {
    return new Promise((resove, reject) => {
      Modal.confirm({
        content,
        okText,
        type: 'warning',
        onOk: () => resove(true),
        onCancel: () => reject(),
      });
    });
  }, []);

  const quote = useCallback(
    async (freightItem?: FFMSRate.ListItem) => {
      const freightItemList: FFMSRate.ListItem[] = [];
      if (freightItem) {
        freightItemList.push(freightItem);
      } else {
        let expiredCount = 0;
        selectedRows.forEach(item => {
          if (item?.tagList?.includes('EXPIRED')) {
            expiredCount += 1;
          } else {
            freightItemList.push(item);
          }
        });

        if (expiredCount && !freightItemList.length) {
          // 全部是已过期的情况
          showConfirm('所选航线已过期，请重新选择');
          return;
        }

        if (expiredCount) {
          // 部分已过期 提示
          await showConfirm(`存在${expiredCount}条过期航线，确认删除过期航线并继续报价吗？`, '删除过期航线并报价');
        }
      }

      // 报价
      // await showConfirm('是否确认报价，订阅客户将收到邮件');
      // await ffmsApi.pushToCustomer(freightIdList);
      // !freightId && setSelectedRows([]);
      // SiriusMessage.success({ content: '报价成功' });
      setQuoteInfo(freightItemList);
    },
    [selectedRows]
  );

  const AddPrice = (
    <Dropdown
      trigger={['hover']}
      placement="bottomRight"
      overlay={
        <Menu>
          <Menu.Item onClick={() => navigate(getUnitableCrmHash('/price/effective?page=addPrice'))}>直接录入</Menu.Item>
          <Menu.Item onClick={() => navigate(getUnitableCrmHash('/price/effective?page=uploadPrice'))}>上传文件/图片</Menu.Item>
          <Divider style={{ margin: '5px 0' }} />
          <Menu.Item onClick={downLoad}>
            <span className={style.link}>下载报价文件模板</span>
          </Menu.Item>
        </Menu>
      }
    >
      <Button btnType="primary" className={style.arrowBtn}>
        <span>添加报价</span>
        <span className={style.iconWrapper}>
          <ArrowIcon />
        </span>
      </Button>
    </Dropdown>
  );

  return (
    <div className={style.ffPrice}>
      <Header title="生效报价" handler={<div className={style.rightBtns}>{AddPrice}</div>} />
      {/* <RouteSearch /> */}
      <Message ref={messageRef} update={refresh} />
      <div className={style.ffPriceSearch}>
        <Search form={form} submit={submit} />
      </div>
      <div className={style.ffPriceContent}>
        <div className={style.operateBar}>
          <Space>
            <span>
              共<span className={style.hilight}>{totalSize}</span>
              家公司
            </span>
            <Button className={style.gostBtn} disabled={!selectedRows?.length} onClick={() => quote()} btnType="primary">
              去报价
            </Button>
            <FfConfirm title="确认删除 ?" onConfirm={batchDelete}>
              <Button btnType="minorLine" className={style.gostBtn} disabled={!selectedRows?.length}>
                删除
              </Button>
            </FfConfirm>
          </Space>
        </div>
        <ConfigProvider renderEmpty={() => <Empty>{AddPrice}</Empty>}>
          <PriceTable
            rowKey="freightId"
            onQuote={quote}
            onChangeDetail={(id: string, row?: FFMSRate.ListItem) => {
              setPriceId(id);
              setDetailVisible(true);
              setDetail(row);
            }}
            onDelete={onDelete}
            onValid={() => setDetailVisible(true)}
            checkHistory={(id: string, row?: FFMSRate.ListItem) => {
              setHistoryVisible(true);
              setPriceId(id);
              setDetail(row);
            }}
            rowSelection={{
              type: 'checkbox',
              preserveSelectedRowKeys: true,
              onChange: (_, _selectedRows: FFMSRate.ListItem[]) => {
                setSelectedRows(_selectedRows);
              },
              selectedRowKeys: selectedRows.map(item => item.freightId),
            }}
            {...tableProps}
          />
        </ConfigProvider>
      </div>
      <UploadModal
        visible={visible}
        onCancel={() => setVisible(false)}
        onSuccess={() => {
          setVisible(false);
          refresh();
          messageRef.current?.getImportInfo();
        }}
      />
      <Detail
        visible={detailVisible}
        rowDetail={detail}
        id={priceId}
        onCancel={() => {
          setDetailVisible(false);
          setPriceId('');
        }}
        onSuccess={() => {
          setDetailVisible(false);
          refresh();
          setPriceId('');
        }}
      />
      <History visible={historyVisible} id={priceId} rowDetail={detail} onCancel={() => setHistoryVisible(false)} />
      <QuoteModal
        visible={Boolean(quoteInfo.length)}
        onCancel={() => setQuoteInfo([])}
        rows={quoteInfo}
        onSuccess={() => {
          setSelectedRows([]);
          setQuoteInfo([]);
          SiriusMessage.success({ content: '报价成功' });
        }}
      />
    </div>
  );
};
export default PriceManage;
