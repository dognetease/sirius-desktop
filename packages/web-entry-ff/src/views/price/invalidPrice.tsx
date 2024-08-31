import React, { useState, useRef } from 'react';
import { Form, message, ConfigProvider } from 'antd';
import { useAntdTable } from 'ahooks';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { Empty } from '@web-entry-ff/components/empty';
import UploadModel from './upload/uploadModal';
import Search from './search';
import PriceTable from './priceTable';
import Detail from './priceDetail/index';
import Header from './Header';
import Message from './Message';
import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

const PriceManage: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [priceId, setPriceId] = useState<string>('');
  const [form] = Form.useForm();
  const messageRef = useRef<any>(null);

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
      updateDateScope: formParams?.updateDateScope || '',
    };
    const res = await ffmsApi.ffRateDraftList(params);
    return {
      list: res?.content || [],
      total: res?.totalSize || 0,
    };
  }

  const { tableProps, search, refresh } = useAntdTable(getPiceList, { form, defaultPageSize: 20 });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;
  const { submit } = search;

  const onDelete = (id: string) => {
    ffmsApi.deleteFfRateDraft({ freightDraftIdList: [id] }).then(() => {
      message.success('删除成功');
      refresh();
    });
  };

  return (
    <div className={style.ffPrice}>
      <Header title="待生效报价" subTitle="上传过程中，数据不完整的将会被存储为待生效报价，修改补充后即可生效。" />
      <Message ref={messageRef} update={refresh} />
      <div className={style.ffPriceSearch}>
        <Search form={form} submit={submit} dataType="draft" />
      </div>
      <div className={style.ffPriceContent}>
        <ConfigProvider renderEmpty={() => <Empty />}>
          <PriceTable
            tableType="draft"
            onChangeDetail={(id: string) => {
              setPriceId(id);
              setDetailVisible(true);
            }}
            onDelete={onDelete}
            onValid={() => setDetailVisible(true)}
            {...tableProps}
          />
        </ConfigProvider>
      </div>
      <UploadModel
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
        id={priceId}
        dataType="draft"
        onCancel={() => {
          setPriceId('');
          setDetailVisible(false);
        }}
        onSuccess={() => {
          setDetailVisible(false);
          refresh();
          messageRef.current?.getImportInfo();
          setPriceId('');
        }}
      />
    </div>
  );
};
export default PriceManage;
