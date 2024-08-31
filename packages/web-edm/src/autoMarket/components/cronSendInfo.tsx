import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Form, Select, TimePicker, Input, Checkbox } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, CronTimeZoneCountry } from 'api';
import { getTransText } from '@/components/util/translate';
import { FormInstance } from 'antd/lib/form';
import { TimePickerProps } from 'antd/lib/time-picker';
import { Moment } from 'moment';
import style from './cronSendInfo.module.scss';
import { getIn18Text } from 'api';

interface Props {
  form: FormInstance;
  value?: any;
}

interface SelectItem {
  value: string;
  children: string;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

interface CustomTimePickerProps {
  onChange?: (v: string) => void;
}

const CustomTimePicker: React.FC<CustomTimePickerProps & TimePickerProps> = props => {
  const { onChange, ...restProps } = props;
  const [value, setValue] = useState<Moment | null>(null);

  function onTimeChange(value: Moment | null, _: string) {
    if (onChange) {
      onChange(value?.format('HH:mm') || '');
    }
  }

  useEffect(() => {
    if (props.value) {
      const date = moment(`2022-01-01 ${props.value}`);
      setValue(date);
    } else {
      setValue(null);
    }
  }, [props.value]);

  return <TimePicker {...restProps} onChange={onTimeChange} value={value} />;
};

export const CronSendInfo: React.FC<Props> = ({ form, value }) => {
  const [countryList, setCountryList] = useState<CronTimeZoneCountry[]>([]);

  async function fetchTimezone() {
    const res = await edmApi.getEdmCronTimezone();
    setCountryList(res?.countryList || []);
  }

  useEffect(() => {
    fetchTimezone();
  }, []);

  const cronTimezoneList = useMemo(() => {
    if (!value?.country) {
      return [];
    }
    const countryInfo = countryList.find(item => item.country === value?.country);
    if (countryInfo) {
      const timeZones = countryInfo?.timeZoneList || [];

      if (!value?.timeZone) {
        const defaultTimeZone = timeZones.find(item => item.defaultTimeZone);
        form.setFields([
          {
            name: ['cronSendInfo', 'timeZone'],
            value: defaultTimeZone?.timeZone || '',
          },
          {
            name: ['cronSendInfo', 'timeZoneDesc'],
            value: defaultTimeZone?.timeZoneDesc || '',
          },
        ]);
      }
      return timeZones.map(timeZone => ({
        ...timeZone,
        country: countryInfo.country,
      }));
    }
    return [];
  }, [value, countryList]);

  function showCronInfoChange(checked: boolean) {
    const formData = form.getFieldsValue();
    if (!checked) {
      form.setFields([{ name: 'cronSendInfo', value: null }]);
    } else if (!formData.cronSendInfo) {
      form.setFields([{ name: 'cronSendInfo', value: {} }]);
    }
  }

  function countryChange(country: string) {
    // 国家改变 清空时区
    form.setFields([
      {
        name: ['cronSendInfo', 'timeZone'],
        value: '',
      },
      {
        name: ['cronSendInfo', 'timeZoneDesc'],
        value: '',
      },
    ]);
  }

  function timeZoneChange(item: SelectItem) {
    form.setFields([{ name: ['cronSendInfo', 'timeZoneDesc'], value: item.children }]);
  }

  const tagRender = useCallback(() => {
    const weeks: string[] = value?.sendWeekDays || [];
    if (
      weeks.length === 5 &&
      weeks.every(v => [getIn18Text('XINGQIYI'), getIn18Text('XINGQIER'), getIn18Text('XINGQISAN'), getIn18Text('XINGQISI'), getIn18Text('XINGQIWU')].includes(v))
    ) {
      return <div>{getIn18Text('GONGZUORI')}</div>;
    }

    if (weeks.length === 2 && weeks.every(v => [getIn18Text('XINGQILIU'), getIn18Text('XINGQIRI')].includes(v))) {
      return <div>{getIn18Text('ZHOUMO')}</div>;
    }

    return <div>{weeks.join(',')}</div>;
  }, [value]);

  return (
    <div className={style.wrapper}>
      <Form.Item noStyle shouldUpdate={() => true}>
        {() => {
          const cronSendInfo = form.getFieldValue('cronSendInfo');
          const show = Boolean(cronSendInfo);
          return (
            <>
              <Checkbox checked={Boolean(cronSendInfo)} onChange={({ target: { checked } }) => showCronInfoChange(checked)}>
                {getTransText('ZHIDINGSHIJIANFASONG')}
              </Checkbox>
              {show ? (
                <div className={style.formItem}>
                  <Form.Item
                    label={getTransText('GUOJIADEQU')}
                    name={['cronSendInfo', 'country']}
                    rules={[{ required: true, message: getTransText('QINGXUANZEGUOJIADEQU') }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder={getTransText('QINGXUANZEXIANGYAOFASONGDEGUOJIA')}
                      // suffixIcon={<DownTriangle />}
                      dropdownClassName="edm-selector-dropdown"
                      onChange={country => countryChange(country as string)}
                    >
                      {countryList.map(country => (
                        <Select.Option value={country.country} key={country.country}>
                          {country.country}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={getTransText('DUIYINGSHIQU')}
                    name={['cronSendInfo', 'timeZone']}
                    rules={[{ required: true, message: getTransText('QINGXUANZESHIQU') }]}
                  >
                    {cronTimezoneList.length ? (
                      <Select dropdownClassName="edm-selector-dropdown" onChange={(_, item) => timeZoneChange(item as SelectItem)}>
                        {cronTimezoneList.map(timeZone => (
                          <Select.Option value={timeZone.timeZone} key={`${timeZone.country}-${timeZone.timeZone}-${timeZone.timeZoneDesc}`}>
                            {timeZone.timeZoneDesc}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : (
                      <Input defaultValue="-" disabled />
                    )}
                  </Form.Item>

                  <Form.Item
                    label={getTransText('SHIJIAN')}
                    className={style.inlineForm}
                    // noStyle
                  >
                    <Form.Item name={['cronSendInfo', 'sendWeekDays']} rules={[{ required: true, message: getTransText('QINGXUANZE'), type: 'array' }]}>
                      <Select
                        mode="multiple"
                        style={{ width: 310, marginRight: 20 }}
                        dropdownClassName="edm-selector-dropdown"
                        placeholder={getTransText('AutoEmailCronDayHolder')}
                        maxTagCount={1}
                        showSearch={false}
                        tagRender={tagRender}
                      >
                        <Select.Option value={getIn18Text('XINGQIYI')}>{getIn18Text('XINGQIYI')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQIER')}>{getIn18Text('XINGQIER')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQISAN')}>{getIn18Text('XINGQISAN')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQISI')}>{getIn18Text('XINGQISI')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQIWU')}>{getIn18Text('XINGQIWU')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQILIU')}>{getIn18Text('XINGQILIU')}</Select.Option>
                        <Select.Option value={getIn18Text('XINGQIRI')}>{getIn18Text('XINGQIRI')}</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name={['cronSendInfo', 'sendTime']} rules={[{ required: true, message: getTransText('QINGXUANZESHIJIAN') }]}>
                      <CustomTimePicker placeholder={getTransText('QINGXUANZESHIJIAN')} format="HH:mm" />
                    </Form.Item>
                  </Form.Item>
                </div>
              ) : (
                ''
              )}
            </>
          );
        }}
      </Form.Item>
    </div>
  );
};
