import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { AutoComplete, Checkbox, Form, InputNumber, Space } from 'antd';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import { NamePath } from 'rc-field-form/lib/interface';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as AddIcon } from '@/images/icons/edm/addressBook/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/addressBook/remove.svg';
import style from './advancedFilter.module.scss';
import { getIn18Text } from 'api';
interface AdvancedFilterProps {
  visible: boolean;
  continents: CascaderType[];
  onCancel: () => void;
  onFinish: (params: any) => void;
}
interface CascaderType {
  label: string;
  value: string;
  children: CascaderType[];
}
const AdvancedFilter = forwardRef((props: AdvancedFilterProps, ref) => {
  const { visible, continents, onCancel, onFinish } = props;
  const [addressVisible, setAddressVisible] = useState(false);
  const [edmVisible, setEdmVisible] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const [form] = Form.useForm();
  const handleOk = () => {
    form.validateFields().then(params => {
      onFinish(params);
    });
  };
  const getContactFormItems = (field: string, itemNamePath: NamePath, fullNamePath: NamePath) => {
    switch (field) {
      case 'contactAddressInfo':
      case 'contactName':
      case 'companyName':
      case 'jobTitle':
        return (
          <Form.Item
            name={[...(itemNamePath as []), 'searchKeys']}
            rules={[
              { required: true, message: getIn18Text('QINGSHURUGUANJIANCI') },
              {
                validator: (_: any, value) => (value.length > 5 ? Promise.reject(getIn18Text('QINGSHURUBUCHAOGUO 5 GEDEGUANJIANCI')) : Promise.resolve()),
              },
            ]}
          >
            <Select
              style={{ width: 250 }}
              mode="tags"
              maxTagCount="responsive"
              open={false}
              allowClear
              showArrow={false}
              placeholder={getIn18Text('KESHURUDUOGEGUANJIANCI\uFF0CANHUICHEQUEREN')}
              onInputKeyDown={() => {
                form.setFields([
                  {
                    name: [...(fullNamePath as []), 'searchKeys'],
                    errors: [],
                  },
                ]);
              }}
            />
          </Form.Item>
        );
      case 'location':
        return (
          <>
            <Form.Item
              style={{ display: 'inline-flex' }}
              name={[...(itemNamePath as []), 'continent']}
              rules={[{ required: true, message: getIn18Text('QINGXUANZEZHOU') }]}
            >
              <Select
                style={{ width: 125 }}
                allowClear
                placeholder={getIn18Text('QINGXUANZEZHOU')}
                onChange={() => {
                  form.setFields([
                    {
                      name: [...(fullNamePath as []), 'country'],
                      value: '',
                      errors: [],
                    },
                  ]);
                }}
              >
                {continents.map(continent => (
                  <Option value={continent.value}>{continent.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item shouldUpdate noStyle>
              {() => {
                const continent = form.getFieldValue([...(fullNamePath as []), 'continent']);
                const countries = continents.find(item => item.value === continent)?.children || [];
                return (
                  <Form.Item name={[...(itemNamePath as []), 'country']} noStyle>
                    <AutoComplete
                      style={{ width: 125 }}
                      allowClear
                      placeholder={getIn18Text('QINGXUANZEGUOJIA')}
                      filterOption={(inputValue, option) => option?.value.includes(inputValue)}
                      options={countries.map(country => ({
                        value: country.value,
                        label: country.label,
                      }))}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </>
        );
      case 'emailStatus':
        return (
          <Form.Item name={[...(itemNamePath as []), 'searchKeys']} rules={[{ required: true, message: getIn18Text('QINGSHURUYOUXIANGZHUANGTAI') }]}>
            <Select mode="multiple" style={{ width: 250 }} placeholder={getIn18Text('QINGXUANZE')} allowClear getPopupContainer={triggerNode => triggerNode.parentNode}>
              <Option value="normal">{getIn18Text('ZHENGCHANG')}</Option>
              <Option value="abnormal">{getIn18Text('YICHANG')}</Option>
              <Option value="unknown">{getIn18Text('WEIZHI')}</Option>
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };
  const handleSearchKeysReset = (resetIndex: number) => {
    const addressConditions = form.getFieldValue('address');
    form.setFieldsValue({
      address: addressConditions.map((item: any, index: number) => {
        if (index !== resetIndex) return item;
        switch (item.field) {
          case 'contactAddressInfo':
          case 'contactName':
          case 'companyName':
          case 'jobTitle':
          case 'emailStatus':
            return {
              ...item,
              searchKeys: [],
            };
          case 'location':
            return {
              ...item,
              continent: undefined,
              country: undefined,
            };
          default:
            return item;
        }
      }),
    });
  };
  const handleSubmittleCheck = () => {
    setTimeout(() => {
      const values = form.getFieldsValue();
      const hasAddressCondition = Array.isArray(values.address) && values.address.length;
      const hasEdmCondition = Array.isArray(values.edm) && values.edm.length;

      if (!hasAddressCondition && !hasEdmCondition) {
        return setSubmittable(false);
      }

      if (hasAddressCondition && values.address.some(item => (item.field !== 'location' ? !item.searchKeys?.length || item.searchKeys?.length > 5 : !item.continent))) {
        return setSubmittable(false);
      }

      return setSubmittable(true);
    });
  };
  useEffect(() => {
    if (addressVisible) {
      const address = [{ field: 'contactAddressInfo', rule: 'LIKE', searchKeys: [] }];
      form.setFieldsValue({ address });
    } else {
      form.setFieldsValue({ address: [] });
    }
    handleSubmittleCheck();
  }, [addressVisible, form]);
  useEffect(() => {
    if (edmVisible) {
      const edm = [{ field: 'latestSendTime', rule: 'TIME_RANGE_EXISTS', searchKeys: undefined, timeRange: 'one_week' }];
      form.setFieldsValue({ edm });
    } else {
      form.setFieldsValue({ edm: [] });
    }
    handleSubmittleCheck();
  }, [edmVisible, form]);
  useImperativeHandle(ref, () => ({
    reset: () => {
      setAddressVisible(false);
      setEdmVisible(false);
      form.setFieldsValue({ relation: 'AND' });
    },
  }));
  return (
    <Modal
      className={style.advancedFilter}
      width={736}
      title={
        <>
          <div className={style.title}>{getIn18Text('GAOJISHAIXUAN')}</div>
          <div className={style.subTitle}>{getIn18Text('XITONGTIGONG2GEGAOJISHAIXUANWEIDU\uFF0CKEZIDINGYISHEZHISHAIXUANTIAOJIAN')}</div>
        </>
      }
      visible={visible}
      onOk={handleOk}
      okButtonProps={{ disabled: (!addressVisible && !edmVisible) || !submittable }}
      onCancel={onCancel}
    >
      <Form form={form} onValuesChange={handleSubmittleCheck}>
        {(addressVisible || edmVisible) && (
          <div className={style.relation}>
            <Form.Item name="relation" initialValue="AND" noStyle>
              <Select>
                <Option value="AND">{getIn18Text('SUOYOUTIAOJIAN')}</Option>
                <Option value="OR">{getIn18Text('RENYITIAOJIAN2')}</Option>
              </Select>
            </Form.Item>
            <span className={style.relationText}>{getIn18Text('MANZUYIXIA')}</span>
          </div>
        )}
        <div className={style.group}>
          <div className={style.groupTitle}>
            <Checkbox checked={addressVisible} onChange={event => setAddressVisible(event.target.checked)}>
              {getIn18Text('LIANXIRENXINXI')}
            </Checkbox>
          </div>
          {addressVisible && (
            <div className={style.groupContent}>
              <Form.List name="address">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                      return (
                        <Form.Item key={key} className={style.formListItem}>
                          <Space align="start">
                            <Form.Item {...restField} name={[name, 'field']} fieldKey={[name, 'field']} initialValue="contactAddressInfo" noStyle>
                              <Select style={{ width: 100 }} onChange={() => handleSearchKeysReset(index)}>
                                <Option value="contactAddressInfo">{getIn18Text('YOUXIANG')}</Option>
                                <Option value="emailStatus">{getIn18Text('YOUXIANGZHUANGTAI')}</Option>
                                <Option value="contactName">{getIn18Text('XINGMING')}</Option>
                                <Option value="location">{getIn18Text('GUOJIADEQU')}</Option>
                                <Option value="companyName">{getIn18Text('GONGSIMINGCHENG')}</Option>
                                <Option value="jobTitle">{getIn18Text('ZHIWEI')}</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'rule']} fieldKey={[name, 'rule']} initialValue="LIKE" noStyle>
                              <Select style={{ width: 90 }}>
                                <Option value="LIKE">{getIn18Text('BAOHAN')}</Option>
                                <Option value="NOT_LIKE">{getIn18Text('BUBAOHAN')}</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item shouldUpdate noStyle>
                              {() => {
                                const itemNamePath = [name];
                                const fullNamePath = ['address', name];
                                const field = form.getFieldValue([...fullNamePath, 'field']);
                                return getContactFormItems(field, itemNamePath, fullNamePath);
                              }}
                            </Form.Item>
                            <Form.Item noStyle>
                              {index === 0 && fields.length < 10 ? (
                                <AddIcon className={style.formListItemIcon} onClick={() => add()} />
                              ) : (
                                <RemoveIcon className={style.formListItemIcon} onClick={() => remove(index)} />
                              )}
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      );
                    })}
                  </>
                )}
              </Form.List>
            </div>
          )}
        </div>
        <div className={style.group}>
          <div className={style.groupTitle}>
            <Checkbox checked={edmVisible} onChange={event => setEdmVisible(event.target.checked)}>
              {getIn18Text('YINGXIAOYOUJIANXINGWEI')}
            </Checkbox>
          </div>
          {edmVisible && (
            <div className={style.groupContent}>
              <Form.List name="edm">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                      return (
                        <Form.Item key={key} className={style.formListItem}>
                          <Space align="start">
                            <Form.Item {...restField} name={[name, 'timeRange']} fieldKey={[name, 'timeRange']} initialValue="one_week" noStyle>
                              <Select style={{ width: 100 }}>
                                <Option value="one_week">{getIn18Text('JINYIZHOU')}</Option>
                                <Option value="one_month">{getIn18Text('JINYIGEYUE')}</Option>
                                <Option value="three_month">{getIn18Text('JINSANGEYUE')}</Option>
                                <Option value="six_month">{getIn18Text('JINBANNIAN')}</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'field']} fieldKey={[name, 'field']} initialValue="latestSendTime" noStyle>
                              <Select style={{ width: 100 }}>
                                <Option value="latestSendTime">{getIn18Text('FASONG')}</Option>
                                <Option value="latestReadTime">{getIn18Text('DAKAI')}</Option>
                                <Option value="latestReplyTime">{getIn18Text('HUIFU')}</Option>
                                <Option value="latestUnsubscribeTime">{getIn18Text('TUIDING')}</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item shouldUpdate noStyle>
                              {() => {
                                const existsLabelMap: Record<string, string> = {
                                  latestSendTime: getIn18Text('FASONGGUO'),
                                  latestReadTime: getIn18Text('DAKAIGUO'),
                                  latestReplyTime: getIn18Text('HUIFUGUO'),
                                  latestUnsubscribeTime: getIn18Text('TUIDINGGUO'),
                                };
                                const notExistsLabelMap: Record<string, string> = {
                                  latestSendTime: getIn18Text('WEIFASONG'),
                                  latestReadTime: getIn18Text('WEIDAKAI'),
                                  latestReplyTime: getIn18Text('WEIHUIFU'),
                                  latestUnsubscribeTime: getIn18Text('WEITUIDING'),
                                };
                                const field: string = form.getFieldValue(['edm', index, 'field']);
                                const existsLabel = existsLabelMap[field] || '';
                                const notExistsLabel = notExistsLabelMap[field] || '';

                                return (
                                  <Form.Item {...restField} name={[name, 'rule']} fieldKey={[name, 'rule']} initialValue="TIME_RANGE_EXISTS" noStyle>
                                    <Select style={{ width: 100 }}>
                                      <Option value="TIME_RANGE_EXISTS">{existsLabel}</Option>
                                      <Option value="TIME_RANGE_NOT_EXISTS">{notExistsLabel}</Option>
                                    </Select>
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                            <Form.Item noStyle>
                              {index === 0 && fields.length < 10 ? (
                                <AddIcon className={style.formListItemIcon} onClick={() => add()} />
                              ) : (
                                <RemoveIcon className={style.formListItemIcon} onClick={() => remove(index)} />
                              )}
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      );
                    })}
                  </>
                )}
              </Form.List>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
});
export interface AdvancedFilterMethods {
  reset: () => void;
}
export default AdvancedFilter;
