import { Filters } from '@web-common/state/reducer/worktableReducer';
import { Dropdown, Skeleton, Spin } from 'antd';
import classnames from 'classnames';
import React, { useState, useEffect, ReactElement, CSSProperties, useRef } from 'react';
import moment from 'moment';
import { customPickers, DateRangeSelectFilter, MemberFilter, RadioGroupDay, TimeFilter } from './modal/filters';
import styles from './workTable.module.scss';
import { api, CustomerApi, WorktableApi } from 'api';
import useVisibleToggleZIndex from './hooks/useVisibleToggleZIndex';
import variables from '@web-common/styles/export.module.scss';
import { getIn18Text } from 'api';
import EdmWeeklyReport from '@/components/Layout/Worktable/edmWeeklyReport';

const customerApi = api.requireLogicalApi('customerApiImpl') as CustomerApi;
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const TeamIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="4" fill={`${variables.brand6}`} />
      <path
        opacity="0.66"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12.8 10.8C14.1255 10.8 15.2 9.72548 15.2 8.4C15.2 7.07452 14.1255 6 12.8 6C11.4745 6 10.4 7.07452 10.4 8.4C10.4 9.72548 11.4745 10.8 12.8 10.8ZM8 14.4C8 12.8536 9.2536 11.6 10.8 11.6H14.8C16.3464 11.6 17.6 12.8536 17.6 14.4V14.8C17.6 15.4627 17.0627 16 16.4 16H9.2C8.53726 16 8 15.4627 8 14.8V14.4Z"
        fill="white"
      />
      <g filter="url(#filter0_d_3088_89599)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9 10C10.6569 10 12 8.65685 12 7C12 5.34315 10.6569 4 9 4C7.34315 4 6 5.34315 6 7C6 8.65685 7.34315 10 9 10ZM6.5 11C4.567 11 3 12.567 3 14.5V15C3 15.8284 3.67157 16.5 4.5 16.5H13.5C14.3284 16.5 15 15.8284 15 15V14.5C15 12.567 13.433 11 11.5 11H6.5Z"
          fill="white"
        />
      </g>
      <defs>
        <filter id="filter0_d_3088_89599" x="3" y="4" width="12.8" height="12.9" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="0.8" dy="0.4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.298039 0 0 0 0 0.415686 0 0 0 0 1 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3088_89599" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3088_89599" result="shape" />
        </filter>
      </defs>
    </svg>
  );
};

export interface WorktableCardHeaderRefreshButton {
  refreshIconStyles?: CSSProperties;
  onRefresh?: () => void;
}

export interface WorktableCardHeaderExpandButton {
  enableExpand?: boolean;
  onExpand?: () => void;
}

export interface WorktableCardHeaderToolsPrefix {
  tools?: Array<ReactElement> | ReactElement;
}

export interface WorktableCardHeaderDateSelect {
  onDateSelectChange?: (changes: any) => void;
}

export interface WorktableCardHeaderDatePicker {
  onDatePickerChange?: (changes: any) => void;
}

export interface WorktableCardMemberSelect {
  resourceLabel?: string;
  onMemberChange?: (changes: any) => void;
  fetchMemberOptionsList?: (cb: (list: { label: string; value: any }[]) => void) => void;
}

export interface WorktableCardDayRadio {
  onDaySelectChange?: (day: number) => void;
}

export interface WorktableCardEdmWeeklyReport {
  edmWeeklyReportUrl?: string;
}

export interface WorktableCardProps {
  title: string | ReactElement;
  titleStyles?: CSSProperties;
  hasDrag?: boolean;
  className: string;
  loading?: boolean;
  headerToolsConfig?: Array<
    WorktableCardHeaderRefreshButton &
      WorktableCardHeaderExpandButton &
      WorktableCardHeaderToolsPrefix &
      WorktableCardHeaderDateSelect &
      WorktableCardHeaderDatePicker &
      WorktableCardMemberSelect &
      WorktableCardDayRadio &
      WorktableCardEdmWeeklyReport
  >;
  wrapStyles?: CSSProperties;
  cardActionStyles?: CSSProperties;
  leftCardHeaderStyles?: CSSProperties;
  showTeamIconInTitle?: boolean;
  titlePrefixIcon?: ReactElement;
}

const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};

export const WorktableCard: React.FC<WorktableCardProps> = props => {
  const {
    title,
    children,
    loading = false,
    hasDrag = true,
    className = '',
    wrapStyles = {},
    showTeamIconInTitle = false,
    titlePrefixIcon = <TeamIcon />,
    titleStyles = {},
    headerToolsConfig = [],
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { handleDropDownVisibleChange } = useVisibleToggleZIndex(containerRef);

  return (
    <div className={classnames(styles.cardWrapper, className)} style={{ ...wrapStyles }} ref={containerRef}>
      <div className={classnames([styles.cardHeader, 'clearfix'])}>
        <div className={styles.leftHeaderBlock} style={{ ...props.leftCardHeaderStyles }}>
          {hasDrag && <span className={styles.sortableIcon} />}
          {showTeamIconInTitle ? (
            <div className={styles.iconTitleGroup}>
              <span className={styles.icon}>{titlePrefixIcon}</span>
              <span className={styles.cardTitle} style={{ ...titleStyles }}>
                {title}
              </span>
            </div>
          ) : typeof title === 'string' ? (
            <span style={{ ...titleStyles }} className={styles.cardTitle}>
              {title}
            </span>
          ) : (
            title
          )}
        </div>
        <div className={styles.cardActions} style={{ ...props.cardActionStyles }}>
          {headerToolsConfig.map(configItem => {
            if (configItem.tools) {
              return configItem.tools;
            }
            if (configItem.onMemberChange) {
              return (
                <MemberFilter
                  onOpenChange={handleDropDownVisibleChange}
                  popupContainer={containerRef.current}
                  fetchOptionsList={configItem.fetchMemberOptionsList}
                  showLabel={false}
                  onChange={configItem.onMemberChange}
                  resourceLabel={configItem.resourceLabel ?? ''}
                />
              );
            }
            if (configItem.onDateSelectChange) {
              return <DateRangeSelectFilter onChange={configItem.onDateSelectChange} onOpenChange={handleDropDownVisibleChange} popupContainer={containerRef.current} />;
            }
            if (configItem.onDatePickerChange) {
              return (
                <TimeFilter
                  onOpenChange={handleDropDownVisibleChange}
                  popupContainer={containerRef.current}
                  showLable={false}
                  containerStyles={{ display: 'flex', alignItems: 'center' }}
                  start={defaultDateRange.start_date}
                  end={defaultDateRange.end_date}
                  onChange={configItem.onDatePickerChange}
                />
              );
            }
            if (configItem.onDaySelectChange) {
              return <RadioGroupDay onChange={configItem.onDaySelectChange} />;
            }
            if (configItem.onExpand) {
              return <div className={classnames([styles.actionBtn, styles.uExpand])} onClick={configItem.onExpand} title={getIn18Text('ZHANKAI')} />;
            }
            if (configItem.onRefresh) {
              return (
                <div
                  style={{ ...(configItem.refreshIconStyles ?? {}) }}
                  className={classnames([styles.actionBtn, styles.uRefresh])}
                  onClick={configItem.onRefresh}
                  title={getIn18Text('SHUAXIN')}
                />
              );
            }
            if (configItem.edmWeeklyReportUrl) {
              return <EdmWeeklyReport edmWeeklyReportUrl={configItem.edmWeeklyReportUrl} />;
            }
            return null;
          })}
        </div>
      </div>
      <div className={styles.cardContainer}>
        <div style={{ display: loading ? 'flex' : 'none' }} className={styles.cardLoading}>
          <Spin />
        </div>
        {children}
      </div>
    </div>
  );
};
export const getFilterText = (
  filter: Filters,
  resourceLabel = 'CONTACT',
  showAll?: boolean,
  excludeFilters?: {
    exclude_company?: boolean;
    exclude_manager?: boolean;
  }
) => {
  const dateFilter = getRangeDateText(filter.start_date, filter.end_date);
  return (
    <>
      <span className={styles.cardFilterItem}>
        {getIn18Text('SHIJIANFANWEI\uFF1A')}
        {dateFilter}
      </span>
      {filter.star_level?.length || filter.company_level?.length ? (
        <span className={styles.cardFilterItem}>
          {getIn18Text('SHUJUFANWEI\uFF1A')}
          <Dropdown
            overlayClassName={styles.cardFilterDropdown}
            overlay={() => <CompanyFilterOverlay star_level={filter.star_level} company_level={filter.company_level} />}
          >
            <a>{getIn18Text('YISHAIXUAN')}</a>
          </Dropdown>
        </span>
      ) : showAll && !excludeFilters?.exclude_company ? (
        <span className={styles.cardFilterItem}>{getIn18Text('SHUJUFANWEI\uFF1AQUANBU')}</span>
      ) : null}
      {filter.account_id_list && filter.account_id_list.length > 0 ? (
        <span className={styles.cardFilterItem}>
          {getIn18Text('RENYUANFANWEI\uFF1A')}
          <Dropdown
            destroyPopupOnHide
            overlayClassName={styles.cardFilterDropdown}
            overlay={() => <AccountOverlay ids={filter.account_id_list as string[]} resourceLabel={resourceLabel} />}
          >
            <a>{filter.account_id_list.length}</a>
          </Dropdown>
        </span>
      ) : showAll && !excludeFilters?.exclude_manager ? (
        <span className={styles.cardFilterItem}>{getIn18Text('RENYUANFANWEI\uFF1AQUANBU')}</span>
      ) : null}
    </>
  );
};
const AccountOverlay = ({ ids, resourceLabel }: { ids: string[]; resourceLabel: string }) => {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  if (ids.length === 0) {
    return null;
  }
  const fetchData = () => {
    setLoading(true);
    worktableApi
      .getAccountRange(resourceLabel)
      .then(res => {
        const map: Record<string, string> = {};
        res.principalInfoVOList.forEach(i => {
          map[i.account_id] = i.nick_name;
        });
        const nameArr = ids.map(id => map[id] || '');
        setNames(nameArr);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    fetchData();
  }, [ids]);
  return (
    <div>
      <Skeleton paragraph={{ rows: 2 }} title={false} active loading={loading}>
        <div>{names.join('、')}</div>
      </Skeleton>
    </div>
  );
};
interface SelectOptionItem {
  label: string;
  value: string;
}
const CompanyFilterOverlay = (props: { star_level?: string[]; company_level?: string[] }) => {
  const [mapLevel, setMapLevel] = useState<Record<string, string>>({});
  const [mapStar, setMapStar] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    customerApi.getBaseInfo().then(res => {
      const mapLevel: Record<string, string> = {};
      const mapStar: Record<string, string> = {};
      res.company_level.forEach(i => (mapLevel[i.value] = i.label));
      res.star_level.forEach(i => (mapStar[i.value] = i.label));
      setMapLevel(mapLevel);
      setMapStar(mapStar);
    });
    setLoading(false);
  }, []);
  return (
    <div>
      <Skeleton paragraph={{ rows: 2 }} title={false} active loading={loading}>
        <div>
          {props.star_level?.length ? (
            <div>
              {getIn18Text('GONGSIXINGJI\uFF1A')}
              {props.star_level.map(i => mapStar[i]).join('、')}
            </div>
          ) : null}
          {props.company_level?.length ? (
            <div>
              {getIn18Text('KEHUFENJI\uFF1A')}
              {props.company_level.map(i => mapLevel[i]).join('、')}
            </div>
          ) : null}
        </div>
      </Skeleton>
    </div>
  );
};
const timeArray = customPickers.map(item => {
  const [start, end] = item.onClick();
  return {
    text: item.text,
    start: start,
    end: end,
  };
});
const getRangeDateText = (start_date: string, end_date: string) => {
  const start = moment(start_date);
  const end = moment(end_date);
  const matchItem = timeArray.find(item => start.isSame(item.start, 'day') && end.isSame(item.end, 'day'));
  if (matchItem) {
    return matchItem.text;
  }
  return start.format('YYYY.MM.DD') + '-' + end.format('YYYY.MM.DD');
};
