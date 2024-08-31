import { getIn18Text } from 'api';
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { api, InsertWhatsAppApi, WAOperationLog, apis } from 'api';
import { ColumnsType } from 'antd/lib/table';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right.svg';
import style from './index.module.scss';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

export const WaOperateLog = () => {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<WAOperationLog[]>([]);

  const fetchData = (curr: number = 1) => {
    setLoading(true);
    whatsAppApi
      .getOperateLog({ page: curr, pageSize: 20 })
      .then(res => {
        setList(res.content);
        setTotal(res.totalSize);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const columns: ColumnsType<WAOperationLog> = [
    {
      key: 'operateAt',
      title: getIn18Text('SHIJIAN'),
      dataIndex: 'operateAt',
      render(timeStr) {
        return commonDateUnitFormat(moment(timeStr).valueOf());
      },
    },
    {
      key: 'operator',
      title: getIn18Text('YEWUYUAN'),
      dataIndex: 'operator',
    },
    {
      key: 'operateContent',
      title: getIn18Text('ZHONGDIANGUANZHUXINGWEI'),
      dataIndex: 'operateContent',
    },
    {
      key: 'customerName',
      title: getIn18Text('KEHUMINGCHENG'),
      dataIndex: 'customerName',
    },
  ];

  return (
    <div className={style.page}>
      <header className={style.breadCrumb}>
        <span>{getIn18Text('Whatsap')}</span>
        <ArrowRight />
        <span className={style.curr}>关注列表</span>
      </header>
      <div className={style.tableWrap}>
        <SiriusTable
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={{
            showSizeChanger: false,
            current: page,
            pageSize: 20,
            total,
            hideOnSinglePage: true,
            onChange: (page: number) => {
              setPage(page);
              fetchData(page);
            },
          }}
        />
      </div>
    </div>
  );
};
