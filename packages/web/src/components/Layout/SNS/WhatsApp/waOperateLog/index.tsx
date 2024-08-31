import classnames from 'classnames';
import { DataTrackerApi, WaMessageType, getIn18Text } from 'api';
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { ReactNode, useEffect, useState } from 'react';
import moment, { Moment } from 'moment';
import { useLocation } from '@reach/router';
import qs from 'querystring';
import { api, InsertWhatsAppApi, WAOperationLog, apis, WaOrgStatKey } from 'api';
import { ColumnsType } from 'antd/lib/table';
import SiriusTable from '@web-common/components/UI/Table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
// import { EnhanceSelect, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right.svg';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import style from './index.module.scss';
import { SensitiveWordSetting } from './drawer';
import { ChatHistoryDrawer } from '@/components/Layout/WhatsAppChat/components/chatHistoryDrawer';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import locale from 'antd/es/date-picker/locale/zh_CN';
// import DatePicker from '@web-common/components/UI/DatePicker';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
import { NoticeModal } from './notice';
import { ReactComponent as TotalIcon } from './icons/total.svg';
import { ReactComponent as ChatRemovedIcon } from './icons/chatRemoved.svg';
import { ReactComponent as MessageRevokedIcon } from './icons/messageRevoked.svg';
import { ReactComponent as KeywordIcon } from './icons/keyword.svg';
import { ReactComponent as TransferIcon } from './icons/transfer.svg';
import { TongyongCuowutishiXian } from '@sirius/icons';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const replacerLower = (match: string) => '_' + match.toLowerCase();
const camelToPascal = (str: string) => str.replace(/[A-Z]/g, replacerLower);

export const customPickers = [
  {
    text: '最近一周',
    onClick: () => {
      const start = moment().subtract(7, 'days').startOf('week');
      const end = moment().subtract(7, 'days').endOf('week');
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    onClick() {
      return [moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')];
    },
  },
  {
    text: '最近三个月',
    onClick() {
      return [moment().subtract(1, 'quarters').startOf('quarter'), moment().subtract(1, 'quarters').endOf('quarter')];
    },
  },
];

interface ParamsType {
  date: [Moment | null, Moment | null];
  waNumber: string[];
  type: string;
  sortField: string;
  sortOrder: string;
}

const dateFormat = 'YYYY-MM-DD';
type ValueType =
  | {
      key?: string;
      label: React.ReactNode;
      value: string | number;
    }
  | any;
interface StatItem {
  key: WaOrgStatKey;
  type: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  tooltip?: string;
}
export const WaOperateLog = () => {
  const location = useLocation();
  const params = qs.parse(location.hash.split('?')[1]);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('TOTAL');
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<WAOperationLog[]>([]);
  const [uniVisible, setUniVisible] = useState(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [sensitiveWordVisible, setSensitiveWordVisible] = useState(false);
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false);
  const [date, setDate] = useState<[Moment | null, Moment | null]>([null, null]);
  const [memberOptions, setMemberOptions] = useState<ValueType[]>([]);
  const [waNumber, setWaNumber] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportAble, setExportAble] = useState(false);
  const [messageId, setMessageId] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [waMsgType, setWaMsgType] = useState<WaMessageType | undefined>();
  const [noticeVisible, setNoticeVisible] = useState<boolean>(false);
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [activeStatKey, setActiveStatKey] = useState<WaOrgStatKey>('totalCount');
  const [statData, setStatData] = useState<StatItem[]>([
    {
      key: 'totalCount',
      type: 'TOTAL',
      icon: <TotalIcon />,
      title: '全部行为',
      value: 0,
    },
    {
      key: 'chatRemovedCount',
      type: 'DELETE_CHAT',
      icon: <ChatRemovedIcon />,
      title: '对话删除',
      value: 0,
      tooltip: 'WA在线登录外贸通，WA的app和网页端删除对话立即生成记录',
    },
    {
      key: 'messageRevokedCount',
      type: 'DELETE_MSG',
      icon: <MessageRevokedIcon />,
      title: '消息删除',
      value: 0,
      tooltip: 'WA在线登录外贸通，WA的app和网页端消息删除立即生成记录',
    },
    {
      key: 'keywordCount',
      type: 'KEYWORD',
      icon: <KeywordIcon />,
      title: '敏感词监测',
      value: 0,
      tooltip: '收发消息匹配上预设的敏感词',
    },
    {
      key: 'transferCount',
      type: 'TRANSFER',
      icon: <TransferIcon />,
      title: '会话转移',
      value: 0,
      tooltip: '会话员工间转移路径',
    },
  ]);

  useEffect(() => {
    whatsAppApi
      .getSubList('WHATSAPP_EMPHASIS_MANAGE_LIST')
      .then(res => {
        const list =
          (res?.length &&
            res.map(item => {
              return { ...item, value: item.accId, label: item.nickName };
            })) ||
          [];
        setMemberOptions(list);
      })
      .catch(err => console.log(err));
  }, []);

  const DefaultImg = () => (
    <svg viewBox="0 0 212 212" height="20px" width="20px" style={{ marginRight: 20 }} preserveAspectRatio="xMidYMid meet">
      <path
        fill="#DFE5E7"
        className="background"
        d="M106.251,0.5C164.653,0.5,212,47.846,212,106.25S164.653,212,106.25,212C47.846,212,0.5,164.654,0.5,106.25 S47.846,0.5,106.251,0.5z"
      ></path>
      <g>
        <path
          fill="#FFFFFF"
          className="primary"
          d="M173.561,171.615c-0.601-0.915-1.287-1.907-2.065-2.955c-0.777-1.049-1.645-2.155-2.608-3.299 c-0.964-1.144-2.024-2.326-3.184-3.527c-1.741-1.802-3.71-3.646-5.924-5.47c-2.952-2.431-6.339-4.824-10.204-7.026 c-1.877-1.07-3.873-2.092-5.98-3.055c-0.062-0.028-0.118-0.059-0.18-0.087c-9.792-4.44-22.106-7.529-37.416-7.529 s-27.624,3.089-37.416,7.529c-0.338,0.153-0.653,0.318-0.985,0.474c-1.431,0.674-2.806,1.376-4.128,2.101 c-0.716,0.393-1.417,0.792-2.101,1.197c-3.421,2.027-6.475,4.191-9.15,6.395c-2.213,1.823-4.182,3.668-5.924,5.47 c-1.161,1.201-2.22,2.384-3.184,3.527c-0.964,1.144-1.832,2.25-2.609,3.299c-0.778,1.049-1.464,2.04-2.065,2.955 c-0.557,0.848-1.033,1.622-1.447,2.324c-0.033,0.056-0.073,0.119-0.104,0.174c-0.435,0.744-0.79,1.392-1.07,1.926 c-0.559,1.068-0.818,1.678-0.818,1.678v0.398c18.285,17.927,43.322,28.985,70.945,28.985c27.678,0,52.761-11.103,71.055-29.095 v-0.289c0,0-0.619-1.45-1.992-3.778C174.594,173.238,174.117,172.463,173.561,171.615z"
        ></path>
        <path
          fill="#FFFFFF"
          className="primary"
          d="M106.002,125.5c2.645,0,5.212-0.253,7.68-0.737c1.234-0.242,2.443-0.542,3.624-0.896 c1.772-0.532,3.482-1.188,5.12-1.958c2.184-1.027,4.242-2.258,6.15-3.67c2.863-2.119,5.39-4.646,7.509-7.509 c0.706-0.954,1.367-1.945,1.98-2.971c0.919-1.539,1.729-3.155,2.422-4.84c0.462-1.123,0.872-2.277,1.226-3.458 c0.177-0.591,0.341-1.188,0.49-1.792c0.299-1.208,0.542-2.443,0.725-3.701c0.275-1.887,0.417-3.827,0.417-5.811 c0-1.984-0.142-3.925-0.417-5.811c-0.184-1.258-0.426-2.493-0.725-3.701c-0.15-0.604-0.313-1.202-0.49-1.793 c-0.354-1.181-0.764-2.335-1.226-3.458c-0.693-1.685-1.504-3.301-2.422-4.84c-0.613-1.026-1.274-2.017-1.98-2.971 c-2.119-2.863-4.646-5.39-7.509-7.509c-1.909-1.412-3.966-2.643-6.15-3.67c-1.638-0.77-3.348-1.426-5.12-1.958 c-1.181-0.355-2.39-0.655-3.624-0.896c-2.468-0.484-5.035-0.737-7.68-0.737c-21.162,0-37.345,16.183-37.345,37.345 C68.657,109.317,84.84,125.5,106.002,125.5z"
        ></path>
      </g>
    </svg>
  );

  const fetchData = (curr: number = 1, filterParams: ParamsType) => {
    setLoading(true);
    const { type, date, waNumber, sortField, sortOrder } = filterParams || {};
    const end_date = date?.[1]?.format(dateFormat) || '';
    const start_date = date?.[0]?.format(dateFormat) || '';

    whatsAppApi
      .getOperateLog({
        page: curr,
        pageSize: 20,
        filterType: type,
        accountId: waNumber,
        startTime: start_date ? start_date + ' 00:00:00' : '',
        endTime: end_date ? end_date + ' 23:59:59' : '',
        // orderBy: sortField ? camelToPascal(sortField) : '',
        direction: sortOrder === 'ascend' ? 'ASC' : 'DESC',
      })
      .then(async res => {
        // 如果列表页没有 url 中id的数据，再请求该id详情
        if (curr === 1 && !initialized && params.id && typeof params.id === 'string') {
          const found = res.content.find(item => item.id.toString() === params.id);
          if (!found) {
            try {
              const detail = await whatsAppApi.getOperateLogDetail({ id: params.id });
              res.content.unshift(detail);
            } catch (error) {
              console.warn(error);
            }
          }
        }
        setList(res.content);
        setTotal(res.totalSize);
        setExportAble(!res.content.length);
      })
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  };

  const fetchStat = (filterParams: Omit<ParamsType, 'sortField' | 'sortOrder'>) => {
    const { date, waNumber } = filterParams || {};
    const startTime = date?.[0]?.startOf('day').format('YYYY-MM-DD HH:mm:ss') || '';
    const endTime = date?.[1]?.endOf('day').format('YYYY-MM-DD HH:mm:ss') || '';

    whatsAppApi
      .getWaOrgStat({
        startTime,
        endTime,
        accountId: waNumber,
      })
      .then(res => {
        setStatData(statData =>
          statData.map(item => ({
            ...item,
            value: res[item.key],
          }))
        );
      });
  };

  const handleRefresh = () => {
    setPage(1);
    fetchData(1, { type, date, waNumber, sortField, sortOrder });
    fetchStat({ type, date, waNumber });
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setPage(1);
    fetchData(1, { type: value, date, waNumber, sortField, sortOrder });
  };

  useEffect(() => {
    fetchData(1, { type, date, waNumber, sortField, sortOrder });
    fetchStat({ type, date, waNumber });
  }, []);

  const [sortField, setSortField] = useState<string>('operateAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  const columns: ColumnsType<WAOperationLog> = [
    {
      key: 'operateAt',
      title: getIn18Text('SHIJIAN'),
      width: 180,
      dataIndex: 'operateAt',
      sorter: true,
      sortOrder: sortField === 'operateAt' ? sortOrder : undefined,
      render(timeStr) {
        return moment(timeStr).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      key: 'operator',
      title: getIn18Text('YEWUYUAN'),
      width: 180,
      dataIndex: 'operator',
      ellipsis: true,
    },
    {
      key: 'typeContent',
      title: '关注类型',
      width: 180,
      ellipsis: true,
      dataIndex: 'typeContent',
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render: (text: string) => text || '-',
    },
    {
      key: 'content',
      title: '关注内容',
      width: 300,
      ellipsis: true,
      dataIndex: 'content',
      className: classnames(style.minWidthCell, style.maxWidthCell),
      render: (text: string) => text || '-',
    },
    {
      key: 'bizId',
      title: getIn18Text('KEHUMINGCHENG'),
      width: 180,
      fixed: 'right',
      dataIndex: 'bizId',
      className: style.customerNameCell,
      render(text, Record) {
        return text ? (
          <a
            onClick={() => {
              setCustomerId(text);
              setUniVisible(true);
            }}
          >
            {`已建档（${Record.bizName}）`}
          </a>
        ) : (
          <a onClick={() => handleBiz(Record)}>{getIn18Text('WEIJIANDANG')}</a>
        );
      },
    },
  ];

  const handleBiz = (record: WAOperationLog) => {
    setMessageId(record?.messageId || '');
    setChatId(record?.chatId || '');
    setUserId(record?.userId || '');
    setWaMsgType(record?.type || '');
    setChatHistoryVisible(true);
    trackApi.track('personal_WA_Pinned_chats', { type: 'click_list' });
  };

  const handleDateChange = (d: [Moment | null, Moment | null] | null) => {
    console.log(d?.map(d => (d ? d.format('YYYY-MM-DD') : 'null')));
    let dateRange: [Moment | null, Moment | null];
    if (d == null || d[0] === null || d[1] === null) {
      dateRange = [null, null];
    } else {
      dateRange = d as [Moment, Moment];
    }
    setDate(dateRange);
    setPage(1);
    fetchData(1, { type, date: dateRange, waNumber, sortField, sortOrder });
    fetchStat({ type, date: dateRange, waNumber });
  };

  const panelRender = (originPanel: ReactNode) => {
    return (
      <div className={classnames(style.customDatePickerPanel, 'lx-date-picker-dropdown')}>
        <div className={style.leftSide}>
          {customPickers.map(item => (
            <div className={style.customPickerRange} key={item.text} onClick={() => handlePanelClick(item)}>
              {item.text}
            </div>
          ))}
        </div>
        {originPanel}
      </div>
    );
  };

  const handleMember = (value: string[]) => {
    setWaNumber(value);
    setPage(1);
    fetchData(1, { type, date, waNumber: value, sortField, sortOrder });
    fetchStat({ type, date, waNumber: value });
  };

  const handlePanelClick = (item: { text?: string; onClick: any }) => {
    const target = item.onClick() as [Moment, Moment];
    setDate(target);
    setPage(1);
    fetchData(1, { type, date: target, waNumber, sortField, sortOrder });
    fetchStat({ type, date: target, waNumber });
  };

  const handleExportClick = () => {
    setExportLoading(true);
    const start_date = date?.[0]?.format(dateFormat) || '';
    const end_date = date?.[1]?.format(dateFormat) || '';
    whatsAppApi
      .recordExport({
        filterType: type,
        accountId: waNumber,
        startTime: start_date ? start_date + ' 00:00:00' : '',
        endTime: end_date ? end_date + ' 23:59:59' : '',
      })
      .then(res => {
        const { nosUrl = '' } = res || {};
        if (nosUrl) {
          window.location.href = nosUrl;
        }
        trackApi.track('personal_WA_Pinned_chats', { type: 'import' });
      })
      .catch(err => console.log(err))
      .finally(() => {
        setTimeout(() => {
          setExportLoading(false);
        }, 1000);
      });
  };

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_EMPHASIS_MANAGE_LIST" accessLabel="VIEW" menu="WA_CHAT_EMPHASIS_MANAGE_LIST">
      <div className={classnames(style.page, layout.container)}>
        <header className={classnames(style.breadCrumb, layout.static)}>
          <span className={style.curr}>关注列表</span>
          <a onClick={handleRefresh} style={{ marginLeft: 8 }}>
            <RefreshSvg />
          </a>
        </header>
        <div className={classnames(style.tableHeader, layout.static)}>
          <DatePicker.RangePicker
            getPopupContainer={node => node.parentElement as HTMLElement}
            width={266}
            separator="~"
            panelRender={panelRender}
            value={date}
            onChange={handleDateChange}
            allowClear
            suffixIcon={null}
            dropdownClassName={style.dropdownWrap}
            locale={locale}
          />
          <EnhanceSelect
            placeholder="请选择账号"
            showSearch
            allowClear
            onChange={handleMember}
            style={{ width: 268, marginLeft: 12, marginRight: 12 }}
            mode="multiple"
            optionLabelProp="label"
            optionFilterProp="label"
            maxTagCount={1}
            dropdownMatchSelectWidth={false}
          >
            {memberOptions.map(item => (
              <InMultiOption name={item.nickName} className={style.memeOption} key={item.accId} label={item.nickName} value={item.accId}>
                <div className={style.memberOp}>
                  {item.avatarUrl ? <img className={style.memberOpAvatar} src={item.avatarUrl} alt="" /> : <DefaultImg />}
                  <span>{item.nickName}</span>
                </div>
              </InMultiOption>
            ))}
          </EnhanceSelect>
          <Button style={{ marginLeft: 'auto' }} disabled={exportAble} loading={exportLoading} btnType="minorLine" onClick={handleExportClick}>
            {getIn18Text('DAOCHU')}
          </Button>
          <Button
            style={{ whiteSpace: 'nowrap', marginLeft: 12 }}
            btnType="minorLine"
            onClick={() => {
              setSensitiveWordVisible(true);
              trackApi.track('personal_WA_Pinned_chats', { type: 'set_sensitive_words' });
            }}
          >
            {getIn18Text('SHEZHIMINGANCI')}
          </Button>
          <Button style={{ whiteSpace: 'nowrap', marginLeft: 12 }} btnType="minorLine" onClick={() => setNoticeVisible(true)}>
            设置消息通知
          </Button>
        </div>
        <div className={classnames(style.statWrap, layout.static)}>
          {statData.map(item => (
            <div
              className={classnames(style.stat, {
                [style.active]: item.key === activeStatKey,
              })}
              key={item.key}
              onClick={() => {
                if (item.key !== activeStatKey) {
                  setActiveStatKey(item.key);
                  handleTypeChange(item.type);
                }
              }}
            >
              <div className={style.icon}>{item.icon}</div>
              <div className={style.content}>
                <div className={style.header}>
                  <span className={style.title}>{item.title}</span>
                  {item.tooltip && (
                    <Tooltip title={item.tooltip}>
                      <TongyongCuowutishiXian wrapClassName="wmzz" style={{ fontSize: 16 }} />
                    </Tooltip>
                  )}
                </div>
                <div className={style.body}>{item.value.toLocaleString('en-US', { style: 'decimal' })}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={classnames(style.tableWrap, layout.grow)} ref={growRef}>
          <SiriusTable
            bordered
            resizable
            sortDirections={['ascend', 'descend', 'ascend']}
            tableWidthKey="waOperateLog"
            columns={columns}
            dataSource={list}
            loading={loading}
            rowClassName={(record: WAOperationLog) => {
              if (record.id.toString() === params.id) {
                return 'ant-table-row-selected';
              }
            }}
            scroll={{ x: 'max-content', y: scrollY }}
            onChange={(pagination, _, sorter: any) => {
              const page = pagination.current as number;
              const sortField = sorter.field;
              const sortOrder = sorter.order;
              setSortField(sortField);
              setSortOrder(sortOrder);
              setPage(page);
              fetchData(page, { type, date, waNumber, sortField, sortOrder });
            }}
            pagination={{
              showSizeChanger: false,
              current: page,
              pageSize: 20,
              total,
            }}
          />
        </div>
        {sensitiveWordVisible && <SensitiveWordSetting visible={sensitiveWordVisible} onClose={() => setSensitiveWordVisible(false)} />}
      </div>
      {uniVisible && (
        <UniDrawerWrapper
          visible={uniVisible}
          source="waCustomer"
          customerId={customerId as unknown as number}
          onClose={() => {
            setUniVisible(false);
          }}
          onSuccess={() => {
            setUniVisible(false);
          }}
        />
      )}
      {chatHistoryVisible && (
        <ChatHistoryDrawer
          waMsgType={waMsgType}
          chatId={chatId}
          userId={userId}
          messageId={messageId}
          deleted={true}
          visible={chatHistoryVisible}
          onClose={() => setChatHistoryVisible(false)}
          title="陌生人详情"
        />
      )}
      {noticeVisible && <NoticeModal visible={noticeVisible} setVisible={setNoticeVisible} />}
    </PermissionCheckPage>
  );
};
