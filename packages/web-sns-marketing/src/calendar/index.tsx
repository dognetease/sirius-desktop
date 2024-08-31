import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import { api, PostCreateTypeOptions, SnsAccountInfoShort, SnsCalendarEvent, SnsCalendarReq, SnsMarketingAccount, SnsMarketingApi } from 'api';
import FullCalendar, { DatesSetArg, EventContentArg } from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction'; // for selectable
import dayGridPlugin from '@fullcalendar/daygrid';
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import { navigate } from '@reach/router';
import moment from 'moment';
import { SnsCalendarUiEvent, transformToUiEvent, getNextCronTime } from '../utils/index';
import { SnsCalendarEventContent } from '../components/calendarEventContent';

import style from './index.module.scss';
import './calendar-view.scss';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { Checkbox } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import AccountsSelect from '../components/AccountsSelect';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { DateClickArg } from '@fullcalendar/interaction';
import PostEditModal from '../components/PostEditModal';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { PageLoading } from '@/components/UI/Loading';
import { HocOrderState } from '../components/orderStateTip';

const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;

export interface IMarketingCalendar {
  showHolidays?: boolean;
}

export const SnsMarketingCalendar = () => {
  // const [calendarData, setCalendarData] = useState<SnsCalendarRes>();
  const searchParamRef = useRef<SnsCalendarReq>({
    startDate: moment().startOf('month').valueOf(),
    endDate: moment().add(1, 'month').startOf('month').valueOf(),
    hideStopSendPost: true,
  });
  const [uiEvents, setUiEvents] = useState<SnsCalendarUiEvent[]>([]);
  const [accounts, setAccounts] = useState<SnsMarketingAccount[]>([]);
  const [editModal, setEditModal] = useState<{ postDbId: string }>();
  const [loading, setLoading] = useState(false);

  const fetchData = (searchParam: SnsCalendarReq) => {
    setLoading(true);
    return snsMarketingApi
      .getSnsCalendar(searchParam)
      .then(res => {
        setUiEvents(transformToUiEvent(res.calendarList));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(searchParamRef.current);
  }, []);

  const handleDatesSet = (datesSet: DatesSetArg) => {
    const newSearchParam = {
      ...searchParamRef.current,
      startDate: datesSet.start.getTime(),
      endDate: datesSet.end.getTime(),
    };
    searchParamRef.current = newSearchParam;
    fetchData(newSearchParam);
  };

  const handleSelectAccount = (accounts: SnsMarketingAccount[]) => {
    const accountInfo: SnsAccountInfoShort[] = accounts.map(item => ({
      accountId: item.accountId,
      accountType: item.accountType,
      platform: item.platform,
      accountStatus: item.accountStatus,
    }));

    const newSearchParam = {
      ...searchParamRef.current,
      accounts: accountInfo,
    };
    searchParamRef.current = newSearchParam;
    fetchData(newSearchParam);
  };

  const handleCreatorChange = () => {};

  const handleCreateTypeCahgne = (v: string) => {
    const newSearchParam = {
      ...searchParamRef.current,
      postCreateType: v as any,
    };
    searchParamRef.current = newSearchParam;
    fetchData(newSearchParam);
  };

  const onCheckedChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const newSearchParam = {
      ...searchParamRef.current,
      hideStopSendPost: checked,
    };
    searchParamRef.current = newSearchParam;
    fetchData(newSearchParam);
  };

  const handleDateClick = (args: DateClickArg) => {
    // console.log('fullCalendar', 'dateClick', args.date);
    // if (+args.date < moment().startOf('day').valueOf()) {
    //   return;
    // }
    // const clickTimeStr = moment().format(`${args.dateStr} HH:mm:ss`);
    // const clickTime = moment(clickTimeStr).valueOf();
    // const cronTime = getNextCronTime(clickTime);
    // navigate('#site?page=snsSendPost&from=snsCalendar&cronTime=' + cronTime);
  };
  const handleEditPost = (e: SnsCalendarEvent) => {
    setEditModal({ postDbId: e.postDbId });
  };
  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_CALENDAR">
      <div className={style.page} id="sns-marketing-calendar-root">
        <div className={style.header}>{getIn18Text('YINGXIAORILI')}</div>
        <div className={style.searchBox}>
          <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <AccountsSelect
                dropdownMatchSelectWidth={false}
                maxTagCount="responsive"
                className={style.accountSelector}
                accounts={accounts}
                onChange={nextAccounts => {
                  setAccounts(nextAccounts);
                  handleSelectAccount(nextAccounts);
                }}
              />
            </div>
            {/* <EnhanceSelect placeholder="全部员工" onChange={handleCreatorChange} style={{width:160}} /> */}
            <EnhanceSelect
              size="large"
              placeholder={getIn18Text('TIEZICHUANGJIANFANGSHI')}
              onChange={handleCreateTypeCahgne}
              options={PostCreateTypeOptions}
              style={{ width: 160 }}
              allowClear
            />
            <Checkbox checked={searchParamRef.current.hideStopSendPost} onChange={onCheckedChange} style={{ color: '#545A6E' }}>
              {getIn18Text('BUKANYIZANTINGWEIFA')}
            </Checkbox>
          </div>
          <div style={{ display: 'flex' }}>
            <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
              <Button onClick={() => navigate('#site?page=snsSendPost&from=snsCalendar')}>{getIn18Text('SHOUDONGFATIE')}</Button>
              <Button btnType="primary" onClick={() => navigate('#site?page=snsMarketingTaskEdit&from=snsCalendar')}>
                {getIn18Text('CHUANGJIANYINGXIAORENWU')}
              </Button>
            </PrivilegeCheck>
          </div>
        </div>
        <div className={style.calendarWrapper}>
          <FullCalendar
            height="100%"
            viewClassNames="sns-marketing-fc-view"
            eventClassNames="fc-custom-event"
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={zhLocale}
            dayMaxEventRows={9}
            datesSet={handleDatesSet}
            events={uiEvents}
            eventContent={(args: EventContentArg) =>
              SnsCalendarEventContent(args as any, {
                onEditPost: handleEditPost,
                getContainer: () => document.getElementById('sns-marketing-calendar-root')!,
              })
            }
            moreLinkContent={moreLinkContent}
            dayCellContent={args => args.dayNumberText.slice(0, -1)}
            dateClick={handleDateClick}
          />
        </div>
        {loading && <PageLoading style={{ zIndex: 10 }} />}
        {editModal && (
          <PostEditModal
            visible={editModal !== undefined}
            postDbId={editModal?.postDbId}
            onCancel={() => setEditModal(undefined)}
            onFinish={() => {
              fetchData(searchParamRef.current);
              setEditModal(undefined);
            }}
          />
        )}
      </div>
    </PermissionCheckPage>
  );
};

export default HocOrderState(SnsMarketingCalendar);

export const moreLinkContent = (args: any) => {
  return getIn18Text('HAIYOUGENGDUO') + args.num + getIn18Text('GETIEZI');
};
