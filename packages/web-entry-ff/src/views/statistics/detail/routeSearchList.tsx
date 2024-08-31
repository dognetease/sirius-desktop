import React, { useState, useEffect } from 'react';
import { Table, Form } from 'antd';
import { useAntdTable } from 'ahooks';
import { apiHolder, apis, FFMSApi, FFMSStatic } from 'api';
import { Moment } from 'moment';
import { RangePicker } from '../common/RangePicker';
import { PortSelect } from './portSelect';
import style from './style.module.scss';

interface Props {
  onSelect?: (row: FFMSStatic.PortState) => void;
}

interface PageInfo {
  current: number;
  pageSize: number;
}

interface SearchForm {
  departurePortCode: string;
  destinationPortCode: string;
  visitDate: [Moment, Moment];
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const RouteSearchList: React.FC<Props> = props => {
  const { onSelect } = props;
  const [form] = Form.useForm();
  const [portList, setPortList] = useState<{ label: string; value: string }[]>([]);

  const getPostList = async () => {
    const res = await ffmsApi.ffPortList();
    const options = (res || []).map(item => {
      return {
        label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
        value: item.code,
      };
    });
    setPortList(options);
  };

  useEffect(() => {
    getPostList();
  }, []);

  const getTableData = async (_: PageInfo, formData: SearchForm) => {
    const params = {
      type: FFMSStatic.StaticType.MINE,
      departurePortCode: formData.departurePortCode,
      destinationPortCode: formData.destinationPortCode,
      visitDateScope: (formData.visitDate || [])
        .filter(Boolean)
        .map(moment => moment.format('YYYY/MM/DD'))
        .join(':'),
      page: 1,
      pageSize: 30,
    };

    const res = await ffmsApi.getPortState(params);
    return {
      total: res?.totalSize ?? 0,
      list: res?.content ?? [],
    };
  };

  const { tableProps, search } = useAntdTable(getTableData, {
    defaultPageSize: 30,
    form,
  });

  const { submit } = search;

  const columns = [
    {
      title: '起始港口',
      render(_: string, row: FFMSStatic.PortState) {
        return `${row?.departurePort?.cnName} ${row?.departurePort?.enName}`;
      },
    },
    {
      title: '目的港口',
      render(_: string, row: FFMSStatic.PortState) {
        return `${row?.destinationPort?.cnName} ${row?.destinationPort?.enName}`;
      },
    },
    {
      title: '查询次数',
      width: 100,
      dataIndex: 'querySum',
    },
    {
      title: '曝光航线数',
      width: 110,
      dataIndex: 'exposureSum',
    },
    {
      title: '航线操作数',
      width: 110,
      dataIndex: 'operateSum',
    },
    {
      title: '操作',
      width: 90,
      render(_: string, row: FFMSStatic.PortState) {
        return (
          <span
            className={style.linkBtn}
            onClick={() => {
              onSelect && onSelect(row);
            }}
          >
            访问记录
          </span>
        );
      },
    },
  ];

  return (
    <div className={style.routeSearchList}>
      <div className={style.head}>
        <span className={style.title}>航线搜索排名</span>
      </div>
      <div className={style.operate}>
        <div className={style.searchForm}>
          <Form
            form={form}
            layout="inline"
            initialValues={{
              departurePortCode: undefined,
              destinationPortCode: undefined,
              visitDate: [moment().add(-1, 'month'), moment()],
            }}
          >
            <Form.Item name="departurePortCode" label="起始港">
              <PortSelect options={portList} onChange={submit} />
            </Form.Item>
            <Form.Item name="destinationPortCode" label="目的港">
              <PortSelect options={portList} onChange={submit} />
            </Form.Item>
            <Form.Item name="visitDate" label="时间段">
              <RangePicker allowClear={false} onChange={submit} />
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className={style.items}>
        <Table {...tableProps} pagination={false} columns={columns} scroll={{ y: 300 }} />
      </div>
    </div>
  );
};
