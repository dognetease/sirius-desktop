import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import { api, apis, MailApi, TodoEmailItem, WorktableApi } from 'api';
import { Empty, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import { ReactComponent as ArrowRight } from '@/images/icons/customs/right.svg';
import { WorktableCard } from '../card';
import { Select } from '../../Customer/components/commonForm/Components';
import style from './index.module.scss';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';
import { getTransText } from '@/components/util/translate';
import NoDataIcon from '../icons/NoData';

interface FilterOption {
  receiveDate: number;
  page: number;
  pageSize: number;
}

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = api.getSystemApi();

enum TodoType {
  Contact = 1,
  Unread = 2,
}

//
async function readMailById(mid: string, type: 'customer' | 'others') {
  workTableTrackAction('waimao_worktable_todo', type === 'customer' ? 'customer_email_topic' : 'other_email_topic');
  if (systemApi.isElectron()) {
    return systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: mid });
  }
  window.open(`/readMail/?id=${mid}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
  return undefined;
}

function formatTime(timeString: string) {
  const now = moment();
  const m = moment(timeString.replace(/年|月/g, '-').replace(getIn18Text('ri'), ''));
  if (m.isSame(now, 'day')) {
    return m.format('HH:mm');
  }
  if (m.startOf('day').diff(now, 'day') === -1) {
    return getIn18Text('ZUOTIAN');
  }
  if (m.isSame(now, 'year')) {
    return m.format('MM-DD');
  }
  return m.format('YYYY-MM-DD');
}

const DefaultNoData = () => {
  return (
    <div className={style.emptyData}>
      <NoDataIcon />
      <span>{getTransText('ZANWUSHUJU')}</span>
    </div>
  );
};

export const TodoCard = () => {
  const [filters, setFilters] = useState<FilterOption>({
    receiveDate: 1,
    page: 0,
    pageSize: 1000,
  });
  const [loading, setLoading] = useState(false);
  const [contactEmailList, setContactEmailList] = useState<TodoEmailItem[]>([]);
  const [unreadEmailList, setUnreadEmailList] = useState<TodoEmailItem[]>([]);
  const [todoType, setTodoType] = useState<number>(0);
  const [inReplyMails] = useState<Record<string, boolean>>({});

  const fetchData = (curFilter: FilterOption) => {
    setLoading(true);
    const promises: Promise<any>[] = [];
    if (todoType === 0 || todoType === TodoType.Unread) {
      const p = worktableApi.getUnreadMail(curFilter).then(res => {
        setUnreadEmailList(res.emailList);
      });
      promises.push(p);
    } else {
      setUnreadEmailList([]);
    }
    if (todoType === 0 || todoType === TodoType.Contact) {
      //
      const p = worktableApi.getContactMail(curFilter).then(res => {
        setContactEmailList(res.emailList);
      });
      promises.push(p);
    } else {
      setContactEmailList([]);
    }

    Promise.allSettled(promises).finally(() => {
      setLoading(false);
    });
  };

  const handleTypeChange = (type: any) => {
    workTableTrackAction('waimao_worktable_todo', 'todo_type_selection');
    setTodoType(type as number);
  };

  const handleIgnoreMail = (mid: string, type: 'customer' | 'others') => {
    workTableTrackAction('waimao_worktable_todo', type === 'customer' ? 'customer_email_miss' : 'other_email_miss');
    worktableApi.ignoreEmail(mid, undefined).then(() => {
      fetchData(filters);
    });
  };

  const handleReplyMail = (mid: string, type: 'customer' | 'others') => {
    workTableTrackAction('waimao_worktable_todo', type === 'customer' ? 'customer_email_reply' : 'other_email_reply');
    if (!inReplyMails[mid]) {
      mailApi.doReplayMail(mid, false).finally(() => {
        delete inReplyMails[mid];
      });
      inReplyMails[mid] = true;
      handleIgnoreMail(mid, type);
    }
  };

  const navigateToMailBox = () => {
    pushNavigateCrossMultiClient('#mailbox');
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters, todoType]);

  const customerColumns: ColumnsType<TodoEmailItem> = [
    {
      key: 'subject',
      dataIndex: 'subject',
      title: getTransText('YOUJIANZHUTI'),
      ellipsis: {
        showTitle: true,
      },
      width: '28.4%',
      render(title, item) {
        return <a onClick={() => readMailById(item.mid, 'customer')}>{title}</a>;
      },
    },
    {
      key: 'sender',
      dataIndex: 'sender',
      title: getTransText('LIANXIREN'),
      width: '16.7%',
      ellipsis: {
        showTitle: true,
      },
    },
    {
      key: 'summary',
      dataIndex: 'summary',
      title: getTransText('YOUJIANZHENGWEN'),
      width: '26.5%',
      ellipsis: {
        showTitle: true,
      },
    },
    {
      key: 'receiveAt',
      dataIndex: 'receiveAt',
      title: getTransText('SHOUJIANSHIJIAN'),
      width: '13.2%',
      render(timeString, item) {
        if ((item as any)._formatTime) {
          return (item as any)._formatTime;
        }
        const f = formatTime(timeString);
        (item as any)._formatTime = f;
        return f;
      },
    },
    {
      key: 'operation',
      title: getTransText('CAOZUO'),
      width: '15.2%',
      render(_, item) {
        return (
          <>
            <a onClick={() => handleReplyMail(item.mid, 'customer')}>{getTransText('HUIFU')}</a>
            <span className={style.spliter} />
            <a onClick={() => handleIgnoreMail(item.mid, 'customer')}>{getTransText('HULVE')}</a>
          </>
        );
      },
    },
  ];

  const othersColumns: ColumnsType<TodoEmailItem> = [
    {
      key: 'subject',
      dataIndex: 'subject',
      title: getTransText('YOUJIANZHUTI'),
      ellipsis: {
        showTitle: true,
      },
      width: '28.4%',
      render(title, item) {
        return <a onClick={() => readMailById(item.mid, 'others')}>{title}</a>;
      },
    },
    {
      key: 'sender',
      dataIndex: 'sender',
      title: getTransText('LIANXIREN'),
      width: '16.7%',
      ellipsis: {
        showTitle: true,
      },
    },
    {
      key: 'summary',
      dataIndex: 'summary',
      title: getTransText('YOUJIANZHENGWEN'),
      width: '26.5%',
      ellipsis: {
        showTitle: true,
      },
    },
    {
      key: 'receiveAt',
      dataIndex: 'receiveAt',
      title: getTransText('SHOUJIANSHIJIAN'),
      width: '13.2%',
      render(timeString, item) {
        if ((item as any)._formatTime) {
          return (item as any)._formatTime;
        }
        const f = formatTime(timeString);
        (item as any)._formatTime = f;
        return f;
      },
    },
    {
      key: 'operation',
      title: getTransText('CAOZUO'),
      width: '15.2%',
      render(_, item) {
        return (
          <>
            <a onClick={() => handleReplyMail(item.mid, 'others')}>{getTransText('HUIFU')}</a>
            <span className={style.spliter} />
            <a onClick={() => handleIgnoreMail(item.mid, 'others')}>{getTransText('HULVE')}</a>
          </>
        );
      },
    },
  ];

  return (
    <WorktableCard
      title={getTransText('DAIBAN')}
      loading={loading}
      headerToolsConfig={[
        {
          tools: (
            <Select onChange={handleTypeChange} value={todoType} style={{ width: 140 }}>
              <Select.Option value={0}>{getTransText('QUANBUDAIBAN')}</Select.Option>
              <Select.Option value={TodoType.Contact}>{getTransText('KEHUYOUJIAN')}</Select.Option>
              <Select.Option value={TodoType.Unread}>{getTransText('QITAYOUJIAN')}</Select.Option>
            </Select>
          ),
        },
        {
          onDaySelectChange: v => {
            workTableTrackAction('waimao_worktable_todo', 'time_selection');
            setFilters(prev => ({ ...prev, page: 0, receiveDate: v }));
          },
        },
        {
          onRefresh: () => setFilters(prev => ({ ...prev, page: 0 })),
        },
      ]}
    >
      <div className={style.body}>
        {(todoType === 0 || todoType === TodoType.Contact) && contactEmailList.length ? (
          <div className={style.block}>
            <div className={style.blockHeader} onClick={navigateToMailBox}>
              {getTransText('KEHUYOUJIAN')}({contactEmailList?.length}
              )
              <ArrowRight style={{ marginLeft: 8 }} />
            </div>
            <Table className="edm-table" columns={customerColumns} dataSource={contactEmailList} rowKey="tid" pagination={false} />
          </div>
        ) : null}
        {(todoType === 0 || todoType === TodoType.Unread) && unreadEmailList.length ? (
          <div className={style.block}>
            <div className={style.blockHeader} onClick={navigateToMailBox}>
              {getIn18Text('QITAYOUJIAN(')}
              {unreadEmailList?.length}
              )
              <ArrowRight style={{ marginLeft: 8 }} />
            </div>
            <Table className="edm-table" columns={othersColumns} dataSource={unreadEmailList} rowKey="tid" pagination={false} />
          </div>
        ) : null}
        {unreadEmailList.length + contactEmailList.length === 0 && <DefaultNoData />}
      </div>
    </WorktableCard>
  );
};
