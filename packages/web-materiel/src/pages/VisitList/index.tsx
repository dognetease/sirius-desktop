import React, { useState, useEffect } from 'react';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import classnames from 'classnames';
// import { EnhanceSelect as Select, InMultiOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
// import DatePicker from '@web-common/components/UI/DatePicker';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
import { MaterielApi, MaterielShareAccount, MaterielShareVisitListReq, ShareVisitResponse, apiHolder, apis } from 'api';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { FileCard } from '@web-materiel/components/FileCard';
import moment from 'moment';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { enhanceLink } from '../../utils';
import styles from './index.module.scss';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;
const { RangePicker } = DatePicker;
const VisitList = () => {
  const [accounts, setAccounts] = useState<MaterielShareAccount[]>([]);
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [fetching, setFetching] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [params, setParams] = useState<MaterielShareVisitListReq>({
    page: 1,
    pageSize: 20,
    accIds: [],
  });
  const [total, setTotal] = useState<number>(0);
  const [visitUrl, setVisitUrl] = useState<string | null>(null);
  const previewSrc = visitUrl ? enhanceLink(visitUrl, { preview: 1 }) : undefined;
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    materielApi.getShareAccounts().then(accounts => {
      setAccounts(accounts || []);
    });
  }, []);

  const onCardClick = (item: ShareVisitResponse) => {
    setPreviewVisible(true);
    setVisitUrl(item.shareLink || '');
  };

  const columns: ColumnsType<ShareVisitResponse> = [
    {
      title: '文件名',
      fixed: 'left',
      width: 200,
      ellipsis: true,
      dataIndex: 'fileName',
      className: styles.maxWidthCell,
      render: (_, item: ShareVisitResponse) => <FileCard onClick={() => onCardClick(item)} className={styles.visitFileCard} fileName={item.fileName} iconSize={28} />,
    },
    {
      title: '访问 IP',
      width: 200,
      dataIndex: 'userIp',
      className: styles.maxWidthCell,
    },
    {
      title: '访问时间',
      width: 200,
      ellipsis: true,
      dataIndex: 'visitAt',
    },
    {
      title: '访问国家',
      width: 150,
      dataIndex: 'country',
    },
    {
      title: '访问来源',
      width: 200,
      dataIndex: 'userNumber',
      render: (_, item: ShareVisitResponse) => <span>{item.userNumber}分享</span>,
    },
  ];

  const handleRangeChange = (values: any) => {
    const nextParams: MaterielShareVisitListReq = {
      ...params,
      startTime: undefined,
      endTime: undefined,
      page: 1,
    };
    if (values && values[0] && values[1]) {
      nextParams.startTime = values[0].startOf('day').valueOf();
      nextParams.endTime = values[1].endOf('day').valueOf();
    }
    setParams(nextParams);
    handleFetch(nextParams);
  };

  const handleFetch = (params: MaterielShareVisitListReq) => {
    setFetching(true);
    materielApi
      .getShareVisitList(params)
      .then(res => {
        setData(res?.content || []);
        setTotal(res?.totalSize || 0);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  useEffect(() => {
    handleFetch(params);
  }, []);

  return (
    <div className={classnames(styles.visitList, layout.container)}>
      <div className={classnames(styles.title, layout.static)}>访问列表</div>
      <div className={classnames(styles.filter, layout.static)}>
        <Select
          className={styles.select}
          placeholder="请选择员工"
          mode="multiple"
          maxTagCount="responsive"
          value={params.accIds}
          allowClear
          onChange={accIds => {
            const nextParams: MaterielShareVisitListReq = { ...params, accIds, page: 1 };
            setParams(nextParams);
            handleFetch(nextParams);
          }}
        >
          {accounts.map(item => (
            <Option value={item.accId}>{item.nickName}</Option>
          ))}
        </Select>
        <RangePicker
          className={styles.rangePicker}
          placeholder={['开始时间', '结束时间']}
          allowClear
          separator="~"
          value={params.startTime && params.endTime ? [moment(params.startTime), moment(params.endTime)] : undefined}
          onChange={handleRangeChange}
        />
      </div>
      <div className={classnames(styles.tableWrapper, layout.grow)} ref={growRef}>
        <Table
          className={styles.table}
          loading={fetching}
          columns={columns as any}
          dataSource={data}
          scroll={{ x: 'max-content', y: scrollY }}
          pagination={{
            total,
            current: params.page,
            pageSize: params.pageSize,
            showTotal: (total: number) => `共 ${total} 条数据`,
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={(pagination: any) => {
            const nextParams: MaterielShareVisitListReq = {
              ...params,
              pageSize: pagination.pageSize as number,
              page: pagination.pageSize === params.pageSize ? (pagination.current as number) : 1,
            };
            setParams(nextParams);
            handleFetch(nextParams);
          }}
        />
      </div>
      <Modal
        className={styles.visitPreview}
        title="文件预览"
        width={700}
        visible={previewVisible}
        footer={null}
        onCancel={() => {
          setVisitUrl(null);
          setPreviewVisible(false);
        }}
      >
        <iframe className={styles.previewIframe} src={previewSrc} />
      </Modal>
    </div>
  );
};

export default VisitList;
