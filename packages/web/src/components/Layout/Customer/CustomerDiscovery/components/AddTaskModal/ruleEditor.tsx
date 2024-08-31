import React, { useState, useEffect, useRef } from 'react';
import { Select, Col, Row, Form, FormInstance } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import { CustomerManualTaskRule, apiHolder, apis, CustomerDiscoveryApi } from 'api';
import { TaskRuleFieldList, TaskRuleField, TaskRuleExpList } from '../../context';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  form: FormInstance;
}
interface SelectOption {
  key: string;
  value: string;
  children: string;
  disabled: boolean;
}
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const RuleEditor: React.FC<Props> = props => {
  const { form } = props;
  const MaxRuleNum = TaskRuleFieldList.length;
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordsVisible, setKeywordsVisible] = useState<number[]>([]);
  const markRef = useRef<HTMLDivElement>(null);
  const initalValue = {
    field: undefined,
    fieldName: '',
    op: undefined,
    value: '',
  };
  async function fetchKeywords() {
    const res = await customerDiscoveryApi.getRuleRecommendKeyword();
    setKeywords(res || []);
  }
  useEffect(() => {
    fetchKeywords();
  }, []);
  function getRule(index: number): CustomerManualTaskRule {
    const conditionList = form.getFieldValue('conditionList') || [];
    return conditionList[index] as CustomerManualTaskRule;
  }
  function getRuleValue(index: number, field: string) {
    const rule = getRule(index);
    if (!rule) {
      return null;
    }
    return rule[field as keyof CustomerManualTaskRule] || null;
  }
  function hasSelectFied(field: string) {
    const conditionList = form?.getFieldValue('conditionList') as CustomerManualTaskRule[];
    if (!conditionList?.length) {
      return false;
    }
    return conditionList.some(item => item?.field === field);
  }
  function fieldChange(index: number, item: SelectOption) {
    const rule = getRule(index);
    if (!rule) {
      return;
    }
    rule.fieldName = item?.children || '';
    if (rule.field === TaskRuleField.EmailSubject || rule.field === TaskRuleField.AttachName) {
      rule.op = 'contain';
    } else {
      rule.op = undefined;
    }
  }
  function keywordSelect(index: number, word: string) {
    closeKeywordPanel(index);
    const rule = getRule(index);
    if (!rule) {
      return;
    }
    rule.value = word;
    const values = form.getFieldsValue();
    form.setFieldsValue({ ...values });
    form.validateFields([['conditionList', index, 'value']]);
  }
  const showKeywordPanel = (index: number) => {
    keywordsVisible[index] = 1;
    setKeywordsVisible(keywordsVisible.slice());
  };
  const closeKeywordPanel = (index: number) => {
    keywordsVisible[index] = 0;
    setKeywordsVisible(keywordsVisible.slice());
  };
  return (
    <Form.List name="conditionList" initialValue={[initalValue]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field, index) => (
            <div className={style.formListRow}>
              <Row gutter={5} className={style.flexCenter}>
                <Col>
                  <Form.Item noStyle shouldUpdate={() => true}>
                    {() => (
                      <Form.Item
                        // eslint-disable-next-line
                        {...field}
                        name={[field.name, 'field']}
                        rules={[{ required: true, message: getIn18Text('QINGXUANZEGUIZELEIXING') }]}
                      >
                        <Select
                          style={{ width: 120 }}
                          placeholder={getIn18Text('QINGXUANZEGUIZELEIXING')}
                          allowClear
                          onChange={(_, item) => {
                            fieldChange(index, item as SelectOption);
                            closeKeywordPanel(index);
                          }}
                        >
                          {TaskRuleFieldList.map(ruleField => (
                            <Select.Option key={ruleField.value} value={ruleField.value} disabled={hasSelectFied(ruleField.value)}>
                              {ruleField.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item noStyle shouldUpdate={() => true}>
                    {() => {
                      const fieldSelectVal = getRuleValue(index, 'field');
                      if (fieldSelectVal === TaskRuleField.EmailSubject || fieldSelectVal === TaskRuleField.AttachName) {
                        return (
                          <Form.Item>
                            <Input style={{ width: 120 }} disabled={Boolean(true)} value={getIn18Text('BAOHAN')} readOnly={Boolean(true)} />
                          </Form.Item>
                        );
                      }
                      return (
                        <Form.Item
                          // eslint-disable-next-line
                          {...field}
                          name={[field.name, 'op']}
                          rules={[{ required: true, message: getIn18Text('QINGXUANZETIAOJIAN') }]}
                        >
                          <Select style={{ width: 120 }} placeholder={getIn18Text('QINGXUANZETIAOJIAN')} allowClear>
                            {TaskRuleExpList.map(ruleField => (
                              <Select.Option key={ruleField.value} value={ruleField.value}>
                                {ruleField.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item noStyle shouldUpdate={() => true}>
                    {() => {
                      const fieldSelectVal = getRuleValue(index, 'field');
                      if (fieldSelectVal === TaskRuleField.EmailSubject && keywords.length) {
                        // return (
                        //   <Popover
                        //     overlayClassName={style.popover}
                        //     placement="bottomLeft"
                        //     content={(
                        //       <div className={style.ruleValueTip}>
                        //         <div className={style.tipTitle}>外贸常用关键词:</div>
                        //         <div className={style.tipWords}>
                        //           {
                        //             (keywords || []).map(keyword => <span onClick={() => keywordSelect(index, keyword)}>{keyword}</span>)
                        //           }
                        //         </div>
                        //       </div>
                        //     )}
                        //     trigger="click"
                        //   >
                        //   </Popover>
                        // );
                        return (
                          <Form.Item
                            // eslint-disable-next-line
                            {...field}
                            name={[field.name, 'value']}
                            rules={[{ required: true, message: getIn18Text('QINGTIANXIENEIRONG') }]}
                          >
                            <Input
                              maxLength={40}
                              placeholder={getIn18Text('QINGTIANXIENEIRONG')}
                              allowClear
                              onFocus={() => showKeywordPanel(index)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                console.log('@@@ onChange', e?.target?.value);
                                if (e?.target?.value) {
                                  closeKeywordPanel(index);
                                } else {
                                  showKeywordPanel(index);
                                }
                              }}
                            />
                          </Form.Item>
                        );
                      }
                      return (
                        <Form.Item
                          // eslint-disable-next-line
                          {...field}
                          name={[field.name, 'value']}
                          rules={[{ required: true, message: getIn18Text('QINGTIANXIENEIRONG') }]}
                        >
                          <Input maxLength={40} placeholder={getIn18Text('QINGTIANXIENEIRONG')} allowClear />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item>
                    {index === 0 && form?.getFieldValue('conditionList')?.length < MaxRuleNum ? (
                      <div
                        className={style.addBtn}
                        onClick={() => {
                          add();
                          setTimeout(() => {
                            if (markRef?.current) {
                              markRef?.current?.scrollIntoView();
                            }
                          }, 0);
                        }}
                      >
                        <PlusOutlined style={{ color: '#A8AAAD', fontSize: '12px' }} />
                      </div>
                    ) : (
                      ''
                    )}
                    {index !== 0 ? (
                      <div
                        className={style.addBtn}
                        onClick={() => {
                          remove(field.name);
                          closeKeywordPanel(index);
                        }}
                      >
                        <MinusOutlined style={{ color: '#A8AAAD', fontSize: '12px' }} />
                      </div>
                    ) : (
                      ''
                    )}
                    {index === fields.length - 1 ? <span ref={markRef}></span> : ''}
                  </Form.Item>
                </Col>
              </Row>
              {keywordsVisible[index] === 1 ? (
                <div className={style.keywordWrap}>
                  <div className={style.keywordPanel}>
                    <div className={style.ruleValueTip}>
                      <div className={style.tipTitle}>{getIn18Text('WAIMAOCHANGYONGGUANJIANCI:')}</div>
                      <div className={style.tipWords}>
                        {(keywords || []).map(keyword => (
                          <span onClick={() => keywordSelect(index, keyword)}>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                ''
              )}
            </div>
          ))}
        </>
      )}
    </Form.List>
  );
};
