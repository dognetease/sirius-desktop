import React, { useState } from 'react';
import { apiHolder as api, apis, DataTrackerApi } from 'api';
import { Radio, Space, DatePicker, RadioChangeEvent, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import moment, { Moment } from 'moment';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import styles from './sortTimeRangeModel.module.scss';
import { getIn18Text } from 'api';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export interface SortTimeRangeModelProps {
  destroy: Function;
  onComplete: Function;
}

type RangeValue = Moment | null;

const RangePickerPH: [string, string] = [getIn18Text('KAISHIRIQI'), getIn18Text('JIESHURIQI')];

const SortTimeRangeModel = (props: SortTimeRangeModelProps) => {
  const { destroy, onComplete } = props;
  const [rangeType, setRangeType] = useState<number>(1);
  const [diyMoment, setDiyMoment] = useState<RangeValue[]>([]);

  const onClose = () => {
    destroy && destroy();
  };

  const onChangeRangeType = (e: RadioChangeEvent) => {
    const curVal = e.target.value;
    setRangeType(curVal);
    if (curVal != 3) {
      setDiyMoment([]);
    }
  };

  // 选了一边就触发
  // 清空时会触发
  const onCalendarChange = (dates: [RangeValue, RangeValue]) => {
    setDiyMoment(dates);
  };

  const disabledDateFun = (current: RangeValue) => {
    if (!diyMoment || diyMoment.length < 1) {
      return false;
    }
    const tooLate = diyMoment[0] && current && current.diff(diyMoment[0], 'days') >= 30;
    const tooEarly = diyMoment[1] && diyMoment[1].diff(current, 'days') >= 30;
    return !!tooEarly || !!tooLate;
  };

  const onCancel = () => {
    onComplete && onComplete(false);
    destroy && destroy();
  };

  const onConfirm = () => {
    let optionStr = '';
    let dayPeriod: string[] = [];
    if (rangeType === 1) {
      optionStr = '最近15天';
      dayPeriod = [moment().subtract(14, 'day').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
    }
    if (rangeType === 2) {
      optionStr = '最近30天';
      dayPeriod = [moment().subtract(29, 'day').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
    }
    if (rangeType === 3) {
      optionStr = '自定义30天内时间范围';
      if (diyMoment.length < 2 || !diyMoment[0] || !diyMoment[1]) {
        message.error({ content: getIn18Text('QINGXUANZELIANXU') });
        return;
      }
      dayPeriod = [diyMoment[0]?.format('YYYY-MM-DD'), diyMoment[1]?.format('YYYY-MM-DD')];
    }
    optionStr && trackApi.track('pcMail_click_submit_sortTimePage', { option: optionStr });
    onComplete && onComplete(true, dayPeriod);
    destroy && destroy();
  };

  return (
    <SiriusHtmlModal width={360} visible destroyOnClose footer={null} closable={false}>
      <div className={styles.wrap}>
        <div className={styles.title}>
          <div className={styles.name}>{getIn18Text('XUANZEPAIXUSHIJIANFANWEI')}</div>
          <div className={styles.close} onClick={onClose} />
        </div>

        <div className={`ant-allow-dark ${styles.content}`}>
          <Radio.Group onChange={onChangeRangeType} value={rangeType}>
            <Space direction="vertical">
              <Radio value={1}>{getIn18Text('ZUIJIN15')}</Radio>
              <Radio value={2}>{getIn18Text('ZUIJIN30')}</Radio>
              <Radio value={3}>
                {getIn18Text('ZIDINGYI30')}
                {rangeType === 3 && (
                  <>
                    <br />
                    <DatePicker.RangePicker
                      allowEmpty={[true, true]}
                      placeholder={RangePickerPH}
                      format="YYYY-MM-DD"
                      locale={cnlocale}
                      disabledDate={disabledDateFun}
                      onCalendarChange={onCalendarChange}
                      // onOpenChange={onOpenChange}
                      suffixIcon=""
                    />
                  </>
                )}
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div className={styles.footerArea}>
          <Button type="primary" className={styles.confirmBut} onMouseDown={onConfirm}>
            {getIn18Text('QUEDING')}
          </Button>
          <Button type="default" className={styles.cancelBut} onMouseDown={onCancel}>
            {getIn18Text('QUXIAO')}
          </Button>
        </div>
      </div>
    </SiriusHtmlModal>
  );
};

export default SortTimeRangeModel;
