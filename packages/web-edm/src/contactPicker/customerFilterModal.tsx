import React, { useState, useEffect, useMemo } from 'react';
import { Form, Select, Row, Col, Input, Cascader, Button, Tabs } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { useAppSelector } from '@web-common/state/createStore';
import UniGridViewModal from '../components/uniGridViewModal';
import { apiHolder, apis, CustomerApi, WayType } from 'api';
import style from './customerFilterModal.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const { TabPane } = Tabs;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface FormValues {
  clueBatch: string;
}
interface optionProps {
  label: string;
  value: string;
}
export interface ICustomerFilterModal {
  visible: boolean;
  defaultActiveTab: string;
  onOk: (values: FormValues) => void;
  onCancel?: () => void;
  way?: WayType;
}
const rangeOptions = [
  {
    label: getIn18Text('BIAOQIANBAOHAN'),
    value: 'contains',
  },
  {
    label: getIn18Text('BIAOQIANDENGYU'),
    value: 'equal',
  },
  {
    label: getIn18Text('BIAOQIANBUHAN'),
    value: 'contain_none',
  },
];
const customerTypeOptions = [
  {
    label: getIn18Text('GONGSI'),
    value: '0',
  },
  {
    label: getIn18Text('YOUXIANG'),
    value: '1',
  },
];
export const CustomerFilterModal = (props: ICustomerFilterModal) => {
  const { visible, defaultActiveTab, onOk, way } = props;
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || '1');
  const [labelList, setLabelList] = useState<string[]>([]);
  const [baseInfo, setBaseInfo] = useState(null);
  // const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const [continent, setContinentOption] = useState<optionProps[]>([]);
  const [countryOption, setCountryOption] = useState<optionProps[]>([]);
  const [showMore, setShowMore] = useState<boolean>(false);
  const { signList } = useAppSelector(state => state.mailConfigReducer);
  const accountName = signList?.[0]?.signInfoDTO?.name || '';
  const [customerType, setCustomerType] = useState<string>('0');
  const [lastFormValues, setLastFormValues] = useState(null);
  /**
   * 标签初始化
   */
  useEffect(() => {
    getBaseInfo();
    getLabels();
    getGlobalArea();
  }, []);
  const getBaseInfo = () => {
    customerApi.getBaseInfo().then(res => {
      setBaseInfo(res);
    });
  };
  const getGlobalArea = () => {
    customerApi.getGlobalArea().then(res => {
      setContinentOption(
        res.area.map(item => ({
          ...item,
        }))
      );
    });
  };
  let handleContinentChange = (value: string) => {
    console.log(value);
    let list = continent.find(item => item.value === value);
    if (list && list.children && list.children.length) {
      setCountryOption(list.children);
    } else {
      setCountryOption([]);
    }
    form.resetFields(['country']);
    // const currentData = {
    //     ...searchCondition,
    //     [type]: value,
    //     'country': undefined
    // }
    // setSearchCondition(currentData);
  };

  const transformParamsByLeads = (leadsdata: any) => {
    const leadsList: any[] = [];
    if (leadsdata.leads_list.length > 0) {
      leadsdata.leads_list.forEach(leads => {
        leadsList.push({
          contact_list: leads?.contact_list || [],
          company_id: leads?.leads_id || '',
          company_name: leads?.leads_name || '',
        });
      });
    }
    return { contact_num: leadsdata.contact_num, company_list: leadsList, company_num: leadsdata.leads_num };
  };

  const getLabels = () => {
    const param = {
      key: '',
      label_type: 0,
    };
    customerApi.getLabelList(param).then(res => {
      const label = res.map(item => item.label_name);
      setLabelList(label);
    });
  };
  const handleReset = () => {
    form.resetFields();
    setCustomerType('0');
  };
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    handleReset();
  };
  useEffect(() => {
    form.setFieldsValue({
      company_name: '',
      email: '',
    });
  }, [customerType]);
  useEffect(() => {
    setActiveTab(defaultActiveTab);
  }, [defaultActiveTab]);
  const handleOk = async data => {
    let values;
    if ([2, 3].includes(Number(activeTab))) {
      values = await form.validateFields();
    } else if (activeTab === 'leads') {
      // 如果是从线索中过来，需要提取必要数据为 通用数据
      values = transformParamsByLeads(data);
    } else {
      values = data;
    }
    console.log('values', values);
    setLastFormValues({
      ...values,
      customerType,
      activeTab,
    });
    onOk({
      ...values,
      activeTab,
    });
  };
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCustomerType('0');
    } else if (lastFormValues) {
      const { customerType = '0', activeTab = '1', ...restFormValues } = lastFormValues;
      setCustomerType(customerType);
      // setActiveTab(activeTab);
      setActiveTab(defaultActiveTab);
      setTimeout(() => {
        form.setFieldsValue(restFormValues);
      });
    } else {
      setActiveTab(defaultActiveTab);
    }
  }, [visible]);
  const getClueFormContent = () => (
    <Form form={form}>
      <Row>
        <Col span={12}>
          <Form.Item name="name" label={getIn18Text('XIANSUOMINGCHENG')}>
            <Input style={{ width: 211 }} allowClear={true} placeholder={getIn18Text('QINGSHURUXIANSUOMINGCHENG')} />
          </Form.Item>
          {showMore && (
            <>
              <Form.Item name="continent" label={getIn18Text('ZHOUJI')}>
                <Select
                  showArrow={true}
                  allowClear={true}
                  style={{ width: 211, marginRight: '8px', verticalAlign: 'top' }}
                  placeholder={getIn18Text('XUANZEZHOU')}
                  dropdownClassName="edm-selector-dropdown"
                  suffixIcon={<DownTriangle />}
                  onChange={e => {
                    handleContinentChange(e);
                  }}
                >
                  {continent.map((item, index) => {
                    return (
                      <Select.Option key={index} value={item.value}>
                        {item.label}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Form.Item name="clue_batch_list" label={getIn18Text('XIANSUOPICI')}>
                <Select
                  maxTagCount={'responsive'}
                  mode="multiple"
                  showArrow={true}
                  allowClear={true}
                  placeholder={getIn18Text('XUANZEXIANSUOPICI')}
                  style={{ width: 211 }}
                  dropdownClassName="edm-selector-dropdown"
                  suffixIcon={<DownTriangle />}
                >
                  {baseInfo &&
                    baseInfo['clue_batch'].map((item, index) => {
                      return (
                        <Select.Option key={index} value={item.value}>
                          {item.label || getIn18Text('KONG(WEITIANXIE)')}
                        </Select.Option>
                      );
                    })}
                </Select>
              </Form.Item>
              <Form.Item name="contact_name" label={getIn18Text('LIANXIRENXINGMING')}>
                <Input style={{ width: 211 }} allowClear={true} placeholder={getIn18Text('QINGSHURULIANXIRENXINGMING')} />
              </Form.Item>
            </>
          )}
        </Col>
        <Col span={1}></Col>
        <Col span={11}>
          <Form.Item name="company_name" label={getIn18Text('GONGSIMINGCHENG')}>
            <Input style={{ width: 211 }} allowClear={true} placeholder={getIn18Text('QINGSHURUGONGSIMINGCHENG')} />
          </Form.Item>
          {showMore && (
            <>
              <Form.Item name="country_list" label={getIn18Text('GUOJIA')}>
                <Select
                  showArrow={true}
                  allowClear={true}
                  // value={country}
                  mode="multiple"
                  style={{ width: 211, marginRight: '8px', verticalAlign: 'top' }}
                  placeholder={getIn18Text('XUANZEGUOJIA')}
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
              <Form.Item name="source_list" label={getIn18Text('XIANSUOLAIYUAN')}>
                <Select
                  maxTagCount={'responsive'}
                  mode="multiple"
                  showArrow={true}
                  allowClear={true}
                  placeholder={getIn18Text('XUANZEXIANSUOLAIYUAN')}
                  style={{ width: 211 }}
                  dropdownClassName="edm-selector-dropdown"
                  suffixIcon={<DownTriangle />}
                >
                  {baseInfo &&
                    baseInfo['clue_source'].map((item, index) => {
                      return (
                        <Select.Option key={index} value={item.value}>
                          {item.label || getIn18Text('KONG(WEITIANXIE)')}
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
  );
  const showUni = useMemo(() => {
    return activeTab === '1' || activeTab === 'leads';
  }, [activeTab]);
  return (
    <Modal
      title={getIn18Text('KEHUGUANLIXUANZE')}
      className={style.customerFilterModal}
      visible={props.visible}
      onCancel={props.onCancel}
      onOk={handleOk}
      footer={showUni ? null : undefined}
      width={showUni ? 600 : 527}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        {/* key="1" */}
        <TabPane tab={getIn18Text('CONGUniZHONGSHAIXUAN')} key={activeTab} style={{ paddingTop: 0 }}>
          <UniGridViewModal activeKey={activeTab} onOk={handleOk} onCancel={props.onCancel} way={way} />
        </TabPane>
        {/* uni遥测包修改 */}
        {/* <TabPane tab="从个人线索中筛选" key="2">
{getClueFormContent()}
</TabPane>
<TabPane tab="从线索公海中筛选" key="3">
{getClueFormContent()}
</TabPane> */}
      </Tabs>

      {!showUni && (
        <Row className={style.actionGroup}>
          <Button size="small" type="link" onClick={() => setShowMore(!showMore)}>
            {!showMore ? getIn18Text('GENGDUOSHAIXUANTIAOJIAN') : getIn18Text('SHOUQI')}
          </Button>
          <Button size="small" type="link" onClick={handleReset}>
            {getIn18Text('ZHONGZHI')}
          </Button>
        </Row>
      )}
    </Modal>
  );
};
