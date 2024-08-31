/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, MailApi, SystemApi, ContactEmailItem, EmailsContactItem, CustomerApi, RessnapshotPreview } from 'api';
import { Pagination, Empty } from 'antd';
import moment from 'moment';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import DatePicker from '@/components/Layout/Customer/components/UI/DatePicker/datePicker';
import Email from './email';
import style from './contactEmails.module.scss';
import QuestionPopover from '@/components/Layout/Customer/components/questionPopover/QuestionPopover';
import { getIn18Text } from 'api';
interface ContactEmailsProps {
  className?: string;
  fromEmail?: string;
  toEmail?: string;
  labels?: string[];
  labelList?: string[];
  fromContacts?: EmailsContactItem[];
  toContacts?: EmailsContactItem[];
  startDate?: string;
  endDate?: string;
  list: ContactEmailItem[];
  pagination: {
    current: number;
    pageSize: number;
    pageSizeOptions: string[];
    total: number;
    showSizeChanger?: boolean;
  };
  onChange: (page: number, pageSize?: number) => void;
  onFilterChagne: (payload: any) => void;
  onFromContactsChange?: () => void;
  onToContactsChange?: () => void;
  onDateChange?: () => void;
  onEmailClick?: (item: ContactEmailItem) => void;
  onTitleClick?: (item: ContactEmailItem) => void;
  onAttachmentClick?: (item: ContactEmailItem) => void;
}
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const isElectron = systemApi.isElectron();
const readEmail = (rest: RessnapshotPreview) => {
  // get preview iframe link from backend
  const { condition } = rest;
  const commonHander = (previewLink: string) => {
    if (isElectron) {
      systemApi.createWindowWithInitData('iframePreview', {
        eventName: 'initPage',
        eventData: {
          iframeSrc: previewLink,
        },
      });
    } else {
      window.open(previewLink);
    }
  };
  clientApi.snapshotPreview(rest).then(res => {
    commonHander(res);
  });
};
const { Option } = Select;
const { RangePicker } = DatePicker;
const FID_TYPE = { received: 1, draft: 2, sent: 3 };
const getCombineData = (data: ContactEmailItem[]) =>
  data.map(item => {
    const { fid, from, to, subject, received_date, sent_date } = item;
    let actionName = '';
    let time = '';
    let isSent;
    const parsedNames = (mailApi as any).contactHandler.parseContactStr([from, to]).parsed;
    const fromName = parsedNames[0]?.name ?? getIn18Text('WEIZHI');
    const toName = parsedNames[1]?.name ?? getIn18Text('WEIZHI');
    if (fid === FID_TYPE.sent) {
      actionName = getIn18Text('FAJIAN');
      time = sent_date;
      isSent = true;
    } else {
      actionName = getIn18Text('SHOUJIAN');
      time = received_date;
      isSent = false;
    }
    const title = `【${actionName}】${fromName}向${toName}发送：${subject}`;
    return {
      ...item,
      title,
      time,
      isSent,
    };
  });
const ContactEmails: React.FC<ContactEmailsProps> = props => {
  const {
    className,
    fromEmail,
    toEmail,
    fromContacts,
    toContacts,
    startDate,
    endDate,
    list,
    labels,
    labelList,
    pagination,
    onChange,
    onFilterChagne,
    onFromContactsChange,
    onToContactsChange,
    onDateChange,
    onEmailClick,
    onTitleClick,
    onAttachmentClick,
  } = props;
  const emailsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [list]);
  return (
    <div className={classnames([style.contactEmails, className])} ref={emailsRef}>
      <div className={style.overflowX} ref={scrollRef}>
        <div className={style.overflowXContent}>
          <div className={style.filter}>
            <Select
              style={{ marginRight: 8, width: 120 }}
              placeholder={getIn18Text('QINGXUANZEFABUREN')}
              showSearch
              value={fromEmail}
              allowClear
              optionFilterProp="children"
              getPopupContainer={() => emailsRef.current as HTMLDivElement}
              onChange={fromEmail => {
                onFilterChagne({ fromEmail });
                onFromContactsChange && onFromContactsChange();
              }}
            >
              {(fromContacts || []).map(item => (
                <Option value={item.email} key={item.email}>
                  {`${item.name} (${item.email})`}
                </Option>
              ))}
            </Select>
            <Select
              style={{ marginRight: 8, width: 120 }}
              showSearch
              placeholder={getIn18Text('QINGXUANZELIANXIREN')}
              value={toEmail}
              allowClear
              optionFilterProp="children"
              getPopupContainer={() => emailsRef.current as HTMLDivElement}
              onChange={toEmail => {
                onFilterChagne({ toEmail });
                onToContactsChange && onToContactsChange();
              }}
            >
              {(toContacts || []).map(item => (
                <Option value={item.email} key={item.email}>
                  {`${item.name} (${item.email})`}
                </Option>
              ))}
            </Select>
            <Select
              style={{ marginRight: 8, width: 120 }}
              showArrow
              placeholder={getIn18Text('QINGXUANZEBIAOQIAN')}
              showSearch
              value={labels}
              allowClear
              mode="multiple"
              maxTagCount="responsive"
              getPopupContainer={() => emailsRef.current as HTMLDivElement}
              onChange={v => {
                onFilterChagne({ labels: v });
              }}
            >
              {labelList?.map(label => (
                <Option key={label} value={label}>
                  {label}
                </Option>
              ))}
            </Select>
            <RangePicker
              // separator={' - '}
              style={{ width: 230 }}
              allowClear
              value={[startDate ? moment(startDate) : null, endDate ? moment(endDate) : null]}
              onChange={(values, formatString) => {
                const [startDate, endDate] = formatString;
                onFilterChagne({ startDate, endDate });
                onDateChange && onDateChange();
              }}
            />
            <QuestionPopover placement="top" className={style.question} content={getIn18Text('ZUIDUOTONGBU50GELIANXIRENDEWANGLAIYOUJIAN')} />
            <span className={style.total}>
              {getIn18Text('GONG')}
              {pagination.total}
              {getIn18Text('TIAO')}
            </span>
          </div>
          {Array.isArray(list) &&
            !!list.length &&
            getCombineData(list).map(item => (
              <Email
                key={item.id}
                data={item}
                onEmailClick={() => onEmailClick && onEmailClick(item)}
                onTitleClick={() => onTitleClick && onTitleClick(item)}
                onAttachmentClick={() => onAttachmentClick && onAttachmentClick(item)}
              />
            ))}
        </div>
      </div>
      {Array.isArray(list) && !!list.length ? (
        <div className={style.pagination}>
          <Pagination className="pagination-wrap" size="small" {...pagination} onChange={onChange} />
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getIn18Text('ZANWUSHUJU\uFF0CXINZENGNEIRONGZAI12XIAOSHINEITONGBU')} />
      )}
    </div>
  );
};
ContactEmails.defaultProps = {};
export default ContactEmails;
export { readEmail };
