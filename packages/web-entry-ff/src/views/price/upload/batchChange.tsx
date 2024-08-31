import React, { useEffect, useState, useMemo, useContext } from 'react';
import { FFMSRate } from 'api';
import { Form, Space, InputNumber, Popover, Tooltip } from 'antd';
import MinusCircleOutlined from '@ant-design/icons/MinusCircleOutlined';
import PlusCircleOutlined from '@ant-design/icons/PlusCircleOutlined';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { FfDatePicker } from '../search/quickTime';
import cloneDeep from 'lodash/cloneDeep';
import Modal from '@/components/Layout/components/Modal/modal';
import style from './batchChange.module.scss';
import { options } from './textConfig';
import { ReactComponent as TextIcon } from './svgs/textIcon.svg';
import { ReactComponent as EmptyIcon } from './svgs/textEmpty.svg';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';

interface Props {
  visible: boolean;
  selectedRowKeys: React.Key[];
  dataSource: FFMSRate.ListItem[];
  carrierList: FFMSRate.Option[];
  portList: FFMSRate.Option[];
  onChange: (data: FFMSRate.ListItem[], isConflictArr: string[]) => void;
  onCancel: () => void;
}

type FieldKeys = keyof FFMSRate.ListItem;
interface TableData {
  selectedCodeValue: FieldKeys;
  currentValue: any;
}

const BatchChangeModal: React.FC<Props> = ({ visible, selectedRowKeys, dataSource, onChange, onCancel, carrierList, portList }) => {
  const [form] = Form.useForm();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { state } = useContext(GlobalContext);

  const setValue = <T, K extends keyof T>(map: T, key: K, val: T[K]): T => {
    map[key] = val;
    return map;
  };

  const onOk = () => {
    const related = ['voyage', 'arriveDate'];
    const isConflictArr: string[] = [];
    form.validateFields().then(res => {
      let newData = cloneDeep(dataSource);
      (res.tableData as TableData[]).forEach(data => {
        console.log('related.includes(data.currentValue)', related.includes(data.selectedCodeValue), related, data.selectedCodeValue);
        if (related.includes(data.selectedCodeValue)) {
          isConflictArr.push(data.selectedCodeValue);
        }
        newData.map(item => {
          if (selectedRowKeys.includes(item.rowId as number)) {
            item = setValue(item, data.selectedCodeValue, data.currentValue);
          }
          return item;
        });
      });
      onChange(newData, isConflictArr);
      onCancel();
    });
  };

  const renderFrom = (value: string) => {
    let obj = options.find(item => item.value === value);
    switch (obj?.type) {
      case 'input':
        return <Input style={{ width: 200 }} placeholder={`请输入${obj.label}`} />;
      case 'inputNumber':
        return <InputNumber style={{ width: 200 }} placeholder={`请输入${obj.label}`} />;
      case 'select':
        return (
          <EnhanceSelect
            style={{ width: 200 }}
            showSearch={true}
            optionFilterProp="label"
            placeholder={`请输入${obj.label}`}
            options={obj.value === 'carrier' ? carrierList : obj.value === 'departurePortCode' ? state.departurePortOptions : portList}
          />
        );
      case 'datePicker':
        return <FfDatePicker style={{ width: 200 }} placeholder={`请输入${obj.label}`}></FfDatePicker>;
      default:
        return <Input placeholder="请选择数据" style={{ width: 200 }} />;
    }
  };

  const findShowNameByCode = (field: string, code: string) => {
    if (field === 'departurePortCode' || field === 'destinationPortCode') {
      let data = portList.find(item => item.value === code);
      if (data) {
        return data.label;
      }
      return code;
    }
    if (field === 'carrier') {
      let data = carrierList.find(item => item.value === code);
      if (data) {
        return data.label;
      }
      return code;
    }
    return code;
  };

  const popOverContent = (value: string) => {
    let obj = options.find(item => item.value === value);
    if (obj && selectedRowKeys) {
      let tempArr = dataSource
        .filter(item => selectedRowKeys.includes(item.rowId as number))
        .map(item => {
          return item[obj?.value as FieldKeys];
        })
        .filter(item => item);
      if (tempArr.length) {
        return (
          <div className={style.content} style={{ padding: 12 }}>
            <span className={style.tip}>字段当前数据</span>
            <h3 className={style.title}>{obj.label}</h3>
            {[...new Set(tempArr)].map(code => (
              <div>{obj && findShowNameByCode(obj.value, code as string)}</div>
            ))}
          </div>
        );
      }
      return null;
    }
    return null;
  };

  const onChangeFiled = () => {
    let data = form.getFieldsValue();
    let arr: string[] = [];
    (data.tableData as TableData[]).forEach(item => {
      if (item.selectedCodeValue) {
        arr.push(item.selectedCodeValue);
      }
    });
    setSelectedKeys(arr);
  };

  const activeOptions = useMemo(() => {
    return options.map(item => {
      item.disabled = selectedKeys.includes(item.value);
      return item;
    });
  }, [selectedKeys]);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedKeys([]);
    }
  }, [visible]);

  return (
    <Modal
      width={700}
      bodyStyle={{
        minHeight: 300,
        maxHeight: 500,
        paddingTop: 12,
        overflow: 'auto',
      }}
      title="批量修改"
      visible={visible}
      onOk={onOk}
      onCancel={() => onCancel()}
    >
      <div className={style.batchChange}>
        <div className={style.message}>{`您已选中${selectedRowKeys.length}条报价，可批量修改选中报价中的字段数据，字段当前的数据将被新数据覆盖`}</div>
        <Form form={form} initialValues={{ tableData: [{}] }}>
          <Form.List name="tableData">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'selectedCodeValue']} rules={[{ required: true, message: '请选择字段' }]}>
                      <EnhanceSelect
                        onChange={() => {
                          onChangeFiled();
                          form.setFields([
                            {
                              name: ['tableData', name, 'currentValue'],
                              value: undefined,
                            },
                          ]);
                        }}
                        placeholder="请选择字段"
                        style={{ width: 200 }}
                        options={activeOptions}
                      />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={() => true}>
                      {() => {
                        const opType = form.getFieldValue(['tableData', name, 'selectedCodeValue']);
                        const overDom = popOverContent(opType);
                        return (
                          <div className={style.tips}>
                            {overDom ? (
                              <Popover overlayClassName={style.selectDataPopover} placement="bottomRight" content={overDom} trigger="hover">
                                <TextIcon />
                              </Popover>
                            ) : (
                              <Tooltip title={'选择字段后，可查看该字段当前的数据'}>
                                <EmptyIcon />
                              </Tooltip>
                            )}
                            <span className={style.text}> 字段中全部数据修改为</span>
                          </div>
                        );
                      }}
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={() => true}>
                      {() => {
                        const opType = form.getFieldValue(['tableData', name, 'selectedCodeValue']);
                        return (
                          <Form.Item {...restField} name={[name, 'currentValue']} rules={[{ required: true, message: '请填写完整数据' }]}>
                            {renderFrom(opType)}
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                    {index != 0 ? (
                      <MinusCircleOutlined
                        style={{ fontSize: 16 }}
                        onClick={() => {
                          remove(name);
                          onChangeFiled();
                        }}
                      />
                    ) : null}
                    <PlusCircleOutlined
                      style={{ fontSize: 16 }}
                      onClick={() => {
                        add(name);
                        onChangeFiled();
                      }}
                    />
                  </Space>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </Modal>
  );
};
export default BatchChangeModal;
