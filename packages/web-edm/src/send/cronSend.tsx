import React, { useState, useImperativeHandle, useEffect, useMemo, useCallback } from 'react';
import moment, { Moment } from 'moment';
import { DatePicker, Form, Input, ModalProps, Select, Button, Tooltip, Spin } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, CronTimeZoneCountry, FetchCustomerInfoRes, CustomerInfoModel } from 'api';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import cnLocale from 'antd/es/date-picker/locale/zh_CN';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import TimeStepPicker from '@web-schedule/components/TimeStepPicker/TimeStepPicker';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { CronSendEmailsModal } from './CronSendModal/index';
import { edmDataTracker } from '../tracker/tracker';
import style from './cronSend.module.scss';
import { getIn18Text } from 'api';
import TongyongJianTouYou from '@web-common/images/newIcon/tongyong_jiantou_you';
import { LoadingIcon } from './write+';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
export type TrySendModalProps = Omit<ModalProps, 'title' | 'okButtonProps' | 'onOK'> & {
  onSend: (time: string, timeZone: string, country: string, userTimeZone?: Record<string, string>, sendMode?: SendMode) => Promise<boolean>;
  footerContent?: React.ReactElement;
  receivers?: Array<Record<string, string>>;
  sendModeVisible?: boolean;
};

export enum SendMode {
  standard = 1,
  local = 2,
}

type ModelKV = Record<string, CustomerInfoModel[]>;

interface SortedTopList {
  east?: Array<ModelKV>;
  west?: Array<ModelKV>;
  unknown?: CustomerInfoModel[];
}

export type CronSendModalMethods = {
  setCronSendTime: (sendTime: string, sendTimeZone: string, country?: string, mode?: SendMode) => void;
};

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const CronSendModal = React.forwardRef((props: TrySendModalProps, ref) => {
  const [disabled, setDisabled] = useState(true);
  const [sendMode, setSendMode] = useState(SendMode.standard);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{
    date: Moment;
    time: Moment;
    cronTimeZone: string;
    country: string;
  }>();
  const [showError, setShowError] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState<FetchCustomerInfoRes>();
  const [countryList, setCountryList] = useState<CronTimeZoneCountry[]>([]);
  const [cronInfo, setCronInfo] = useState({ country: '', setDefault: true });
  const [timeZoneMap, setTimeZoneMap] = useState<Record<string, string>>({});
  const [topList, setTopList] = useState<SortedTopList>({});
  const [emailsModalVisible, setEmailsModalVisible] = useState<boolean>(false);
  let standardMode = sendMode === SendMode.standard;
  let localMode = sendMode === SendMode.local;
  const { onOk, receivers, sendModeVisible = true, ...rest } = props;

  const [pageLoading, setPageLoading] = useState(false);
  const loadingComp = () => {
    return (
      <div className={style.pageLoading}>
        <Spin indicator={<LoadingIcon />} />
      </div>
    );
  };

  const toList = (model: SortedTopList) => {
    let resp: CustomerInfoModel[] = new Array();

    model.east?.forEach(item => {
      let temp = Object.values(item)[0];
      resp = resp.concat(temp);
    });
    model.west?.forEach(item => {
      let temp = Object.values(item)[0];
      resp = resp.concat(temp);
    });
    resp = resp.concat(model.unknown || []);
    return resp;
  };

  async function fetchTimezone() {
    const res = await edmApi.getEdmCronTimezone();
    setCountryList(res?.countryList || []);

    let kv: Record<string, string> = {};
    res?.countryList.forEach(item => {
      item.timeZoneList.forEach(innerItem => {
        kv[innerItem.timeZone] = innerItem.timeZoneDesc;
      });
    });
    setTimeZoneMap(kv);
  }

  const getTopTimezone = () => {
    if (!customerInfo || customerInfo.customerInfos.length === 0) {
      return;
    }
    // {时区: [时区对应的人]}
    let kv: ModelKV = {};
    let unKnown = new Array<CustomerInfoModel>();
    customerInfo.customerInfos.forEach(item => {
      if (!item.exist) {
        unKnown.push(item);
        return;
      }
      let values = kv[item.timezone] || [];
      values.push(item);
      kv[item.timezone] = values;
    });
    const sortedArray = Object.entries(kv).sort((a, b) => b[1].length - a[1].length);
    if (!sortedArray || sortedArray.length === 0) {
      setTopList({
        unknown: unKnown,
      });
      return;
    }

    let resp: ModelKV = {};
    for (let value of sortedArray) {
      resp[value[0]] = value[1];
    }

    // 排序规则, 东(+) > 西(-), 1->12级
    let eastTimezone: ModelKV = {};
    let westTimezone: ModelKV = {};
    for (const timezone in resp) {
      if (parseInt(timezone) < 0) {
        westTimezone[timezone] = resp[timezone];
      } else {
        eastTimezone[timezone] = resp[timezone];
      }
    }
    let sortEast = Object.entries(eastTimezone).sort((a, b) => {
      if (a[1].length === b[1].length) {
        return parseInt(a[0]) - parseInt(b[0]);
      }
      return b[1].length - a[1].length;
    });
    let e = sortEast?.map(item => {
      let kv: ModelKV = {};
      kv[item[0]] = item[1];
      return kv;
    });
    let sortWest = Object.entries(westTimezone).sort((a, b) => {
      if (a[1].length === b[1].length) {
        return parseInt(b[0]) - parseInt(a[0]);
      }
      return b[1].length - a[1].length;
    });
    let w = sortWest?.map(item => {
      let kv: ModelKV = {};
      kv[item[0]] = item[1];
      return kv;
    });
    setTopList({
      east: e,
      west: w,
      unknown: unKnown,
    });
  };

  useEffect(() => {
    getTopTimezone();
  }, [customerInfo]);

  const handleSend = () => {
    form.validateFields().then(values => {
      const timeString = [values.date.format('YYYY-MM-DD'), values.time.format('HH:mm:ss')];
      // '2021-12-06T12:12:11+08:00' 标准加时区时间
      if (+moment(timeString.join('T') + values.cronTimeZone).toDate() < Date.now()) {
        // todo 小于当前时间提示
        setShowError(getIn18Text('DINGSHIFASONGSHIJIANBUNENGXIAOYUDANGQIANSHIJIAN'));
        return;
      }
      setShowError('');
      setLoading(true);

      let kv: Record<string, string> = {};
      customerInfo?.customerInfos.map(item => {
        if (item.exist && (item.timezone?.length || 0) > 0) {
          kv[item.email] = item.timezone;
        }
      });
      try {
        props.onSend(timeString.join(' '), values.cronTimeZone, values.country, kv, sendMode);
      } catch (e: any) {
        if (e?.code === 100) {
          setShowError('TIP');
          edmDataTracker.trackSendResult('timing', {
            result: 'limit',
          });
        } else if (e?.data?.data?.message) {
          setShowError(e?.data?.data?.message);
        }
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (props.visible && (receivers?.length || 0) > 0) {
      fetchTimeZone();
    }
  }, [receivers, props.visible]);

  const handleDateByLocal = (h: number, m: number) => {
    const cMoment = moment().add(h, 'hours').add(m, 'm');
    const cMinute = cMoment.minute();
    const cHour = cMoment.hour();
    const cDate = cMoment.date();
    let nMinute = cMinute;
    let nHour = cHour;
    let nDate = cDate;
    if (cMinute <= 30) {
      nMinute = cMinute <= 15 ? 15 : 30;
    } else {
      if (cMinute <= 45) {
        nMinute = 45;
      } else {
        nMinute = 0;
        nHour++;
        if (nHour >= 24) {
          nHour = 0;
          nDate++;
        }
      }
    }
    const treatedDate = moment().set({ date: nDate, hour: nHour, minute: nMinute, second: 0, milliseconds: 0 });
    return treatedDate;
  };

  const fetchTimeZone = async () => {
    let emails = receivers?.map(item => {
      return item.email;
    });

    if (emails && emails?.length > 0) {
      setPageLoading(true);
      try {
        let resp = await edmApi.fetchCustomerInfo({ emails: emails });
        resp && setCustomerInfo(resp);
      } catch (e) {
      } finally {
        setPageLoading(false);
      }
    }
  };

  const getLocalTime = (cronDate: Moment, time: Moment, cronTimeZone: string) => {
    if (cronDate && time && cronTimeZone) {
      const dateString = cronDate.format('YYYY-MM-DD');
      const timeString = time.format('HH:mm:ss');
      const date = moment(`${dateString}T${timeString}${cronTimeZone}`);
      return date.utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
    }
    return '-';
  };
  const handleChange = () => {
    const values = form.getFieldsValue();
    setDisabled(!values.date || !values.time);
    setLocalTime(getLocalTime(values.date, values.time, values.cronTimeZone));
  };
  const cronTimezoneList = useMemo(() => {
    if (!cronInfo.country) {
      form.setFields([{ name: 'cronTimeZone', value: undefined }]);
      return [];
    }
    const countryInfo = countryList.find(item => item.country === cronInfo.country);
    if (countryInfo) {
      const timeZones = countryInfo?.timeZoneList || [];
      if (cronInfo.setDefault) {
        const defaultTimeZone = timeZones.find(item => item.defaultTimeZone);
        form.setFields([{ name: 'cronTimeZone', value: defaultTimeZone?.timeZone || undefined }]);
      }
      return timeZones.map(timeZone => ({
        ...timeZone,
        country: countryInfo.country,
      }));
    }
    return [];
  }, [cronInfo, countryList]);
  const disableDate = useCallback(current => current && current <= moment().subtract(1, 'days').endOf('day'), []);
  const errorContent =
    showError === 'TIP' ? (
      <>
        {getIn18Text('FAXINLIANGXIANE\uFF0CQINGSHANJIANHUOBAOCUNHOU')}
        <a
          /* eslint-disable-next-line */
          href="https://qiye163.qiyukf.com/client?k=abab5b9989e6f898240067f40874a096&wp=1&gid=480959804&robotShuntSwitch=1&robotId=9091&templateId=6603268&qtype=4483243&welcomeTemplateId=1151&t=%E7%81%B5%E7%8A%80%E5%8A%9E%E5%85%AC%E6%A1%8C%E9%9D%A2%E7%89%88"
          target="_blank"
          rel="noreferrer"
        >
          {getIn18Text('LIANXIKEFU')}
        </a>
      </>
    ) : (
      <>{showError}</>
    );
  useImperativeHandle(ref, () => ({
    setCronSendTime: (sendTime: string, cronTimeZone: string, country: string, mode?: SendMode) => {
      const date = moment(sendTime);
      const time = moment(sendTime);
      setSendMode(mode || SendMode.standard);
      form.setFieldsValue({
        date,
        time,
        country,
        cronTimeZone,
      });
      setDisabled(!sendTime);
      setCronInfo({ country, setDefault: false });
      setLocalTime(getLocalTime(date, time, cronTimeZone));
    },
  }));
  useEffect(() => {
    fetchTimezone();
  }, []);

  useEffect(() => {
    if (sendMode === SendMode.local && !form.getFieldValue('date')) {
      const date = handleDateByLocal(1, 15);
      form.setFieldsValue({
        date: date,
        time: date,
      });
      setDisabled(!date);
    }
  }, [sendMode]);

  const SendModeComp = () => {
    let existCount =
      customerInfo?.customerInfos.filter(item => {
        return item.exist;
      }).length || 0;

    return (
      <Form.Item className={style.sendMode} label={'发送机制'} style={existCount > 0 ? { margin: '0px' } : {}}>
        <Radio.Group
          onChange={e => {
            setSendMode(e.target.value);
          }}
          value={sendMode}
        >
          <Radio value={SendMode.standard}>统一时间发送</Radio>
          <Radio value={SendMode.local}>
            <div className={style.localSendMode}>
              <span>当地时间发送</span>
              <Tooltip title={'跟随收件人所在地区的时间，开始发信任务'}>
                <ExplanationIcon />
              </Tooltip>
            </div>
          </Radio>
        </Radio.Group>
      </Form.Item>
    );
  };

  const CountryAndAreaComp = () => {
    return (
      <Form.Item label={getIn18Text('GUOJIADEQU')} name="country" rules={[{ required: true, message: getIn18Text('QINGXUANZEGUOJIADEQU') }]}>
        <Select
          showSearch
          allowClear
          placeholder={getIn18Text('QINGXUANZEXIANGYAOFASONGDEGUOJIA')}
          suffixIcon={<DownTriangle />}
          dropdownClassName="edm-selector-dropdown"
          onChange={country => setCronInfo({ country: country as string, setDefault: true })}
        >
          {countryList.map(country => (
            <Select.Option value={country.country} key={country.country}>
              {country.country}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
  };

  const TargetTimeZoneComp = () => {
    return (
      <Form.Item label={getIn18Text('DUIYINGSHIQU')} name="cronTimeZone" rules={[{ required: true, message: getIn18Text('QINGXUANZESHIQU') }]}>
        {cronTimezoneList.length ? (
          <Select style={{ width: '352px' }} suffixIcon={<DownTriangle />} dropdownClassName="edm-selector-dropdown">
            {cronTimezoneList.map(timeZone => (
              <Select.Option value={timeZone.timeZone} key={`${timeZone.country}-${timeZone.timeZone}-${timeZone.timeZoneDesc}`}>
                {timeZone.timeZoneDesc}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <Input style={{ width: '352px' }} defaultValue="-" disabled />
        )}
      </Form.Item>
    );
  };

  const SendTimeComp = () => {
    return (
      <Form.Item className={style.limitItem} label={getIn18Text('FASONGSHIJIAN')} style={{ height: 32 }}>
        <Input.Group compact>
          <Form.Item name="date" rules={[{ required: true, message: getIn18Text('QINGXUANZERIQI') }]}>
            <DatePicker placeholder={getIn18Text('QINGXUANZERIQI')} style={{ width: '304px' }} locale={cnLocale} disabledDate={disableDate} />
          </Form.Item>
          <Form.Item name="time" rules={[{ required: true, message: getIn18Text('QINGXUANZESHIJIAN') }]}>
            <TimeStepPicker className={style.timePicker} />
          </Form.Item>
        </Input.Group>
      </Form.Item>
    );
  };

  const MapBeiJingComp = () => {
    return (
      <Form.Item label={getIn18Text('BEIJINGSHIJIAN')} style={{ marginBottom: 0 }}>
        <Input value={disabled ? '-' : localTime} disabled />
      </Form.Item>
    );
  };

  const TooltipComp = () => {
    return (
      <Form.Item noStyle>
        <Tooltip
          title={
            <>
              <div>{getIn18Text('SHIQUSHUOMING\uFF1A')}</div>
              <div>{getIn18Text('1.YIYINGGUOGENINIZHISHIJIANWEIQIDIAN\uFF0CYINGGUOSUOZAIQUYUWEILINGSHIQU\uFF08UTC+0 \uFF09')}</div>
              <div>{getIn18Text('2.ZHONGGUOYIBEIJINGSHIJIANWEIZHUN\uFF0CSUOZAISHIQUWEIDONG8QU\uFF08 UTC+8 \uFF09\uFF0CBILINGSHIQUKUAILE8GEXIAOSHI')}</div>
              <div>{getIn18Text('3.MEIGUOYIHUASHENGDUNSHIJIANWEIZHUN\uFF0CSUOZAISHIQUWEIXI5QU\uFF08UTC-5\uFF09\uFF0CBILINGSHIQUMANLE5GEXIAOSHI')}</div>
            </>
          }
        >
          <ExplanationIcon className={style.cronSentFormTip} />
        </Tooltip>
      </Form.Item>
    );
  };

  const StandardSmartAssistantComp = () => {
    if (!customerInfo || customerInfo.customerInfos.length === 0) {
      return undefined;
    }
    let existCount = customerInfo.customerInfos.filter(item => {
      return item.exist;
    }).length;
    if (existCount === 0) {
      return undefined;
    }
    let eastTopListCount = 0;
    let westTopListCount = 0;
    if (topList.east && topList.east.length > 0) {
      eastTopListCount = Object.values(topList.east[0])[0].length;
    }
    if (topList.west && topList.west.length > 0) {
      westTopListCount = Object.values(topList.west[0])[0].length;
    }
    let showEast = eastTopListCount >= westTopListCount;

    return (
      <div className={style.smartAssRoot}>
        {showEast && topList.east && topList.east.length > 0 && (
          <div className={style.smartAss}>
            <div className={style.dot} />
            智能营销助手检测到收件人有<span className={style.count}>{Object.values(topList.east[0])[0].length}</span>
            位，位于{timeZoneMap[Object.keys(topList.east[0])[0]]}
          </div>
        )}
        {!showEast && topList.west && topList.west.length > 0 && (
          <div className={style.smartAss}>
            <div className={style.dot} />
            智能营销助手检测到收件人有<span className={style.count}>{Object.values(topList.west[0])[0].length}</span>
            位，位于{timeZoneMap[Object.keys(topList.west[0])[0]]}
          </div>
        )}
        <div
          className={style.seeAll}
          onClick={() => {
            setEmailsModalVisible(true);
          }}
        >
          查看全部
          <TongyongJianTouYou fill={'#4C6AFF'} />
        </div>
      </div>
    );
  };
  const LocalSmartAssiatantComp = () => {
    if (!customerInfo || customerInfo.customerInfos.length === 0) {
      return undefined;
    }
    let existCount = customerInfo.customerInfos.filter(item => {
      return item.exist;
    }).length;
    let unknownCount = customerInfo.customerInfos.length - existCount;

    return (
      <div className={style.smartAssRoot}>
        {existCount > 0 && (
          <div className={style.smartAss}>
            <div className={style.dot}></div>有<span className={style.count}>{existCount}</span>
            位收件人检测到时区，将会在当地时间开始发信
          </div>
        )}
        {unknownCount > 0 && (
          <div className={style.smartAss}>
            <div className={style.dot}></div>有<span className={style.count}>{unknownCount}</span>
            位收件人未检测到时区，将会在北京时间开始发信
          </div>
        )}
        <div
          className={style.seeAll}
          onClick={() => {
            setEmailsModalVisible(true);
          }}
        >
          查看全部
          <TongyongJianTouYou fill={'#4C6AFF'} />
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title={getIn18Text('SHEDINGFASONGSHIJIAN')}
        className={style.cronSendModal}
        visible={props.visible}
        width={480}
        footer={
          <div className={style.cronModalFooter}>
            <div className={style.cronModalFooterContent}>{props.footerContent}</div>
            <Button
              onClick={e => {
                setLoading(false);
                props.onCancel && props.onCancel(e);
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button type="primary" loading={loading} disabled={disabled} onClick={handleSend}>
              {getIn18Text('SHEDINGWANCHENG')}
            </Button>
          </div>
        }
        /* eslint-disable-next-line */
        {...rest}
      >
        {showError !== '' && (
          <div style={{ height: 12 }}>
            <div className={style.errorTip}>
              <AlertErrorIcon style={{ verticalAlign: -5, marginRight: 4 }} />
              {errorContent}
            </div>
          </div>
        )}
        <Form
          className={style.cronSentForm}
          form={form}
          colon={false}
          requiredMark={false}
          onFieldsChange={handleChange}
          initialValues={{
            time: moment().startOf('day'),
          }}
        >
          {sendModeVisible && SendModeComp()}
          {standardMode && StandardSmartAssistantComp()}
          {localMode && LocalSmartAssiatantComp()}
          {standardMode && CountryAndAreaComp()}
          {standardMode && TargetTimeZoneComp()}
          {standardMode && TooltipComp()}
          {SendTimeComp()}
          {standardMode && MapBeiJingComp()}
          {pageLoading && loadingComp()}
        </Form>
      </Modal>

      {emailsModalVisible && (
        <CronSendEmailsModal
          emails={toList(topList)}
          onClose={() => {
            setEmailsModalVisible(false);
          }}
        />
      )}
    </>
  );
});
