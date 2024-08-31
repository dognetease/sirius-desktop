import React, { useState, useEffect } from 'react';
import { Button, Table, Form, Select, Tooltip, Tag } from 'antd';
import { useAntdTable } from 'ahooks';
import { apiHolder, apis, FFMSApi, FFMSStatic } from 'api';
import { Moment } from 'moment';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { RangePicker } from '../RangePicker';
import { OperationDetail } from './operationDetail';
import { CustomerTypeSelect } from './customerTypeSelect';
import style from './style.module.scss';

interface Props {
  departurePortCode?: string;
  destinationPortCode?: string;
  type?: LogType;
  title?: string;
}

export enum LogType {
  PortState = 'PortState',
  Global = 'Global',
}

interface PageInfo {
  current: number;
  pageSize: number;
}

interface SearchForm {
  customerType: string;
  visitDate: [Moment, Moment];
  haveEmail: string;
  customerTypeId: string;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const AccessLog: React.FC<Props> = props => {
  const { departurePortCode, destinationPortCode, title, type } = props;
  const [form] = Form.useForm<SearchForm>();
  const [selectEmails, setSelectEmails] = useState<string[]>([]);
  const [selectRowKeys, setSelectRowKeys] = useState<string[]>([]);
  const [detailModal, setDetailModal] = useState<{ open: boolean; visitId: string }>({ open: false, visitId: '' });
  const [emailList, setEmailList] = useState<Array<IEdmEmailList>>([]);
  useEdmSendCount(emailList, undefined, undefined, undefined, 'ffms', 'ffms');

  const getTableData = async ({ current, pageSize }: PageInfo, formData: SearchForm) => {
    // 港口排名 必须选择后才能查询
    if (type === LogType.PortState && (!destinationPortCode || !destinationPortCode)) {
      return {
        total: 0,
        list: [],
      };
    }

    const params: FFMSStatic.VisitListReq = {
      type: FFMSStatic.StaticType.MINE,
      customerType: formData.customerType,
      customerTypeId: formData.customerTypeId,
      haveEmail: formData.haveEmail ? (formData.haveEmail === 'Y' ? true : false) : '',
      visitDateScope: (formData.visitDate || [])
        .filter(Boolean)
        .map(moment => moment.format('YYYY/MM/DD'))
        .join(':'),
      page: current,
      pageSize,
    };

    if (departurePortCode && destinationPortCode) {
      // 必须同时存在才添加港口参数
      params.departurePortCode = departurePortCode;
      params.destinationPortCode = destinationPortCode;
    }

    const res = await ffmsApi.getVisiteList(params);
    return {
      total: res?.totalSize ?? 0,
      list: res?.content ?? [],
    };
  };

  const { tableProps, search } = useAntdTable(getTableData, {
    defaultPageSize: 20,
    form,
  });

  const { submit } = search;

  useEffect(() => {
    if (type === LogType.PortState && departurePortCode && destinationPortCode) {
      submit();
    }
  }, [departurePortCode, destinationPortCode]);

  const sendEdm = () => {
    setEmailList(selectEmails.map(email => ({ contactEmail: email, contactName: '', sourceName: '货代平台数据统计' })));
    setSelectRowKeys([]);
    setSelectEmails([]);
  };

  const columns = [
    {
      title: '访问时间',
      dataIndex: 'visitAt',
    },
    {
      title: '企业名称',
      dataIndex: 'customerName',
      render(value: string, row: FFMSStatic.VisitListItem) {
        return (
          <>
            {row.customerTypeName ? <Tag className={style[row.customerTypeColor]}>{row.customerTypeName}</Tag> : ''}
            {value || '--'}
          </>
        );
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '访问时长',
      dataIndex: 'visitTime',
    },
    {
      title: '是否申请',
      dataIndex: 'booking',
      render(isbooking: boolean) {
        return isbooking ? '是' : '否';
      },
    },
    {
      title: '查询内容',
      width: 130,
      render(_: string, row: FFMSStatic.VisitListItem) {
        return (
          <span
            className={style.linkBtn}
            onClick={() =>
              setDetailModal({
                open: true,
                visitId: row.visitId,
              })
            }
          >
            查看
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className={style.head}>
        <span className={style.title}>{title || '访问记录'}</span>
      </div>
      <div className={style.operate}>
        <div className={style.searchForm}>
          <Form form={form} layout="inline">
            <Form.Item name="customerTypeId" label="客户类型">
              <CustomerTypeSelect
                style={{ width: 130, marginRight: 16 }}
                allowClear
                onChange={(_, item: any) => {
                  form.setFieldsValue({ customerType: item?.customerType });
                  submit();
                }}
                placeholder="请选择"
              />
            </Form.Item>
            <Form.Item name="customerType" label="客户类型Type" hidden></Form.Item>
            <Form.Item name="haveEmail" label="是否有邮箱">
              <Select style={{ width: 120, marginRight: 16 }} allowClear onChange={submit} placeholder="请选择">
                <Select.Option value="Y">是</Select.Option>
                <Select.Option value="N">否</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="visitDate" label="时间段">
              <RangePicker onChange={submit} />
            </Form.Item>
          </Form>
        </div>
        <div className={style.opBtn}>
          <Tooltip title={!selectEmails.length ? '选择有邮箱的客户后才能进行一键营销' : ''} placement="rightTop">
            <Button type="primary" disabled={!selectEmails.length} onClick={sendEdm}>
              邮件营销
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <Table
          {...tableProps}
          rowKey="visitId"
          columns={columns}
          rowSelection={{
            type: 'checkbox',
            preserveSelectedRowKeys: true,
            selectedRowKeys: selectRowKeys,
            onChange: (rowKeys: React.Key[], selectedRows: FFMSStatic.VisitListItem[]) => {
              setSelectRowKeys(rowKeys as string[]);
              setSelectEmails((selectedRows || []).map(item => item.email).filter(Boolean));
            },
          }}
        />
      </div>

      <OperationDetail
        open={detailModal.open}
        visitId={detailModal.visitId}
        onClose={() => {
          setDetailModal({ open: false, visitId: '' });
        }}
      />
    </div>
  );
};
