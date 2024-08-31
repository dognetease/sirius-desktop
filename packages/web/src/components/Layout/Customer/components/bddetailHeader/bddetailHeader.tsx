import React, { useCallback, useMemo } from 'react';
import style from './bddetailHeader.module.scss';
import { ReactComponent as HideContactInfoIcon } from '../../../globalSearch/assets/hide-contact-info.svg';
import { getIn18Text } from 'api';
import DatePicker from '@web-common/components/UI/DatePicker';
import Tooltip from 'antd/es/tooltip';
import moment from 'moment';
import classNames from 'classnames';

export interface Prop {
  title?: string;
  detailType: 'supplier' | 'buysers' | 'peers';
  mergeCompanys?: string[];
  selectCompanys?: () => void;
  selectedCompanyList?: string[];
  time: string[];
  setTime: (param: string[]) => void;
}

const { RangePicker } = DatePicker;

const BdDetailHeader: React.FC<Prop> = ({ title, detailType, mergeCompanys, selectCompanys, selectedCompanyList, time, setTime }) => {
  const renderWarning = useCallback(() => {
    return (
      <Tooltip title="由于某些国家的海关数据未披露交易金额等信息， 以上统计数据仅基于海关单据中已公开的数据。">
        <HideContactInfoIcon />
      </Tooltip>
    );
  }, []);
  return (
    <div className={style.container}>
      {title ? (
        <div className={style.title}>
          {title} {renderWarning()}
        </div>
      ) : null}
      <section>
        <div className={style.dataPicker}>
          <RangePicker
            defaultValue={[moment(time[0]), moment(time[1])]}
            onChange={(value, dateString) => {
              setTime(dateString);
            }}
            value={[moment(time[0]), moment(time[1])]}
            allowClear={false}
            renderExtraFooter={() => {
              let rangeMonth = moment(time[1])?.diff(moment(time[0]), 'month');
              const dates = [
                {
                  label: getIn18Text('JINBANNIAN'),
                  monthCount: -6,
                },
                {
                  label: getIn18Text('JINYINIAN'),
                  monthCount: -12,
                },
                {
                  label: getIn18Text('JINLIANGNIAN'),
                  monthCount: -24,
                },
                {
                  label: getIn18Text('JINSANNIAN'),
                  monthCount: -36,
                },
                {
                  label: getIn18Text('JINWUNIAN'),
                  monthCount: -60,
                },
              ];
              return (
                <div className={style.dateSelectFoot}>
                  {dates.map(date => (
                    <div
                      key={date.label}
                      className={classNames(style.dateSelectItem, {
                        [style.dateSelectItemSelected]: rangeMonth !== undefined && Math.abs(date.monthCount) === Math.abs(rangeMonth),
                      })}
                      onClick={() => {
                        setTime([moment().add(date.monthCount, 'month').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]);
                      }}
                    >
                      {date.label}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </div>
        <div className={style.mergeCompanyText} hidden={!mergeCompanys}>
          {selectedCompanyList && selectedCompanyList.length > 0
            ? `已自动合并已选择的${selectedCompanyList.length}家公司的${detailType === 'peers' ? '货运数据' : '海关数据'}`
            : `${getIn18Text('YIZIDONGHEBING')}${mergeCompanys?.length}家公司名称相似的${detailType === 'peers' ? '货运数据' : '海关数据'}`}{' '}
          <span
            className={style.mergeCompanyQuery}
            onClick={() => {
              selectCompanys && selectCompanys();
            }}
          >
            {getIn18Text('CHAKANHEBINGGONGSI')}
          </span>
        </div>
      </section>
    </div>
  );
};

export default BdDetailHeader;
