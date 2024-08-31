import React, { useState, useEffect, useImperativeHandle } from 'react';
import { Form, Select, Row, Col, Input, Button } from 'antd';
import { apiHolder, apis, CustomerApi, ISimpleCustomerConatctModel } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { useAppSelector } from '@web-common/state/createStore';
import style from './index.module.scss';
import { CustomerTreeData } from '@web-mail/types';
import { formatCustomerTreeData } from '@web-mail/utils/slice';
import { setCurrentAccount, isValidArray } from '@web-mail/util';
import { getIn18Text } from 'api';

const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface optionProps {
  label: string;
  value: string;
}

export interface ICustomerFilterModal {
  visible: boolean;
  onOk: (values: any) => void;
  onCancel: () => void;
}

export interface AdRef {
  startAdSearch: (formValues: any) => void;
}

const STR_MAP = {
  biaoqianbaohan: getIn18Text(['BIAOQIAN', 'BAOHAN']),
  biaoqiandengyu: getIn18Text(['BIAOQIAN', 'DENGYU']),
  gongsi: getIn18Text('GONGSI'),
  youxiang: getIn18Text('YOUXIANG'),
  kehubiaoqian: getIn18Text(['KEHU', 'BIAOQIAN']),
  kehumingcheng: getIn18Text(['KEHU', 'MINGCHENG']),
  kehufenji: getIn18Text(['KEHU', 'FENJI']),
  kehufuzeren: getIn18Text(['KEHU', 'FUZEREN']),
  zhouji: getIn18Text('ZHOUJI'),
  guojia: getIn18Text('GUOJIA'),
  kehulaiyuan: getIn18Text(['KEHU', 'LAIYUAN']),
  kehuguanlixuanze: getIn18Text(['KEHU', 'GUANLI', 'XUANZE']),
  xuanzekehubiaoqian: getIn18Text(['XUANZE', 'KEHU', 'BIAOQIAN']),
  xuanzekehulaiyuan: getIn18Text(['XUANZE', 'KEHU', 'LAIYUAN']),
  kong: getIn18Text('KONG'),
  weitianxie: getIn18Text('WEITIANXIE'),
  xuanzezhou: getIn18Text('XUANZEZHOU'),
  xuanzeguojia: getIn18Text(['XUANZE', 'GUOJIA']),
  gengduoshaixuantiaojian: getIn18Text(['GENGDUO', 'SHAIXUANTIAOJIAN']),
};

const rangeOptions = [
  {
    label: STR_MAP.biaoqianbaohan,
    value: 'contains',
  },
  {
    label: STR_MAP.biaoqiandengyu,
    value: 'equal',
  },
];

const customerTypeOptions = [
  {
    label: STR_MAP.gongsi,
    value: '0',
  },
  {
    label: STR_MAP.youxiang,
    value: '1',
  },
];

export const CustomerAdvancedSearch = React.forwardRef<AdRef, ICustomerFilterModal>((props, ref) => {
  const { visible, onOk, onCancel } = props;
  const { signList } = useAppSelector(state => state.mailConfigReducer);

  const [form] = Form.useForm();
  const [labelList, setLabelList] = useState<string[]>([]);
  const [baseInfo, setBaseInfo] = useState<any>(null);
  const [continentOption, setContinentOption] = useState<optionProps[]>([]);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const [showMore, setShowMore] = useState<boolean>(false);
  const accountName = signList?.[0]?.signInfoDTO?.name || '';
  const [customerType, setCustomerType] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  /**
   * 标签初始化
   */
  useEffect(() => {
    setTimeout(() => {
      getBaseInfo();
      getLabels();
      getGlobalArea();
    }, 1000);
  }, []);

  const getBaseInfo = () => {
    // setCurrentAccount();
    customerApi.getBaseInfo().then(res => {
      setBaseInfo(res);
    });
  };

  const getGlobalArea = () => {
    // setCurrentAccount();
    customerApi.getGlobalArea().then(res => {
      setContinentOption(
        res.area.map(item => ({
          ...item,
        }))
      );
    });
  };

  const handleContinentChange = (value: any) => {
    let list: any = continentOption.find(item => item.value === value);
    if (list && list.children && list.children.length) {
      setCountryOption(list.children);
    } else {
      setCountryOption([]);
    }
    form.resetFields(['country']);
  };

  const getLabels = () => {
    const param = {
      key: '',
      label_type: 0,
    };
    // setCurrentAccount();
    customerApi.getLabelList(param).then(res => {
      const label = res.map(item => item.label_name);
      setLabelList(label);
    });
  };

  const handleReset = () => {
    form.resetFields();
    setCustomerType('0');
  };

  useEffect(() => {
    form.setFieldsValue({
      company_name: '',
      email: '',
    });
  }, [customerType]);

  const handleOk = (initValues?: any) => {
    form.validateFields().then(values => {
      const formValues = initValues || {
        ...values,
        customerType,
      };
      setLoading(true);
      onSearch(formValues)
        .then(v => {
          onOk({
            stringFromValue: formatFormValues(formValues) || '全部客户',
            treeList: v,
            formValues,
          });
          handleReset();
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  useImperativeHandle(ref, () => ({
    startAdSearch: handleOk,
  }));

  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  const formatFormValues = (formValue: any) => {
    if (!formValue) {
      return '';
    }
    const result: string[] = [];
    const sep = '-';
    if (isValidArray(formValue.label_name_list)) {
      const range = rangeOptions.find(v => v.value === formValue.filter_label_op);
      const key = range ? range.label : '';
      const item = `${STR_MAP.kehubiaoqian}:${key ? key + sep : ''}${formValue.label_name_list.join('+')}`;
      result.push(item);
    }
    if (formValue.company_name) {
      const type = customerTypeOptions.find(v => v.value === customerType);
      const item = `${STR_MAP.kehumingcheng}:${type ? type.label + sep : ''}${formValue.company_name}`;
      result.push(item);
    }
    if (isValidArray(formValue.company_level_list)) {
      const companyLevel: { label: string; value: string }[] = baseInfo && isValidArray(baseInfo.company_level) ? baseInfo.company_level : [];
      const levels = companyLevel.filter(v => formValue.company_level_list.includes(v.value)).map(v => v.label);
      const values = levels.length > 0 ? levels.join('+') : '';
      const item = `${STR_MAP.kehufenji}:${values}`;
      result.push(item);
    }
    if (accountName) {
      const item = `${STR_MAP.kehufuzeren}:${accountName}`;
      result.push(item);
    }
    if (formValue.continent) {
      const continentValue = isValidArray(continentOption) ? continentOption.find(v => v.value === formValue.continent) : null;
      const item = `${STR_MAP.zhouji}:${continentValue?.label || ''}`;
      result.push(item);
    }
    if (formValue.country) {
      const countryValue = isValidArray(countryOption) ? countryOption.find(v => v.value === formValue.country) : null;
      const item = `${STR_MAP.guojia}:${countryValue?.label || ''}`;
      result.push(item);
    }
    if (isValidArray(formValue.source_list)) {
      const sourceList: { label: string; value: string }[] = baseInfo && isValidArray(baseInfo.company_source) ? baseInfo.company_source : [];
      const levels = sourceList.filter(v => formValue.source_list.includes(v.value)).map(v => v.label);
      const values = levels.length > 0 ? levels.join('+') : '';
      const item = `${STR_MAP.kehulaiyuan}:${values}`;
      result.push(item);
    }
    return result.length > 0 ? result.join(';') : '';
  };

  const onSearch = (searchCondition: any): Promise<CustomerTreeData[]> => {
    const { ...payload } = searchCondition;
    // setCurrentAccount();
    // TODO: 高级搜索负责人信息
    return customerApi.searchCustomerFromPersonalClue(payload).then(({ company_list }) => {
      if (isValidArray(company_list)) {
        const _lastUpdateTime = Date.now();
        const inputs = company_list.map(v => {
          const contacts: ISimpleCustomerConatctModel[] = v.contact_list.map(c => ({
            id: c.contact_id,
            name: c.contact_name,
            email: c.email,
          }));
          return {
            orgName: v.company_name,
            id: v.company_id,
            contacts,
            lastUpdateTime: _lastUpdateTime,
          };
        });
        return formatCustomerTreeData(inputs);
      }
      return [];
    });
  };

  return (
    <Modal
      title={STR_MAP.kehuguanlixuanze}
      className={style.customerAdvancedSearchModal}
      visible={visible}
      onCancel={handleCancel}
      width={527}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button key="confirm" type="primary" onClick={() => handleOk()} loading={loading}>
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
      <div className={style.customerAdContent}>
        <Form form={form}>
          <Row>
            <Col span={12}>
              <Form.Item name="tag" label={STR_MAP.kehubiaoqian} style={{ marginBottom: 0 }}>
                <Form.Item name="filter_label_op">
                  <Select placeholder={STR_MAP.biaoqiandengyu} style={{ width: 92 }} allowClear={true} suffixIcon={<DownTriangle />}>
                    {rangeOptions.map(({ label, value }) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="label_name_list">
                  <Select
                    maxTagCount={'responsive'}
                    mode="multiple"
                    showArrow={true}
                    allowClear={true}
                    placeholder={STR_MAP.xuanzekehubiaoqian}
                    style={{ width: 116, marginLeft: 12 }}
                    suffixIcon={<DownTriangle />}
                  >
                    {labelList.map((item, index) => {
                      return (
                        <Select.Option key={index} value={item}>
                          {item}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Form.Item>
              {showMore && (
                <>
                  <Form.Item name="level" label={STR_MAP.kehufenji} style={{ marginBottom: 0 }}>
                    <Form.Item name="company_level_list">
                      <Select
                        maxTagCount={'responsive'}
                        mode="multiple"
                        showArrow={true}
                        allowClear={true}
                        placeholder={STR_MAP.xuanzekehubiaoqian}
                        style={{ width: 220 }}
                        dropdownClassName="edm-selector-dropdown"
                        suffixIcon={<DownTriangle />}
                      >
                        {baseInfo &&
                          (baseInfo.company_level as any).map((item: any, index: number) => {
                            return (
                              <Select.Option key={index} value={item.value}>
                                {item.label || `${STR_MAP.kong}(${STR_MAP.weitianxie})`}
                              </Select.Option>
                            );
                          })}
                      </Select>
                    </Form.Item>
                  </Form.Item>
                  <Form.Item name="continent" label={STR_MAP.zhouji}>
                    <Select
                      showArrow={true}
                      allowClear={true}
                      style={{ width: 211, marginRight: '8px', verticalAlign: 'top' }}
                      placeholder={STR_MAP.xuanzezhou}
                      dropdownClassName="edm-selector-dropdown"
                      suffixIcon={<DownTriangle />}
                      onChange={e => {
                        handleContinentChange(e);
                      }}
                    >
                      {continentOption.map((item, index) => {
                        return (
                          <Select.Option key={index} value={item.value}>
                            {item.label}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item name="source" label={STR_MAP.kehulaiyuan} style={{ marginBottom: 0 }}>
                    <Form.Item name="source_list">
                      <Select
                        maxTagCount={'responsive'}
                        mode="multiple"
                        showArrow={true}
                        allowClear={true}
                        placeholder={STR_MAP.xuanzekehulaiyuan}
                        style={{ width: 220 }}
                        suffixIcon={<DownTriangle />}
                      >
                        {baseInfo &&
                          baseInfo['company_source'].map((item: any, index: number) => {
                            return (
                              <Select.Option key={index} value={item.value}>
                                {item.label || `${STR_MAP.kong}(${STR_MAP.weitianxie})`}
                              </Select.Option>
                            );
                          })}
                      </Select>
                    </Form.Item>
                  </Form.Item>
                </>
              )}
            </Col>
            <Col span={1} />
            <Col span={11}>
              <Form.Item label={STR_MAP.kehumingcheng} style={{ marginBottom: 0 }}>
                <Form.Item>
                  <Select placeholder={getIn18Text('LEIXING')} style={{ width: 92 }} suffixIcon={<DownTriangle />} value={customerType} onChange={setCustomerType}>
                    {customerTypeOptions.map(({ label, value }) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                {customerType === '0' && (
                  <Form.Item name="company_name">
                    <Input style={{ width: 116, marginLeft: 12 }} placeholder="请输入" allowClear={true} />
                  </Form.Item>
                )}
                {customerType === '1' && (
                  <Form.Item name="email">
                    <Input style={{ width: 116, marginLeft: 12 }} placeholder="请输入" allowClear={true} />
                  </Form.Item>
                )}
              </Form.Item>
              {showMore && (
                <>
                  <Form.Item label={STR_MAP.kehufuzeren}>
                    <Input value={accountName} style={{ width: 211 }} disabled />
                  </Form.Item>

                  <Form.Item name="country" label={STR_MAP.guojia}>
                    <Select
                      showArrow={true}
                      allowClear={true}
                      style={{ width: 211, marginRight: '8px', verticalAlign: 'top' }}
                      placeholder={STR_MAP.xuanzeguojia}
                      dropdownClassName="edm-selector-dropdown"
                      suffixIcon={<DownTriangle />}
                    >
                      {countryOption.map((item, index) => {
                        return (
                          <Select.Option key={index} value={item.value}>
                            {item.label}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </>
              )}
            </Col>
          </Row>
        </Form>
        <Row className={style.actionGroup}>
          <Button size="small" type="link" onClick={() => setShowMore(!showMore)}>
            {!showMore ? STR_MAP.gengduoshaixuantiaojian : getIn18Text('SHOUQI')}
          </Button>
          <Button size="small" type="link" onClick={handleReset}>
            {getIn18Text('ZHONGZHI')}
          </Button>
        </Row>
      </div>
    </Modal>
  );
});
