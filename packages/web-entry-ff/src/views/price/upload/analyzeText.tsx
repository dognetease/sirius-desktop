import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Popover, message, Button, Alert, InputNumber, Tooltip } from 'antd';
import icon from '@web-common/components/UI/Icons/svgs';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
const { TongyongYiwenMian } = icon;
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { useMount } from 'ahooks';
import { FfDatePicker } from '../search/quickTime';
import cloneDeep from 'lodash/cloneDeep';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { ColumnsType } from 'antd/es/table';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Editor from './editor';
import { isPriceError } from './util';
import BatchChangeModal from './batchChange';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';
import style from './analyzeText.module.scss';

const dateFormat = 'YYYY/MM/DD';
const MAX_NUMS = 40;

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface ImageProps {
  dataSource: FFMSRate.ListItem[];
  setDataSource: (data: FFMSRate.ListItem[]) => void;
  error: boolean;
}
type FieldKeys = keyof FFMSRate.ListItem;

export const AnalyzeText: React.FC<ImageProps> = ({ dataSource, setDataSource, error }) => {
  const [value, setValue] = useState<string>();
  const [portList, setPortList] = useState<FFMSRate.Option[]>([]);
  const [carrierList, setCarrierList] = useState<FFMSRate.Option[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnsType<Record<string, string>>>([]);
  const { state } = useContext(GlobalContext);

  const hasKeys = (allValues: FFMSRate.ListItem) => {
    type allkeys = keyof FFMSRate.ListItem;
    let keys = ['sailingDate', 'arriveDate', 'voyage'];
    let hasValue: string[] = [];
    keys.forEach(key => {
      if (allValues[key as allkeys]) {
        hasValue.push(key);
      }
    });
    return hasValue;
  };

  const changeVoyage = (allValues: FFMSRate.ListItem) => {
    let start = moment(allValues.sailingDate).format('x');
    let end = moment(allValues.arriveDate).format('x');
    return (Number(end) - Number(start)) / (24 * 60 * 60 * 1000);
  };

  const changeArriveDate = (allValues: FFMSRate.ListItem) => {
    return moment(allValues.sailingDate).add(allValues.voyage, 'days').format(dateFormat);
  };

  const setProp = <T, K extends keyof T>(map: T, key: K, val: T[K]): T => {
    map[key] = val;
    return map;
  };
  const onChange = (index: number, field: FieldKeys, newValue: string) => {
    let rowData = cloneDeep(dataSource)[index];
    // rowData[field] = newValue;
    rowData = setProp(rowData, field, newValue);
    let allKeys = hasKeys(rowData);
    if (allKeys.length === 3) {
      if (field === 'sailingDate' || field === 'arriveDate') {
        rowData.voyage = changeVoyage(rowData);
      }
      if (field === 'voyage') {
        rowData.arriveDate = changeArriveDate(rowData);
      }
    }
    if (allKeys.length === 2) {
      if (!allKeys.includes('voyage') && field !== 'voyage') {
        rowData.voyage = changeVoyage(rowData);
      }
      if (!allKeys.includes('arriveDate') && field !== 'arriveDate') {
        rowData.arriveDate = changeArriveDate(rowData);
      }
    }
    setDataSource(pre => {
      pre[index] = rowData;
      return [...pre];
    });
  };

  const canAdd = useMemo(() => {
    return dataSource.length < 40 && dataSource.length !== 0;
  }, [dataSource]);

  const errorDom = (value: string, isError?: boolean) => {
    if (error && (!value || isError)) {
      return (
        <div className={style.error}>
          <Tooltip title={isError ? '默认为20GP/40GP/40HQ的美元价格，多个价格请用/隔开，若仅输入2个价格则默认代表20GP/40HQ，且40GP=40HQ' : '必填字段'}>
            <ExclamationCircleOutlined />
          </Tooltip>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const list: ColumnsType<Record<string, string>> = [
      {
        title: () => <span className={style.tableTitleRequired}>{'起运港'}</span>,
        dataIndex: 'departurePortCode',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <EnhanceSelect
              style={{ width: 150 }}
              value={value}
              onChange={value => onChange(index, 'departurePortCode', value as string)}
              showSearch={true}
              optionFilterProp="label"
              size="large"
              placeholder={'请选择起运港'}
              options={state.departurePortOptions}
            ></EnhanceSelect>
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'目的港'}</span>,
        dataIndex: 'destinationPortCode',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <EnhanceSelect
              style={{ width: 150 }}
              value={value}
              onChange={value => onChange(index, 'destinationPortCode', value as string)}
              showSearch={true}
              optionFilterProp="label"
              size="large"
              placeholder={'请选择目的港'}
              options={portList}
            ></EnhanceSelect>
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'船司'}</span>,
        dataIndex: 'carrier',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <EnhanceSelect
              style={{ width: 150 }}
              value={value}
              onChange={value => onChange(index, 'carrier', value as string)}
              showSearch={true}
              optionFilterProp="label"
              size="large"
              placeholder={'请选择船司'}
              options={carrierList}
            ></EnhanceSelect>
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => <span>{'航线'}</span>,
        dataIndex: 'route',
        render: (value, row, index) => (
          <Input
            style={{ width: 150 }}
            maxLength={64}
            onChange={e => onChange(index, 'route', e.target.value as string)}
            value={value}
            placeholder={'请输入航线'}
          ></Input>
        ),
      },
      {
        title: () => <span>{'船只'}</span>,
        dataIndex: 'vessel',
        render: (value, row, index) => (
          <Input
            style={{ width: 150 }}
            maxLength={64}
            onChange={e => onChange(index, 'vessel', e.target.value as string)}
            value={value}
            placeholder={'请输入船只'}
          ></Input>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'价格'}</span>,
        dataIndex: 'price',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <Input style={{ width: 150 }} onChange={e => onChange(index, 'price', e.target.value as string)} value={value} placeholder={'请输入价格'}></Input>
            {errorDom(value, isPriceError(value))}
          </div>
        ),
      },
      {
        title: () => <span>{'截止日'}</span>,
        dataIndex: 'expiryDate',
        render: (value, row, index) => (
          <FfDatePicker
            style={{ width: 150 }}
            onChange={time => onChange(index, 'expiryDate', time as string)}
            value={value}
            format={dateFormat}
            placeholder={'请输入截止日'}
          ></FfDatePicker>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'出发日'}</span>,
        dataIndex: 'sailingDate',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <FfDatePicker
              style={{ width: 150 }}
              onChange={time => onChange(index, 'sailingDate', time as string)}
              value={value}
              format={dateFormat}
              placeholder={'请输入出发日'}
            ></FfDatePicker>
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'航程'}</span>,
        dataIndex: 'voyage',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <InputNumber style={{ width: 150 }} onChange={e => onChange(index, 'voyage', e as string)} value={value} placeholder={'请输入航程'}></InputNumber>
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => <span className={style.tableTitleRequired}>{'参考到港日'}</span>,
        dataIndex: 'arriveDate',
        render: (value, row, index) => (
          <div className={style.tableCol}>
            <FfDatePicker
              style={{ width: 150 }}
              onChange={time => onChange(index, 'arriveDate', time as string)}
              value={value}
              format={dateFormat}
              placeholder={'请输入参考到港日'}
            ></FfDatePicker>{' '}
            {errorDom(value)}
          </div>
        ),
      },
      {
        title: () => (
          <div className={style.rowTitle}>
            {'其他'}
            <Tooltip title={'非标准字段数据无法识别，会将数据统一汇总到其他'}>
              <TongyongYiwenMian />
            </Tooltip>
          </div>
        ),
        className: style.maxWidthCell,
        ellipsis: true,
        dataIndex: 'rowText',
        fixed: 'right',
        render: value => (
          <>
            {value ? (
              <Popover placement="bottomRight" content={<div style={{ padding: 16 }}>{value}</div>} trigger="hover">
                <span>{value}</span>
              </Popover>
            ) : (
              '-'
            )}
          </>
        ),
      },
    ];
    setColumns(list);
  }, [portList, state.departurePortOptions, carrierList, error, dataSource]);

  const getCarrierList = () => {
    ffmsApi.ffCarrierList().then(res => {
      setCarrierList(() => {
        return (res || []).map(item => {
          return {
            label: `${item.carrier} ${item.cnName}`,
            value: item.carrier,
          };
        });
      });
    });
  };

  const getFfPortList = () => {
    ffmsApi.ffPermissionsPortList().then(res => {
      setPortList(() =>
        (res || []).map(item => {
          return {
            label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
            value: item.code,
          };
        })
      );
    });
  };

  const analyzeText = (content: string) => {
    ffmsApi
      .ffAnalyzeText({
        text: content,
      })
      .then(res => {
        let remainNums = MAX_NUMS - dataSource.length;
        if (res.content.length > remainNums) {
          message.success(`报价总数已超过40条，仅添加识别出的前${remainNums}条报价`, 5);
        } else {
          message.success(`成功识别出${res.content.length}条报价`);
        }
        let saveData = res.content.length > remainNums ? res.content.slice(0, remainNums) : res.content;
        let arrData = [...cloneDeep(dataSource), ...saveData].map((item, index) => {
          item.rowId = Math.random() + index;
          return item;
        });
        formatTableData(arrData);
        setValue(undefined);
      });
  };

  const add = () => {
    formatTableData([...cloneDeep(dataSource), { rowId: Math.random() } as FFMSRate.ListItem]);
  };

  const formatTableData = (data: FFMSRate.ListItem[], isConflictArr?: string[]) => {
    let arrData = [...cloneDeep(data)].map(item => {
      if (item.sailingDate && isConflictArr?.length === 2) {
        item.voyage = changeVoyage(item);
      }
      if (item.sailingDate && isConflictArr?.length === 1) {
        if (isConflictArr[0] === 'voyage') {
          item.arriveDate = changeArriveDate(item);
        }
        if (isConflictArr[0] === 'arriveDate') {
          item.voyage = changeVoyage(item);
        }
      }
      if (!isConflictArr?.length) {
        if (item.sailingDate && item.voyage && !item.arriveDate) {
          item.arriveDate = changeArriveDate(item);
        }
        if (item.sailingDate && item.arriveDate) {
          item.voyage = changeVoyage(item);
        }
      }
      return item;
    });
    setDataSource([...arrData]);
  };

  const batchDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择报价数据再操作');
      return;
    }
    SiriusModal.confirm({
      title: `确认删除${selectedRowKeys.length}条报价？`,
      content: '删除报价后，报价数据将无法恢复',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        let filterData = cloneDeep(dataSource).filter(item => !selectedRowKeys.includes(item.rowId as number));
        formatTableData([...filterData]);
        setSelectedRowKeys([]);
      },
    });
  };

  const batchChange = () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择报价数据再操作');
      return;
    }
    setVisible(true);
  };

  useMount(() => {
    getFfPortList();
    getCarrierList();
  });

  return (
    <div className={style.ffAnalyze}>
      <Editor value={value} setValue={setValue} analyzeText={analyzeText} disabled={dataSource.length >= MAX_NUMS} />
      <div className={style.commonBox}>
        <Button onClick={batchChange} type="link">
          批量修改数据
        </Button>
        <Button onClick={batchDelete} type="link">
          删除报价
        </Button>
        {error ? <Alert message="以下报价中，部分必填字段缺少数据，请填写必填字段的数据后才能导入系统" type="warning" showIcon closable /> : null}
        <div>
          <Table
            rowKey={'rowId'}
            locale={{
              emptyText: (
                <>
                  <h3 className={style.empty}>暂无数据</h3>
                  <p>
                    请在上方输入报价信息，识别的报价单会展示到此，或 <a onClick={() => add()}>直接新增一条报价</a>
                  </p>
                </>
              ),
            }}
            rowSelection={{
              type: 'checkbox',
              fixed: true,
              selectedRowKeys: selectedRowKeys,
              onChange: (selectedRowKeys: React.Key[]) => {
                setSelectedRowKeys(selectedRowKeys);
              },
            }}
            scroll={{ x: 'max-content' }}
            pagination={false}
            dataSource={dataSource}
            columns={columns}
          />
          {canAdd ? (
            <div className={style.addBtn} onClick={add}>
              <PlusOutlined /> 添加报价
            </div>
          ) : null}
        </div>
      </div>
      <BatchChangeModal
        portList={portList}
        carrierList={carrierList}
        selectedRowKeys={selectedRowKeys}
        onChange={(data, isConflictArr) => formatTableData([...data], isConflictArr)}
        dataSource={dataSource}
        visible={visible}
        onCancel={() => setVisible(false)}
      />
    </div>
  );
};
