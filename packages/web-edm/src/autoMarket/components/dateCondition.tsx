import React, { useEffect, useCallback, useState } from 'react';
import { Button, Form, Checkbox, Tooltip, CheckboxProps } from 'antd';
import { apiHolder, apis, AutoMarketApi, AutoMarketTaskTriggerCondition } from 'api';
import DatePicker from '@/components/Layout/Customer/components/UI/DatePicker/datePicker';
import moment, { Moment } from 'moment';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { useLocalStorage } from 'react-use';
import { getTransText } from '@/components/util/translate';
import style from './dateCondition.module.scss';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

interface DateConditionProps {
  visible: boolean;
  values: AutoMarketTaskTriggerCondition.DATE;
  resetValues: AutoMarketTaskTriggerCondition.DATE;
  onSave: (values: AutoMarketTaskTriggerCondition.DATE) => void;
  onClose: () => void;
}

interface CountryMap {
  countryName: string;
  countryCode: string;
}

type FormData = Record<string, boolean | string | Moment[]>;

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
const DateCondition: React.FC<DateConditionProps> = props => {
  const { visible, values, resetValues, onSave, onClose } = props;
  const [form] = Form.useForm();
  const [countrys, setCountrys] = useLocalStorage<string[]>('AutomarketFestivalDate', ['CN']);
  const [festivalMap, setFestivalMap] = useState<Record<string, { name: string; dateMap: Record<string, string> }>>({});
  const [countryMaps, setCountryMaps] = useState<CountryMap[]>([]);

  async function fetchFestivalMap() {
    const res = await autoMarketApi.getAutoMarketHolidayInfo();
    const festMap: Record<string, { name: string; dateMap: Record<string, string> }> = {};
    const countryMaps: CountryMap[] = [];
    if (res?.countryHolidayList?.length) {
      res.countryHolidayList.forEach(item => {
        const dateMap = (item?.holidayList || []).reduce((map, current) => {
          map[current.date] = current.holidayName;
          return map;
        }, {} as Record<string, string>);

        festMap[item.countryEnglishName] = {
          name: item.countryName,
          dateMap,
        };

        countryMaps.push({
          countryName: item.countryName,
          countryCode: item.countryEnglishName,
        });
      });
    }
    setCountryMaps(countryMaps);
    setFestivalMap(festMap);
  }

  const handleSetFieldsValues = (values: AutoMarketTaskTriggerCondition.DATE) => {
    let triggerTimes =
      values?.triggerTimes && values.triggerTimes.length
        ? values.triggerTimes.map(time => {
            return time ? moment(time) : undefined;
          })
        : [undefined];
    // 国家字段无需保存到服务端
    form.setFieldsValue({
      ...values,
      triggerTimes,
      selectCountrys: countrys,
    });
  };

  useEffect(() => {
    fetchFestivalMap();
  }, []);

  // useEffect(() => {
  //   form.setFieldsValue({ triggerTimes: [undefined], selectCountrys:countrys });
  // }, [form, countrys, visible])

  useEffect(() => {
    handleSetFieldsValues(values);
  }, [values, visible]);

  const handleReset = () => {
    handleSetFieldsValues(resetValues);
  };

  const onFinish = (values: any) => {
    console.log('Received values of form:', values);
    const triggerTimes: string[] = [];
    values.triggerTimes.forEach((date: Moment) => {
      triggerTimes.push(date.format('YYYY-MM-DD'));
      console.log('fieldsValue', date.format('YYYY-MM-DD'));
    });
    if (triggerTimes.length === [...new Set(triggerTimes)].length) {
      onSave({ ...values, triggerTimes });
    } else {
      Toast.warning({ content: getTransText('WUXUANZECHONGFURIQI') });
    }
  };
  const onValuesChange = (data: FormData) => {
    let key = 'selectCountrys';
    if (key in data) {
      setCountrys(data[key]);
    }
    console.log('onFieldsChange', data);
  };

  const dateRender = useCallback(
    (currentDate: Moment) => {
      const day = currentDate.format('DD');
      if (!countrys?.length) {
        return (
          <div className={style.dateCell}>
            <div className={style.dateCellDay}>{+day}</div>
          </div>
        );
      }
      const key = currentDate.format('YYYY-MM-DD');
      const fstList: string[] = [];
      const countryList: string[] = [];
      const tipMap: Record<string, string[]> = {};

      countrys.forEach(country => {
        const map = festivalMap[country];
        const fstName = map?.dateMap?.[key];
        if (fstName) {
          fstList.push(fstName);
          countryList.push(map.name);
          if (!tipMap[fstName]) {
            tipMap[fstName] = [map.name];
          } else if (!tipMap[fstName].includes(map.name)) {
            tipMap[fstName].push(map.name);
          }
        }
      });

      const tipText = Object.entries(tipMap)
        .map(([fastName, countrys]) => {
          return `${fastName}[${countrys?.join('/')}]`;
        })
        .join('、');

      return (
        <Tooltip title={tipText} arrowPointAtCenter>
          <div className={style.dateCell}>
            <div className={style.dateCellDay}>{+day}</div>
            {fstList.length ? (
              <>
                <div className={style.dateCellExt}>
                  <div className={style.dateCellEllips}>{fstList.join('、')}</div>
                </div>
                <div className={style.dateCellExt}>
                  <span style={{ textAlign: 'right' }}>[</span>
                  <div className={style.dateCellEllips}>{countryList.join('/')}</div>
                  <span style={{ textAlign: 'left' }}>]</span>
                </div>
              </>
            ) : (
              ''
            )}
          </div>
        </Tooltip>
      );
    },
    [countrys, festivalMap]
  );

  interface CheckboxWrapProps extends CheckboxProps {
    value?: number;
    onChange?: (value: number) => void;
  }
  const CheckboxWrap: React.FC<CheckboxWrapProps> = props => {
    const { value, onChange, children, ...rest } = props;
    return (
      <Checkbox {...rest} checked={Boolean(value)} onChange={e => onChange && onChange(Number(e.target.checked))}>
        {children}
      </Checkbox>
    );
  };

  return (
    <Drawer
      className={style.dateCondition}
      title={getIn18Text('XUANZEPANDUANTIAOJIAN')}
      contentWrapperStyle={{ width: 500 }}
      visible={visible}
      onClose={() => {
        handleSetFieldsValues(values);
        onClose();
      }}
      footer={
        <div className={style.dateConditionFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button
            type="primary"
            onClick={() => {
              form.submit();
            }}
          >
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.dateConditionBody}>
        <Form className={style.form} form={form} onFinish={onFinish} onValuesChange={onValuesChange} layout="vertical">
          <Form.List name="triggerTimes">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item label={index === 0 ? getIn18Text('ANRIQI') : ''} required={true} key={field.key} className={style.formListItem}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          message: getIn18Text('QINGXUANZERIQI'),
                        },
                      ]}
                      noStyle
                    >
                      <DatePicker className={style.datePicker} dateRender={dateRender} style={{ width: '425px' }} getPopupContainer={node => node as HTMLElement} />
                    </Form.Item>
                    <div className={style.btns}>{fields.length === 1 ? null : <RemoveIcon onClick={() => remove(field.name)} />}</div>
                  </Form.Item>
                ))}
                {
                  <Form.Item label=" " colon={false} noStyle>
                    <div className={style.addSubWrap}>
                      <span
                        onClick={() => {
                          fields.length < 10 ? add() : null;
                        }}
                        className={fields.length < 10 ? style.addSubIcon : style.addSubDisableIcon}
                      />
                      <span
                        onClick={() => {
                          fields.length < 10 ? add() : null;
                        }}
                        className={style.addSubTxt}
                        style={{ color: fields.length < 10 ? '#386EE7' : '#B7C3FF' }}
                      >
                        {getTransText('TIANJIARIQI')}
                      </span>
                    </div>
                  </Form.Item>
                }
              </>
            )}
          </Form.List>
          <Form.Item className={style.formItemDate} name={'periodicityType'}>
            <CheckboxWrap>{getTransText('SHIFOUMEINIANCHONGFU')}</CheckboxWrap>
          </Form.Item>

          <Form.Item label={getTransText('FestivalTip')} name={'selectCountrys'}>
            <Checkbox.Group>
              {countryMaps.map(country => {
                return (
                  <Checkbox value={country.countryCode} key={country.countryCode}>
                    {country.countryName}
                  </Checkbox>
                );
              })}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </div>
    </Drawer>
  );
};
export default DateCondition;
