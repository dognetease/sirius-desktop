import React, { useEffect, useState } from 'react';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import { ScheduleDatePicker, ScheduleTimeStepPicker, ScheduleLocationInput } from '@web-schedule/components/FormComponents';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Form, Input, Select, Col, Row, AutoComplete, Radio } from 'antd';
import { api, apis, EdmSendBoxApi, MailApiType, AiWriteMailModel } from 'api';
import { toneList, reportType, attendanceType, languageList, wordCountOptionsList } from './util';
import { getIn18Text } from 'api';
let gptApi = api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
if (process.env.BUILD_ISEDM) {
  gptApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
}
interface Props {
  writeValue: AiWriteMailModel;
  type: 'write' | 'retouch';
  inputMemory: Record<string, any>;
  sendWriteValue: (writeValue: AiWriteMailModel) => void;
}
interface ValueModel {
  value: string;
  type: string;
  label: string;
  col?: number;
  required?: boolean;
  showTextCount?: boolean;
  maxTextCount?: number;
  autoComplete?: boolean;
  autoCompleteKey?: string;
  originOptions?: any[];
}
const totalValueList: ValueModel[] = [
  {
    value: 'company',
    type: 'input',
    label: getIn18Text('GONGSIMINGCHENG'),
    col: 12,
    showTextCount: true,
    maxTextCount: 50,
    autoComplete: true,
    autoCompleteKey: 'companies',
  },
  {
    value: 'language',
    type: 'select',
    label: getIn18Text('SHUCHUYOUJIANSHIYONGDE'),
    col: 12,
  },
  {
    value: 'product',
    type: 'input',
    label: getIn18Text('CHANPINMINGCHENG'),
    col: 12,
    showTextCount: true,
    maxTextCount: 50,
    autoComplete: true,
    autoCompleteKey: 'products',
  },
  {
    value: 'tone',
    type: 'select',
    label: getIn18Text('YOUJIANYUQI'),
    col: 12,
  },
  {
    value: 'reportType',
    type: 'select',
    label: '类型',
    col: 12,
  },
  {
    value: 'mustContains',
    type: 'input',
    label: getIn18Text('YOUJIANZHONGBIXUBAOHAN'),
    col: 24,
    showTextCount: true,
    maxTextCount: 100,
    autoComplete: true,
    autoCompleteKey: 'keywords',
  },
  {
    value: 'time',
    type: 'time',
    label: '日期',
    required: true,
    col: 24,
  },
  {
    value: 'date',
    type: 'date',
    label: '日期',
    required: true,
    col: 12,
  },
  {
    value: 'extraDesc',
    type: 'input',
    label: getIn18Text('MIAOSHUNINDEGONGSIHUO'),
    col: 24,
    required: true,
    showTextCount: true,
    maxTextCount: 500,
  },
  {
    value: 'additional',
    type: 'input',
    label: '补充说明',
    col: 24,
    showTextCount: true,
    maxTextCount: 500,
  },
  {
    value: 'announcementTitle',
    type: 'input',
    label: '通知标题',
    col: 12,
    showTextCount: true,
    maxTextCount: 50,
  },
  {
    value: 'meetingSubject',
    type: 'input',
    label: '会议主题',
    col: 12,
    required: true,
    showTextCount: true,
    maxTextCount: 50,
  },
  {
    value: 'meetingPosition',
    type: 'input',
    label: '会议地点',
    col: 12,
    showTextCount: true,
    maxTextCount: 50,
  },
  {
    value: 'attendanceReason',
    type: 'input',
    label: '申请原因',
    col: 12,
    required: true,
    showTextCount: true,
    maxTextCount: 50,
  },
  {
    value: 'attendanceType',
    type: 'select',
    label: '申请类型',
    col: 12,
  },
  {
    value: 'wordCountLevel',
    type: 'radio',
    label: getIn18Text('SHUCHUZISHUXIANZHI'),
    col: 24,
    originOptions: wordCountOptionsList,
  },
];

const descLabelMap = {
  '1': {
    label: getIn18Text('MIAOSHUNINDEGONGSIHUO'),
    placeholder: getIn18Text('KESHIYONGNINSHUXIDE'),
  },
  '2': {
    label: getIn18Text('MIAOSHUNINDECHANPINGONG'),
    placeholder: getIn18Text('KESHIYONGNINSHUXIDE'),
  },
  '3': {
    label: getIn18Text('MIAOSHUJUTIJIERI'),
    placeholder: getIn18Text('KESHIYONGNINSHUXIDE'),
  },
  '5': {
    label: '重点汇报内容',
    placeholder: '可使用您属性的语言描述',
  },
  '6': {
    label: '会议时间',
    placeholder: '可使用您属性的语言描述',
  },
  '7': {
    label: '申请时间',
    placeholder: '可使用您属性的语言描述',
  },
  '8': {
    label: '通知的主要内容',
    placeholder: '可使用您属性的语言描述',
  },
  '0': {
    label: getIn18Text('MIAOSHUYOUJIANDEJUTI'),
    placeholder: getIn18Text('KESHIYONGNINSHUXIDE'),
  },
};

let totalValueMap = new Map<string, ValueModel>();
totalValueList.forEach(item => {
  totalValueMap.set(item.value, item);
});

type OptionsKey = 'tone' | 'language';

type OptionsListModel = {
  [key in OptionsKey]: any[];
};

const { Option } = Select;
const { TextArea } = Input;

export const AiForm = (props: Props) => {
  const { writeValue, type, sendWriteValue, inputMemory } = props;
  const [curValueList, setCurValueList] = useState<ValueModel[]>([]);
  const [optionsList, setOptionsList] = useState<OptionsListModel>({ tone: toneList, reportType, attendanceType, language: [] });
  const getFormItemByType = item => {
    const { type: formType, value, maxTextCount, autoComplete, required } = item;
    if (formType === 'input') {
      if (['extraDesc', 'additional'].includes(value)) {
        return <TextArea rows={4} maxLength={maxTextCount} placeholder={renderPlaceholder()} />;
      } else {
        if (autoComplete) {
          return (
            <AutoComplete
              getPopupContainer={node => node}
              defaultActiveFirstOption={false}
              options={inputMemory[item.autoCompleteKey] || []}
              filterOption={false}
              maxLength={maxTextCount}
            >
              <Input maxLength={maxTextCount} placeholder={required ? '请输入' : getIn18Text('XUANTIAN')} />
            </AutoComplete>
          );
        }
        return <Input maxLength={maxTextCount} placeholder={required ? '请输入' : getIn18Text('XUANTIAN')} />;
      }
    } else if (formType === 'select') {
      const options = optionsList[item.value];
      return (
        <Select
          allowClear={value !== 'language'}
          showSearch
          placeholder={getIn18Text('QINGXUANZE')}
          getPopupContainer={node => node.parentElement}
          dropdownClassName={styles.dropdownClassName}
          suffixIcon={<i className="expand-icon" />}
        >
          {options.map(option => {
            return <Option value={option.value}>{option.label}</Option>;
          })}
        </Select>
      );
    } else if (formType === 'radio') {
      return (
        <Radio.Group
          className={styles.radioGroup}
          onChange={e => {
            sendWriteValue({ ...writeValue, wordCountLevel: e.target.value });
          }}
        >
          {item.originOptions.map(option => {
            return <Radio value={option.value}>{option.label}</Radio>;
          })}
        </Radio.Group>
      );
    } else if (formType === 'time') {
      const datePickerStyles: React.CSSProperties = { width: 105 };
      const timePickerStyles: React.CSSProperties = { ...datePickerStyles, width: 58 };
      return (
        <div className={classnames(styles.dateBox)}>
          {/* 开始日期 */}
          <Form.Item label="" name={['moments', 'startDate']}>
            <ScheduleDatePicker
              popperStrategy={'fixed'}
              className={classnames(styles.timeInput)}
              // onChange={handleStartDateChange}
              allowClear={false}
              style={datePickerStyles}
            />
          </Form.Item>
          {/* 开始时间 */}
          <Form.Item
            label=""
            name={['moments', 'startTime']}
            className={classnames(styles.marginLeft8Style)}
            // normalize={timeNormalize(['moments', 'startTime'])}
          >
            <ScheduleTimeStepPicker
              // onChange={handleStartTimeChange}
              popperStrategy={'fixed'}
              style={timePickerStyles}
              className={classnames(styles.timeInput)}
            />
          </Form.Item>
          <div className={classnames(styles.timeLine)} />
          {/* 结束日期 */}
          <Form.Item label="" name={['moments', 'endDate']}>
            <ScheduleDatePicker popperStrategy={'fixed'} className={classnames(styles.timeInput)} allowClear={false} style={datePickerStyles} />
          </Form.Item>
          {/* 结束时间 */}
          <Form.Item
            label=""
            name={['moments', 'endTime']}
            // normalize={timeNormalize(['moments', 'endTime'])}
            className={classnames(styles.marginLeft8Style)}
          >
            <ScheduleTimeStepPicker popperStrategy={'fixed'} className={classnames(styles.timeInput)} style={timePickerStyles} />
          </Form.Item>
        </div>
      );
    } else if (formType === 'date') {
      const datePickerStyles: React.CSSProperties = { width: 105 };
      return (
        <div className={classnames(styles.dateBox)}>
          {/* 开始日期 */}
          <Form.Item label="" name={['moments', 'startDate']}>
            <ScheduleDatePicker
              popperStrategy={'fixed'}
              className={classnames(styles.timeInput)}
              // onChange={handleStartDateChange}
              allowClear={false}
              style={datePickerStyles}
            />
          </Form.Item>
          <div className={classnames(styles.timeLine)} />
          {/* 结束日期 */}
          <Form.Item label="" name={['moments', 'endDate']}>
            <ScheduleDatePicker popperStrategy={'fixed'} className={classnames(styles.timeInput)} allowClear={false} style={datePickerStyles} />
          </Form.Item>
        </div>
      );
    }
    return <></>;
  };

  const renderHistory = item => {
    let historyList = [];
    let historyKey = '';
    if (['extraDesc'].includes(item.value)) {
      historyKey = 'extraDesc';
      // (1：开发信，2：产品介绍，3：节日祝福，0：其他)
      if (type === 'retouch' || writeValue.type === '1' || writeValue.type === '2') {
        historyList = (inputMemory?.intros && inputMemory?.intros[0]?.historyOptions) || [];
      } else if (writeValue.type === '3') {
        historyList = (inputMemory?.festivalDesc && inputMemory?.festivalDesc[0]?.historyOptions) || [];
      } else if (writeValue.type === '0') {
        historyList = (inputMemory?.otherDesc && inputMemory?.otherDesc[0]?.historyOptions) || [];
      } else if (writeValue.type === '5') {
        historyList = (inputMemory?.reportContents && inputMemory?.reportContents[0]?.historyOptions) || [];
      } else if (writeValue.type === '8') {
        historyList = (inputMemory?.announcementContents && inputMemory?.announcementContents[0]?.historyOptions) || [];
      }
    } else if (['additional'].includes(item.value)) {
      historyKey = 'additional';
      if (writeValue.type === '5') {
        historyList = (inputMemory?.reportAdditions && inputMemory?.reportAdditions[0]?.historyOptions) || [];
      } else if (writeValue.type === '6') {
        historyList = (inputMemory?.meetingAdditions && inputMemory?.meetingAdditions[0]?.historyOptions) || [];
      } else if (writeValue.type === '7') {
        historyList = (inputMemory?.attendanceAdditions && inputMemory?.attendanceAdditions[0]?.historyOptions) || [];
      } else if (writeValue.type === '8') {
        historyList = (inputMemory?.announcementAdditions && inputMemory?.announcementAdditions[0]?.historyOptions) || [];
      }
    }
    historyList = historyList.slice(0, 3);
    if (historyList.length > 0) {
      return (
        <div className={styles.history}>
          <span className={styles.title}>最近输入:</span>{' '}
          {historyList.map(every => {
            return (
              <span
                className={styles.everySpan}
                onClick={() => {
                  sendWriteValue({ ...writeValue, [historyKey]: every });
                }}
              >
                {every}
              </span>
            );
          })}
        </div>
      );
    }
    return '';
  };

  const renderContent = () => {
    // style={{ width: '80%' }}
    return curValueList.map(item => {
      if (writeValue.hasOwnProperty(item.value)) {
        if (item.value === 'tone' && writeValue.tone === getIn18Text('QITA')) {
          return (
            <Col span={12}>
              <Form.Item label={item.label}>
                <Form.Item name="tone">
                  <Select
                    allowClear
                    showSearch
                    placeholder={getIn18Text('QINGXUANZE')}
                    getPopupContainer={node => node.parentElement}
                    dropdownClassName={styles.dropdownClassName}
                    suffixIcon={<i className="expand-icon" />}
                  >
                    {optionsList[item.value].map(option => {
                      return <Option value={option.value}>{option.label}</Option>;
                    })}
                  </Select>
                </Form.Item>
                <Form.Item name="otherTone">
                  <Input placeholder={getIn18Text('QINGSHURU')} maxLength={50} />
                </Form.Item>
              </Form.Item>
            </Col>
          );
        }
        return (
          <Col span={item.col || 12}>
            <Form.Item
              // style={{ width: item.col === 12 ? '80%' : '100%' }}
              className={classnames({
                [styles.toneFormItem]: item.value === 'tone',
                [styles.extraDescFormItem]: ['extraDesc'].includes(item.value),
              })}
              name={item.value}
              rules={
                //! 申请时间变成不能为空了
                item.required
                  ? [
                      {
                        required: true,
                        // message: getIn18Text('MIAOSHUNINDEGONGSIHUO'), 这个文案不通用，在节日祝福的tab也不对，改成通用的
                        message: '内容不能为空',
                      },
                    ]
                  : []
              }
              label={
                <>
                  <span>{renderLabel(item.label, item.value)}</span>
                  {item.showTextCount && (
                    <span className={styles.numCount}>
                      {' '}
                      {writeValue[item.value].length} / {item.maxTextCount}
                    </span>
                  )}
                </>
              }
              tooltip={
                item.value === 'tone' && {
                  title: `邮件语气是指我们通常说的行文风格，等同于书面文字的声音和语调，是表达情感和整体态度的重要属性`,
                  icon: <InfoCircleOutlined />,
                }
              }
            >
              {getFormItemByType(item)}
            </Form.Item>
            {renderHistory(item)}
          </Col>
        );
      }
      return <></>;
    });
  };

  const renderLabel = (label: string, value: string) => {
    if (['extraDesc', 'time'].includes(value)) {
      return type === 'write' ? descLabelMap[writeValue.type.toString()].label : getIn18Text('MIAOSHUYOUJIANDEJUTI');
    }
    return label || '';
  };

  const renderPlaceholder = () => {
    return type === 'write' ? descLabelMap[writeValue.type.toString()].placeholder : getIn18Text('QINGMIAOSHUYOUJIANSHIYONG');
  };

  const fetchConfig = async () => {
    const data = await gptApi.getGptConfig();
    const language = (process.env.BUILD_ISEDM ? data?.languages : data.data?.data?.languages) || [];
    setOptionsList({ ...optionsList, language });
  };

  useEffect(() => {
    let res = [];
    for (var key in writeValue) {
      if (totalValueMap.has(key)) {
        let value = { ...(totalValueMap.get(key) as ValueModel) };
        if (['extraDesc'].includes(key) && type === 'retouch') {
          value.required = false;
        }
        res.push(value);
      }
    }
    setCurValueList(res);
  }, [writeValue]);

  useEffect(() => {
    fetchConfig();
  }, []);

  return <Row gutter={40}>{renderContent()}</Row>;
};
